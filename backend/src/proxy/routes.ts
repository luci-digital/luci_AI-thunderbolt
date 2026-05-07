/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { Auth } from '@/auth/elysia-plugin'
import { createAuthMacro } from '@/auth/elysia-plugin'
import { safeErrorHandler } from '@/middleware/error-handling'
import { ensureHttps, validateAndPin, type DnsLookup } from '@/utils/url-validation'
import {
  DROPPED_RESPONSE_HEADERS,
  FINAL_URL_HEADER,
  FOLLOW_REDIRECTS_HEADER,
  PASSTHROUGH_PREFIX,
  PASSTHROUGH_PREFIX_CASED,
  REDIRECT_STATUSES,
  TARGET_URL_HEADER,
} from '@shared/proxy-protocol'
import { Elysia, type AnyElysia } from 'elysia'
import { capStream } from './streaming'
import { noopObservability, type ObservabilityRecorder } from './observability'

const maxBodyBytes = 10 * 1024 * 1024
const maxHops = 5
const dnsTimeoutMs = 5_000
const streamCapBytes = 10 * 1024 * 1024
const streamIdleMs = 30_000

const allowedMethods = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
const bodylessMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

const targetUrlHeaderLower = TARGET_URL_HEADER.toLowerCase()
const followRedirectsHeaderLower = FOLLOW_REDIRECTS_HEADER.toLowerCase()

/** Race a promise against a DNS timeout. Throws `Error('DNS_TIMEOUT')` on expiry.
 *  Note: dns.promises.lookup does not honor an AbortSignal in Node 22, so this only
 *  unblocks the handler — the underlying lookup runs to completion in background. */
const withDnsTimeout = <T>(p: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>
  return Promise.race([
    p,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('DNS_TIMEOUT')), dnsTimeoutMs)
    }),
  ]).finally(() => clearTimeout(timer))
}

const isPrintableAscii = (value: string) => /^[\x20-\x7E]*$/.test(value)

const textResponse = (status: number, body: string): Response =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain' } })

/** Auto-upgrade `http://` URLs to `https://` and reject all other non-https schemes. */
const normaliseTargetUrl = (raw: string): URL | { error: string } => {
  const upgraded = ensureHttps(raw)
  if (!upgraded) {
    try {
      new URL(raw)
      return { error: 'Only http:// or https:// targets are allowed' }
    } catch {
      return { error: 'Invalid URL' }
    }
  }
  return new URL(upgraded)
}

/** Strip the passthrough prefix off inbound headers and validate values. Returns
 *  the assembled outbound headers, or a string error message. Callers that pass
 *  `dropAuthorization: true` strip Authorization (cross-origin redirects). */
const buildOutboundHeaders = (
  inbound: Headers,
  { dropAuthorization }: { dropAuthorization: boolean } = { dropAuthorization: false },
): Headers | { error: string } => {
  const out = new Headers()
  let invalid = false
  inbound.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (!lower.startsWith(PASSTHROUGH_PREFIX)) return
    const upstreamKey = lower.slice(PASSTHROUGH_PREFIX.length)
    if (!upstreamKey) return
    if (!isPrintableAscii(value)) {
      invalid = true
      return
    }
    if (dropAuthorization && upstreamKey === 'authorization') return
    out.set(upstreamKey, value)
  })
  if (invalid) return { error: 'Invalid passthrough header value' }
  return out
}

/** Re-prefix every upstream response header so the browser ignores them and the
 *  caller's `proxyFetch` helper unwraps them back into a normal-looking Response. */
const buildResponseHeaders = (upstream: Headers, finalUrl: string): Headers => {
  const out = new Headers()
  upstream.forEach((value, key) => {
    if (DROPPED_RESPONSE_HEADERS.has(key.toLowerCase())) return
    out.set(`${PASSTHROUGH_PREFIX_CASED}${key}`, value)
  })

  // Proxy-set headers (NOT prefixed): describe the proxy's own response framing
  // and security posture. Forced — override anything the upstream might have sent.
  out.set('Content-Security-Policy', 'sandbox')
  out.set('X-Content-Type-Options', 'nosniff')
  out.set('Content-Disposition', 'attachment')
  out.set('Cross-Origin-Resource-Policy', 'cross-origin')
  out.set(FINAL_URL_HEADER, finalUrl)
  return out
}

export type CreateUniversalProxyRoutesOptions = {
  auth: Auth
  fetchFn?: typeof fetch
  rateLimit?: AnyElysia
  observability?: ObservabilityRecorder
  dnsLookup?: DnsLookup
}

export const createUniversalProxyRoutes = (options: CreateUniversalProxyRoutesOptions) => {
  const { auth, rateLimit, dnsLookup } = options
  const fetchFn = options.fetchFn ?? globalThis.fetch
  const observability = options.observability ?? noopObservability

  return new Elysia({ prefix: '/proxy' })
    .onError(safeErrorHandler)
    .use(createAuthMacro(auth))
    .guard({ auth: true }, (g) => {
      if (rateLimit) g.use(rateLimit)

      return g
        .derive(({ request }) => ({
          proxyStartedAt: performance.now(),
          proxyRequestId: crypto.randomUUID(),
          proxyTargetUrl: request.headers.get(targetUrlHeaderLower) ?? '',
        }))
        .onAfterResponse(({ set, user, proxyStartedAt, proxyRequestId, proxyTargetUrl, request }) => {
          observability.proxyRequest({
            method: request.method.toUpperCase(),
            target_url: proxyTargetUrl,
            status: typeof set.status === 'number' ? set.status : 200,
            duration_ms: Math.round(performance.now() - proxyStartedAt),
            user_id: (user as { id?: string } | undefined)?.id ?? 'unknown',
            request_id: proxyRequestId,
          })
        })
        .all(
          '/',
          async (ctx) => {
            const method = ctx.request.method.toUpperCase()

            if (!allowedMethods.has(method)) {
              ctx.set.status = 405
              return textResponse(405, 'Method not allowed')
            }

            // Read target URL from header (not path). Keeps user-supplied paths/queries
            // out of standard HTTP access logs which only record method + path.
            const targetHeader = ctx.proxyTargetUrl
            if (!targetHeader || targetHeader.trim() === '') {
              ctx.set.status = 400
              return textResponse(400, `Missing ${TARGET_URL_HEADER} header`)
            }
            if (!isPrintableAscii(targetHeader)) {
              ctx.set.status = 400
              return textResponse(400, `Invalid ${TARGET_URL_HEADER} header`)
            }

            const normalised = normaliseTargetUrl(targetHeader)
            if ('error' in normalised) {
              ctx.set.status = 400
              return textResponse(400, normalised.error)
            }

            // Strip userinfo before any further processing (matches validateAndPin).
            normalised.username = ''
            normalised.password = ''
            const targetUrl = normalised.toString()
            const initialOrigin = normalised.origin

            // Pre-check Content-Length to short-circuit oversized uploads before
            // opening any upstream connection. Streaming bodies without a header
            // are caught later by capStream.
            if (!bodylessMethods.has(method)) {
              const contentLength = ctx.request.headers.get('content-length')
              if (contentLength) {
                const cl = parseInt(contentLength, 10)
                if (Number.isFinite(cl) && cl > maxBodyBytes) {
                  ctx.set.status = 413
                  return textResponse(413, 'Request body too large')
                }
              }
            }

            // Strict literal match — anything other than 'true'/'false' falls back to default.
            const followRedirectsHeader = ctx.request.headers.get(followRedirectsHeaderLower)?.toLowerCase()
            const followOverride =
              followRedirectsHeader === 'true' ? true : followRedirectsHeader === 'false' ? false : null

            const initialHeadersResult = buildOutboundHeaders(ctx.request.headers)
            if ('error' in initialHeadersResult) {
              ctx.set.status = 400
              return textResponse(400, initialHeadersResult.error)
            }
            const initialPassthroughHeaders = initialHeadersResult

            // Decide whether redirect-following will need a buffered body.
            // - GET/HEAD have no body, so we can stream the initial hop and follow
            //   redirects safely (each hop is a fresh fetch).
            // - For other methods, default behaviour is "do not follow" (return 3xx as-is).
            //   If the caller explicitly opts in via X-Proxy-Follow-Redirects: true we
            //   buffer the body so it can be replayed on 307/308.
            const needsBodyBuffer = !bodylessMethods.has(method) && followOverride === true

            let bufferedBody: ArrayBuffer | null = null
            if (needsBodyBuffer && ctx.request.body) {
              bufferedBody = await new Response(ctx.request.body as BodyInit).arrayBuffer()
              if (bufferedBody.byteLength > maxBodyBytes) {
                ctx.set.status = 413
                return textResponse(413, 'Request body too large')
              }
            }

            // Per-hop redirect loop: hop 0 = initial fetch; hops 1..maxHops = follows.
            let currentUrl = targetUrl
            let currentMethod = method
            let currentBufferedBody: ArrayBuffer | null = bufferedBody
            let dropAuthorizationOnHop = false

            for (let hop = 0; hop <= maxHops; hop++) {
              // DNS-pin each hop so cross-origin redirects can't bypass SSRF.
              let pinnedUrl: string
              let pinnedExtraHeaders: Headers
              try {
                ;[pinnedUrl, pinnedExtraHeaders] = await withDnsTimeout(
                  validateAndPin(currentUrl, undefined, dnsLookup),
                )
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                if (hop === 0) {
                  ctx.set.status = 400
                  return textResponse(400, `Blocked: ${msg}`)
                }
                ctx.set.status = 502
                return textResponse(502, 'Bad gateway (SSRF or DNS error on redirect)')
              }

              // Compose hop-specific headers: passthrough + Host (for SNI).
              const hopHeadersResult =
                hop === 0
                  ? initialPassthroughHeaders
                  : buildOutboundHeaders(ctx.request.headers, { dropAuthorization: dropAuthorizationOnHop })
              if ('error' in hopHeadersResult) {
                ctx.set.status = 400
                return textResponse(400, hopHeadersResult.error)
              }
              const hopHeaders = new Headers(hopHeadersResult)
              pinnedExtraHeaders.forEach((value, key) => {
                hopHeaders.set(key, value)
              })

              const upstreamCtl = new AbortController()
              const isInitialHopStream = hop === 0 && !needsBodyBuffer && !bodylessMethods.has(currentMethod)

              // Wrap the inbound stream with capStream on the streaming initial hop so
              // body-size and idle-timeout limits still apply without buffering.
              const streamedInitialBody =
                isInitialHopStream && ctx.request.body
                  ? capStream(ctx.request.body, {
                      maxBytes: streamCapBytes,
                      idleTimeoutMs: streamIdleMs,
                      onAbort: () => upstreamCtl.abort(),
                    })
                  : null

              const upstreamBody: BodyInit | null = streamedInitialBody ?? currentBufferedBody ?? null

              const response = await fetchFn(pinnedUrl, {
                method: currentMethod,
                headers: hopHeaders,
                body: upstreamBody,
                redirect: 'manual',
                signal: upstreamCtl.signal,
                // @ts-expect-error -- Bun fetch supports duplex:'half' for streaming bodies
                duplex: 'half',
              })

              if (!REDIRECT_STATUSES.has(response.status)) {
                return buildProxyResponse(response, upstreamCtl, currentUrl)
              }

              const defaultFollow = bodylessMethods.has(currentMethod)
              const shouldFollow = followOverride !== null ? followOverride : defaultFollow
              if (!shouldFollow) {
                return buildProxyResponse(response, upstreamCtl, currentUrl)
              }

              const location = response.headers.get('location')
              if (!location) {
                return buildProxyResponse(response, upstreamCtl, currentUrl)
              }

              // Resolve relative Location and auto-upgrade http://.
              const nextRaw = new URL(location, currentUrl).toString()
              const nextNormalised = normaliseTargetUrl(nextRaw)
              if ('error' in nextNormalised) {
                upstreamCtl.abort()
                ctx.set.status = 502
                return textResponse(502, 'Redirect target is not http(s)')
              }
              nextNormalised.username = ''
              nextNormalised.password = ''
              const nextUrl = nextNormalised.toString()

              if (nextNormalised.origin !== initialOrigin) {
                dropAuthorizationOnHop = true
              }

              // RFC 7231: 303 always becomes GET; 301/302 become GET for non-GET/HEAD.
              let nextMethod = currentMethod
              let nextBody = currentBufferedBody
              if (response.status === 303) {
                nextMethod = 'GET'
                nextBody = null
              } else if ((response.status === 301 || response.status === 302) && !bodylessMethods.has(currentMethod)) {
                nextMethod = 'GET'
                nextBody = null
              }

              // Release the current hop before opening the next.
              upstreamCtl.abort()

              currentUrl = nextUrl
              currentMethod = nextMethod
              currentBufferedBody = nextBody
            }

            ctx.set.status = 502
            return textResponse(502, 'Too many redirects')
          },
          { parse: 'none' },
        )
    })
}

const buildProxyResponse = (response: Response, upstreamCtl: AbortController, finalUrl: string): Response => {
  const headers = buildResponseHeaders(response.headers, finalUrl)

  const body = response.body
    ? capStream(response.body, {
        maxBytes: streamCapBytes,
        idleTimeoutMs: streamIdleMs,
        onAbort: () => upstreamCtl.abort(),
      })
    : null

  return new Response(body, {
    status: response.status,
    headers,
  })
}

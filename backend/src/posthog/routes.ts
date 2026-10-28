/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { getCorsOriginsList, getSettings } from '@/config/settings'
import { safeErrorHandler } from '@/middleware/error-handling'
import { buildQueryString, defaultRequestDenylist, extractResponseHeaders, filterHeaders } from '@/utils/request'
import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'

/**
 * PostHog analytics proxy routes — intentionally public (no auth).
 * Events are anonymous client-side analytics; the proxy target is fixed to posthogHost.
 * PostHog's API rejects events without a valid project API key.
 */
export const createPostHogRoutes = (fetchFn: typeof fetch = globalThis.fetch) => {
  const settings = getSettings()

  return new Elysia({
    prefix: '/posthog',
  })
    .onError(safeErrorHandler)
    .use(
      cors({
        origin: getCorsOriginsList(settings),
        // allowedHeaders: true → mirrors main backend mount and Access-Control-Request-Headers (avoids static allowlist drift)
        allowedHeaders: true,
        exposeHeaders: settings.corsExposeHeaders,
      }),
    )
    .get('/config', async () => {
      return {
        public_posthog_api_key: settings.posthogApiKey,
      }
    })
    .all(
      '/*',
      async (ctx) => {
        const path = ctx.params['*'] || ''
        const posthogHost = settings.posthogHost || 'https://us.i.posthog.com'

        const baseUrl = `${posthogHost}/${path}`
        const headers = filterHeaders(ctx.headers, defaultRequestDenylist)
        const queryString = buildQueryString(ctx.query)
        const url = `${baseUrl}${queryString}`

        const response = await fetchFn(url, {
          method: ctx.request.method,
          headers,
          body: ctx.request.body as BodyInit,
        })

        const responseHeaders = extractResponseHeaders(response.headers)

        // Prevent XSS: proxied content must never execute scripts in our origin
        responseHeaders.set('content-security-policy', 'sandbox')
        responseHeaders.set('content-disposition', 'attachment')
        responseHeaders.set('x-content-type-options', 'nosniff')

        responseHeaders.set('cross-origin-resource-policy', 'cross-origin')

        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        })
      },
      {
        parse: 'none',
      },
    )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

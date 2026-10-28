/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Wire protocol shared by the universal proxy backend (`backend/src/proxy/routes.ts`)
 * and the proxy-fetch frontend client (`src/lib/proxy-fetch.ts`).
 *
 * The two ends form one wire contract — drift here is silent breakage, so all
 * header names and prefix strings live in one place.
 */

/** Caller header that names the upstream URL. POST-style routing — never logged. */
export const targetUrlHeader = 'X-Proxy-Target-Url'

/** Caller header opting in/out of redirect following (`true` | `false`). */
export const followRedirectsHeader = 'X-Proxy-Follow-Redirects'

/** Response header echoing the final hop URL after redirect following. */
export const finalUrlHeader = 'X-Proxy-Final-Url'

/** Symmetric prefix wrapping caller and upstream headers across the proxy boundary.
 *  Stored lower-case for header comparisons; outbound writes use the canonical
 *  casing in `passthroughPrefixCased`. */
export const passthroughPrefix = 'x-proxy-passthrough-'
export const passthroughPrefixCased = 'X-Proxy-Passthrough-'

/** WS subprotocol marker that carries the base64url-encoded target URL. */
export const wsTargetPrefix = 'tbproxy.target.'

/** HTTP redirect status codes the proxy follows when configured to. */
export const redirectStatuses = new Set([301, 302, 303, 307, 308])

/** Wire-level / hop-by-hop response headers the proxy never propagates. The proxy
 *  hands a fresh body to the client, so any framing/length headers from upstream
 *  describe the wrong thing. Set-Cookie family is dropped to preserve cookie
 *  isolation: the response's *origin* is Thunderbolt, not the upstream.
 *
 *  `content-encoding` is intentionally NOT dropped — the proxy passes
 *  compressed bodies through untouched (Bun fetch is called with
 *  `decompress: false`) so the browser performs the decode itself. */
export const droppedResponseHeaders = new Set([
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'trailers',
  'upgrade',
  'set-cookie',
  'set-cookie2',
])

/** Headers the proxy adds for browser framing — caller-side `unwrapHostedResponse`
 *  strips these so caller code sees a natural-looking Response. */
export const proxyFramingHeaders = new Set(['content-security-policy', 'content-disposition'])

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// `SSEClientTransport` is marked @deprecated by the SDK in favour of Streamable HTTP, but we
// intentionally retain it: per the MCP SDK migration guidance the client-side SSE transport is the
// only way to reach legacy SSE-only servers, and there is no non-deprecated replacement for them.
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { isLoopbackUrl } from '@/acp/transports/is-loopback'
import { getAuthToken } from './auth-token'
import { computeEffectiveProxyEnabled, createProxyFetch, type FetchFn } from './proxy-fetch'

/** Remote transport kind. stdio (local) servers are connected by THU-575, not here. */
export type MCPTransportType = 'http' | 'sse'

/**
 * Reconciles a version mismatch between `@ai-sdk/mcp` and `@modelcontextprotocol/sdk` at our
 * transport seam. After the initialize handshake, `@ai-sdk/mcp`'s `init()` records the negotiated
 * protocol via the *direct assignment* `this.transport.protocolVersion = result.protocolVersion`
 * (see @ai-sdk/mcp dist `init()`). But `@modelcontextprotocol/sdk` (>=1.25) made `protocolVersion`
 * a getter-only accessor on `StreamableHTTPClientTransport` and exposes a `setProtocolVersion()`
 * setter instead — so the direct assignment throws
 * `TypeError: Cannot set property protocolVersion ... which has only a getter`, breaking every
 * remote (http/sse) MCP connect. The SDK's own client uses `transport.setProtocolVersion(...)`.
 *
 * No stable `@ai-sdk/mcp` release fixes the assignment (it persists through 1.0.45; only the
 * AI-SDK-v6 `2.0.0-beta` line drops it, which would force a major upgrade of our v5 AI SDK stack),
 * and the getter-only accessor exists across our whole declared `@modelcontextprotocol/sdk` range —
 * so the proper, minimal fix lives here, where we own the transport. We shadow the getter-only
 * accessor with a settable instance accessor that delegates writes to the SDK's own
 * `setProtocolVersion()`, leaving reads unchanged.
 */
const installProtocolVersionSetter = (transport: Transport): Transport => {
  Object.defineProperty(transport, 'protocolVersion', {
    configurable: true,
    enumerable: false,
    get() {
      return this._protocolVersion
    },
    set(version: string) {
      this.setProtocolVersion?.(version)
    },
  })
  return transport
}

/**
 * Builds the request headers for an MCP connection. Adds a **plain**
 * `Authorization: Bearer <token>` when a credential is present — `createProxyFetch`
 * promotes it to the passthrough header on web and sends it direct on Tauri.
 * Never set the passthrough header here (it would double-prefix). See proxy-fetch.ts.
 */
export const buildMcpHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = { Accept: 'application/json, text/event-stream' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const nativeFetch: FetchFn = Object.assign(
  (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init),
  { preconnect: () => Promise.resolve(false) },
)

/**
 * Selects the fetch implementation for an MCP server URL. Loopback targets
 * (`localhost` / `127.0.0.0-8` / `::1` / `*.localhost` — see {@link isLoopbackUrl})
 * are the local `thunderbolt-stdio-bridge --mode mcp` server: connect directly with
 * a native `fetch`, skipping the cloud proxy. A browser reaching its own machine
 * has no SSRF surface (the proxy's localhost rejection protects the *cloud backend*,
 * which is irrelevant here), and the proxy SSRF-rejects localhost regardless, so the
 * proxied path would never reach the bridge. All non-loopback URLs keep the proxy
 * hop. The factory is injected so the decision logic is unit-testable.
 */
export const resolveMcpFetch = (url: string, proxyFetch: FetchFn, native: FetchFn = nativeFetch): FetchFn =>
  isLoopbackUrl(url) ? native : proxyFetch

/**
 * Builds an MCP client transport. Non-loopback URLs route through the universal
 * proxy fetch: Hosted mode (web) goes through `${cloudUrl}/v1/proxy` with header
 * rewriting; Standalone mode (Tauri) hits the upstream directly. Loopback URLs
 * bypass the proxy and connect natively (see {@link resolveMcpFetch}). Picks SSE
 * for `sse`, otherwise Streamable HTTP — both accept the identical
 * `{ fetch, requestInit }` shape. Keeps the provider and the settings
 * test-connection on one code path.
 */
export const createMcpTransport = (
  url: string,
  type: MCPTransportType,
  cloudUrl: string,
  headers: Record<string, string>,
) => {
  const urlObj = new URL(url)
  // Authenticate the proxy hop with the Thunderbolt session bearer (the same getter the
  // app-wide ProxyFetchProvider uses) — without it `/v1/proxy` returns 401. The upstream
  // MCP credential rides separately as `X-Proxy-Passthrough-Authorization` (createProxyFetch
  // promotes the plain `Authorization` we set in buildMcpHeaders). `getProxyEnabled` honours
  // the Tauri standalone toggle; web always proxies (CORS forces it).
  const proxyFetch = createProxyFetch({
    cloudUrl,
    getProxyAuthToken: getAuthToken,
    getProxyEnabled: () => computeEffectiveProxyEnabled(),
  })
  const resolvedFetch = resolveMcpFetch(url, proxyFetch)
  const options = {
    fetch: (input: string | URL, init?: RequestInit) => resolvedFetch(input, init),
    requestInit: { headers },
  }
  const transport =
    type === 'sse' ? new SSEClientTransport(urlObj, options) : new StreamableHTTPClientTransport(urlObj, options)
  return installProtocolVersionSetter(transport)
}

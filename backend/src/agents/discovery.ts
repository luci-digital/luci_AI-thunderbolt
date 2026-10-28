/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { Settings } from '@/config/settings'
import type { RemoteAgentDescriptor } from '@shared/acp-types'

/**
 * An agent provider contributes one or more {@link RemoteAgentDescriptor} entries
 * to the `GET /agents` response. The Haystack module calls {@link registerAgentProvider}
 * at startup with its provider; future managed agents follow the same shape.
 */
export type AgentProvider = {
  /** Stable identifier for the provider. Re-registering the same id is a no-op. */
  id: string
  /** Returns descriptors visible to the caller. May read settings or the request
   *  (e.g. for WS URL host derivation). Throwing here is isolated per-provider —
   *  the discovery route swallows the failure and continues. */
  list: (request: Request, settings: Settings) => RemoteAgentDescriptor[]
}

/**
 * Module-level registry. Side-effectful by design: `createHaystackRoutes()`
 * calls {@link registerAgentProvider} as part of its construction, and the
 * discovery route reads back via {@link getRegisteredProviders}. Idempotent on
 * `id` so HMR / repeated test setup doesn't double-register.
 */
const providers: AgentProvider[] = []

/** Register an agent provider. Subsequent calls with the same `id` are skipped. */
export const registerAgentProvider = (provider: AgentProvider): void => {
  if (providers.some((p) => p.id === provider.id)) {
    return
  }
  providers.push(provider)
}

/** Return the current set of registered providers in registration order. */
export const getRegisteredProviders = (): AgentProvider[] => [...providers]

/** Test helper — clears all providers. Not exported from the module index. */
export const resetAgentProvidersForTesting = (): void => {
  providers.length = 0
}

/**
 * Build a `wss://host/v1/<suffix>` URL from the incoming HTTP `Request`. Uses
 * `x-forwarded-proto` when present (deployed behind a reverse proxy) and falls
 * back to the request URL's protocol. Strips any leading slash from `suffix` to
 * keep call-sites unambiguous.
 *
 * Examples:
 *   buildWebSocketUrl(req, 'haystack/ws')
 *     => 'wss://thunderbolt.example/v1/haystack/ws'   (in prod behind TLS proxy)
 *     => 'ws://localhost:8000/v1/haystack/ws'         (local http dev)
 */
export const buildWebSocketUrl = (request: Request, suffix: string): string => {
  const url = new URL(request.url)
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const httpProto = forwardedProto || url.protocol.replace(':', '')
  const wsProto = httpProto === 'https' ? 'wss' : 'ws'
  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || url.host
  const normalized = suffix.replace(/^\/+/, '')
  return `${wsProto}://${host}/v1/${normalized}`
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

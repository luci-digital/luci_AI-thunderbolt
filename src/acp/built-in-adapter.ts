/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Built-in adapter — wraps the existing `aiFetchStreamingResponse` pipeline so
 * the chat layer can route every agent (built-in or ACP) through one
 * `AgentAdapter` seam. No ACP handshake; `capabilities` is null;
 * `disconnect()` is a no-op (the underlying pipeline is stateless per call).
 */

import { aiFetchStreamingResponse } from '@/ai/fetch'
import type { Agent, AgentAdapter, AgentAdapterContext } from '@/types/acp'

/** Production injection point — production binds to `aiFetchStreamingResponse`. */
export type AiFetchStreamingResponseFn = typeof aiFetchStreamingResponse

export type BuiltInAdapterOptions = {
  /** Inject for tests so we don't touch the AI SDK / DB / settings stack. */
  aiFetch?: AiFetchStreamingResponseFn
}

export const createBuiltInAdapter = (agent: Agent, options: BuiltInAdapterOptions = {}): AgentAdapter => {
  const aiFetch = options.aiFetch ?? aiFetchStreamingResponse

  const fetch = (init: RequestInit, context: AgentAdapterContext): Promise<Response> =>
    aiFetch({
      init,
      modelId: context.selectedModel.id,
      modeSystemPrompt: context.selectedMode.systemPrompt ?? undefined,
      modeName: context.selectedMode.name ?? undefined,
      mcpClients: context.mcpClients,
      reconnectClient: context.reconnectClient,
      httpClient: context.httpClient,
      getProxyFetch: context.getProxyFetch,
    })

  return {
    agent,
    capabilities: null,
    fetch,
    // No ACP session to warm — the built-in pipeline advertises no commands.
    ensureSession: async () => {},
    disconnect: () => {},
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

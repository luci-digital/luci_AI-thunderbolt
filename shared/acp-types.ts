/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Wire contract shared by backend (`backend/src/agents/routes.ts`) and frontend
 * (`src/dal/agents.ts`, `src/db/seeding/seed-agents.ts`) for the ACP feature.
 *
 * Both ends consume the same shape — drift here is silent breakage, so every
 * identifier the discovery response carries lives in one place.
 */

export type AgentType = 'built-in' | 'remote-acp' | 'managed-acp'

export type AgentTransport = 'in-process' | 'websocket'

/** Descriptor returned by `GET /agents` for remote (`remote-acp`) and
 *  server-managed (`managed-acp`) agents. The built-in agent is never on the
 *  wire — it is a hardcoded frontend constant in `src/defaults/agents.ts`. */
export type RemoteAgentDescriptor = {
  id: string
  name: string
  type: 'remote-acp' | 'managed-acp'
  transport: 'websocket'
  url: string
  description: string | null
  icon: string | null
  isSystem: 0 | 1
}

/** Envelope for `GET /agents`. `version` lets us evolve the shape later;
 *  `allowCustomAgents` mirrors backend `ALLOW_CUSTOM_AGENTS` env so the UI can
 *  hide the "+ Add Custom Agent" button per deployment. */
export type AgentDiscoveryResponse = {
  version: '1'
  agents: RemoteAgentDescriptor[]
  allowCustomAgents: boolean
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

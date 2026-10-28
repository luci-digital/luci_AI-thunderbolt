/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { create } from 'zustand'
import type { AcpCommand } from './translators/acp-to-ai-sdk'

/**
 * Commands an ACP agent advertises via `available_commands_update`, keyed by
 * agent id (commands are an agent-level capability, shared across that agent's
 * threads). Populated by the chat instance's session side-effect handler and
 * read by the chat input's slash menu.
 */
type AgentCommandsState = {
  byAgentId: Record<string, AcpCommand[]>
  setCommands: (agentId: string, commands: AcpCommand[]) => void
  /** Drop an agent's commands when its connection is torn down, so the slash
   *  menu doesn't keep offering commands from a disconnected agent. */
  clearCommands: (agentId: string) => void
}

export const useAgentCommandsStore = create<AgentCommandsState>((set) => ({
  byAgentId: {},
  setCommands: (agentId, commands) => set((state) => ({ byAgentId: { ...state.byAgentId, [agentId]: commands } })),
  clearCommands: (agentId) =>
    set((state) => {
      if (!(agentId in state.byAgentId)) {
        return state
      }
      const { [agentId]: _removed, ...rest } = state.byAgentId
      return { byAgentId: rest }
    }),
}))

/** Stable empty reference so the selector doesn't churn when an agent has none. */
const noCommands: AcpCommand[] = []

/** The commands the given agent has advertised this session (empty if none). */
export const useAgentCommands = (agentId: string | undefined): AcpCommand[] =>
  useAgentCommandsStore((state) => (agentId ? (state.byAgentId[agentId] ?? noCommands) : noCommands))

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

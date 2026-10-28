/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { AgentRow } from './agent-row'
import type { Agent } from '@/types/acp'

type AgentListProps = {
  agents: Agent[]
  currentUserId: string | null
  /** Defaults to true. Mirrors `add_agents`; gates the row enable/disable toggle. */
  canEditAgents?: boolean
  /** Defaults to true — when false the Remove affordance is hidden on every row.
   *  Mirrors the workspace `remove_agents` permission; the BE is authoritative. */
  canRemoveAgents?: boolean
  /** Mount the scope badge on `remote-acp` rows. Resolved once at the page
   *  level via `useScopePickerEnabled()`; defaults to false so component-level
   *  tests don't need to wire the provider chain. */
  scopePickerEnabled?: boolean
  onToggle: (agent: Agent, enabled: boolean) => void
  onEdit: (agent: Agent) => void
  onDelete: (agent: Agent) => void
}

/** Renders the unified agent list returned by `useAllAgents` (built-in first,
 *  then system, then user customs). Composition lives in the DAL — this
 *  component is purely visual + event-dispatching so it stays trivial to test. */
export const AgentList = ({
  agents,
  currentUserId,
  canEditAgents = true,
  canRemoveAgents = true,
  scopePickerEnabled = false,
  onToggle,
  onEdit,
  onDelete,
}: AgentListProps) => (
  <div className="grid gap-3" data-testid="agent-list">
    {agents.map((agent) => (
      <AgentRow
        key={agent.id}
        agent={agent}
        currentUserId={currentUserId}
        canEditAgents={canEditAgents}
        canRemoveAgents={canRemoveAgents}
        scopePickerEnabled={scopePickerEnabled}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ))}
  </div>
)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useConfigStore, type AppConfig } from '@/api/config-store'
import { useAuth } from '@/contexts'

type GateInput = {
  hasSession: boolean
  isAnonymous: boolean
  config: AppConfig
}

/**
 * Pure gating logic for the "Create Workspace" affordance — exported separately
 * from the hook so it can be unit-tested without the AuthProvider/DB plumbing
 * that `useAuth` requires. The BE upload handler is the authoritative enforcer;
 * this controls UI visibility only.
 *
 * Returns `false` when:
 * - no session is loaded yet (the affordance shouldn't render before auth)
 * - the active user is anonymous and `allowWorkspaceCreationByAnon === false`
 * - the active user is real and `allowWorkspaceCreationByMembers === false`
 *
 * Treats absent flags as "allowed" — matches `selectAllowCustomAgents` /
 * `selectBuiltInAgentEnabled`, so offline boots without server config fall
 * back to the permissive path.
 */
export const canCreateWorkspace = ({ hasSession, isAnonymous, config }: GateInput): boolean => {
  if (!hasSession) {
    return false
  }
  if (isAnonymous) {
    return config.allowWorkspaceCreationByAnon !== false
  }
  return config.allowWorkspaceCreationByMembers !== false
}

/** Hook variant — reads session + config from context and forwards to `canCreateWorkspace`. */
export const useCanCreateWorkspace = (): boolean => {
  const authClient = useAuth()
  const { data: session } = authClient.useSession()
  const config = useConfigStore((state) => state.config)
  return canCreateWorkspace({
    hasSession: !!session?.user,
    isAnonymous: session?.user?.isAnonymous === true,
    config,
  })
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

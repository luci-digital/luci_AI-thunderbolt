/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { selectAllowUserScopedResources, useConfigStore } from '@/api/config-store'
import { useActiveWorkspace } from '@/lib/active-workspace'

/**
 * True when the create-resource scope picker should be mountable — the
 * deployment flag `allowUserScopedResources` is enabled AND the active
 * workspace is shared (non-personal). Personal workspaces have a single
 * member, so the workspace vs user distinction collapses to a single state;
 * we keep the UI free of a no-op control.
 *
 * Returns `false` while the active workspace is still resolving (PowerSync
 * hasn't synced the row yet) — defers the picker until we know which kind of
 * workspace we're in.
 */
export const useScopePickerEnabled = (): boolean => {
  const allow = useConfigStore((state) => selectAllowUserScopedResources(state.config))
  const workspace = useActiveWorkspace()
  if (!allow) {
    return false
  }
  if (!workspace) {
    return false
  }
  return workspace.isPersonal !== 1
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

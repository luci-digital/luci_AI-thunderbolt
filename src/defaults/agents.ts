/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { Agent } from '@/types/acp'

/**
 * The built-in Thunderbolt agent. Lives in code only — never a DB row.
 *
 * The chat layer treats this special case as a thin adapter over the existing
 * `aiFetchStreamingResponse` pipeline; the ACP protocol is not involved.
 * Always present, always first in the agent list, never removable.
 */
export const builtInAgent: Agent = {
  id: 'thunderbolt-built-in',
  name: 'Thunderbolt',
  type: 'built-in',
  transport: 'in-process',
  url: null,
  description: 'Built-in AI assistant',
  icon: 'zap',
  isSystem: 1,
  enabled: 1,
  deletedAt: null,
  userId: null,
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { parseRegistryJson } from '@/lib/agent-registry-filter'
import type { RegistryEntry } from '@/types/registry'
import snapshot from './acp-registry-snapshot.json'

/**
 * Bundled snapshot of the official ACP registry
 * (https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json),
 * parsed into typed entries. Shipped so the catalogue renders instantly and
 * works offline; the live CDN fetch (see `useAgentRegistry`) refreshes it in the
 * background and falls back here on any error.
 */
export const agentRegistrySnapshot: ReadonlyArray<RegistryEntry> = parseRegistryJson(snapshot)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

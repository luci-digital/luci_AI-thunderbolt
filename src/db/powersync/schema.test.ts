/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { powersyncTableNames } from '@shared/powersync-tables'
import { drizzleSchema } from './schema'

/**
 * MCP server config and its credentials are per-device local-only: syncing the server
 * entry without its (local-only) credentials would replicate a non-functional server to
 * other devices. These guards fail if mcp_servers is ever re-added to the synced set.
 */
describe('MCP tables are local-only (not synced)', () => {
  it('are absent from the synced table list', () => {
    expect(powersyncTableNames).not.toContain('mcp_servers')
    expect(powersyncTableNames).not.toContain('mcp_secrets')
  })

  it('are registered as local-only in the PowerSync schema', () => {
    // Local-only entries are { tableDefinition, options: { localOnly: true } };
    // synced entries are bare Drizzle table objects without `options`.
    const localOnlyOption = (entry: unknown) => (entry as { options?: { localOnly?: boolean } }).options?.localOnly

    expect(localOnlyOption(drizzleSchema.mcp_servers)).toBe(true)
    expect(localOnlyOption(drizzleSchema.mcp_secrets)).toBe(true)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

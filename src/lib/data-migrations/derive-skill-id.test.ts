/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'

import { deriveSkillIdFromAutomationId } from './derive-skill-id'

describe('deriveSkillIdFromAutomationId', () => {
  it('returns a UUID-shaped string', async () => {
    const id = await deriveSkillIdFromAutomationId('automation-1')
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('is deterministic — same input always produces the same output', async () => {
    const a = await deriveSkillIdFromAutomationId('automation-1')
    const b = await deriveSkillIdFromAutomationId('automation-1')
    expect(a).toBe(b)
  })

  it('produces different ids for different automations', async () => {
    const a = await deriveSkillIdFromAutomationId('automation-1')
    const b = await deriveSkillIdFromAutomationId('automation-2')
    expect(a).not.toBe(b)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

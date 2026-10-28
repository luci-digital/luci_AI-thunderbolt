/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'

import { hashSkillId } from './telemetry'

describe('hashSkillId', () => {
  it('returns a deterministic 16-char hex string', async () => {
    const a = await hashSkillId('user-1', 'skill-1')
    const b = await hashSkillId('user-1', 'skill-1')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{16}$/)
  })

  it('produces different hashes for different user_ids on the same skill (unlinkability)', async () => {
    const a = await hashSkillId('user-1', 'shared-skill')
    const b = await hashSkillId('user-2', 'shared-skill')
    expect(a).not.toBe(b)
  })

  it('produces different hashes for different skill_ids under the same user', async () => {
    const a = await hashSkillId('user-1', 'skill-a')
    const b = await hashSkillId('user-1', 'skill-b')
    expect(a).not.toBe(b)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

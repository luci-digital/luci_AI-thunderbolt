/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'

import { defaultSkills } from './skills'

describe('defaultSkills', () => {
  it('seeds every default with a pinnedOrder so new users start with pinned chips in chat', () => {
    // Regression guard — Chris flagged that seeded skills must be pinned by
    // default. Pinning is now manageable only from the chat composer; a new
    // user with no pinned defaults would see the chip bar empty until they
    // open the `+` popover and pin one manually, which loses the "starter
    // chip is ready" affordance that the legacy automations gave them.
    for (const skill of defaultSkills) {
      expect(typeof skill.pinnedOrder).toBe('number')
      expect(skill.pinnedOrder).not.toBeNull()
    }
  })

  it('assigns each default a unique pinnedOrder so the order is stable on seed', () => {
    const orders = defaultSkills.map((s) => s.pinnedOrder)
    expect(new Set(orders).size).toBe(orders.length)
  })

  it('seeds every default as enabled — disabled defaults would never reach the chat resolver', () => {
    for (const skill of defaultSkills) {
      expect(skill.enabled).toBe(1)
    }
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

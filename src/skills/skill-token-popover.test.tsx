/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { SkillTokenPopover } from './skill-token-popover'

// HoverCard's open/close behavior depends on timer-driven hover handling
// inside Radix and JSDOM-incompatible pointer events. We assert the
// trigger surface that the chat composer relies on, not the full
// open/close cycle — that lives in manual / e2e testing.
const renderPopover = (state: { editSkill: string } | { createSkill: string }) =>
  render(
    <MemoryRouter>
      <SkillTokenPopover
        trigger={<span className="text-orange-500">/some-token</span>}
        message="Skill is broken."
        actionLabel="Enable"
        state={state}
      />
    </MemoryRouter>,
  )

describe('SkillTokenPopover', () => {
  afterEach(cleanup)

  it('renders the trigger with pointer-events-auto so it can capture hover inside a pointer-events-none overlay', () => {
    const { container } = renderPopover({ editSkill: 'id-1' })
    const trigger = container.querySelector('.pointer-events-auto')
    expect(trigger).toBeTruthy()
    expect(trigger?.textContent).toBe('/some-token')
  })

  it('exposes the trigger as keyboard-focusable so users can Tab to a problematic token', () => {
    const { container } = renderPopover({ editSkill: 'id-1' })
    const trigger = container.querySelector('[tabindex="0"]')
    expect(trigger?.textContent).toBe('/some-token')
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

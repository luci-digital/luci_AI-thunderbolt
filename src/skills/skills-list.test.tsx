/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import '@testing-library/jest-dom'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { MemoryRouter } from 'react-router'
import { SidebarProvider } from '@/components/ui/sidebar'
// Import for side effect: framer-motion mock so the row `m.li` renders to a
// plain `<li>` in jsdom.
import '@/test-utils/framer-motion-mock'
import { SkillsList } from './skills-list'
import type { Skill } from '@/types'

afterEach(cleanup)

const skill: Skill = {
  id: 's1',
  name: 'meeting-notes',
  description: 'desc',
  instruction: 'do',
  enabled: 1,
  pinnedOrder: null,
  deletedAt: null,
  defaultHash: null,
  userId: null,
  workspaceId: null,
  scope: null,
}

const renderList = (props: { canCreate?: boolean } = {}) => {
  render(
    <MemoryRouter>
      <SidebarProvider>
        <SkillsList
          skills={[skill]}
          activeSkillId={null}
          isEnabled={() => true}
          canCreate={props.canCreate}
          onToggleEnabled={mock(() => {})}
          onCreate={mock(() => {})}
          onSelectSkill={mock(() => {})}
          onEdit={mock(() => {})}
          onDelete={mock(() => {})}
        />
      </SidebarProvider>
    </MemoryRouter>,
  )
}

describe('SkillsList — permission gating', () => {
  it('hides the Create button when canCreate is false', () => {
    renderList({ canCreate: false })

    expect(screen.queryByRole('button', { name: 'Create skill' })).not.toBeInTheDocument()
  })

  it('shows the Create button by default', () => {
    renderList()

    expect(screen.getByRole('button', { name: 'Create skill' })).toBeInTheDocument()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

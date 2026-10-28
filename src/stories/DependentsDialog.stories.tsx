/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { DependentsDialog } from '@/skills/dependents-dialog'
import type { Skill } from '@/types'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

const dep = (id: string, name: string): Skill => ({
  id,
  name,
  description: 'desc',
  instruction: 'inst',
  enabled: 1,
  pinnedOrder: null,
  deletedAt: null,
  defaultHash: null,
  userId: null,
  workspaceId: null,
  scope: null,
})

const meta = {
  title: 'skills/dependents-dialog',
  component: DependentsDialog,
  parameters: {
    layout: 'centered',
    docs: {
      story: { inline: false, iframeHeight: 420 },
    },
  },
  tags: ['autodocs'],
  args: { onConfirm: fn(), onOpenChange: fn(), onJumpToDependent: fn() },
} satisfies Meta<typeof DependentsDialog>

export default meta
type Story = StoryObj<typeof meta>

export const DisableSingleDependent: Story = {
  args: {
    open: true,
    action: 'disable',
    targetName: 'meeting-notes',
    dependents: [dep('1', 'weekly-review')],
  },
}

export const DeleteMultipleDependents: Story = {
  args: {
    open: true,
    action: 'delete',
    targetName: 'task-triage',
    dependents: [dep('1', 'weekly-review'), dep('2', 'planning-session'), dep('3', 'standup-prep')],
  },
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

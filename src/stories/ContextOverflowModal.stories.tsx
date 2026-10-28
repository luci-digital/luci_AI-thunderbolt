/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { ContextOverflowModal } from '@/components/context-overflow-modal'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

const meta = {
  title: 'components/context-overflow-modal',
  component: ContextOverflowModal,
  parameters: {
    layout: 'centered',
    docs: {
      story: {
        inline: false,
        iframeHeight: 400,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: { type: 'boolean' },
      description: 'Whether the modal is open',
    },
    maxTokens: {
      control: { type: 'number', min: 1000, max: 300000 },
      description: 'Maximum number of tokens for the model',
    },
  },
  args: {
    onClose: fn(),
    onNewChat: fn(),
  },
} satisfies Meta<typeof ContextOverflowModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isOpen: true,
    maxTokens: 256000,
  },
}

export const UnknownMaxTokens: Story = {
  args: {
    isOpen: true,
    maxTokens: undefined,
  },
}

export const SmallModel: Story = {
  args: {
    isOpen: true,
    maxTokens: 4096,
  },
}

export const Closed: Story = {
  args: {
    isOpen: false,
    maxTokens: 256000,
  },
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

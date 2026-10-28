/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { Meta, StoryObj } from '@storybook/react-vite'
import { CopyMessageButton } from './copy-message-button'

const meta = {
  title: 'Chat/CopyMessageButton',
  component: CopyMessageButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A button that copies text to clipboard with a checkmark feedback animation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'The text to copy to clipboard when clicked',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    text: 'Hello, this is a sample message to copy!',
  },
} satisfies Meta<typeof CopyMessageButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LongMarkdown: Story = {
  args: {
    text: '## Summary\n\nHere are two standout thriller films:\n\n1. **Black Bag** – A sleek spy-thriller\n2. **Highest 2 Lowest** – A tense kidnapping drama',
  },
}

export const CustomClass: Story = {
  args: {
    text: 'Custom styled button',
    className: 'bg-muted rounded-full',
  },
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

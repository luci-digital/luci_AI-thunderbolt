/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { ContextUsageIndicator } from '@/components/context-usage-indicator'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'components/context-usage-indicator',
  component: ContextUsageIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    usedTokens: {
      control: { type: 'number', min: 0, max: 300000 },
      description: 'Number of tokens currently used',
    },
    maxTokens: {
      control: { type: 'number', min: 1000, max: 300000 },
      description: 'Maximum number of tokens available',
    },
  },
} satisfies Meta<typeof ContextUsageIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const SmallUsage: Story = {
  args: {
    usedTokens: 42,
    maxTokens: 4096,
  },
  name: '1% Usage',
}

export const Normal: Story = {
  args: {
    usedTokens: 128000,
    maxTokens: 256000,
  },
  name: '50% Usage',
}

export const NearLimit: Story = {
  args: {
    usedTokens: 220000,
    maxTokens: 256000,
  },
  name: '86% Usage',
}

export const OverLimit: Story = {
  args: {
    usedTokens: 281600,
    maxTokens: 256000,
  },
  name: '110% Usage (Over Limit)',
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

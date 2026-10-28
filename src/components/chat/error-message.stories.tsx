/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { maxRetries } from '@/chats/chat-instance'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ErrorMessage } from './error-message'

const meta = {
  title: 'Chat/ErrorMessage',
  component: ErrorMessage,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Two-phase error banner shown during chat failures. Displays a yellow "retrying" state with a spinner during auto-retries, then a red error state with a manual Retry button when all attempts are exhausted.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ErrorMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Retrying: Story = {
  args: {
    retryCount: 1,
    retriesExhausted: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Yellow banner with spinner shown while auto-retries are in progress.',
      },
    },
  },
}

export const RetryingSecondAttempt: Story = {
  args: {
    retryCount: 2,
    retriesExhausted: false,
  },
}

export const RetryingFinalAttempt: Story = {
  args: {
    retryCount: maxRetries,
    retriesExhausted: false,
  },
}

export const RetriesExhausted: Story = {
  args: {
    retryCount: maxRetries,
    retriesExhausted: true,
    onRetry: () => {
      console.log('Retry clicked')
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Red banner with manual Retry button shown after all auto-retries have failed.',
      },
    },
  },
}

export const RetriesExhaustedNoRetryHandler: Story = {
  args: {
    retryCount: maxRetries,
    retriesExhausted: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Red banner without Retry button when no onRetry handler is provided.',
      },
    },
  },
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

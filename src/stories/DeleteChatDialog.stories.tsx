/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { DeleteChatDialog, type DeleteChatDialogRef } from '@/components/delete-chat-dialog'
import { Button } from '@/components/ui/button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useEffect } from 'react'

import { fn } from 'storybook/test'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'components/delete-chat-dialog',
  component: DeleteChatDialog,
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
  argTypes: {},
  args: { onCancel: fn(), onConfirm: fn() },
} satisfies Meta<typeof DeleteChatDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  render: ({ onConfirm, onCancel, ...args }) => {
    const ref = useRef<DeleteChatDialogRef>(null)

    const handleConfirm = () => {
      onConfirm()
      ref.current?.close()
    }

    const handleCancel = () => {
      onCancel?.()
      ref.current?.close()
    }

    // Auto-open the dialog when component mounts
    useEffect(() => {
      ref.current?.open()
    }, [])

    return <DeleteChatDialog ref={ref} onConfirm={handleConfirm} onCancel={handleCancel} {...args} />
  },
}

export const Basic: Story = {
  render: ({ onConfirm, ...args }) => {
    const ref = useRef<DeleteChatDialogRef>(null)

    const handleConfirm = () => {
      onConfirm()
      ref.current?.close()
    }

    return (
      <>
        <Button onClick={() => ref.current?.open()}>Open Delete Chat Dialog</Button>
        <DeleteChatDialog ref={ref} onConfirm={handleConfirm} {...args} />
      </>
    )
  },
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

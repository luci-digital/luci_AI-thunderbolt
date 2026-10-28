/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, mock } from 'bun:test'
import { RenameChatDialog } from './rename-chat-dialog'

const setup = (title: string | null = 'My Chat') => {
  const onOpenChange = mock()
  const onRename = mock()
  render(<RenameChatDialog open title={title} onOpenChange={onOpenChange} onRename={onRename} />)
  return { onOpenChange, onRename }
}

describe('RenameChatDialog', () => {
  it('renders with the current title in the input', () => {
    setup()
    expect(screen.getByDisplayValue('My Chat')).toBeInTheDocument()
  })

  it('uses "New Chat" when title is null', () => {
    setup(null)
    expect(screen.getByDisplayValue('New Chat')).toBeInTheDocument()
  })

  it('saves on Enter key', () => {
    const { onRename, onOpenChange } = setup()
    const input = screen.getByDisplayValue('My Chat')
    fireEvent.change(input, { target: { value: 'Renamed' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onRename).toHaveBeenCalledWith('Renamed')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('saves on Save button click', () => {
    const { onRename, onOpenChange } = setup()
    const input = screen.getByDisplayValue('My Chat')
    fireEvent.change(input, { target: { value: 'Renamed' } })
    fireEvent.click(screen.getByText('Save'))

    expect(onRename).toHaveBeenCalledWith('Renamed')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes on Cancel button click', () => {
    const { onRename, onOpenChange } = setup()
    fireEvent.click(screen.getByText('Cancel'))

    expect(onRename).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('trims whitespace and falls back to "New Chat"', () => {
    const { onRename } = setup()
    const input = screen.getByDisplayValue('My Chat')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByText('Save'))

    expect(onRename).toHaveBeenCalledWith('New Chat')
  })

  it('does not call onRename when title is unchanged', () => {
    const { onRename, onOpenChange } = setup()
    fireEvent.click(screen.getByText('Save'))

    expect(onRename).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

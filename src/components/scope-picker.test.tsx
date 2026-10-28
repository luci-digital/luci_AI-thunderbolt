/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it, mock } from 'bun:test'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

import { ScopePicker } from './scope-picker'

describe('ScopePicker', () => {
  it('shows the workspace hint when value=workspace', () => {
    render(<ScopePicker value="workspace" onChange={() => {}} />)
    expect(screen.getByText(/shared with everyone/i)).toBeInTheDocument()
  })

  it('shows the private hint when value=user', () => {
    render(<ScopePicker value="user" onChange={() => {}} />)
    expect(screen.getByText(/only you can see/i)).toBeInTheDocument()
  })

  it('calls onChange with the next scope when the user picks the other option', () => {
    const onChange = mock(() => {})
    render(<ScopePicker value="workspace" onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: /private/i }))
    expect(onChange).toHaveBeenCalledWith('user')
  })

  it('ignores the deselect that Radix emits when clicking the already-active item', () => {
    const onChange = mock(() => {})
    render(<ScopePicker value="workspace" onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: /shared with the workspace/i }))
    expect(onChange).not.toHaveBeenCalled()
    cleanup()
  })

  it('disables both options when disabled', () => {
    render(<ScopePicker value="workspace" onChange={() => {}} disabled />)
    expect(screen.getByRole('radio', { name: /shared with the workspace/i })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /private to you/i })).toBeDisabled()
  })

  it('readOnly silences clicks without dimming the selected state', () => {
    const onChange = mock(() => {})
    render(<ScopePicker value="user" onChange={onChange} readOnly />)
    // The picker still reflects the value (private hint visible)…
    expect(screen.getByText(/only you can see/i)).toBeInTheDocument()
    // …but clicking the other option doesn't fire onChange (pointer-events: none).
    fireEvent.click(screen.getByRole('radio', { name: /shared with the workspace/i }))
    expect(onChange).not.toHaveBeenCalled()
    // And the items aren't marked disabled (would dim them).
    expect(screen.getByRole('radio', { name: /shared with the workspace/i })).not.toBeDisabled()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

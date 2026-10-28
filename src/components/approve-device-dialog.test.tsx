/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import '@testing-library/jest-dom'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { ApproveDeviceDialog } from './approve-device-dialog'

describe('ApproveDeviceDialog', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders title and description when open', () => {
    render(<ApproveDeviceDialog open={true} onOpenChange={() => {}} onConfirm={() => {}} isPending={false} />)

    expect(screen.getByText('Approve this device?')).toBeInTheDocument()
    expect(
      screen.getByText(
        'This will share your encryption key with the device, allowing it to decrypt and sync your data.',
      ),
    ).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(<ApproveDeviceDialog open={false} onOpenChange={() => {}} onConfirm={() => {}} isPending={false} />)

    expect(screen.queryByText('Approve this device?')).not.toBeInTheDocument()
  })

  it('calls onConfirm when Approve is clicked', async () => {
    const onConfirm = mock()
    render(<ApproveDeviceDialog open={true} onOpenChange={() => {}} onConfirm={onConfirm} isPending={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('shows loading state when isPending', () => {
    render(<ApproveDeviceDialog open={true} onOpenChange={() => {}} onConfirm={() => {}} isPending={true} />)

    expect(screen.getByText('Approving…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('disables buttons when isPending', () => {
    render(<ApproveDeviceDialog open={true} onOpenChange={() => {}} onConfirm={() => {}} isPending={true} />)

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Approving…' })).toBeDisabled()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '@/dal/test-utils'
import { createTestProvider } from '@/test-utils/test-provider'
import { getClock } from '@/testing-library'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import { RevokedDeviceModal } from './revoked-device-modal'

const mockSignOutAndWipe = mock(async ({ onComplete }: { signOut?: () => Promise<void>; onComplete: () => void }) => {
  onComplete()
})

const mockReplace = mock()
Object.defineProperty(window, 'location', {
  value: { replace: mockReplace },
  writable: true,
  configurable: true,
})

describe('RevokedDeviceModal', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await resetTestDatabase()
    mockSignOutAndWipe.mockClear()
    mockReplace.mockClear()
  })

  const renderModal = (props: Partial<{ open: boolean }> = {}) =>
    render(<RevokedDeviceModal open={props.open ?? true} signOutAndWipe={mockSignOutAndWipe} />, {
      wrapper: createTestProvider(),
    })

  describe('rendering', () => {
    it('renders title and wipe-warning description when open', () => {
      renderModal({ open: true })
      expect(screen.getByRole('heading', { name: 'Device access revoked' })).toBeInTheDocument()
      expect(
        screen.getByText(
          'This device has been signed out remotely. Your local chats, settings, and cached data will be removed from this device.',
        ),
      ).toBeInTheDocument()
    })

    it('does not render content when closed', () => {
      renderModal({ open: false })
      expect(screen.queryByRole('heading', { name: 'Device access revoked' })).not.toBeInTheDocument()
    })

    it('displays a single destructive confirm button', () => {
      renderModal()
      const button = screen.getByRole('button', { name: 'Confirm' })
      expect(button).toBeInTheDocument()
      expect(button.className).toContain('destructive')
    })

    it('does not offer a "keep my data" affordance', () => {
      renderModal()
      expect(screen.queryByText(/keep data/i)).not.toBeInTheDocument()
    })

    it('has no cancel button (revocation is non-optional)', () => {
      renderModal()
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    })
  })

  describe('confirm flow', () => {
    it('invokes signOutAndWipe with no signOut and an onComplete that replaces to /', async () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

      await act(async () => {
        await getClock().runAllAsync()
      })

      expect(mockSignOutAndWipe).toHaveBeenCalledTimes(1)
      const arg = mockSignOutAndWipe.mock.calls[0][0]
      expect(arg.signOut).toBeUndefined()
      expect(typeof arg.onComplete).toBe('function')
      // The mock invokes onComplete itself; assert the side-effect that landed.
      expect(mockReplace).toHaveBeenCalledWith('/')
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

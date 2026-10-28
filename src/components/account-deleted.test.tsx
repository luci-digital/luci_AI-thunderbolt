/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { setupTestDatabase, teardownTestDatabase } from '@/dal/test-utils'
import { createTestProvider } from '@/test-utils/test-provider'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import { AccountDeleted } from './account-deleted'

const mockReplace = mock()
Object.defineProperty(window, 'location', {
  value: { replace: mockReplace },
  writable: true,
  configurable: true,
})

describe('AccountDeleted', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(() => {
    mockReplace.mockClear()
  })

  const renderComponent = () =>
    render(<AccountDeleted />, {
      wrapper: createTestProvider(),
    })

  describe('rendering', () => {
    it('renders heading and description', () => {
      renderComponent()
      expect(screen.getByRole('heading', { name: 'Account Deleted' })).toBeInTheDocument()
      expect(screen.getByText('Your account has been deleted and local data has been cleared.')).toBeInTheDocument()
    })

    it('renders Thunderbolt branding', () => {
      renderComponent()
      expect(screen.getByText('Thunderbolt')).toBeInTheDocument()
    })

    it('renders Back to App button', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: 'Back to App' })).toBeInTheDocument()
    })
  })

  describe('Back to App button', () => {
    it('calls window.location.replace("/") when clicked', () => {
      renderComponent()
      fireEvent.click(screen.getByRole('button', { name: 'Back to App' }))
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

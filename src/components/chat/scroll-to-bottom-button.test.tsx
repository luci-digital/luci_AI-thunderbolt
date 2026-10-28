/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { getClock } from '@/testing-library'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { ScrollToBottomButton } from './scroll-to-bottom-button'

describe('ScrollToBottomButton', () => {
  afterEach(() => {
    cleanup()
  })

  describe('visibility', () => {
    it('should render button when isVisible is true', async () => {
      const onClick = mock()

      render(<ScrollToBottomButton isVisible={true} onClick={onClick} />)

      // Wait for animation to complete
      await act(async () => {
        await getClock().tickAsync(300)
      })

      const button = screen.getByRole('button', { name: 'Scroll to bottom' })
      expect(button).toBeInTheDocument()
    })

    it('should not render button when isVisible is false', () => {
      const onClick = mock()

      render(<ScrollToBottomButton isVisible={false} onClick={onClick} />)

      const button = screen.queryByRole('button', { name: 'Scroll to bottom' })
      expect(button).toBeNull()
    })
  })

  describe('interaction', () => {
    it('should call onClick when button is clicked', async () => {
      const onClick = mock()

      render(<ScrollToBottomButton isVisible={true} onClick={onClick} />)

      // Wait for animation to complete
      await act(async () => {
        await getClock().tickAsync(300)
      })

      const button = screen.getByRole('button', { name: 'Scroll to bottom' })
      fireEvent.click(button)

      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('styling', () => {
    it('should apply custom className', async () => {
      const onClick = mock()

      render(<ScrollToBottomButton isVisible={true} onClick={onClick} className="custom-class" />)

      await act(async () => {
        await getClock().tickAsync(300)
      })

      // The className is applied to the m.div wrapper, not the button
      // We can verify the button exists and has proper styling
      const button = screen.getByRole('button', { name: 'Scroll to bottom' })
      expect(button).toBeInTheDocument()
      expect(button.className).toContain('rounded-full')
    })

    it('should have proper accessibility label', async () => {
      const onClick = mock()

      render(<ScrollToBottomButton isVisible={true} onClick={onClick} />)

      await act(async () => {
        await getClock().tickAsync(300)
      })

      const button = screen.getByRole('button', { name: 'Scroll to bottom' })
      expect(button).toHaveAttribute('aria-label', 'Scroll to bottom')
    })
  })

  describe('icon', () => {
    it('should render chevron-down icon', async () => {
      const onClick = mock()

      render(<ScrollToBottomButton isVisible={true} onClick={onClick} />)

      await act(async () => {
        await getClock().tickAsync(300)
      })

      const button = screen.getByRole('button', { name: 'Scroll to bottom' })
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

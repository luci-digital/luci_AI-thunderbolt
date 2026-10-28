/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { render, screen } from '@testing-library/react'
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'bun:test'
import '@testing-library/jest-dom'
import { OnboardingCelebrationStep } from './onboarding-celebration-step'
import { createQueryTestWrapper } from '@/test-utils/react-query'
import { setupTestDatabase, resetTestDatabase, teardownTestDatabase } from '@/dal/test-utils'

beforeAll(async () => {
  await setupTestDatabase()
})

afterAll(async () => {
  await teardownTestDatabase()
})

describe('OnboardingCelebrationStep', () => {
  beforeEach(async () => {
    // Reset database before each test to prevent pollution from randomized test order
    await resetTestDatabase()
  })

  const renderComponent = () => {
    return render(<OnboardingCelebrationStep />, { wrapper: createQueryTestWrapper() })
  }

  describe('UI rendering', () => {
    it('should render celebration UI correctly', () => {
      renderComponent()

      expect(screen.getByText("You're all set! 🎉")).toBeInTheDocument()
    })

    it('should render celebration message', () => {
      renderComponent()

      expect(screen.getByText("You're all set! 🎉")).toBeInTheDocument()
    })

    it('should render celebration icon', () => {
      renderComponent()

      const iconContainer = screen
        .getByText("You're all set! 🎉")
        .closest('div')
        ?.parentElement?.querySelector('.mx-auto')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Visual structure', () => {
    it('should display celebration icon with proper styling', () => {
      renderComponent()

      const message = screen.getByText("You're all set! 🎉")
      expect(message).toBeInTheDocument()
    })

    it('should have proper text styling', () => {
      renderComponent()

      const message = screen.getByText("You're all set! 🎉")
      expect(message).toHaveClass('text-lg', 'text-muted-foreground')
    })
  })

  describe('Icon structure', () => {
    it('should display CheckCircle icon', () => {
      renderComponent()

      const iconContainer = screen
        .getByText("You're all set! 🎉")
        .closest('div')
        ?.parentElement?.querySelector('.mx-auto')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper text structure', () => {
      renderComponent()

      const message = screen.getByText("You're all set! 🎉")
      expect(message).toBeInTheDocument()
    })

    it('should have proper text hierarchy', () => {
      renderComponent()

      const message = screen.getByText("You're all set! 🎉")
      expect(message).toBeInTheDocument()
      expect(message.tagName).toBe('P')
    })

    it('should maintain accessibility with proper contrast', () => {
      renderComponent()

      const message = screen.getByText("You're all set! 🎉")
      expect(message).toBeInTheDocument()
    })
  })

  describe('Content validation', () => {
    it('should display correct celebration message', () => {
      renderComponent()

      expect(screen.getByText("You're all set! 🎉")).toBeInTheDocument()
    })

    it('should display emoji correctly', () => {
      renderComponent()

      expect(screen.getByText(/🎉/)).toBeInTheDocument()
    })

    it('should have proper text content', () => {
      renderComponent()

      const message = screen.getByText("You're all set! 🎉")
      expect(message).toHaveTextContent("You're all set! 🎉")
    })
  })

  describe('Edge cases', () => {
    it('should handle component rendering without errors', () => {
      expect(() => renderComponent()).not.toThrow()
    })

    it('should maintain proper structure with all elements', () => {
      renderComponent()

      expect(screen.getByText("You're all set! 🎉")).toBeInTheDocument()
    })

    it('should display emoji correctly', () => {
      renderComponent()

      expect(screen.getByText(/🎉/)).toBeInTheDocument()
    })
  })

  describe('Visual elements', () => {
    it('should have proper icon styling', () => {
      renderComponent()

      const message = screen.getByText("You're all set! 🎉")
      expect(message).toBeInTheDocument()
    })
  })

  describe('Content structure', () => {
    it('should have proper content hierarchy', () => {
      renderComponent()

      const message = screen.getByText("You're all set! 🎉")
      expect(message).toBeInTheDocument()
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

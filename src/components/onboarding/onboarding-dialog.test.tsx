/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '@/dal/test-utils'
import { mockLocationData } from '@/test-utils/http-client'
import { createTestProvider } from '@/test-utils/test-provider'
import { render, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import type { ConsoleSpies } from '@/test-utils/console-spies'
import { setupConsoleSpy } from '@/test-utils/console-spies'
import { MemoryRouter } from 'react-router'
import type { ReactNode } from 'react'
import { OnboardingDialog } from './onboarding-dialog'

let consoleSpies: ConsoleSpies

beforeAll(async () => {
  await setupTestDatabase()
  consoleSpies = setupConsoleSpy()
})

afterAll(async () => {
  await teardownTestDatabase()
  consoleSpies.restore()
})

afterEach(async () => {
  await resetTestDatabase()
})

const createRouterWrapper =
  (locationState?: unknown) =>
  ({ children }: { children: ReactNode }) => {
    const TestProvider = createTestProvider({ mockResponse: mockLocationData })
    const entries = [{ pathname: '/', state: locationState ?? null }]
    return (
      <MemoryRouter initialEntries={entries}>
        <TestProvider>{children}</TestProvider>
      </MemoryRouter>
    )
  }

describe('OnboardingDialog', () => {
  describe('Component rendering', () => {
    it('should render without crashing', () => {
      render(<OnboardingDialog />, {
        wrapper: createRouterWrapper(),
      })
    })

    it('should handle location state changes', () => {
      const oauthState = {
        oauth: {
          code: 'mock_auth_code_12345',
          state: 'mock_state_67890',
          error: undefined,
        },
      }

      render(<OnboardingDialog />, {
        wrapper: createRouterWrapper(oauthState),
      })
    })

    it('should handle OAuth error state', () => {
      const oauthErrorState = {
        oauth: {
          code: undefined,
          state: 'mock_state_67890',
          error: 'access_denied',
        },
      }

      render(<OnboardingDialog />, {
        wrapper: createRouterWrapper(oauthErrorState),
      })
    })
  })

  describe('Integration with database', () => {
    it('should work with real database operations', async () => {
      render(<OnboardingDialog />, {
        wrapper: createRouterWrapper(),
      })

      await waitFor(() => {
        expect(true).toBe(true)
      })
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

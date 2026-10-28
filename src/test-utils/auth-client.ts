/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { AuthClient } from '@/contexts'

type MockAuthClientOptions = {
  session?: {
    user: {
      id: string
      email: string
      name?: string
      isAnonymous?: boolean
    }
  } | null
  isPending?: boolean
  signInEmailOtp?: (options: {
    email: string
    otp: string
  }) => Promise<{ error: { message: string; code?: string } | null }>
  signInAnonymous?: () => Promise<{
    error: { status: number; code: string } | null
    data: { user: { id: string } } | null
  }>
  sendVerificationOtp?: (options: { email: string; type: string }) => Promise<{ error: { message: string } | null }>
  signOut?: () => Promise<void>
  getSession?: () => Promise<{ data: unknown; error: { message: string } | null }>
}

/**
 * Creates a mock auth client for testing
 * Default state is logged out (session: null, isPending: false)
 */
export const createMockAuthClient = (options: MockAuthClientOptions = {}): AuthClient => {
  const {
    session = null,
    isPending = false,
    signInEmailOtp = async () => ({ error: null }),
    signInAnonymous = async () => ({ error: null, data: { user: { id: 'anon-mock' } } }),
    sendVerificationOtp = async () => ({ error: null }),
    signOut = async () => {},
    getSession = async () => ({ data: session, error: null }),
  } = options

  // Use unknown first to bypass strict type checking for test mocks
  return {
    useSession: () => ({
      data: session,
      isPending,
      isRefetching: false,
      error: null,
      refetch: async () => ({ data: session, error: null }),
    }),
    getSession,
    signIn: {
      emailOtp: signInEmailOtp,
      anonymous: signInAnonymous,
    },
    emailOtp: {
      sendVerificationOtp,
    },
    signOut,
    $Infer: {} as AuthClient['$Infer'],
  } as unknown as AuthClient
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

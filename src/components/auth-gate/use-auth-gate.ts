/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts'
import { isAnonymousAuthEnabled, isSsoMode, isWaitlistBypassed } from '@/lib/auth-mode'

export type AuthRequirement = 'authenticated' | 'unauthenticated'

export type RedirectTarget = 'sso' | 'waitlist' | 'home'

export type AuthGateState =
  | { status: 'loading' }
  | { status: 'allowed' }
  | { status: 'redirect'; target: RedirectTarget }

/**
 * Hook that determines route access based on authentication state.
 *
 * For `require="authenticated"`:
 *  - has session (real or anonymous) → allowed
 *  - SSO mode + no session → redirect to /sso-redirect
 *  - waitlist bypassed + anonymous overlay enabled + no session → fire `signIn.anonymous()` and show loading
 *  - waitlist active + no session → redirect to /waitlist
 *
 * For `require="unauthenticated"`:
 *  - has session → redirect to /
 *  - no session → allowed
 *
 * Anonymous users count as "authenticated" for routing — their session has a real
 * `user` record with `isAnonymous: true`. Capability gating per route lives in the
 * route itself, not here.
 */
export const useAuthGate = (require: AuthRequirement): AuthGateState => {
  const authClient = useAuth()
  const { data: session, isPending } = authClient.useSession()
  const isAuthenticated = !!session?.user

  const isAnonymousAllowed = isAnonymousAuthEnabled() && !isSsoMode() && isWaitlistBypassed()

  const triedAnonRef = useRef(false)
  const [anonError, setAnonError] = useState<Error | null>(null)
  if (anonError) {
    throw anonError
  }

  // Strict Mode invokes effects twice on mount; the ref dedups so we never fire
  // signIn.anonymous() more than once per gate mount.
  //
  // Better Auth client methods resolve with `{ data, error }` for HTTP failures
  // (4xx/5xx) — they do NOT throw. Only network errors / aborts reject. We must
  // surface both paths to the error boundary; otherwise an HTTP error leaves the
  // gate stuck in `loading` forever (the ref prevents a retry).
  useEffect(() => {
    const shouldFireAnon =
      !isPending && !isAuthenticated && require === 'authenticated' && isAnonymousAllowed && !triedAnonRef.current
    if (!shouldFireAnon) {
      return
    }
    triedAnonRef.current = true
    const run = async () => {
      try {
        const result = await authClient.signIn.anonymous()
        if (result?.error) {
          setAnonError(new Error(result.error.message ?? 'Anonymous sign-in failed'))
        }
      } catch (err) {
        setAnonError(err instanceof Error ? err : new Error(String(err)))
      }
    }
    void run()
  }, [isPending, isAuthenticated, require, isAnonymousAllowed, authClient])

  if (isPending) {
    return { status: 'loading' }
  }

  if (require === 'unauthenticated') {
    return isAuthenticated ? { status: 'redirect', target: 'home' } : { status: 'allowed' }
  }

  if (isAuthenticated) {
    return { status: 'allowed' }
  }

  if (isAnonymousAllowed) {
    return { status: 'loading' }
  }

  if (isSsoMode()) {
    return { status: 'redirect', target: 'sso' }
  }

  return { status: 'redirect', target: 'waitlist' }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

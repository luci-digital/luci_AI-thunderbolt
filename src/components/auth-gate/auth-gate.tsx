/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Navigate, Outlet } from 'react-router'

import Loading from '@/loading'
import { useAuthGate, type AuthRequirement, type RedirectTarget } from './use-auth-gate'

type AuthGateProps = {
  /** What auth state is required to access child routes */
  require: AuthRequirement
}

const redirectPaths: Record<RedirectTarget, string> = {
  sso: '/sso-redirect',
  waitlist: '/waitlist',
  home: '/',
}

/**
 * Route guard that controls access based on authentication state.
 * Use as a layout route element to wrap protected route groups.
 *
 * The gate decides redirect targets internally from `VITE_AUTH_MODE` and the
 * `VITE_AUTH_ENABLE_ANONYMOUS` / `VITE_BYPASS_WAITLIST` overlays — no caller
 * configuration needed.
 *
 * @example
 * // Require authentication — redirects to /sso-redirect (SSO mode) or /waitlist (consumer mode),
 * // or auto-creates an anonymous session when `VITE_AUTH_ENABLE_ANONYMOUS=true` on a bypass-waitlist
 * // / PR-preview deployment.
 * <Route element={<AuthGate require="authenticated" />}>
 *   <Route path="/" element={<Layout />} />
 * </Route>
 *
 * @example
 * // Require unauthenticated — redirects to / if already logged in.
 * <Route element={<AuthGate require="unauthenticated" />}>
 *   <Route path="waitlist" element={<WaitlistLayout />} />
 * </Route>
 */
export const AuthGate = ({ require }: AuthGateProps) => {
  const state = useAuthGate(require)

  if (state.status === 'loading') {
    return <Loading />
  }
  if (state.status === 'redirect') {
    return <Navigate to={redirectPaths[state.target]} replace />
  }

  return <Outlet />
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

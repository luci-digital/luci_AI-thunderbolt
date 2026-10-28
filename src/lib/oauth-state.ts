/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { OAuthProvider } from './auth'

export type ReturnContext = 'onboarding' | 'integrations' | `/${string}`

const storageKey = 'oauth_flow_state'

/**
 * OAuth state stored in localStorage (device-local, never synced).
 *
 * localStorage (not sessionStorage) because on Tauri mobile the OS may
 * terminate the app while the user is in the system browser completing
 * OAuth — sessionStorage would be wiped on relaunch, breaking the
 * deep-link callback validation. The IdP enforces code expiry server-side,
 * so no client-side TTL is needed; the next flow's setOAuthState
 * overwrites any abandoned entry.
 */
type OAuthState = {
  state: string | null
  provider: OAuthProvider | null
  verifier: string | null
  returnContext: ReturnContext | null
}

const emptyState = (): OAuthState => ({
  state: null,
  provider: null,
  verifier: null,
  returnContext: null,
})

/** Gets all OAuth flow state from localStorage. */
export const getOAuthState = (): OAuthState => {
  const raw = localStorage.getItem(storageKey)
  if (!raw) {
    return emptyState()
  }
  try {
    return JSON.parse(raw) as OAuthState
  } catch {
    return emptyState()
  }
}

/** Sets OAuth flow state in localStorage (merges with existing). */
export const setOAuthState = (update: Partial<OAuthState>): void => {
  const current = getOAuthState()
  const merged = { ...current, ...update }
  localStorage.setItem(storageKey, JSON.stringify(merged))
}

/** Clears all OAuth flow state from localStorage. */
export const clearOAuthState = (): void => {
  localStorage.removeItem(storageKey)
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

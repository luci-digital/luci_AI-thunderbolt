/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import posthog from 'posthog-js'
import { trackEvent } from '@/lib/posthog'
import { pendingAnonIdKey } from './use-anonymous-promotion-analytics'
import type { AuthClient } from '@/contexts'

/**
 * Reads a pending anon id from sessionStorage (written by `persistForSso()` before an SSO
 * redirect) and fires `posthog.alias` if the current session is now a real (non-anonymous) user.
 *
 * Idempotent: the sessionStorage key is removed immediately after the alias fires, so repeated
 * calls within the same page session are no-ops.
 *
 * Mount once from `AuthProvider` using a ref guard to prevent StrictMode double-invocation.
 */
export const consumePendingSsoAnonAlias = async (authClient: AuthClient): Promise<void> => {
  const pendingAnonId = sessionStorage.getItem(pendingAnonIdKey)
  if (!pendingAnonId) {
    return
  }

  const { data } = await authClient.getSession()

  // Only fire if we now have a real (non-anonymous) session.
  if (!data?.user || data.user.isAnonymous === true) {
    return
  }

  const newUserId = data.user.id
  if (newUserId === pendingAnonId) {
    sessionStorage.removeItem(pendingAnonIdKey)
    return
  }

  posthog.alias(newUserId, pendingAnonId)

  trackEvent('anonymous_user_promoted')
  sessionStorage.removeItem(pendingAnonIdKey)
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

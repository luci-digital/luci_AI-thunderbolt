/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

export const isSsoMode = () => import.meta.env.VITE_AUTH_MODE === 'sso'

/**
 * Returns true when anonymous-session auto-creation is enabled for this deployment.
 * Mirrors the operator-controlled overlay alongside the primary auth path (email-OTP or SSO).
 */
export const isAnonymousAuthEnabled = () => import.meta.env.VITE_AUTH_ENABLE_ANONYMOUS === 'true'

/**
 * Returns true when the waitlist gate is bypassed for this deployment
 */
export const isWaitlistBypassed = () => import.meta.env.VITE_BYPASS_WAITLIST === 'true'

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

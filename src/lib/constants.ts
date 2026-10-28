/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * App-wide constants
 */

/** URL to Mozilla/Thunderbird privacy policy */
export const privacyPolicyUrl = 'https://www.thunderbird.net/en-US/privacy/'

/** URL to Mozilla terms of service */
export const termsOfServiceUrl = 'https://www.mozilla.org/en-US/about/legal/terms/mozilla/'

/** Default title shown for new/untitled chat threads */
export const defaultChatTitle = 'New Chat'

/** Standardized spacing between viewport/container edge and content (in px) */
export const edgeSpacing = {
  mobile: 12,
  desktop: 16,
} as const

/** Mobile sidebar width as a fraction of viewport width (0–1) */
export const mobileSidebarWidthRatio = 0.8

/** OTP code length — must match backend emailOTP config (otpLength). */
export const otpLength = 8

/** HTTP header name for challenge token session binding. */
export const challengeTokenHeader = 'x-challenge-token'

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

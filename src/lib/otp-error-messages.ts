/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

type OtpError = { code?: string; message?: string }
type OtpErrorContext = 'link' | 'code'

const messages: Record<OtpErrorContext, Record<string, string>> = {
  link: {
    OTP_EXPIRED: 'This link has expired. Please request a new one.',
    INVALID_OTP: 'This link is invalid. Please request a new one.',
    TOO_MANY_ATTEMPTS: 'Too many attempts. Please request a new code.',
  },
  code: {
    OTP_EXPIRED: 'This code has expired. Please request a new one.',
    INVALID_OTP: 'Invalid code. Please try again.',
    TOO_MANY_ATTEMPTS: 'Too many attempts. Please request a new code.',
  },
}

const fallback = 'Verification failed. Please try again.'

/**
 * Returns a user-friendly message for OTP verification errors.
 * Handles OTP_EXPIRED, INVALID_OTP, and TOO_MANY_ATTEMPTS from Better Auth.
 */
export const getOtpErrorMessage = (error: OtpError, context: OtpErrorContext): string => {
  const message = error?.code ? messages[context][error.code] : undefined
  return message ?? error?.message ?? fallback
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

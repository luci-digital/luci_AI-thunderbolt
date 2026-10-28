/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type React from 'react'
import { Resend } from 'resend'

/** Default sender address for all outgoing emails */
export const emailFrom = 'hello@auth.thunderbolt.io'

/**
 * Shared Resend client instance for sending emails
 * Created once at module load to avoid multiple instances
 */
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

if (!resend) {
  console.warn('⚠️ RESEND_API_KEY is not set - emails will not be sent')
}

/**
 * Check if email sending should be skipped (test/dev mode or resend not configured)
 * Throws an error if in production but resend is not configured
 * @returns true if email should be skipped, false if it should be sent
 */
export const shouldSkipEmail = (): boolean => {
  const isProduction = process.env.NODE_ENV === 'production'
  if (!resend || process.env.NODE_ENV === 'test') {
    if (isProduction && !resend) {
      throw new Error('Email service not configured')
    }
    return true
  }
  return false
}

export type SendEmailParams = {
  to: string
  from?: string
  subject: string
  react: React.ReactElement
}

/**
 * Send an email using a React Email component.
 * Uses the default sender address unless overridden.
 * @throws Error if resend client is not configured (should call shouldSkipEmail first)
 */
export const sendEmail = async ({ to, from = emailFrom, subject, react }: SendEmailParams) => {
  if (!resend) {
    throw new Error('Email service not configured')
  }

  const { data, error } = await resend.emails.send({ from, to, subject, react })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

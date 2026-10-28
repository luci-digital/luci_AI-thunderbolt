/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { sendEmail, shouldSkipEmail } from '@/lib/resend'
import { WaitlistJoinedEmail } from '@/emails/waitlist-joined'
import { WaitlistReminderEmail } from '@/emails/waitlist-reminder'
import { WaitlistNotReadyEmail } from '@/emails/waitlist-not-ready'
import { getWaitlistAutoApproveDomains, getSettings } from '@/config/settings'

/**
 * Check if an email domain is in the auto-approved list.
 */
export const isAutoApprovedDomain = (email: string): boolean => {
  const domain = email.split('@').pop()!.toLowerCase()
  return getWaitlistAutoApproveDomains(getSettings()).includes(domain)
}

type SendWaitlistEmailParams = {
  email: string
}

/**
 * Send email when user joins the waitlist.
 */
export const sendWaitlistJoinedEmail = async ({ email }: SendWaitlistEmailParams): Promise<void> => {
  console.info('📧 Sending joined waitlist email')

  if (shouldSkipEmail()) {
    console.info('📝 [DEV] Would send joined waitlist email')
    return
  }

  const data = await sendEmail({
    to: email,
    subject: "You're on the Thunderbolt waitlist!",
    react: <WaitlistJoinedEmail />,
  })
  console.info(`✅ Joined waitlist email sent successfully. ID: ${data?.id}`)
}

/**
 * Send waitlist reminder email for users already on the waitlist.
 */
export const sendWaitlistReminderEmail = async ({ email }: SendWaitlistEmailParams): Promise<void> => {
  console.info('📧 Sending waitlist reminder email')

  if (shouldSkipEmail()) {
    console.info('📝 [DEV] Would send waitlist reminder email')
    return
  }

  const data = await sendEmail({
    to: email,
    subject: "You're already on the waitlist!",
    react: <WaitlistReminderEmail />,
  })
  console.info(`✅ Waitlist reminder sent successfully. ID: ${data?.id}`)
}

/**
 * Send "not ready yet" email when a pending waitlist user tries to sign in.
 */
export const sendWaitlistNotReadyEmail = async ({ email }: SendWaitlistEmailParams): Promise<void> => {
  console.info('📧 Sending waitlist not-ready email')

  if (shouldSkipEmail()) {
    console.info('📝 [DEV] Would send waitlist not-ready email')
    return
  }

  const data = await sendEmail({
    to: email,
    subject: "You're on the Thunderbolt waitlist!",
    react: <WaitlistNotReadyEmail />,
  })
  console.info(`✅ Waitlist not-ready email sent successfully. ID: ${data?.id}`)
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Section, Text } from 'react-email'
import { EmailLayout } from './email-layout'

export const WaitlistReminderEmail = () => (
  <EmailLayout preview="You're already on the waitlist!">
    <Section className="bg-white border border-solid border-tb-border rounded-2xl text-center px-8 py-8">
      <Text className="text-2xl font-semibold text-tb-text m-0 mb-6">You're already on the waitlist!</Text>
      <Text className="text-sm text-tb-text m-0 mb-6">
        Good news — you're already on the Thunderbolt waitlist. No need to sign up again! We're working hard to get you
        access as soon as possible. We'll send you an email when it's your turn to join.
      </Text>
      <Text className="text-sm text-tb-text m-0">The Thunderbolt Team</Text>
    </Section>
  </EmailLayout>
)

export default WaitlistReminderEmail

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

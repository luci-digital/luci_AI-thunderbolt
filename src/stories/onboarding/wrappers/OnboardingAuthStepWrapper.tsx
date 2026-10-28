/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { OnboardingAuthStep } from '@/components/onboarding/onboarding-auth-step'
import { createQueryTestWrapper } from '@/test-utils/react-query'
import { MemoryRouter } from 'react-router'

export const OnboardingAuthStepWrapper = () => {
  const handleConnectionChange = (connected: boolean) => {
    console.log('Connection changed:', connected)
  }

  return (
    <MemoryRouter>
      <div className="w-[400px] h-[500px] border rounded-lg p-4">
        {createQueryTestWrapper()({
          children: (
            <OnboardingAuthStep
              providers={['google']}
              isProcessing={false}
              isConnected={false}
              onConnectionChange={handleConnectionChange}
            />
          ),
        })}
      </div>
    </MemoryRouter>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

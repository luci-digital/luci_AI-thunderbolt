/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { OnboardingPrivacyStepWrapper } from './OnboardingPrivacyStepWrapper'
import { StepIndicators } from '@/components/onboarding/step-indicators'

const totalSteps = 5

export const OnboardingDialogWrapper = () => {
  return (
    <Dialog open>
      <DialogContent
        className="sm:max-w-[600px] sm:min-h-[500px] p-0 h-screen sm:h-auto w-screen sm:w-auto m-0 sm:m-4 rounded-none sm:rounded-lg max-h-screen overflow-hidden"
        showCloseButton={false}
      >
        <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden">
          <div className="flex-1 px-6 py-6 flex flex-col justify-center min-h-0">
            <div className="w-full max-w-md mx-auto space-y-4 sm:min-h-[500px] sm:flex sm:flex-col sm:justify-center overflow-x-hidden">
              <OnboardingPrivacyStepWrapper />
            </div>
          </div>

          <div className="px-6 pb-6 flex-shrink-0">
            <StepIndicators currentStep={1} totalSteps={totalSteps} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

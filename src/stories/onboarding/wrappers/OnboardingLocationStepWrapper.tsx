/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { OnboardingLocationStep } from '@/components/onboarding/onboarding-location-step'
import { createQueryTestWrapper } from '@/test-utils/react-query'
import type { OnboardingState } from '@/hooks/use-onboarding-state'

export const OnboardingLocationStepWrapper = () => {
  const mockState: OnboardingState = {
    currentStep: 4 as const,
    privacyAgreed: true,
    isProviderConnected: true,
    isConnecting: false,
    processingOAuth: false,
    nameValue: 'John Doe',
    isNameValid: true,
    isSubmittingName: false,
    locationValue: '',
    isLocationValid: false,
    isSubmittingLocation: false,
    canGoBack: true,
    canGoNext: false,
    canSkip: true,
  }

  const mockActions = {
    setLocationValue: (value: string) => console.log('setLocationValue:', value),
    setLocationValid: (valid: boolean) => console.log('setLocationValid:', valid),
    setSubmittingLocation: (submitting: boolean) => console.log('setSubmittingLocation:', submitting),
    submitLocation: async (locationData: { locationName: string; locationLat: number; locationLng: number }) => {
      console.log('submitLocation:', locationData)
    },
    nextStep: async () => console.log('nextStep'),
    prevStep: async () => console.log('prevStep'),
    skipStep: async () => console.log('skipStep'),
  }

  return (
    <div className="w-[400px] h-[500px] border rounded-lg p-4">
      {createQueryTestWrapper()({
        children: <OnboardingLocationStep state={mockState} actions={mockActions} />,
      })}
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

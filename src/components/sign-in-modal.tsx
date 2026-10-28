/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { BackButton } from '@/components/ui/back-button'
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal'
import { useRef, useState } from 'react'
import { SignInForm } from './sign-in'

type SignInModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * Sign-in modal that wraps the reusable SignInForm component.
 * Provides the modal chrome and delegates to SignInForm for all form logic.
 */
export const SignInModal = ({ open, onOpenChange, onSuccess }: SignInModalProps) => {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const goBackRef = useRef<(() => void) | null>(null)

  const handleClose = () => {
    onOpenChange(false)
    setStep('email')
  }

  const handleSuccess = () => {
    setStep('email')
    if (onSuccess) {
      onSuccess()
    } else {
      onOpenChange(false)
    }
  }

  const handleGoBack = () => {
    goBackRef.current?.()
  }
  const handleGoToOtp = () => setStep('otp')

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setStep('email')
        }
        onOpenChange(open)
      }}
    >
      <ResponsiveModalHeader className={step === 'email' ? 'text-center' : ''}>
        {step === 'otp' && <BackButton onClick={handleGoBack} className="absolute left-4 top-4" />}
        <ResponsiveModalTitle className={step === 'email' ? 'text-2xl font-semibold' : 'sr-only'}>
          {step === 'email' ? 'Sign In' : 'Enter your code'}
        </ResponsiveModalTitle>
        {step === 'email' && (
          <ResponsiveModalDescription>Sign in to get more out of Thunderbolt</ResponsiveModalDescription>
        )}
      </ResponsiveModalHeader>

      <ResponsiveModalContent centered={step === 'otp'} className="flex flex-col gap-4">
        <SignInForm
          variant="modal"
          onSuccess={handleSuccess}
          onCancel={handleClose}
          onGoBack={() => setStep('email')}
          onEmailSent={handleGoToOtp}
          goBackRef={goBackRef}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

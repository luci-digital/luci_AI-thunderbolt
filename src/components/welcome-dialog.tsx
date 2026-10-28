/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useState } from 'react'
import { create } from 'zustand'

import { SignInSuccessStep } from '@/components/sign-in/sign-in-success-step'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useSettings } from '@/hooks/use-settings'

export const useWelcomeStore = create<{
  pending: boolean
  trigger: () => void
  consume: () => boolean
}>((set, get) => ({
  pending: false,
  trigger: () => set({ pending: true }),
  consume: () => {
    const val = get().pending
    if (val) {
      set({ pending: false })
    }
    return val
  },
}))

/**
 * Shows a welcome dialog after successful sign-in from the waitlist page.
 */
export const WelcomeDialog = () => {
  const { preferredName } = useSettings({ preferred_name: '' })
  const [isOpen, setIsOpen] = useState(() => useWelcomeStore.getState().consume())

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogTitle className="sr-only">Welcome</DialogTitle>
        <DialogDescription className="sr-only">Sign-in successful</DialogDescription>
        <SignInSuccessStep
          displayName={preferredName.value as string}
          onContinue={() => setIsOpen(false)}
          variant="modal"
        />
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

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { forwardRef, useImperativeHandle, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

export type TelemetryRequiredModalRef = {
  open: (featureName?: string | null) => void
  close: () => void
}

type TelemetryRequiredModalProps = {
  onEnableTelemetry: (featureName?: string | null) => Promise<void>
}

export const TelemetryRequiredModal = forwardRef<TelemetryRequiredModalRef, TelemetryRequiredModalProps>(
  ({ onEnableTelemetry }, ref) => {
    const [open, setOpen] = useState(false)
    const [featureName, setFeatureName] = useState<string | null>(null)

    const handleOpen = (featureName?: string | null) => {
      setFeatureName(featureName || null)
      setOpen(true)
    }

    const handleClose = () => {
      setOpen(false)
      setFeatureName(null)
    }

    const handleEnableTelemetry = async () => {
      await onEnableTelemetry(featureName)
      handleClose()
    }

    useImperativeHandle(ref, () => ({
      open: handleOpen,
      close: handleClose,
    }))

    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Telemetry Required</AlertDialogTitle>
            <AlertDialogDescription>
              In order to use preview features, we ask that you help us improve the product by sharing telemetry data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnableTelemetry}>Enable Telemetry</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  },
)

TelemetryRequiredModal.displayName = 'TelemetryRequiredModal'

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

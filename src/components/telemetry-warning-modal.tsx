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

export type TelemetryWarningModalRef = {
  open: () => void
  close: () => void
}

type TelemetryWarningModalProps = {
  onDisableTelemetry: () => Promise<void>
}

export const TelemetryWarningModal = forwardRef<TelemetryWarningModalRef, TelemetryWarningModalProps>(
  ({ onDisableTelemetry }, ref) => {
    const [open, setOpen] = useState(false)

    const handleClose = () => {
      setOpen(false)
    }

    const handleDisableTelemetry = async () => {
      await onDisableTelemetry()
      handleClose()
    }

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      close: handleClose,
    }))

    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Preview Features Will Be Disabled</AlertDialogTitle>
            <AlertDialogDescription>
              Turning off telemetry will disable all preview features. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisableTelemetry}>Disable Telemetry</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  },
)

TelemetryWarningModal.displayName = 'TelemetryWarningModal'

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

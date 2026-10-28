/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, PanelRight, X } from 'lucide-react'
import { memo, useCallback } from 'react'

type ExternalLinkDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  onConfirm: () => Promise<void>
  /** Called when onConfirm() rejects (e.g. unhandled throw). Use to show error in dialog. */
  onOpenError?: (error: unknown) => void
  onOpenInApp?: () => void
  openError?: string | null
  isOpening?: boolean
}

export const ExternalLinkDialog = memo(
  ({
    open,
    onOpenChange,
    url,
    onConfirm,
    onOpenError,
    onOpenInApp,
    openError = null,
    isOpening = false,
  }: ExternalLinkDialogProps) => {
    const handleConfirmClick = useCallback(async () => {
      try {
        await onConfirm()
      } catch (error) {
        if (onOpenError) {
          onOpenError(error)
        } else {
          console.error('External link confirm failed:', error)
        }
      }
    }, [onConfirm, onOpenError])

    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open External Link</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">Confirm opening an external link</AlertDialogDescription>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 flex size-[var(--touch-height-sm)] cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-[var(--icon-size-default)]" />
              <span className="sr-only">Close</span>
            </button>
          </AlertDialogHeader>

          <div className="rounded-lg border bg-muted px-4 py-3 text-sm font-mono break-all max-h-32 overflow-y-auto">
            {url}
          </div>

          {openError && <p className="text-sm text-destructive">{openError}</p>}

          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {onOpenInApp && (
              <Button onClick={onOpenInApp} variant="outline" disabled={isOpening}>
                <PanelRight className="size-4" />
                Open in Sidebar
              </Button>
            )}
            <Button onClick={handleConfirmClick} disabled={isOpening}>
              {onOpenInApp && <ExternalLink className="size-4" />}
              {isOpening ? 'Opening…' : onOpenInApp ? 'Open in Browser' : 'Open Link'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  },
)

ExternalLinkDialog.displayName = 'ExternalLinkDialog'

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

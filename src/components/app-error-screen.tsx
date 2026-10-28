/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { HandleError } from '@/types/handle-errors'

/**
 * Generates a support email with error details and stack traces
 */
const generateSupportEmail = (error: HandleError) => {
  const subject = 'App Initialization Error'
  let body = `Error Code: ${error.code}\nError Message: ${error.message}`

  if (error.stackTrace) {
    body += `\n\nStack Trace:\n${error.stackTrace}`
  }

  if (error.originalError && error.originalError instanceof Error && error.originalError.stack) {
    body += `\n\nOriginal Error Stack:\n${error.originalError.stack}`
  }

  return {
    subject: encodeURIComponent(subject),
    body: encodeURIComponent(body),
  }
}

type AppErrorScreenProps = {
  error: HandleError
  isClearingDatabase: boolean
  onClearDatabase: () => void
}

export const AppErrorScreen = ({ error, isClearingDatabase, onClearDatabase }: AppErrorScreenProps) => {
  const isDatabaseError = error.code === 'MIGRATION_FAILED' || error.code === 'DATABASE_INIT_FAILED'

  return (
    <div className="flex flex-col items-center justify-center w-full h-[100vh] p-4">
      <div className="text-red-500 text-center mb-4">Failed to initialize app</div>
      <div className="text-sm text-gray-500 text-center mb-6">{error.message}</div>

      <div className="flex flex-col gap-3">
        {isDatabaseError && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isClearingDatabase}>
                {isClearingDatabase ? 'Clearing Database...' : 'Clear Local Database'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Local Database?</AlertDialogTitle>
                <AlertDialogDescription>
                  Unfortunately, the local database encountered an error while being migrated to the latest version of
                  this app. Deleting your local data will resolve the issue but you will permanently lose your settings
                  and chat history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClearDatabase}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Clear Database
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button
          variant="outline"
          onClick={() => {
            const { subject, body } = generateSupportEmail(error)
            window.open(`mailto:support@thunderbird.net?subject=${subject}&body=${body}`)
          }}
        >
          Contact Support
        </Button>
      </div>
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

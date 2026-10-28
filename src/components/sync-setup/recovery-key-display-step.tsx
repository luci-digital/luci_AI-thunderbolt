/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

type RecoveryKeyDisplayStepProps = {
  recoveryKey: string
  onDone: () => void
  onConfirmedChange?: (confirmed: boolean) => void
}

export const RecoveryKeyDisplayStep = ({ recoveryKey, onDone, onConfirmedChange }: RecoveryKeyDisplayStepProps) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [confirmed, setConfirmed] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('failed')
    }
  }

  const handleConfirmedChange = (checked: boolean) => {
    setConfirmed(checked)
    onConfirmedChange?.(checked)
  }

  return (
    <div className="w-full flex flex-col">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Save your recovery phrase</h2>
        <p className="text-muted-foreground">
          Write down these 24 words in order and store them somewhere safe. You&apos;ll need them to recover your data
          if you lose access to all your devices. This phrase won&apos;t be shown again.
        </p>
      </div>

      <div className="pt-5 space-y-4">
        <div role="region" aria-label="Recovery phrase" className="rounded-xl bg-muted p-4">
          <p className="text-sm font-medium leading-relaxed">{recoveryKey}</p>
        </div>

        <Button variant="outline" className="w-full" onClick={handleCopy}>
          {copyState === 'copied' ? (
            <>
              <Check className="size-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4 mr-2" />
              Copy to clipboard
            </>
          )}
        </Button>

        {copyState === 'failed' && (
          <p className="text-sm text-destructive text-center">
            Clipboard unavailable. Please select the phrase above and copy it manually.
          </p>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={confirmed} onCheckedChange={(v) => handleConfirmedChange(v === true)} className="mt-0.5" />
          <span className="text-sm">I have saved my recovery phrase</span>
        </label>

        <Button
          className="w-full"
          onClick={() => {
            try {
              navigator.clipboard.writeText('')
            } catch {
              // Best-effort clipboard clear
            }
            onDone()
          }}
          disabled={!confirmed}
        >
          Done
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

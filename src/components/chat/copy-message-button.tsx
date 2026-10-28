/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { Check, Copy } from 'lucide-react'

type CopyMessageButtonProps = {
  text: string
  className?: string
}

/**
 * A button that copies the given text to the clipboard.
 * Shows a checkmark icon for 2 seconds after a successful copy.
 */
export const CopyMessageButton = ({ text, className }: CopyMessageButtonProps) => {
  const { copy, isCopied } = useCopyToClipboard()

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-8 rounded-lg', className)}
      title="Copy message"
      aria-label="Copy message"
      onClick={() => copy(text)}
    >
      {isCopied ? (
        <Check className="size-4 text-muted-foreground/80 animate-[fadeOut_2s_ease-in-out]" />
      ) : (
        <Copy className="size-4 text-muted-foreground/80" />
      )}
    </Button>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

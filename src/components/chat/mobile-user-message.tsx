/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useLongPress } from '@/hooks/use-long-press'
import { extractTextFromParts } from '@/lib/message-utils'
import type { UIMessage } from 'ai'
import { Copy } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { MessageBubbles } from './message-bubbles'

type MobileUserMessageProps = {
  message: UIMessage
}

export const MobileUserMessage = ({ message }: MobileUserMessageProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const copyText = useMemo(() => extractTextFromParts(message.parts), [message.parts])
  const { copy } = useCopyToClipboard()

  const longPressHandlers = useLongPress(() => setIsMenuOpen(true))

  const handleClose = useCallback(() => setIsMenuOpen(false), [])
  const handleCopy = useCallback(async () => {
    await copy(copyText)
    setIsMenuOpen(false)
  }, [copy, copyText])

  return (
    <div data-message-id={message.id}>
      <div {...longPressHandlers} className={isMenuOpen ? 'relative z-50 select-none' : 'select-none'}>
        <div className={isMenuOpen ? 'transition-transform scale-[1.02]' : undefined}>
          <MessageBubbles message={message} />
        </div>
        {isMenuOpen && (
          <div className="flex justify-end mt-2">
            <div className="rounded-xl bg-card shadow-lg border overflow-hidden">
              <button
                onClick={handleCopy}
                className="flex items-center gap-3 px-3 py-2 text-sm w-full active:bg-accent"
              >
                <Copy className="size-4 text-muted-foreground" />
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
      {isMenuOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={handleClose} />}
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

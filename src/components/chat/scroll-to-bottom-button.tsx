/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimatePresence, m } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

type ScrollToBottomButtonProps = {
  isVisible: boolean
  onClick: () => void
  className?: string
}

export const ScrollToBottomButton = ({ isVisible, onClick, className }: ScrollToBottomButtonProps) => (
  <AnimatePresence>
    {isVisible && (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className={cn('absolute bottom-0 left-1/2 -translate-x-1/2 z-10', className)}
      >
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur-sm shadow-md size-[var(--touch-height-sm)]"
          onClick={onClick}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="size-[var(--icon-size-default)]" />
        </Button>
      </m.div>
    )}
  </AnimatePresence>
)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

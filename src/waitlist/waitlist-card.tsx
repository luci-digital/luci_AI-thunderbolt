/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type WaitlistCardProps = {
  children: ReactNode
}

/**
 * Shared card container for waitlist pages.
 * Responsive: full-screen on mobile, fixed-size card on desktop.
 * Uses CSS media queries to avoid layout flicker during navigation.
 */
export const WaitlistCard = ({ children }: WaitlistCardProps) => {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center backdrop-blur-[5px]',
        // Mobile styles (default)
        'inset-0 w-full h-full border-0 rounded-none px-4 py-8 justify-start overflow-y-auto',
        // Desktop styles (md breakpoint = 768px)
        'md:h-[600px] md:w-[430px] md:min-h-0 md:rounded-[16px] md:border md:border-border md:p-8 md:justify-center md:overflow-clip',
      )}
    >
      {children}
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

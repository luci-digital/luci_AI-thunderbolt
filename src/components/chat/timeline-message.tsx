/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { cn } from '@/lib/utils'
import { type PropsWithChildren } from 'react'

type TimelineMessageProps = PropsWithChildren<{
  className?: string
}>

export const TimelineMessage = ({ children, className }: TimelineMessageProps) => (
  <div className={cn('flex flex-col items-center select-none', className)}>
    {/* Timeline bullet */}
    <span className="w-3 h-3 rounded-full bg-secondary" />
    {/* Vertical line above the text */}
    <span className="h-6 w-px bg-secondary mb-2" />
    {/* Label */}
    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{children}</div>
    {/* Vertical line that runs directly into the accordion */}
    <span className="h-6 w-px bg-secondary" />
  </div>
)

export default TimelineMessage

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

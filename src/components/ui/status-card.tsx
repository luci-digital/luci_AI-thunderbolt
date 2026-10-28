/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { forwardRef, type ReactNode } from 'react'

type StatusCardProps = {
  /**
   * The title can be a string or a React node that includes an icon
   * If it's a string, it will be left-aligned
   * If it's a React node, you can include the icon inline
   */
  title: ReactNode
  /**
   * Optional description that appears below the title
   */
  description?: ReactNode
  /**
   * Additional CSS classes
   */
  className?: string
}

const StatusCard = forwardRef<HTMLDivElement, StatusCardProps>(({ title, description, className, ...props }, ref) => {
  return (
    <Card ref={ref} className={cn('border border-border shadow-sm rounded-md py-0 gap-0', className)} {...props}>
      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-2">
          {typeof title === 'string' ? (
            <span className="text-base font-semibold text-foreground">{title}</span>
          ) : (
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">{title}</div>
          )}
        </div>
        {description && <div className="text-sm text-muted-foreground mt-2">{description}</div>}
      </CardContent>
    </Card>
  )
})

StatusCard.displayName = 'StatusCard'

export { StatusCard }

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

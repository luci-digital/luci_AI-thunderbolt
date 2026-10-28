/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { CitationSource } from '@/types/citation'
import { SourceCard } from './source-card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type SourceListProps = {
  sources: CitationSource[]
  className?: string
  /** Called when a source is selected (e.g. to close the containing popover) */
  onSelect?: () => void
}

/**
 * Container component that renders multiple SourceCard components with dividers
 * Matches Figma design: dark background with border and dividers between items
 */
export const SourceList = ({ sources, className, onSelect }: SourceListProps) => {
  if (sources.length === 0) {
    return <div className="text-muted-foreground text-sm text-center py-4">No sources available</div>
  }

  // Sort: primary source first, then others in original order
  const sortedSources = [...sources].sort((a, b) => {
    if (a.isPrimary === b.isPrimary) {
      return 0
    }
    return a.isPrimary ? -1 : 1
  })

  return (
    <div className={cn('overflow-hidden', className)} role="list">
      {sortedSources.map((source, index) => (
        <div key={source.id}>
          <SourceCard source={source} onSelect={onSelect} />
          {index < sortedSources.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

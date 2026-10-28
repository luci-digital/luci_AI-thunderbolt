/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { SidebarContent } from '@/components/ui/sidebar'
import { ContentViewHeader } from './header'
import { type ObjectViewData } from './context'

type ObjectSidebarContentProps = {
  content: ObjectViewData
  onClose: () => void
}

/**
 * Content for displaying tool call results in the unified content view
 */
export const ObjectSidebarContent = ({ content, onClose }: ObjectSidebarContentProps) => {
  return (
    <div
      className="flex flex-col h-dvh"
      style={{
        paddingBottom: 'var(--safe-area-bottom-padding)',
        paddingTop: 'var(--safe-area-top-padding)',
      }}
    >
      <ContentViewHeader title={content.title} onClose={onClose} className="bg-card border-b border-border" />
      <SidebarContent className="p-4 overflow-x-hidden">
        <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{content.output}</p>
      </SidebarContent>
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

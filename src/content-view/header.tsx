/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { SidebarCloseButton } from '@/components/ui/sidebar-close-button'
import { type ReactNode } from 'react'

type ContentViewHeaderProps = {
  title: string
  onClose: () => void
  actions?: ReactNode
  className?: string
}

/**
 * Reusable header component for content views
 * Provides consistent layout with title, optional actions, and close button
 */
export const ContentViewHeader = ({ title, onClose, actions, className = '' }: ContentViewHeaderProps) => {
  return (
    <div className={`flex h-12 w-full items-center justify-between pl-4 pr-2 flex-shrink-0 ${className}`.trim()}>
      <h2 className="text-lg font-semibold truncate">{title}</h2>
      <div className="flex items-center gap-2">
        {actions}
        <SidebarCloseButton onClick={onClose} />
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

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { type ReactNode } from 'react'

type IconCircleProps = {
  children: ReactNode
  size?: number
}

/**
 * Reusable icon circle for onboarding steps
 */
export const IconCircle = ({ children, size = 16 }: IconCircleProps) => {
  return (
    <div
      className={`mx-auto bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
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

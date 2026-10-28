/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Loader2 } from 'lucide-react'
import { type FC } from 'react'

type LoadingProps = {
  className?: string
  size?: number
}

export const Loading: FC<LoadingProps> = ({ className, size = 24 }) => {
  return (
    <div className="flex items-center justify-center w-full h-[100vh]">
      <Loader2 className={`animate-spin text-gray-500 ${className || ''}`} size={size} />
    </div>
  )
}

export const PageFallback: FC = () => (
  <div className="flex items-center justify-center h-full w-full">
    <Loader2 className="animate-spin text-muted-foreground" size={24} />
  </div>
)

export default Loading

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

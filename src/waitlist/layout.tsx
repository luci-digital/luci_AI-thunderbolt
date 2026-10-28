/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { PageFallback } from '@/loading'
import { Suspense } from 'react'
import { Outlet } from 'react-router'

/**
 * Full-screen layout for waitlist pages.
 * Dark background, centered content with safe area handling for mobile.
 */
export const WaitlistLayout = () => {
  return (
    <div
      className="flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-background"
      style={{
        paddingTop: 'var(--safe-area-top-padding)',
        paddingBottom: 'calc(var(--safe-area-bottom-padding) + var(--kb, 0px))',
      }}
    >
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

export default WaitlistLayout

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

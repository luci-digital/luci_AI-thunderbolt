/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { isTauri } from '@/lib/platform'
import { usePostHog } from 'posthog-js/react'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

/**
 * Hook to track page views and page leaves on route changes
 */
export const usePageTracking = () => {
  const location = useLocation()
  const posthog = usePostHog()
  const previousUrl = useRef<string | null>(null)

  useEffect(() => {
    if (!posthog) {
      return
    }

    const origin = isTauri() ? 'tauri://' : window.location.origin
    const fullUrl = origin + location.pathname + location.search

    if (previousUrl.current) {
      posthog.capture('$pageleave', { $current_url: previousUrl.current })
    }

    posthog.capture('$pageview', { $current_url: fullUrl })
    previousUrl.current = fullUrl
  }, [location, posthog])

  // Track page leave when component unmounts (app closing)
  useEffect(() => {
    return () => {
      if (!posthog || !previousUrl.current) {
        return
      }
      posthog.capture('$pageleave', { $current_url: previousUrl.current })
    }
  }, [posthog])
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

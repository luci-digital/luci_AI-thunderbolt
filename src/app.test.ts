/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { readFileSync } from 'fs'
import { describe, expect, it } from 'bun:test'

/**
 * Dev-only routes (/message-simulator, /settings/dev-settings) must be
 * guarded by `import.meta.env.DEV` so Vite eliminates them from
 * production builds. These tests read the source to catch regressions.
 */
describe('dev-only routes are excluded from production builds', () => {
  const appSource = readFileSync(new URL('./app.tsx', import.meta.url), 'utf-8')

  const devRoutes = ['message-simulator', 'dev-settings'] as const

  for (const route of devRoutes) {
    it(`${route} route is guarded by import.meta.env.DEV`, () => {
      const routePattern = new RegExp(`import\\.meta\\.env\\.DEV\\s*&&\\s*\\(?\\s*<Route[^>]*path=["']${route}["']`)
      expect(appSource).toMatch(routePattern)
    })

    it(`${route} page uses lazy() import`, () => {
      const lazyPattern = new RegExp(
        `import\\.meta\\.env\\.DEV\\s*\\?\\s*lazy\\(\\(\\)\\s*=>\\s*import\\([^)]*${route}`,
      )
      expect(appSource).toMatch(lazyPattern)
    })
  }
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

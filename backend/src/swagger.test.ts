/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { clearSettingsCache } from '@/config/settings'
import { createApp } from '@/index'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

describe('Swagger', () => {
  let savedSwaggerEnabled: string | undefined

  beforeEach(() => {
    savedSwaggerEnabled = process.env.SWAGGER_ENABLED
    clearSettingsCache()
  })

  afterEach(() => {
    if (savedSwaggerEnabled !== undefined) {
      process.env.SWAGGER_ENABLED = savedSwaggerEnabled
    } else {
      delete process.env.SWAGGER_ENABLED
    }
    clearSettingsCache()
  })

  it('should NOT expose /v1/swagger when SWAGGER_ENABLED is unset', async () => {
    delete process.env.SWAGGER_ENABLED
    const app = await createApp()
    const res = await app.handle(new Request('http://localhost/v1/swagger'))
    expect(res.status).toBe(404)
  })

  it('should expose /v1/swagger when SWAGGER_ENABLED=true', async () => {
    process.env.SWAGGER_ENABLED = 'true'
    const app = await createApp()
    const res = await app.handle(new Request('http://localhost/v1/swagger'))
    expect(res.status).not.toBe(404)
  })

  it('should NOT expose /v1/swagger when SWAGGER_ENABLED=false', async () => {
    process.env.SWAGGER_ENABLED = 'false'
    const app = await createApp()
    const res = await app.handle(new Request('http://localhost/v1/swagger'))
    expect(res.status).toBe(404)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

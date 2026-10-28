/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it, afterEach } from 'bun:test'
import { createMockHttpClient } from '@/test-utils/http-client'
import { useConfigStore } from './config-store'
import { fetchConfig } from './config'

describe('fetchConfig', () => {
  afterEach(() => {
    useConfigStore.setState({ config: {} })
  })

  it('returns config from the backend and updates the store', async () => {
    const httpClient = createMockHttpClient({ e2eeEnabled: true })

    const result = await fetchConfig('http://test-api.local', httpClient)

    expect(result).toEqual({ e2eeEnabled: true })
    expect(useConfigStore.getState().config).toEqual({ e2eeEnabled: true })
  })

  it('returns null and preserves cached store value when backend is unreachable', async () => {
    useConfigStore.getState().updateConfig({ e2eeEnabled: true })

    const httpClient = createMockHttpClient(null, 'http://unreachable.local')
    const failingClient = {
      ...httpClient,
      get: () => {
        const p = Promise.reject(new Error('Network error')) as ReturnType<typeof httpClient.get>
        p.json = () => p as unknown as Promise<never>
        p.text = () => p as unknown as Promise<never>
        return p
      },
    }

    const result = await fetchConfig('http://test-api.local', failingClient)

    expect(result).toBeNull()
    expect(useConfigStore.getState().config).toEqual({ e2eeEnabled: true })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

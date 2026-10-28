/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { createClient, type HttpClient } from '@/lib/http'
import { useConfigStore, type AppConfig } from './config-store'

/**
 * Fetches the public app config from the backend and updates the config store on success.
 * On failure the store retains its persisted localStorage value.
 * @param httpClient - Optional pre-configured client; when omitted, creates an unauthenticated client with `cloudUrl`.
 */
export const fetchConfig = async (cloudUrl: string, httpClient?: HttpClient): Promise<AppConfig | null> => {
  try {
    const client = httpClient ?? createClient({ prefixUrl: cloudUrl })
    const config = await client.get('config', { timeout: 5_000 }).json<AppConfig>()
    useConfigStore.getState().updateConfig(config)
    return config
  } catch {
    console.warn('Failed to fetch app config, using cached value')
    return null
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

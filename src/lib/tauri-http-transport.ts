/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'

/**
 * Custom fetch wrapper that uses Tauri's HTTP client to bypass CORS
 */
export const createTauriFetch = (): typeof fetch =>
  Object.assign(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = input instanceof Request ? input.url : input.toString()

      // Use Tauri's fetch which bypasses CORS
      return tauriFetch(url, init || {})
    },
    {
      preconnect: () => Promise.resolve(false),
    },
  )

/**
 * Custom transport that uses Tauri's HTTP client
 */
export class TauriStreamableHTTPClientTransport extends StreamableHTTPClientTransport {
  constructor(url: URL, options?: any) {
    // Override global fetch temporarily during construction
    const originalFetch = globalThis.fetch
    globalThis.fetch = createTauriFetch()

    try {
      super(url, options)
    } finally {
      globalThis.fetch = originalFetch
    }

    // Override the internal fetch method if possible
    // This is a workaround since the SDK doesn't expose a way to inject custom fetch
    const transport = this as any
    if (transport._fetch || transport.fetch) {
      const fetchProp = transport._fetch ? '_fetch' : 'fetch'
      transport[fetchProp] = createTauriFetch()
    }
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

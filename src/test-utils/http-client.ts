/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { createClient, type HttpClient } from '@/lib/http'

/**
 * Creates an HTTP client with a custom fetch function that returns mock data
 * @param mockResponse - The mock data to return
 * @param prefixUrl - Optional base URL for the client (defaults to http://test-api.local)
 */
export const createMockHttpClient = (mockResponse: unknown = [], prefixUrl = 'http://test-api.local'): HttpClient => {
  const mockFetch = async (): Promise<Response> => {
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return createClient({ fetch: mockFetch, prefixUrl })
}

/**
 * Default mock locations for testing
 */
export const mockLocationData = [
  {
    name: 'San Francisco',
    region: 'California',
    country: 'United States',
    lat: 37.7749,
    lon: -122.4194,
  },
  {
    name: 'New York',
    region: 'New York',
    country: 'United States',
    lat: 40.7128,
    lon: -74.006,
  },
  {
    name: 'London',
    region: 'England',
    country: 'United Kingdom',
    lat: 51.5074,
    lon: -0.1278,
  },
]

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

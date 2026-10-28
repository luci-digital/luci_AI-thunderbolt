/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { authHeaders, createTestApp, createTestUpstream, createUpstreamRouter } from './e2e'

describe('e2e scaffolding', () => {
  it('signs in a fresh user and returns a usable bearer token', async () => {
    const handle = await createTestApp()
    expect(handle.bearerToken).toBeTruthy()
    expect(handle.email).toMatch(/^e2e-.+@example\.com$/)

    // Hitting an authenticated route with the bearer token should not return 401.
    // Use /v1/api/auth/get-session as a low-touch authenticated probe.
    const res = await handle.app.handle(
      new Request('http://localhost/v1/api/auth/get-session', {
        method: 'GET',
        headers: authHeaders(handle.bearerToken),
      }),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { user?: { email?: string } }
    expect(body.user?.email).toBe(handle.email)

    await handle.cleanup()
  })

  it('routes upstream requests via createUpstreamRouter', async () => {
    const upstream = createTestUpstream(
      'upstream.test',
      () => new Response('hello', { status: 200, headers: { 'content-type': 'text/plain' } }),
    )
    const router = createUpstreamRouter({ 'upstream.test': upstream })

    const res = await router('https://upstream.test/hello', {
      method: 'GET',
      headers: { host: 'upstream.test' },
    })
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('hello')
    expect(upstream.requests).toHaveLength(1)
    expect(upstream.requests[0].method).toBe('GET')
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

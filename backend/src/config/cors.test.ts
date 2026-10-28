/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { getCorsOriginsList } from '@/config/settings'
import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'

/**
 * Integration tests for CORS middleware behavior.
 * Verifies that the actual HTTP headers are set correctly for various origins.
 */
describe('CORS integration', () => {
  const createTestApp = (corsOrigins: string[]) =>
    new Elysia()
      .use(
        cors({
          origin: corsOrigins,
          credentials: true,
          methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
          allowedHeaders: 'Content-Type,Authorization',
        }),
      )
      .get('/test', () => ({ ok: true }))
      .delete('/test', () => ({ ok: true }))

  describe('with Tauri and explicit origins', () => {
    const origins = getCorsOriginsList({
      corsOrigins: 'https://app.example.com,tauri://localhost,http://tauri.localhost',
    })

    it('should allow the explicit origin', async () => {
      const app = createTestApp(origins)
      const res = await app.handle(
        new Request('http://localhost/test', {
          headers: { Origin: 'https://app.example.com' },
        }),
      )

      expect(res.headers.get('access-control-allow-origin')).toBe('https://app.example.com')
      expect(res.headers.get('access-control-allow-credentials')).toBe('true')
    })

    it('should allow tauri://localhost', async () => {
      const app = createTestApp(origins)
      const res = await app.handle(
        new Request('http://localhost/test', {
          headers: { Origin: 'tauri://localhost' },
        }),
      )

      expect(res.headers.get('access-control-allow-origin')).toBe('tauri://localhost')
      expect(res.headers.get('access-control-allow-credentials')).toBe('true')
    })

    it('should allow http://tauri.localhost', async () => {
      const app = createTestApp(origins)
      const res = await app.handle(
        new Request('http://localhost/test', {
          headers: { Origin: 'http://tauri.localhost' },
        }),
      )

      expect(res.headers.get('access-control-allow-origin')).toBe('http://tauri.localhost')
      expect(res.headers.get('access-control-allow-credentials')).toBe('true')
    })

    it('should reject arbitrary localhost ports', async () => {
      const app = createTestApp(origins)
      const res = await app.handle(
        new Request('http://localhost/test', {
          headers: { Origin: 'http://localhost:9999' },
        }),
      )

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })

    it('should reject unknown origins', async () => {
      const app = createTestApp(origins)
      const res = await app.handle(
        new Request('http://localhost/test', {
          headers: { Origin: 'https://evil.com' },
        }),
      )

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })

    it('should reject preflight from arbitrary localhost ports', async () => {
      const app = createTestApp(origins)
      const res = await app.handle(
        new Request('http://localhost/test', {
          method: 'OPTIONS',
          headers: {
            Origin: 'http://localhost:9999',
            'Access-Control-Request-Method': 'DELETE',
          },
        }),
      )

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })
  })

  describe('with only explicit origins', () => {
    const origins = getCorsOriginsList({
      corsOrigins: 'https://app.example.com',
    })

    it('should allow the explicit origin', async () => {
      const app = createTestApp(origins)
      const res = await app.handle(
        new Request('http://localhost/test', {
          headers: { Origin: 'https://app.example.com' },
        }),
      )

      expect(res.headers.get('access-control-allow-origin')).toBe('https://app.example.com')
    })

    it('should reject other origins', async () => {
      const app = createTestApp(origins)
      const res = await app.handle(
        new Request('http://localhost/test', {
          headers: { Origin: 'http://localhost:9999' },
        }),
      )

      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

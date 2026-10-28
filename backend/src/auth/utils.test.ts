/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { buildVerifyUrl, parseTrustedOrigins } from './utils'

describe('parseTrustedOrigins', () => {
  it('parses comma-separated origins and adds tauri origin', () => {
    const result = parseTrustedOrigins('http://localhost:1420,https://app.example.com')
    expect(result).toEqual(['http://localhost:1420', 'https://app.example.com', 'tauri://localhost'])
  })

  it('filters empty values from comma-separated string', () => {
    const result = parseTrustedOrigins('http://localhost:1420,,https://app.example.com,')
    expect(result).toEqual(['http://localhost:1420', 'https://app.example.com', 'tauri://localhost'])
  })

  it('returns default origins when env is undefined', () => {
    const result = parseTrustedOrigins(undefined)
    expect(result).toEqual(['http://localhost:1420', 'tauri://localhost'])
  })

  it('returns default origins when env is empty string', () => {
    const result = parseTrustedOrigins('')
    expect(result).toEqual(['http://localhost:1420', 'tauri://localhost'])
  })

  it('handles single origin and adds tauri origin', () => {
    const result = parseTrustedOrigins('https://app.example.com')
    expect(result).toEqual(['https://app.example.com', 'tauri://localhost'])
  })

  it('does not duplicate tauri origin if already included', () => {
    const result = parseTrustedOrigins('http://localhost:1420,tauri://localhost')
    expect(result).toEqual(['http://localhost:1420', 'tauri://localhost'])
  })
})

describe('buildVerifyUrl', () => {
  it('builds URL using the provided app URL', () => {
    const result = buildVerifyUrl('https://app.thunderbolt.io', 'user@example.com', '12345678')
    expect(result).toBe('https://app.thunderbolt.io/auth/verify?email=user%40example.com&otp=12345678')
  })

  it('appends challengeToken when provided', () => {
    const result = buildVerifyUrl('https://app.thunderbolt.io', 'user@example.com', '12345678', 'abc-123-def')
    expect(result).toBe(
      'https://app.thunderbolt.io/auth/verify?email=user%40example.com&otp=12345678&challengeToken=abc-123-def',
    )
  })

  it('encodes special characters in email', () => {
    const result = buildVerifyUrl('https://app.thunderbolt.io', 'user+tag@example.com', '12345678')
    expect(result).toBe('https://app.thunderbolt.io/auth/verify?email=user%2Btag%40example.com&otp=12345678')
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

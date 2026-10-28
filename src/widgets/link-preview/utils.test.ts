/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, test } from 'bun:test'
import { getHostname } from './utils'

describe('getHostname', () => {
  test('extracts hostname from valid URL', () => {
    expect(getHostname('https://example.com/path')).toBe('example.com')
  })

  test('strips www. prefix', () => {
    expect(getHostname('https://www.example.com/path')).toBe('example.com')
  })

  test('preserves subdomains that are not www', () => {
    expect(getHostname('https://blog.example.com')).toBe('blog.example.com')
  })

  test('handles URLs with ports', () => {
    expect(getHostname('https://example.com:8080/path')).toBe('example.com')
  })

  test('handles URLs with query strings', () => {
    expect(getHostname('https://example.com/page?q=test')).toBe('example.com')
  })

  test('returns Unknown for empty string', () => {
    expect(getHostname('')).toBe('Unknown')
  })

  test('returns Unknown for whitespace-only string', () => {
    expect(getHostname('   ')).toBe('Unknown')
  })

  test('falls back to regex extraction for malformed URLs', () => {
    expect(getHostname('not-a-url')).toBe('not-a-url')
  })

  test('extracts hostname from URL-like strings without protocol', () => {
    expect(getHostname('http://example.com')).toBe('example.com')
  })

  test('truncates very long hostnames', () => {
    const longHostname = 'a'.repeat(60)
    const result = getHostname(longHostname)
    expect(result.length).toBeLessThanOrEqual(50)
    expect(result).toEndWith('...')
  })

  test('handles http protocol', () => {
    expect(getHostname('http://example.com/page')).toBe('example.com')
  })

  test('strips www. in regex fallback path', () => {
    expect(getHostname('www.example.com/path')).toBe('example.com')
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

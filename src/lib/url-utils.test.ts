/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { deriveFaviconUrl, isSafeUrl } from './url-utils'

describe('isSafeUrl', () => {
  it('accepts http URLs', () => {
    expect(isSafeUrl('http://example.com')).toBe(true)
  })

  it('accepts https URLs', () => {
    expect(isSafeUrl('https://example.com')).toBe(true)
  })

  it('rejects javascript: URLs', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: URLs', () => {
    expect(isSafeUrl('data:text/html,<h1>hi</h1>')).toBe(false)
  })

  it('rejects invalid URLs', () => {
    expect(isSafeUrl('not a url')).toBe(false)
  })
})

describe('deriveFaviconUrl', () => {
  it('derives /favicon.ico from a HTTPS page URL origin', () => {
    expect(deriveFaviconUrl('https://example.com/article/123')).toBe('https://example.com/favicon.ico')
  })

  it('returns null for HTTP-only URLs (mixed content)', () => {
    expect(deriveFaviconUrl('http://example.com')).toBeNull()
  })

  it('returns null for invalid URLs', () => {
    expect(deriveFaviconUrl('not a url')).toBeNull()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

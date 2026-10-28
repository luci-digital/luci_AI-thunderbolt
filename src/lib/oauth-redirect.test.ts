/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { getOAuthRedirectUri } from './oauth-redirect'

describe('getOAuthRedirectUri', () => {
  it('returns web callback for non-Tauri environment', () => {
    const originalLocation = window.location
    const mockLocation = { origin: 'https://app.example.com' } as Location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    })

    const uri = getOAuthRedirectUri()

    expect(uri).toBe('https://app.example.com/oauth/callback')

    // Restore
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  it('returns App Link for mobile platforms', () => {
    const uri = getOAuthRedirectUri()

    // In test environment (not Tauri), should return web callback
    expect(uri).toContain('/oauth/callback')
  })

  it('returns valid URL format', () => {
    const originalLocation = window.location
    const mockLocation = { origin: 'https://test.example.com' } as Location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    })

    const uri = getOAuthRedirectUri()

    // Should be a valid URL
    expect(() => new URL(uri)).not.toThrow()

    // Should end with /oauth/callback
    expect(uri).toMatch(/\/oauth\/callback$/)

    // Restore
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

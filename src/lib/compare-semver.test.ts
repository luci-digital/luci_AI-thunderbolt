/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { compareSemver } from './compare-semver'

describe('compareSemver', () => {
  it('returns 0 for equal versions', () => {
    expect(compareSemver('0.1.87', '0.1.87')).toBe(0)
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0)
  })

  it('returns negative when a < b', () => {
    expect(compareSemver('0.1.87', '0.2.0')).toBeLessThan(0)
    expect(compareSemver('0.1.86', '0.1.87')).toBeLessThan(0)
    expect(compareSemver('0.9.99', '1.0.0')).toBeLessThan(0)
  })

  it('returns positive when a > b', () => {
    expect(compareSemver('0.2.0', '0.1.87')).toBeGreaterThan(0)
    expect(compareSemver('1.0.0', '0.99.99')).toBeGreaterThan(0)
  })

  it('compares major, then minor, then patch', () => {
    expect(compareSemver('2.0.0', '1.99.99')).toBeGreaterThan(0)
    expect(compareSemver('1.2.0', '1.1.99')).toBeGreaterThan(0)
    expect(compareSemver('1.1.2', '1.1.1')).toBeGreaterThan(0)
  })

  it('strips pre-release and build metadata before comparing', () => {
    expect(compareSemver('1.0.0-alpha', '1.0.0')).toBe(0)
    expect(compareSemver('1.0.0+build.1', '1.0.0')).toBe(0)
    expect(compareSemver('1.0.1-rc.1', '1.0.0')).toBeGreaterThan(0)
  })

  it('returns 0 for unparseable input — never hard-blocks on malformed data', () => {
    expect(compareSemver('not-a-version', '1.0.0')).toBe(0)
    expect(compareSemver('1.0', '1.0.0')).toBe(0)
    expect(compareSemver('', '1.0.0')).toBe(0)
    expect(compareSemver('1.0.0', '')).toBe(0)
    expect(compareSemver('-1.0.0', '1.0.0')).toBe(0)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

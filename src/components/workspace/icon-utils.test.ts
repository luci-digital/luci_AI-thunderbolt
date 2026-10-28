/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { isDataUrlIcon } from './icon-utils'

describe('isDataUrlIcon', () => {
  it('returns true for a JPEG data URL', () => {
    expect(isDataUrlIcon('data:image/jpeg;base64,/9j/4AAQ...')).toBe(true)
  })

  it('returns true for a PNG data URL', () => {
    expect(isDataUrlIcon('data:image/png;base64,iVBOR...')).toBe(true)
  })

  it('returns false for an emoji', () => {
    expect(isDataUrlIcon('🛠️')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isDataUrlIcon('')).toBe(false)
  })

  it('returns false for null / undefined', () => {
    expect(isDataUrlIcon(null)).toBe(false)
    expect(isDataUrlIcon(undefined)).toBe(false)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

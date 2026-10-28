/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { afterEach, describe, expect, it } from 'bun:test'
import { useWelcomeStore } from './welcome-dialog'

describe('useWelcomeStore', () => {
  afterEach(() => {
    // Reset store between tests
    useWelcomeStore.setState({ pending: false })
  })

  it('starts with pending = false', () => {
    expect(useWelcomeStore.getState().pending).toBe(false)
  })

  it('trigger() sets pending to true', () => {
    useWelcomeStore.getState().trigger()
    expect(useWelcomeStore.getState().pending).toBe(true)
  })

  it('consume() returns true and resets pending', () => {
    useWelcomeStore.getState().trigger()

    const result = useWelcomeStore.getState().consume()
    expect(result).toBe(true)
    expect(useWelcomeStore.getState().pending).toBe(false)
  })

  it('consume() returns false when nothing was triggered', () => {
    const result = useWelcomeStore.getState().consume()
    expect(result).toBe(false)
  })

  it('double consume() returns false on the second call', () => {
    useWelcomeStore.getState().trigger()

    expect(useWelcomeStore.getState().consume()).toBe(true)
    expect(useWelcomeStore.getState().consume()).toBe(false)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

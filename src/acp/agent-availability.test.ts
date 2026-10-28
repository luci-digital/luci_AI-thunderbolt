/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import '@/testing-library'

import { describe, expect, it } from 'bun:test'
import type { Agent } from '@/types/acp'
import { isAgentAvailable } from './agent-availability'

const baseAgent: Agent = {
  id: 'a1',
  name: 'A1',
  type: 'remote-acp',
  transport: 'websocket',
  url: 'wss://x',
  description: null,
  icon: null,
  isSystem: 0,
  enabled: 1,
  deletedAt: null,
  userId: null,
}

describe('isAgentAvailable', () => {
  it('returns true for websocket agents on any platform', () => {
    expect(isAgentAvailable(baseAgent, { isTauri: () => false })).toBe(true)
    expect(isAgentAvailable(baseAgent, { isTauri: () => true })).toBe(true)
  })

  it('returns true for built-in agents even on in-process transport', () => {
    const builtIn: Agent = { ...baseAgent, type: 'built-in', transport: 'in-process', url: null }
    expect(isAgentAvailable(builtIn, { isTauri: () => false })).toBe(true)
  })

  it('returns false for non-built-in in-process agents in the web build', () => {
    const local: Agent = { ...baseAgent, type: 'remote-acp', transport: 'in-process' }
    expect(isAgentAvailable(local, { isTauri: () => false })).toBe(false)
  })

  it('returns true for non-built-in in-process agents on Tauri', () => {
    const local: Agent = { ...baseAgent, type: 'remote-acp', transport: 'in-process' }
    expect(isAgentAvailable(local, { isTauri: () => true })).toBe(true)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { ToolUIPart } from 'ai'
import { describe, expect, it } from 'bun:test'
import { useToolGroupState } from './tool-group'

const createMockTool = (state: ToolUIPart['state']): ToolUIPart => {
  const base = {
    type: 'tool:test' as const,
    toolCallId: `call-${Math.random()}`,
    input: {},
  }

  if (state === 'output-available') {
    return { ...base, state, output: 'result' } as unknown as ToolUIPart
  }
  if (state === 'output-error') {
    return { ...base, state, errorText: 'error' } as unknown as ToolUIPart
  }
  return { ...base, state } as unknown as ToolUIPart
}

describe('useToolGroupState', () => {
  it('shows loading when streaming, last part, all tools complete, no text', () => {
    const result = useToolGroupState({
      tools: [createMockTool('output-available'), createMockTool('output-available')],
      isStreaming: true,
      isLastPartInMessage: true,
      hasTextInMessage: false,
    })

    expect(result.showLoadingNext).toBe(true)
    expect(result.allToolsComplete).toBe(true)
  })

  it('does not show loading when not streaming', () => {
    const result = useToolGroupState({
      tools: [createMockTool('output-available')],
      isStreaming: false,
      isLastPartInMessage: true,
      hasTextInMessage: false,
    })

    expect(result.showLoadingNext).toBe(false)
  })

  it('does not show loading when not last part', () => {
    const result = useToolGroupState({
      tools: [createMockTool('output-available')],
      isStreaming: true,
      isLastPartInMessage: false,
      hasTextInMessage: false,
    })

    expect(result.showLoadingNext).toBe(false)
  })

  it('does not show loading when text already exists', () => {
    const result = useToolGroupState({
      tools: [createMockTool('output-available')],
      isStreaming: true,
      isLastPartInMessage: true,
      hasTextInMessage: true,
    })

    expect(result.showLoadingNext).toBe(false)
  })

  it('does not show loading when tools are still executing', () => {
    const result = useToolGroupState({
      tools: [createMockTool('output-available'), createMockTool('input-streaming')],
      isStreaming: true,
      isLastPartInMessage: true,
      hasTextInMessage: false,
    })

    expect(result.showLoadingNext).toBe(false)
    expect(result.allToolsComplete).toBe(false)
  })

  it('shows loading even if some tools errored (as long as they are complete)', () => {
    const result = useToolGroupState({
      tools: [createMockTool('output-available'), createMockTool('output-error')],
      isStreaming: true,
      isLastPartInMessage: true,
      hasTextInMessage: false,
    })

    expect(result.showLoadingNext).toBe(true)
    expect(result.allToolsComplete).toBe(true)
  })

  it('handles empty tools array', () => {
    const result = useToolGroupState({
      tools: [],
      isStreaming: true,
      isLastPartInMessage: true,
      hasTextInMessage: false,
    })

    expect(result.showLoadingNext).toBe(true)
    expect(result.allToolsComplete).toBe(true)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it, mock } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { getClock } from '@/testing-library'
import { useThrottledCallback } from './use-throttle'

describe('useThrottledCallback', () => {
  it('should call callback immediately on first invocation', () => {
    const callback = mock((..._args: any[]) => {})
    const { result } = renderHook(() => useThrottledCallback(callback, 1000))

    act(() => {
      result.current('test')
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('test')
  })

  it('should throttle rapid calls', async () => {
    const callback = mock((..._args: any[]) => {})
    const { result } = renderHook(() => useThrottledCallback(callback, 100))

    // First call - immediate
    act(() => {
      result.current('first')
    })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('first')

    // Rapid calls - throttled
    act(() => {
      result.current('second')
      result.current('third')
      result.current('fourth')
    })

    // Should still only have been called once (first call)
    expect(callback).toHaveBeenCalledTimes(1)

    // Wait for throttle to complete
    await act(async () => {
      await getClock().tickAsync(150)
    })

    // Should have been called with the last value
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback.mock.calls[1]?.[0]).toBe('fourth')
  })

  it('should allow calls after interval passes', async () => {
    const callback = mock((..._args: any[]) => {})
    const { result } = renderHook(() => useThrottledCallback(callback, 50))

    act(() => {
      result.current('first')
    })
    expect(callback).toHaveBeenCalledTimes(1)

    // Wait for interval to pass
    await act(async () => {
      await getClock().tickAsync(60)
    })

    // Next call should be immediate
    act(() => {
      result.current('second')
    })
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback.mock.calls[1]?.[0]).toBe('second')
  })

  it('should handle multiple arguments', () => {
    const callback = mock((..._args: any[]) => {})
    const { result } = renderHook(() => useThrottledCallback(callback, 1000))

    act(() => {
      result.current('arg1', 'arg2', 'arg3')
    })

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

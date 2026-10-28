/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { getClock } from '@/testing-library'
import { act } from '@testing-library/react'
import { describe, expect, it } from 'bun:test'
import { withTimeout } from './timeout'

describe('withTimeout', () => {
  it('should resolve with promise value when promise resolves before timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 100, 'test')
    expect(result).toBe('ok')
  })

  it('should resolve with undefined when timeout fires before promise', async () => {
    const neverResolves = new Promise<string>(() => {})

    const resultPromise = withTimeout(neverResolves, 100, 'slow-op')

    await act(async () => {
      await getClock().tickAsync(100)
    })

    const result = await resultPromise
    expect(result).toBeUndefined()
  })

  it('should propagate rejection when promise rejects before timeout', async () => {
    const rejectPromise = Promise.reject(new Error('failed'))

    await expect(withTimeout(rejectPromise, 100, 'reject-op')).rejects.toThrow('failed')
  })

  it('should resolve with undefined when promise rejects after timeout', async () => {
    const slowReject = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('late failure')), 200)
    })

    const resultPromise = withTimeout(slowReject, 50, 'timeout-wins')

    await act(async () => {
      await getClock().runAllAsync()
    })

    const result = await resultPromise
    expect(result).toBeUndefined()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

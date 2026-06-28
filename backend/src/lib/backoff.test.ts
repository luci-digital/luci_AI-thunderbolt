/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { describe, it, expect } from 'bun:test'
import { retryWithBackoff, retryWithBackoffSync } from './backoff'

describe('retryWithBackoff', () => {
  it('succeeds on first attempt', async () => {
    const result = await retryWithBackoff(() => Promise.resolve(42))
    expect(result).toBe(42)
  })

  it('retries on failure and eventually succeeds', async () => {
    let attempts = 0
    const result = await retryWithBackoff(async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('not yet')
      }
      return 42
    })

    expect(result).toBe(42)
    expect(attempts).toBe(3)
  })

  it('exhausts retries and throws', async () => {
    let attempts = 0
    try {
      await retryWithBackoff(
        async () => {
          attempts++
          throw new Error('always fails')
        },
        { maxRetries: 2 },
      )
      throw new Error('should have thrown')
    } catch (error) {
      expect(attempts).toBe(3) // initial + 2 retries
      expect((error as Error).message).toBe('always fails')
    }
  })

  it('respects maxRetries option', async () => {
    let attempts = 0
    try {
      await retryWithBackoff(
        async () => {
          attempts++
          throw new Error('fail')
        },
        { maxRetries: 1 },
      )
      throw new Error('should have thrown')
    } catch {
      expect(attempts).toBe(2) // initial + 1 retry
    }
  })

  it('increases delay with exponential backoff', async () => {
    const delays: number[] = []
    const start = Date.now()

    try {
      await retryWithBackoff(
        async () => {
          const now = Date.now()
          delays.push(now)
          throw new Error('fail')
        },
        { maxRetries: 2, initialDelayMs: 10, maxDelayMs: 1000 },
      )
    } catch {
      // expected
    }

    // Check that delays are increasing (accounting for jitter)
    // delays[0] = initial attempt
    // delays[1] should be ~initialDelayMs later (10ms + jitter)
    // delays[2] should be ~2*initialDelayMs later (20ms + jitter)

    expect(delays.length).toBe(3)

    const gap1 = delays[1] - delays[0]
    const gap2 = delays[2] - delays[1]

    // Gap should be at least initialDelayMs
    expect(gap1).toBeGreaterThanOrEqual(5) // allow some wiggle room
    expect(gap2).toBeGreaterThanOrEqual(10) // exponential increase

    // But not exceed maxDelayMs
    expect(gap1).toBeLessThanOrEqual(2000)
    expect(gap2).toBeLessThanOrEqual(2000)
  })

  it('caps delay at maxDelayMs', async () => {
    const delays: number[] = []

    try {
      await retryWithBackoff(
        async () => {
          delays.push(Date.now())
          throw new Error('fail')
        },
        { maxRetries: 3, initialDelayMs: 100, maxDelayMs: 200 },
      )
    } catch {
      // expected
    }

    // Check that no delay exceeds maxDelayMs
    for (let i = 1; i < delays.length; i++) {
      const gap = delays[i] - delays[i - 1]
      expect(gap).toBeLessThanOrEqual(500) // maxDelayMs + jitter buffer
    }
  })

  it('handles async errors correctly', async () => {
    try {
      await retryWithBackoff(() => Promise.reject(new Error('async error')), { maxRetries: 0 })
      throw new Error('should have thrown')
    } catch (error) {
      expect((error as Error).message).toBe('async error')
    }
  })
})

describe('retryWithBackoffSync', () => {
  it('succeeds on first attempt', async () => {
    const result = await retryWithBackoffSync(() => 42)
    expect(result).toBe(42)
  })

  it('retries on failure and eventually succeeds', async () => {
    let attempts = 0
    const result = await retryWithBackoffSync(() => {
      attempts++
      if (attempts < 3) {
        throw new Error('not yet')
      }
      return 42
    })

    expect(result).toBe(42)
    expect(attempts).toBe(3)
  })

  it('exhausts retries and throws', async () => {
    let attempts = 0
    try {
      await retryWithBackoffSync(
        () => {
          attempts++
          throw new Error('always fails')
        },
        { maxRetries: 2 },
      )
      throw new Error('should have thrown')
    } catch (error) {
      expect(attempts).toBe(3)
      expect((error as Error).message).toBe('always fails')
    }
  })
})

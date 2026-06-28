/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { describe, it, expect, beforeEach } from 'bun:test'
import { CircuitBreaker, getOrCreateCircuitBreaker, resetAllCircuitBreakers, getAllCircuitBreakerStates } from './circuit-breaker'

describe('CircuitBreaker', () => {
  beforeEach(() => {
    resetAllCircuitBreakers()
  })

  it('starts in CLOSED state', () => {
    const breaker = new CircuitBreaker('test')
    expect(breaker.getState()).toBe('CLOSED')
  })

  it('tracks successful executions', async () => {
    const breaker = new CircuitBreaker('test')
    const result = await breaker.execute(() => Promise.resolve(42))
    expect(result).toBe(42)
    expect(breaker.getState()).toBe('CLOSED')
  })

  it('increments failure count on error', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 3 })
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(() => Promise.reject(new Error('fail')))
      } catch {
        // expected
      }
    }
    expect(breaker.getState()).toBe('CLOSED')
    const info = breaker.getStateInfo()
    expect(info.failureCount).toBe(2)
  })

  it('opens circuit after failure threshold', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 2 })
    try {
      await breaker.execute(() => Promise.reject(new Error('fail')))
    } catch {
      // expected
    }
    try {
      await breaker.execute(() => Promise.reject(new Error('fail')))
    } catch {
      // expected
    }
    expect(breaker.getState()).toBe('OPEN')
  })

  it('rejects immediately when OPEN', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 1 })
    try {
      await breaker.execute(() => Promise.reject(new Error('fail')))
    } catch {
      // expected
    }

    // Circuit should be open now
    expect(breaker.getState()).toBe('OPEN')

    // Next call should fail immediately without calling fn
    let fnCalled = false
    try {
      await breaker.execute(() => {
        fnCalled = true
        return Promise.resolve(42)
      })
    } catch (error) {
      expect(fnCalled).toBe(false)
      expect(error).toBeDefined()
      expect((error as Error).message).toContain('OPEN')
    }
  })

  it('transitions to HALF_OPEN after resetTimeout', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 1, resetTimeout: 100 })

    // Trigger OPEN
    try {
      await breaker.execute(() => Promise.reject(new Error('fail')))
    } catch {
      // expected
    }

    expect(breaker.getState()).toBe('OPEN')

    // Wait for resetTimeout
    await new Promise((resolve) => setTimeout(resolve, 150))

    // Next check should transition to HALF_OPEN
    expect(breaker.getState()).toBe('HALF_OPEN')
  })

  it('closes circuit on success in HALF_OPEN', async () => {
    const breaker = new CircuitBreaker('test', {
      failureThreshold: 1,
      resetTimeout: 100,
      successThreshold: 1,
    })

    // Trigger OPEN
    try {
      await breaker.execute(() => Promise.reject(new Error('fail')))
    } catch {
      // expected
    }

    // Wait for HALF_OPEN
    await new Promise((resolve) => setTimeout(resolve, 150))

    // Successful call in HALF_OPEN should close circuit
    const result = await breaker.execute(() => Promise.resolve(42))
    expect(result).toBe(42)
    expect(breaker.getState()).toBe('CLOSED')
  })

  it('reopens on failure in HALF_OPEN', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 1, resetTimeout: 100 })

    // Trigger OPEN
    try {
      await breaker.execute(() => Promise.reject(new Error('fail')))
    } catch {
      // expected
    }

    // Wait for HALF_OPEN
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(breaker.getState()).toBe('HALF_OPEN')

    // Failure in HALF_OPEN should reopen
    try {
      await breaker.execute(() => Promise.reject(new Error('fail')))
    } catch {
      // expected
    }

    expect(breaker.getState()).toBe('OPEN')
  })

  it('resets to CLOSED state', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 1 })

    // Trigger OPEN
    try {
      await breaker.execute(() => Promise.reject(new Error('fail')))
    } catch {
      // expected
    }

    expect(breaker.getState()).toBe('OPEN')

    // Manual reset
    breaker.reset()
    expect(breaker.getState()).toBe('CLOSED')
  })

  it('supports sync execution', () => {
    const breaker = new CircuitBreaker('test')
    const result = breaker.executeSync(() => 42)
    expect(result).toBe(42)
  })

  it('getOrCreateCircuitBreaker returns same instance', () => {
    const breaker1 = getOrCreateCircuitBreaker('test')
    const breaker2 = getOrCreateCircuitBreaker('test')
    expect(breaker1).toBe(breaker2)
  })

  it('getAllCircuitBreakerStates returns all states', () => {
    getOrCreateCircuitBreaker('postgres')
    getOrCreateCircuitBreaker('oidc')

    const states = getAllCircuitBreakerStates()
    expect(Object.keys(states)).toContain('postgres')
    expect(Object.keys(states)).toContain('oidc')
    expect(states.postgres.state).toBe('CLOSED')
  })

  it('handles multiple failures correctly', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 3 })

    const callBreaker = async () => {
      try {
        await breaker.execute(() => Promise.reject(new Error('fail')))
      } catch {
        // expected
      }
    }

    // Not enough failures yet
    await callBreaker()
    await callBreaker()
    expect(breaker.getState()).toBe('CLOSED')

    // Threshold reached
    await callBreaker()
    expect(breaker.getState()).toBe('OPEN')
  })

  it('resets failure count on success', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 5 })

    // Accumulate failures
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(() => Promise.reject(new Error('fail')))
      } catch {
        // expected
      }
    }

    let info = breaker.getStateInfo()
    expect(info.failureCount).toBe(3)

    // Success resets counter
    await breaker.execute(() => Promise.resolve(42))

    info = breaker.getStateInfo()
    expect(info.failureCount).toBe(0)
  })
})

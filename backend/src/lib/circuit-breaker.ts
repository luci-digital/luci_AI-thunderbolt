/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export type CircuitBreakerOptions = {
  /** Number of failures before opening the circuit */
  failureThreshold?: number
  /** Time (ms) to wait before attempting to half-open the circuit */
  resetTimeout?: number
  /** Maximum time (ms) to wait between retries when half-open */
  halfOpenTimeout?: number
  /** Success threshold before closing circuit from half-open state */
  successThreshold?: number
}

// Lazy load logger to avoid initialization issues in tests
const getLogger = () => {
  // Dynamically imported to avoid circular dependencies and initialization issues
  return { info: console.info, warn: console.warn } as const
}

/**
 * Implements a circuit breaker pattern to prevent cascade failures.
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (recovering) → CLOSED.
 *
 * When OPEN, the circuit rejects new requests immediately without calling the protected function.
 * When HALF_OPEN, a limited number of requests are allowed through to test recovery.
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED'
  private failureCount = 0
  private successCount = 0
  private nextAttemptTime = Date.now()
  private failureThreshold: number
  private resetTimeout: number
  private halfOpenTimeout: number
  private successThreshold: number
  private name: string

  constructor(
    name: string,
    options: CircuitBreakerOptions = {},
  ) {
    this.name = name
    this.failureThreshold = options.failureThreshold ?? 5
    this.resetTimeout = options.resetTimeout ?? 60_000 // 60 seconds
    this.halfOpenTimeout = options.halfOpenTimeout ?? 30_000 // 30 seconds
    this.successThreshold = options.successThreshold ?? 2
  }

  /**
   * Execute a function with circuit breaker protection.
   * Rejects immediately if circuit is OPEN, otherwise attempts execution.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkStateTransition()

    if (this.state === 'OPEN') {
      throw new Error(
        `Circuit breaker "${this.name}" is OPEN. Service unavailable. Will attempt recovery at ${new Date(this.nextAttemptTime).toISOString()}`,
      )
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Synchronously execute a function with circuit breaker protection.
   * Useful for synchronous operations or checks.
   */
  executeSync<T>(fn: () => T): T {
    this.checkStateTransition()

    if (this.state === 'OPEN') {
      throw new Error(
        `Circuit breaker "${this.name}" is OPEN. Service unavailable. Will attempt recovery at ${new Date(this.nextAttemptTime).toISOString()}`,
      )
    }

    try {
      const result = fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private checkStateTransition() {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttemptTime) {
      this.setState('HALF_OPEN')
      this.successCount = 0
    }

    if (this.state === 'HALF_OPEN' && Date.now() >= this.nextAttemptTime + this.halfOpenTimeout) {
      this.setState('OPEN')
      this.nextAttemptTime = Date.now() + this.resetTimeout
    }
  }

  private onSuccess() {
    this.failureCount = 0

    if (this.state === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.setState('CLOSED')
      }
    }
  }

  private onFailure() {
    this.failureCount++

    if (this.failureCount >= this.failureThreshold && this.state === 'CLOSED') {
      this.setState('OPEN')
      this.nextAttemptTime = Date.now() + this.resetTimeout
    }

    if (this.state === 'HALF_OPEN') {
      this.setState('OPEN')
      this.nextAttemptTime = Date.now() + this.resetTimeout
    }
  }

  private setState(newState: CircuitBreakerState) {
    if (newState !== this.state) {
      const logger = getLogger()
      logger.info(
        {
          circuit: this.name,
          from: this.state,
          to: newState,
          failureCount: this.failureCount,
          successCount: this.successCount,
        },
        `Circuit breaker state transition: ${this.state} → ${newState}`,
      )
      this.state = newState
    }
  }

  /**
   * Get the current state of the circuit breaker
   */
  getState(): CircuitBreakerState {
    this.checkStateTransition()
    return this.state
  }

  /**
   * Manually reset the circuit breaker to CLOSED state
   */
  reset() {
    this.setState('CLOSED')
    this.failureCount = 0
    this.successCount = 0
    this.nextAttemptTime = Date.now()
  }

  /**
   * Get detailed state information for monitoring
   */
  getStateInfo() {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      name: this.name,
      nextAttemptTime: this.nextAttemptTime,
    }
  }
}

/**
 * Create a shared circuit breaker instance for a given name.
 * Subsequent calls with the same name return the existing breaker.
 */
const breakers = new Map<string, CircuitBreaker>()

export const getOrCreateCircuitBreaker = (
  name: string,
  options?: CircuitBreakerOptions,
): CircuitBreaker => {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, options))
  }
  return breakers.get(name)!
}

/**
 * Reset all circuit breakers (useful for testing)
 */
export const resetAllCircuitBreakers = () => {
  for (const breaker of breakers.values()) {
    breaker.reset()
  }
}

/**
 * Get all circuit breaker states (useful for monitoring endpoints)
 */
export const getAllCircuitBreakerStates = () => {
  const states: Record<string, ReturnType<CircuitBreaker['getStateInfo']>> = {}
  for (const [name, breaker] of breakers) {
    states[name] = breaker.getStateInfo()
  }
  return states
}

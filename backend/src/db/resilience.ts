/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getOrCreateCircuitBreaker } from '@/lib/circuit-breaker'
import { retryWithBackoff } from '@/lib/backoff'
import { createStandaloneLogger } from '@/config/logger'

const logger = createStandaloneLogger({ logLevel: 'INFO' })

/**
 * Wrap database query execution with circuit breaker and retry logic.
 * This provides resilience against transient failures and cascading failures.
 *
 * The circuit breaker prevents DOS of a failing Postgres instance by:
 * 1. Tracking failures
 * 2. Opening after threshold failures (stops sending requests immediately)
 * 3. Attempting recovery with half-open state
 * 4. Closing when service recovers
 *
 * @example
 * ```ts
 * const result = await executeWithResilience(async () => {
 *   return await db.query.users.findMany();
 * });
 * ```
 */
export const executeWithResilience = async <T>(
  fn: () => Promise<T>,
  options?: {
    /** Circuit breaker name (default: 'postgres') */
    serviceName?: string
    /** Max retry attempts (default: 3) */
    maxRetries?: number
    /** Initial backoff delay in ms (default: 100) */
    initialDelayMs?: number
  },
): Promise<T> => {
  const serviceName = options?.serviceName ?? 'postgres'
  const maxRetries = options?.maxRetries ?? 3
  const initialDelayMs = options?.initialDelayMs ?? 100

  // Get or create circuit breaker for this service
  const breaker = getOrCreateCircuitBreaker(serviceName, {
    failureThreshold: 5,
    resetTimeout: 60_000, // 60 seconds
    halfOpenTimeout: 30_000, // 30 seconds
    successThreshold: 2,
  })

  // Execute with circuit breaker protection
  return await breaker.execute(async () => {
    // Retry with exponential backoff on transient failures
    return await retryWithBackoff(fn, {
      maxRetries,
      initialDelayMs,
      maxDelayMs: 10_000, // 10 second max delay for DB queries
      name: serviceName,
    })
  })
}

/**
 * Execute multiple database operations in parallel with resilience.
 * Useful for complex queries that span multiple calls.
 */
export const executeMultipleWithResilience = async <T>(
  operations: Array<() => Promise<T>>,
  options?: {
    serviceName?: string
    maxRetries?: number
    initialDelayMs?: number
  },
): Promise<T[]> => {
  return Promise.all(operations.map((op) => executeWithResilience(op, options)))
}

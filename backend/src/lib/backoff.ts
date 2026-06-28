/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createStandaloneLogger } from '@/config/logger'

export type BackoffOptions = {
  /** Maximum number of retry attempts (default: 5) */
  maxRetries?: number
  /** Initial delay in milliseconds (default: 100) */
  initialDelayMs?: number
  /** Maximum delay cap in milliseconds (default: 60000) */
  maxDelayMs?: number
  /** Optional name for logging purposes */
  name?: string
}

const logger = createStandaloneLogger({ logLevel: 'INFO' })

/**
 * Calculate exponential backoff with jitter.
 * Formula: delayMs = initialDelayMs * 2^attempt + random(0, 1000)
 * Capped at maxDelayMs to prevent infinite waits.
 */
const calculateDelay = (attempt: number, initialDelayMs: number, maxDelayMs: number): number => {
  const exponentialDelay = initialDelayMs * Math.pow(2, attempt)
  const jitter = Math.random() * 1000
  const delay = exponentialDelay + jitter
  return Math.min(delay, maxDelayMs)
}

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Retry a function with exponential backoff.
 * On each failure, waits with exponential backoff + random jitter before retrying.
 * Useful for transient failures (network issues, temporary service downtime).
 *
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, initialDelayMs: 100 }
 * );
 * ```
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: BackoffOptions = {},
): Promise<T> => {
  const maxRetries = options.maxRetries ?? 5
  const initialDelayMs = options.initialDelayMs ?? 100
  const maxDelayMs = options.maxDelayMs ?? 60_000
  const name = options.name ?? 'operation'

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt >= maxRetries) {
        // Out of retries
        logger.warn(
          {
            name,
            attempt,
            maxRetries,
            error: error instanceof Error ? error.message : String(error),
          },
          `Retry exhausted after ${maxRetries} attempts`,
        )
        throw error
      }

      // Calculate delay with exponential backoff + jitter
      const delayMs = calculateDelay(attempt, initialDelayMs, maxDelayMs)

      logger.info(
        {
          name,
          attempt,
          maxRetries,
          delayMs,
          error: error instanceof Error ? error.message : String(error),
        },
        `Retry attempt ${attempt + 1}/${maxRetries + 1}, waiting ${delayMs}ms before retry`,
      )

      await sleep(delayMs)
    }
  }

  // Should never reach here, but TypeScript needs a return
  throw lastError
}

/**
 * Retry a synchronous function with exponential backoff (using setTimeout).
 * Similar to retryWithBackoff but for sync operations that internally use promises.
 * Note: this is async because it uses setTimeout for delays.
 */
export const retryWithBackoffSync = async <T>(
  fn: () => T,
  options: BackoffOptions = {},
): Promise<T> => {
  const maxRetries = options.maxRetries ?? 5
  const initialDelayMs = options.initialDelayMs ?? 100
  const maxDelayMs = options.maxDelayMs ?? 60_000
  const name = options.name ?? 'operation'

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return fn()
    } catch (error) {
      lastError = error

      if (attempt >= maxRetries) {
        logger.warn(
          {
            name,
            attempt,
            maxRetries,
            error: error instanceof Error ? error.message : String(error),
          },
          `Retry exhausted after ${maxRetries} attempts`,
        )
        throw error
      }

      const delayMs = calculateDelay(attempt, initialDelayMs, maxDelayMs)

      logger.info(
        {
          name,
          attempt,
          maxRetries,
          delayMs,
          error: error instanceof Error ? error.message : String(error),
        },
        `Retry attempt ${attempt + 1}/${maxRetries + 1}, waiting ${delayMs}ms before retry`,
      )

      await sleep(delayMs)
    }
  }

  throw lastError
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getAllCircuitBreakerStates } from '@/lib/circuit-breaker'
import type { Elysia } from 'elysia'

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export type HealthResponse = {
  status: HealthStatus
  timestamp: string
  checks: {
    [key: string]: {
      status: HealthStatus
      details?: unknown
    }
  }
}

/**
 * Create health check routes
 * GET /health/live - Liveness probe (at least one service healthy)
 * GET /health/ready - Readiness probe (all critical services healthy)
 * GET /health/detailed - Detailed health with circuit breaker states
 */
export const createHealthRoutes = (app: Elysia) => {
  return app
    .get('/health/live', () => {
      const breakers = getAllCircuitBreakerStates()
      const circuitStates = Object.values(breakers)

      // Liveness: at least one circuit is not fully open, or no circuits exist
      const isHealthy = circuitStates.length === 0 || circuitStates.some((cb) => cb.state !== 'OPEN')

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
      }
    })
    .get('/health/ready', () => {
      const breakers = getAllCircuitBreakerStates()
      const circuitStates = Object.values(breakers)

      // Readiness: all circuits must be CLOSED for full readiness
      const isReady = circuitStates.length === 0 || circuitStates.every((cb) => cb.state === 'CLOSED')
      const status: HealthStatus = isReady ? 'healthy' : circuitStates.some((cb) => cb.state === 'CLOSED') ? 'degraded' : 'unhealthy'

      return {
        status,
        timestamp: new Date().toISOString(),
        checks: {
          circuits: {
            status,
            details: circuitStates.reduce(
              (acc, cb) => {
                acc[cb.name] = cb.state
                return acc
              },
              {} as Record<string, string>,
            ),
          },
        },
      }
    })
    .get('/health/detailed', (): HealthResponse => {
      const breakers = getAllCircuitBreakerStates()
      const circuitStates = Object.values(breakers)

      const isHealthy = circuitStates.length === 0 || circuitStates.some((cb) => cb.state !== 'OPEN')
      const isReady = circuitStates.length === 0 || circuitStates.every((cb) => cb.state === 'CLOSED')

      const status: HealthStatus = isReady ? 'healthy' : isHealthy ? 'degraded' : 'unhealthy'

      return {
        status,
        timestamp: new Date().toISOString(),
        checks: {
          circuits: {
            status,
            details: circuitStates.map((cb) => ({
              name: cb.name,
              state: cb.state,
              failureCount: cb.failureCount,
              successCount: cb.successCount,
              nextAttemptTime: cb.nextAttemptTime,
            })),
          },
        },
      }
    })
}

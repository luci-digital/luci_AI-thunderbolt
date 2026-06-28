/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { getAllCircuitBreakerStates } from '@/lib/circuit-breaker'

export type LuciaMetrics = {
  blockCacheBytes: number
  blockCacheCount: number
  walEntries: number
  walBytes: number
  threadsTotal: number
  workflowsCompleted: number
  workflowsPending: number
  workflowDurationSecondsSum: number
}

export type BackendMetricsSnapshot = {
  circuitBreakers: Record<string, { state: string; failureCount: number; successCount: number }>
  syncBatchesCompleted: number
  syncBatchesFailed: number
  healthCheckCount: number
  lastReportedAt: string
}

/**
 * Reports backend metrics to .lucia/metrics/counters.json.
 * Merges backend-specific metrics with the existing VCS metrics.
 */
export class MetricsReporter {
  private readonly metricsDir: string
  private syncBatchesCompleted = 0
  private syncBatchesFailed = 0
  private healthCheckCount = 0

  constructor(luciaDir?: string) {
    const root = resolve(process.cwd(), '..')
    this.metricsDir = join(luciaDir ?? join(root, '.lucia'), 'metrics')
  }

  /**
   * Read the current .lucia/metrics/counters.json.
   */
  readMetrics(): LuciaMetrics | null {
    const countersPath = join(this.metricsDir, 'counters.json')
    if (!existsSync(countersPath)) {
      return null
    }

    const raw = readFileSync(countersPath, 'utf-8')
    const parsed = JSON.parse(raw) as Record<string, number>

    return {
      blockCacheBytes: parsed['block_cache_bytes'] ?? parsed['blockCacheBytes'] ?? 0,
      blockCacheCount: parsed['block_cache_count'] ?? parsed['blockCacheCount'] ?? 0,
      walEntries: parsed['wal_entries'] ?? parsed['walEntries'] ?? 0,
      walBytes: parsed['wal_bytes'] ?? parsed['walBytes'] ?? 0,
      threadsTotal: parsed['threads_total'] ?? parsed['threadsTotal'] ?? 0,
      workflowsCompleted: parsed['workflows_completed'] ?? parsed['workflowsCompleted'] ?? 0,
      workflowsPending: parsed['workflows_pending'] ?? parsed['workflowsPending'] ?? 0,
      workflowDurationSecondsSum: parsed['workflow_duration_seconds_sum'] ?? parsed['workflowDurationSecondsSum'] ?? 0,
    }
  }

  /**
   * Record a sync batch completion.
   */
  recordSyncBatch(success: boolean): void {
    if (success) {
      this.syncBatchesCompleted++
    } else {
      this.syncBatchesFailed++
    }
  }

  /**
   * Record a health check.
   */
  recordHealthCheck(): void {
    this.healthCheckCount++
  }

  /**
   * Write a backend metrics snapshot to .lucia/metrics/backend.json.
   */
  writeBackendMetrics(): void {
    const breakers = getAllCircuitBreakerStates()
    const circuitBreakers: BackendMetricsSnapshot['circuitBreakers'] = {}

    for (const [name, info] of Object.entries(breakers)) {
      circuitBreakers[name] = {
        state: info.state,
        failureCount: info.failureCount,
        successCount: info.successCount,
      }
    }

    const snapshot: BackendMetricsSnapshot = {
      circuitBreakers,
      syncBatchesCompleted: this.syncBatchesCompleted,
      syncBatchesFailed: this.syncBatchesFailed,
      healthCheckCount: this.healthCheckCount,
      lastReportedAt: new Date().toISOString(),
    }

    const backendPath = join(this.metricsDir, 'backend.json')
    writeFileSync(backendPath, JSON.stringify(snapshot, null, 2))
  }

  /**
   * Get combined metrics from both VCS (.lucia/) and backend sources.
   */
  getCombinedMetrics(): { vcs: LuciaMetrics | null; backend: BackendMetricsSnapshot } {
    const vcs = this.readMetrics()

    const breakers = getAllCircuitBreakerStates()
    const circuitBreakers: BackendMetricsSnapshot['circuitBreakers'] = {}
    for (const [name, info] of Object.entries(breakers)) {
      circuitBreakers[name] = {
        state: info.state,
        failureCount: info.failureCount,
        successCount: info.successCount,
      }
    }

    return {
      vcs,
      backend: {
        circuitBreakers,
        syncBatchesCompleted: this.syncBatchesCompleted,
        syncBatchesFailed: this.syncBatchesFailed,
        healthCheckCount: this.healthCheckCount,
        lastReportedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * Reset all counters (for testing).
   */
  reset(): void {
    this.syncBatchesCompleted = 0
    this.syncBatchesFailed = 0
    this.healthCheckCount = 0
  }
}

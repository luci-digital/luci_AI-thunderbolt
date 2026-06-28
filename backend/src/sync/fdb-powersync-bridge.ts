/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { PowerSyncTableName } from '@shared/powersync-tables'
import type { ConflictResolver } from './conflict-resolver'

/**
 * Health status of the FDB-PowerSync bridge.
 */
export type HealthStatus = {
  healthy: boolean
  lastSyncTime: Date | null
  totalSynced: number
  totalFailed: number
  failureRate: number
  syncLagMs: number
  lastError?: string
}

/**
 * Represents a batched sync operation.
 */
type SyncBatch = {
  tableName: PowerSyncTableName
  records: Array<{
    recordId: string
    userId: string
    data: Record<string, unknown>
    operation: 'INSERT' | 'UPDATE' | 'DELETE'
  }>
  timestamp: Date
}

/**
 * Configuration for the FDB-PowerSync bridge.
 */
export type FdbPowerSyncBridgeConfig = {
  batchSize: number // Number of records to batch before syncing (default 100)
  batchIntervalMs: number // Time in ms to wait before syncing batch (default 5000)
  maxRetries: number // Max retry attempts with exponential backoff (default 5)
  initialBackoffMs: number // Initial backoff time (default 100ms)
  maxBackoffMs: number // Max backoff time (default 30000ms)
  enableIdempotency: boolean // Track watermarks to prevent duplicate syncs (default true)
}

/**
 * FdbToPowerSyncBridge synchronizes data from FoundationDB to PowerSync.
 * Handles batching, retries, conflict resolution, and idempotency via watermarks.
 */
export class FdbToPowerSyncBridge {
  private readonly config: FdbPowerSyncBridgeConfig
  private readonly conflictResolver: ConflictResolver
  private readonly pendingBatches: Map<PowerSyncTableName, SyncBatch> = new Map()
  private readonly watermarks: Map<PowerSyncTableName, number> = new Map()
  private batchTimeouts: Map<PowerSyncTableName, NodeJS.Timeout> = new Map()
  private totalSynced = 0
  private totalFailed = 0
  private lastSyncTime: Date | null = null
  private lastError: string | null = null

  constructor(conflictResolver: ConflictResolver, config: Partial<FdbPowerSyncBridgeConfig> = {}) {
    this.conflictResolver = conflictResolver
    this.config = {
      batchSize: config.batchSize ?? 100,
      batchIntervalMs: config.batchIntervalMs ?? 5000,
      maxRetries: config.maxRetries ?? 5,
      initialBackoffMs: config.initialBackoffMs ?? 100,
      maxBackoffMs: config.maxBackoffMs ?? 30000,
      enableIdempotency: config.enableIdempotency ?? true,
    }
  }

  /**
   * Queue a sync for a single record (INSERT/UPDATE/DELETE).
   * Records are batched and synced periodically.
   */
  async syncTable(
    tableName: PowerSyncTableName,
    recordId: string,
    userId: string,
    data: Record<string, unknown>,
    operation: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT',
  ): Promise<void> {
    // Initialize batch if needed
    let batch = this.pendingBatches.get(tableName)
    if (!batch) {
      batch = {
        tableName,
        records: [],
        timestamp: new Date(),
      }
      this.pendingBatches.set(tableName, batch)
    }

    // Add record to batch
    batch.records.push({
      recordId,
      userId,
      data,
      operation,
    })

    // If batch is full, flush immediately
    if (batch.records.length >= this.config.batchSize) {
      await this.flushBatch(tableName)
    } else {
      // Otherwise, schedule a flush after interval
      this.scheduleFlush(tableName)
    }
  }

  /**
   * Explicitly delete a record from PowerSync.
   */
  async deleteRecord(tableName: PowerSyncTableName, recordId: string, userId: string): Promise<void> {
    await this.syncTable(tableName, recordId, userId, { id: recordId }, 'DELETE')
  }

  /**
   * Handle a detected conflict between FDB and device versions.
   * Uses the conflict resolver to determine the winner.
   */
  async handleConflict(
    tableName: PowerSyncTableName,
    recordId: string,
    userId: string,
    fdbVersion: Record<string, unknown>,
    deviceVersion: Record<string, unknown>,
    conflictType: 'concurrent_edit' | 'delete_vs_update',
  ): Promise<void> {
    const conflict = {
      tableName,
      recordId,
      userId,
      fdbVersion,
      deviceVersion,
      conflictType,
      timestamp: new Date(),
    }

    const resolution = await this.conflictResolver.resolve(conflict)

    // Queue the winning version for sync
    if (resolution.resolved) {
      await this.syncTable(tableName, recordId, userId, resolution.winnerVersion, 'UPDATE')
    }
  }

  /**
   * Flush a batch to PowerSync (with retries and exponential backoff).
   */
  private async flushBatch(tableName: PowerSyncTableName, retryCount = 0): Promise<void> {
    const batch = this.pendingBatches.get(tableName)
    if (!batch || batch.records.length === 0) {
      return
    }

    try {
      // Clear the scheduled timeout if any
      const timeout = this.batchTimeouts.get(tableName)
      if (timeout) {
        clearTimeout(timeout)
        this.batchTimeouts.delete(tableName)
      }

      // Check idempotency: skip if this batch was already synced
      const watermark = this.watermarks.get(tableName) ?? 0
      if (this.config.enableIdempotency && batch.records[0]) {
        const batchKey = this.computeBatchKey(batch)
        if (watermark >= batchKey) {
          // Already synced; remove and return
          this.pendingBatches.delete(tableName)
          return
        }
      }

      // Sync all records in the batch
      await this.powerSyncUpload(batch)

      // Update watermark and stats
      const batchKey = this.computeBatchKey(batch)
      this.watermarks.set(tableName, batchKey)
      this.totalSynced += batch.records.length
      this.lastSyncTime = new Date()
      this.lastError = null

      // Clear the batch
      this.pendingBatches.delete(tableName)
    } catch (error) {
      this.totalFailed += batch.records.length
      this.lastError = error instanceof Error ? error.message : String(error)

      // Retry with exponential backoff
      if (retryCount < this.config.maxRetries) {
        const backoffMs = Math.min(
          this.config.initialBackoffMs * Math.pow(2, retryCount),
          this.config.maxBackoffMs,
        )

        await new Promise((resolve) => setTimeout(resolve, backoffMs))
        return this.flushBatch(tableName, retryCount + 1)
      }

      // Max retries exceeded; log and move on
      console.error(
        `[FdbPowerSyncBridge] Failed to sync ${tableName} after ${this.config.maxRetries} retries:`,
        error,
      )
    }
  }

  /**
   * Schedule a batch flush after the configured interval.
   */
  private scheduleFlush(tableName: PowerSyncTableName): void {
    // Clear any existing timeout
    const existingTimeout = this.batchTimeouts.get(tableName)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Schedule new timeout
    const timeout = setTimeout(async () => {
      await this.flushBatch(tableName)
    }, this.config.batchIntervalMs)

    this.batchTimeouts.set(tableName, timeout)
  }

  /**
   * Compute a unique key for a batch (for idempotency checks).
   * Uses record IDs and timestamps.
   */
  private computeBatchKey(batch: SyncBatch): number {
    // Simple hash: use timestamp + count
    return batch.timestamp.getTime() + batch.records.length
  }

  /**
   * Upload records to PowerSync.
   * This is a stub; in production, would call PowerSync API.
   */
  private async powerSyncUpload(batch: SyncBatch): Promise<void> {
    // TODO: Implement actual PowerSync API call
    // For now, simulate success
    return new Promise((resolve) => {
      setTimeout(resolve, 100)
    })
  }

  /**
   * Get the current health status of the bridge.
   */
  getHealth(): HealthStatus {
    const syncLagMs = this.lastSyncTime ? Date.now() - this.lastSyncTime.getTime() : 0
    const totalOps = this.totalSynced + this.totalFailed
    const failureRate = totalOps === 0 ? 0 : this.totalFailed / totalOps

    return {
      healthy: failureRate < 0.05 && syncLagMs < 10000,
      lastSyncTime: this.lastSyncTime,
      totalSynced: this.totalSynced,
      totalFailed: this.totalFailed,
      failureRate,
      syncLagMs,
      lastError: this.lastError ?? undefined,
    }
  }

  /**
   * Get watermark for a table (for debugging).
   */
  getWatermark(tableName: PowerSyncTableName): number {
    return this.watermarks.get(tableName) ?? 0
  }

  /**
   * Flush all pending batches immediately (for testing or shutdown).
   */
  async flushAll(): Promise<void> {
    const tableNames = Array.from(this.pendingBatches.keys())
    await Promise.all(tableNames.map((name) => this.flushBatch(name)))
  }

  /**
   * Clear all pending batches and timeouts (for testing or reset).
   */
  reset(): void {
    for (const timeout of this.batchTimeouts.values()) {
      clearTimeout(timeout)
    }
    this.pendingBatches.clear()
    this.batchTimeouts.clear()
    this.watermarks.clear()
    this.totalSynced = 0
    this.totalFailed = 0
    this.lastSyncTime = null
    this.lastError = null
  }
}

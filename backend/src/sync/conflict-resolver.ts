/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { PowerSyncTableName } from '@shared/powersync-tables'

/**
 * Represents a data conflict when records differ between FDB and PowerSync/device.
 */
export type ConflictType = 'concurrent_edit' | 'delete_vs_update' | 'encryption_key_mismatch'

/**
 * Conflict information for logging and resolution.
 */
export type ConflictRecord = {
  tableName: PowerSyncTableName
  recordId: string
  userId: string
  fdbVersion: Record<string, unknown>
  deviceVersion: Record<string, unknown>
  conflictType: ConflictType
  timestamp: Date
  deviceId?: string
}

/**
 * Result of conflict resolution.
 */
export type ConflictResolutionResult = {
  resolved: boolean
  winnerVersion: Record<string, unknown>
  strategy: ConflictResolutionStrategy
  reason: string
  auditLog?: string
}

/**
 * Strategy for resolving conflicts between versions.
 */
export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'LAST_WRITE_WINS',
  CRDT = 'CRDT',
  CUSTOM = 'CUSTOM',
}

/**
 * Configuration for conflict resolution per table.
 */
export type ConflictResolutionConfig = {
  strategy: ConflictResolutionStrategy
  customResolver?: (conflict: ConflictRecord) => Promise<ConflictResolutionResult>
  notifyUser?: boolean
}

/**
 * Conflict resolver with strategy pattern.
 * Handles concurrent writes from multiple devices and resolution logic.
 */
export class ConflictResolver {
  private readonly config: Map<PowerSyncTableName, ConflictResolutionConfig>
  private readonly auditLog: ConflictRecord[] = []

  constructor(config: Partial<Record<PowerSyncTableName, ConflictResolutionConfig>> = {}) {
    // Default to LAST_WRITE_WINS for all tables
    const defaultConfig = (tableName: PowerSyncTableName): ConflictResolutionConfig => ({
      strategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
      notifyUser: tableName === 'chat_threads' || tableName === 'chat_messages',
    })

    this.config = new Map()
    // Initialize all known tables with defaults
    const allTables: PowerSyncTableName[] = [
      'settings',
      'chat_threads',
      'chat_messages',
      'tasks',
      'models',
      'prompts',
      'skills',
      'triggers',
      'modes',
      'model_profiles',
      'devices',
      'agents',
    ]

    for (const table of allTables) {
      this.config.set(table, config[table] ?? defaultConfig(table))
    }
  }

  /**
   * Resolve a conflict between FDB and device versions.
   * Returns the winning version and metadata.
   */
  async resolve(conflict: ConflictRecord): Promise<ConflictResolutionResult> {
    const tableConfig = this.config.get(conflict.tableName)
    if (!tableConfig) {
      return {
        resolved: false,
        winnerVersion: conflict.fdbVersion,
        strategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
        reason: 'Unknown table, defaulting to FDB version',
      }
    }

    // Log the conflict for audit trail
    this.auditLog.push(conflict)

    switch (tableConfig.strategy) {
      case ConflictResolutionStrategy.LAST_WRITE_WINS:
        return this.resolveLww(conflict)

      case ConflictResolutionStrategy.CRDT:
        return this.resolveCrdt(conflict)

      case ConflictResolutionStrategy.CUSTOM:
        if (!tableConfig.customResolver) {
          return {
            resolved: false,
            winnerVersion: conflict.fdbVersion,
            strategy: ConflictResolutionStrategy.CUSTOM,
            reason: 'No custom resolver configured',
          }
        }
        return tableConfig.customResolver(conflict)

      default:
        return {
          resolved: false,
          winnerVersion: conflict.fdbVersion,
          strategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
          reason: 'Unknown strategy',
        }
    }
  }

  /**
   * Last-Write-Wins (LWW) resolution.
   * Compares timestamps; newer version wins.
   * Falls back to FDB version if timestamps are identical or missing.
   */
  private resolveLww(conflict: ConflictRecord): ConflictResolutionResult {
    const fdbTimestamp = this.extractTimestamp(conflict.fdbVersion)
    const deviceTimestamp = this.extractTimestamp(conflict.deviceVersion)

    if (!fdbTimestamp || !deviceTimestamp) {
      return {
        resolved: true,
        winnerVersion: conflict.fdbVersion,
        strategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
        reason: 'Missing timestamp; defaulting to FDB version',
        auditLog: `Conflict: ${conflict.conflictType} on ${conflict.tableName}/${conflict.recordId}`,
      }
    }

    const fdbTime = fdbTimestamp.getTime()
    const deviceTime = deviceTimestamp.getTime()

    if (deviceTime > fdbTime) {
      return {
        resolved: true,
        winnerVersion: conflict.deviceVersion,
        strategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
        reason: `Device version is newer (${new Date(deviceTime).toISOString()})`,
        auditLog: `LWW: device won at ${new Date(deviceTime).toISOString()}`,
      }
    }

    return {
      resolved: true,
      winnerVersion: conflict.fdbVersion,
      strategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
      reason: `FDB version is newer or equal (${new Date(fdbTime).toISOString()})`,
      auditLog: `LWW: FDB won at ${new Date(fdbTime).toISOString()}`,
    }
  }

  /**
   * CRDT (Conflict-free Replicated Data Type) resolution.
   * Uses LWW-Element-Set semantics: combines the latest version of each field.
   * For now, delegates to field-level LWW.
   */
  private resolveCrdt(conflict: ConflictRecord): ConflictResolutionResult {
    // Merge both versions field-by-field, taking the newer value
    const merged: Record<string, unknown> = {}
    const allKeys = new Set([
      ...Object.keys(conflict.fdbVersion),
      ...Object.keys(conflict.deviceVersion),
    ])

    for (const key of allKeys) {
      const fdbVal = conflict.fdbVersion[key]
      const deviceVal = conflict.deviceVersion[key]

      // If both have a timestamp, use field-level LWW
      if (fdbVal && deviceVal && typeof fdbVal === 'object' && typeof deviceVal === 'object') {
        const fdbTime = (fdbVal as Record<string, unknown>)['timestamp']
        const deviceTime = (deviceVal as Record<string, unknown>)['timestamp']
        if (fdbTime && deviceTime && typeof fdbTime === 'number' && typeof deviceTime === 'number') {
          merged[key] = deviceTime > fdbTime ? deviceVal : fdbVal
          continue
        }
      }

      // Fallback: device value if present, otherwise FDB
      merged[key] = deviceVal !== undefined ? deviceVal : fdbVal
    }

    return {
      resolved: true,
      winnerVersion: merged,
      strategy: ConflictResolutionStrategy.CRDT,
      reason: 'CRDT: merged field-level versions',
      auditLog: 'CRDT merge completed',
    }
  }

  /**
   * Extract updatedAt/timestamp from a record for LWW comparison.
   */
  private extractTimestamp(version: Record<string, unknown>): Date | null {
    const ts =
      version.updatedAt ||
      version.updated_at ||
      version.timestamp ||
      version.createdAt ||
      version.created_at

    if (ts instanceof Date) return ts
    if (typeof ts === 'string') {
      const d = new Date(ts)
      return Number.isNaN(d.getTime()) ? null : d
    }
    if (typeof ts === 'number') return new Date(ts)
    return null
  }

  /**
   * Get all recorded conflicts (for audit trails and debugging).
   */
  getAuditLog(userId?: string, limit?: number): ConflictRecord[] {
    let filtered = this.auditLog

    if (userId) {
      filtered = filtered.filter((c) => c.userId === userId)
    }

    if (limit) {
      return filtered.slice(-limit)
    }

    return filtered
  }

  /**
   * Clear audit log (e.g., on archival).
   */
  clearAuditLog(): void {
    this.auditLog.length = 0
  }

  /**
   * Get conflict statistics.
   */
  getStats(): {
    totalConflicts: number
    byTable: Record<PowerSyncTableName, number>
    byType: Record<ConflictType, number>
  } {
    const byTable: Record<PowerSyncTableName, number> = {} as Record<PowerSyncTableName, number>
    const byType: Record<ConflictType, number> = {} as Record<ConflictType, number>

    for (const conflict of this.auditLog) {
      byTable[conflict.tableName] = (byTable[conflict.tableName] ?? 0) + 1
      byType[conflict.conflictType] = (byType[conflict.conflictType] ?? 0) + 1
    }

    return {
      totalConflicts: this.auditLog.length,
      byTable,
      byType,
    }
  }
}

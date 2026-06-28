/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ConflictResolver, ConflictResolutionStrategy } from './conflict-resolver'
import { FdbToPowerSyncBridge } from './fdb-powersync-bridge'
import type { ConflictRecord, ConflictResolutionConfig } from './conflict-resolver'
import type { PowerSyncTableName } from '@shared/powersync-tables'

/**
 * Test utilities for FDB-PowerSync sync layer testing.
 */

/**
 * Create a test ConflictResolver with default config.
 */
export const createTestConflictResolver = (
  config: Partial<Record<PowerSyncTableName, ConflictResolutionConfig>> = {},
): ConflictResolver => {
  return new ConflictResolver(config)
}

/**
 * Create a test FDB-PowerSync bridge with fast batch intervals.
 */
export const createTestFdbBridge = (conflictResolver: ConflictResolver): FdbToPowerSyncBridge => {
  return new FdbToPowerSyncBridge(conflictResolver, {
    batchSize: 5,
    batchIntervalMs: 50, // Fast for tests
    maxRetries: 1,
    initialBackoffMs: 10,
    maxBackoffMs: 100,
  })
}

/**
 * Helper to create a conflict record for testing.
 */
export const createTestConflict = (overrides: Partial<ConflictRecord> = {}): ConflictRecord => {
  const now = new Date()
  return {
    tableName: 'chat_messages',
    recordId: 'test-record-1',
    userId: 'test-user-1',
    fdbVersion: { id: 'test-record-1', content: 'FDB version' },
    deviceVersion: { id: 'test-record-1', content: 'Device version' },
    conflictType: 'concurrent_edit',
    timestamp: now,
    ...overrides,
  }
}

/**
 * Helper to create two versions with timestamps for LWW testing.
 */
export const createLwwTestConflict = (deviceIsNewer = true): ConflictRecord => {
  const fdbTime = new Date('2024-01-01T10:00:00Z')
  const deviceTime = deviceIsNewer ? new Date('2024-01-01T10:05:00Z') : new Date('2024-01-01T09:55:00Z')

  return createTestConflict({
    fdbVersion: { id: 'msg-1', content: 'FDB version', updatedAt: fdbTime },
    deviceVersion: { id: 'msg-1', content: 'Device version', updatedAt: deviceTime },
  })
}

/**
 * Helper to create a custom resolver for testing.
 */
export const createCustomResolver = (resolverFn: (conflict: ConflictRecord) => Promise<any>) => ({
  strategy: ConflictResolutionStrategy.CUSTOM,
  customResolver: resolverFn,
})

/**
 * Assertion helper: verify conflict was resolved correctly.
 */
export const assertConflictResolved = async (
  resolver: ConflictResolver,
  conflict: ConflictRecord,
  expectedWinner: 'fdb' | 'device',
): Promise<void> => {
  const result = await resolver.resolve(conflict)

  if (!result.resolved) {
    throw new Error(`Conflict not resolved: ${result.reason}`)
  }

  const expectedVersion = expectedWinner === 'fdb' ? conflict.fdbVersion : conflict.deviceVersion
  const actualVersion = result.winnerVersion

  // Compare by checking the content field or first non-id field
  const expectedContent = expectedVersion.content || Object.values(expectedVersion)[1]
  const actualContent = actualVersion.content || Object.values(actualVersion)[1]

  if (expectedContent !== actualContent) {
    throw new Error(
      `Expected ${expectedWinner} to win, got: ${JSON.stringify(actualVersion)}, expected: ${JSON.stringify(expectedVersion)}`,
    )
  }
}

/**
 * Helper to wait for bridge to complete all pending syncs.
 */
export const waitForBridgeSyncComplete = async (
  bridge: FdbToPowerSyncBridge,
  timeoutMs = 5000,
): Promise<void> => {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const health = bridge.getHealth()

    // If no pending syncs and last sync was recent, we're done
    if (health.lastSyncTime) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  throw new Error(`Bridge sync did not complete within ${timeoutMs}ms`)
}

/**
 * Helper to verify bridge health is good.
 */
export const assertBridgeHealthy = (bridge: FdbToPowerSyncBridge, maxFailureRate = 0.1): void => {
  const health = bridge.getHealth()

  if (health.failureRate > maxFailureRate) {
    throw new Error(
      `Bridge failure rate ${health.failureRate} exceeds threshold ${maxFailureRate}: ${health.lastError}`,
    )
  }

  if (!health.healthy) {
    throw new Error(`Bridge is unhealthy: ${health.lastError}`)
  }
}

/**
 * Fixture: sample data for different table types.
 */
export const SAMPLE_DATA = {
  chat_message: {
    id: 'msg-1',
    content: 'Hello world',
    role: 'user',
    chatThreadId: 'thread-1',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  task: {
    id: 'task-1',
    item: 'Do something important',
    isComplete: 0,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  model: {
    id: 'model-1',
    name: 'GPT-4',
    provider: 'openai',
    model: 'gpt-4',
    enabled: 1,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  settings: {
    key: 'theme',
    value: 'dark',
    userId: 'user-1',
    updatedAt: new Date(),
  },
}

/**
 * Helper to create batch test scenarios.
 */
export const createBatchScenario = (batchSize: number, tableCount = 1) => {
  const batches: Array<{
    table: PowerSyncTableName
    recordId: string
    userId: string
    data: Record<string, unknown>
  }> = []

  const tables: PowerSyncTableName[] = ['chat_messages', 'tasks', 'models', 'prompts', 'skills']

  for (let i = 0; i < batchSize; i++) {
    const table = tables[i % Math.min(tableCount, tables.length)]
    batches.push({
      table,
      recordId: `record-${i}`,
      userId: 'user-1',
      data: { id: `record-${i}`, content: `Data ${i}` },
    })
  }

  return batches
}

/**
 * Helper to measure sync performance.
 */
export const measureSyncPerformance = async (
  bridge: FdbToPowerSyncBridge,
  operationCount: number,
  tableName: PowerSyncTableName = 'chat_messages',
): Promise<{
  duration: number
  throughput: number
  avgLatency: number
}> => {
  const startTime = Date.now()

  for (let i = 0; i < operationCount; i++) {
    await bridge.syncTable(tableName, `record-${i}`, 'user-1', { id: `record-${i}` })
  }

  await bridge.flushAll()

  const duration = Date.now() - startTime
  const throughput = operationCount / (duration / 1000)
  const avgLatency = duration / operationCount

  return { duration, throughput, avgLatency }
}

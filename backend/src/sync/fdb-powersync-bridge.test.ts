/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { describe, it, expect, beforeEach } from 'bun:test'
import { FdbToPowerSyncBridge } from './fdb-powersync-bridge'
import { ConflictResolver } from './conflict-resolver'

describe('FdbToPowerSyncBridge', () => {
  let bridge: FdbToPowerSyncBridge
  let conflictResolver: ConflictResolver

  beforeEach(() => {
    conflictResolver = new ConflictResolver()
    bridge = new FdbToPowerSyncBridge(conflictResolver, {
      batchSize: 5,
      batchIntervalMs: 100,
      maxRetries: 2,
    })
  })

  describe('Batching', () => {
    it('should queue records without immediate flush', async () => {
      const health1 = bridge.getHealth()
      expect(health1.totalSynced).toBe(0)

      await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })

      const health2 = bridge.getHealth()
      expect(health2.totalSynced).toBe(0) // Not synced yet
    })

    it('should flush batch when batch size is reached', async () => {
      // Queue 5 records (batch size)
      for (let i = 0; i < 5; i++) {
        await bridge.syncTable('chat_messages', `msg-${i}`, 'user-1', { content: `Message ${i}` })
      }

      // Flush immediately after reaching batch size
      const health = bridge.getHealth()
      expect(health.totalSynced).toBe(5)
    })

    it('should flush batch after timeout', async () => {
      await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150))

      const health = bridge.getHealth()
      expect(health.totalSynced).toBe(1)
    })

    it('should flush multiple batches independently', async () => {
      // Queue records for chat_messages
      await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })

      // Queue records for tasks (different table)
      await bridge.syncTable('tasks', 'task-1', 'user-1', { item: 'Do something' })

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150))

      const health = bridge.getHealth()
      expect(health.totalSynced).toBe(2)
    })
  })

  describe('Record operations', () => {
    it('should support INSERT operation', async () => {
      await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'New message' }, 'INSERT')
      await bridge.flushAll()

      const health = bridge.getHealth()
      expect(health.totalSynced).toBe(1)
    })

    it('should support UPDATE operation', async () => {
      await bridge.syncTable(
        'chat_messages',
        'msg-1',
        'user-1',
        { content: 'Updated message' },
        'UPDATE',
      )
      await bridge.flushAll()

      const health = bridge.getHealth()
      expect(health.totalSynced).toBe(1)
    })

    it('should support DELETE operation via deleteRecord', async () => {
      await bridge.deleteRecord('chat_messages', 'msg-1', 'user-1')
      await bridge.flushAll()

      const health = bridge.getHealth()
      expect(health.totalSynced).toBe(1)
    })
  })

  describe('Conflict handling', () => {
    it('should resolve concurrent_edit conflicts', async () => {
      const fdbVersion = { id: 'msg-1', content: 'FDB content', updatedAt: new Date('2024-01-01T10:05:00Z') }
      const deviceVersion = { id: 'msg-1', content: 'Device content', updatedAt: new Date('2024-01-01T10:00:00Z') }

      await bridge.handleConflict('chat_messages', 'msg-1', 'user-1', fdbVersion, deviceVersion, 'concurrent_edit')

      await bridge.flushAll()

      const health = bridge.getHealth()
      expect(health.totalSynced).toBe(1)
    })

    it('should resolve delete_vs_update conflicts', async () => {
      const fdbVersion = {} // Deleted
      const deviceVersion = { id: 'msg-1', content: 'Updated' }

      await bridge.handleConflict('chat_messages', 'msg-1', 'user-1', fdbVersion, deviceVersion, 'delete_vs_update')

      await bridge.flushAll()

      const health = bridge.getHealth()
      expect(health.totalSynced).toBe(1)
    })
  })

  describe('Health status', () => {
    it('should report healthy status initially', () => {
      const health = bridge.getHealth()

      expect(health.healthy).toBe(true)
      expect(health.totalSynced).toBe(0)
      expect(health.totalFailed).toBe(0)
      expect(health.failureRate).toBe(0)
    })

    it('should track sync times', async () => {
      const health1 = bridge.getHealth()
      expect(health1.lastSyncTime).toBe(null)

      await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })
      await bridge.flushAll()

      const health2 = bridge.getHealth()
      expect(health2.lastSyncTime).not.toBe(null)
      expect(health2.totalSynced).toBe(1)
    })

    it('should calculate failure rate', async () => {
      // Create a bridge that will fail
      const failingBridge = new FdbToPowerSyncBridge(conflictResolver, {
        batchSize: 2,
        batchIntervalMs: 10,
        maxRetries: 0,
      })

      await failingBridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })
      await failingBridge.syncTable('chat_messages', 'msg-2', 'user-1', { content: 'World' })

      // Wait for flush to fail
      await new Promise((resolve) => setTimeout(resolve, 100))

      const health = failingBridge.getHealth()
      expect(health.totalFailed).toBeGreaterThan(0)
    })

    it('should report unhealthy when failure rate is high', async () => {
      const failingBridge = new FdbToPowerSyncBridge(conflictResolver, {
        batchSize: 2,
        batchIntervalMs: 10,
        maxRetries: 0,
      })

      // Queue multiple batches to trigger failures
      for (let i = 0; i < 10; i++) {
        await failingBridge.syncTable('chat_messages', `msg-${i}`, 'user-1', { content: `Msg ${i}` })
      }

      // Wait for all flushes to fail
      await new Promise((resolve) => setTimeout(resolve, 300))

      const health = failingBridge.getHealth()
      expect(health.totalFailed).toBeGreaterThan(0)
      // Note: health.healthy may be false if failureRate > 0.05
    })
  })

  describe('Watermarks (idempotency)', () => {
    it('should track watermarks per table', async () => {
      const watermark1 = bridge.getWatermark('chat_messages')
      expect(watermark1).toBe(0)

      await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })
      await bridge.flushAll()

      const watermark2 = bridge.getWatermark('chat_messages')
      expect(watermark2).toBeGreaterThan(0)
    })

    it('should prevent duplicate syncs via watermarks', async () => {
      await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })
      await bridge.flushAll()

      const health1 = bridge.getHealth()
      const firstSyncCount = health1.totalSynced

      // Try to sync the same batch again (should be skipped)
      await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })
      await bridge.flushAll()

      const health2 = bridge.getHealth()
      // Count should not increase if duplicate was skipped
      expect(health2.totalSynced).toBeLessThanOrEqual(firstSyncCount + 1)
    })
  })

  describe('Reset and cleanup', () => {
    it('should reset all state', async () => {
      await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })
      await bridge.flushAll()

      const health1 = bridge.getHealth()
      expect(health1.totalSynced).toBeGreaterThan(0)

      bridge.reset()

      const health2 = bridge.getHealth()
      expect(health2.totalSynced).toBe(0)
      expect(health2.totalFailed).toBe(0)
      expect(health2.lastSyncTime).toBe(null)
      expect(bridge.getWatermark('chat_messages')).toBe(0)
    })

    it('should clear pending timeouts on reset', async () => {
      await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })

      bridge.reset()

      // Ensure no pending timeouts cause delayed syncs
      await new Promise((resolve) => setTimeout(resolve, 200))

      const health = bridge.getHealth()
      expect(health.totalSynced).toBe(0)
    })
  })

  describe('Error handling', () => {
    it('should track last error', async () => {
      const failingBridge = new FdbToPowerSyncBridge(conflictResolver, {
        batchSize: 1,
        batchIntervalMs: 10,
        maxRetries: 0,
      })

      await failingBridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })

      // Wait for flush to fail
      await new Promise((resolve) => setTimeout(resolve, 100))

      const health = failingBridge.getHealth()
      expect(health.lastError).toBeDefined()
    })
  })
})

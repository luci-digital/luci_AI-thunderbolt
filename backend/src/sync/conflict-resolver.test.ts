/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { describe, it, expect, beforeEach } from 'bun:test'
import {
  ConflictResolver,
  ConflictResolutionStrategy,
  type ConflictRecord,
  type ConflictRecord as ConflictType,
} from './conflict-resolver'

describe('ConflictResolver', () => {
  let resolver: ConflictResolver

  beforeEach(() => {
    resolver = new ConflictResolver()
  })

  describe('Last-Write-Wins (LWW) resolution', () => {
    it('should prefer device version when device timestamp is newer', async () => {
      const fdbTime = new Date('2024-01-01T10:00:00Z')
      const deviceTime = new Date('2024-01-01T10:05:00Z')

      const conflict: ConflictRecord = {
        tableName: 'chat_messages',
        recordId: 'msg-123',
        userId: 'user-1',
        conflictType: 'concurrent_edit',
        timestamp: new Date(),
        fdbVersion: {
          id: 'msg-123',
          content: 'FDB version',
          updatedAt: fdbTime,
        },
        deviceVersion: {
          id: 'msg-123',
          content: 'Device version',
          updatedAt: deviceTime,
        },
      }

      const result = await resolver.resolve(conflict)

      expect(result.resolved).toBe(true)
      expect(result.strategy).toBe(ConflictResolutionStrategy.LAST_WRITE_WINS)
      expect(result.winnerVersion.content).toBe('Device version')
    })

    it('should prefer FDB version when FDB timestamp is newer', async () => {
      const fdbTime = new Date('2024-01-01T10:05:00Z')
      const deviceTime = new Date('2024-01-01T10:00:00Z')

      const conflict: ConflictRecord = {
        tableName: 'tasks',
        recordId: 'task-456',
        userId: 'user-1',
        conflictType: 'concurrent_edit',
        timestamp: new Date(),
        fdbVersion: {
          id: 'task-456',
          item: 'FDB version',
          updatedAt: fdbTime,
        },
        deviceVersion: {
          id: 'task-456',
          item: 'Device version',
          updatedAt: deviceTime,
        },
      }

      const result = await resolver.resolve(conflict)

      expect(result.resolved).toBe(true)
      expect(result.winnerVersion.item).toBe('FDB version')
    })

    it('should default to FDB when timestamps are missing', async () => {
      const conflict: ConflictRecord = {
        tableName: 'chat_threads',
        recordId: 'thread-789',
        userId: 'user-1',
        conflictType: 'concurrent_edit',
        timestamp: new Date(),
        fdbVersion: { id: 'thread-789', title: 'FDB version' },
        deviceVersion: { id: 'thread-789', title: 'Device version' },
      }

      const result = await resolver.resolve(conflict)

      expect(result.resolved).toBe(true)
      expect(result.winnerVersion.title).toBe('FDB version')
    })

    it('should handle ISO string timestamps', async () => {
      const conflict: ConflictRecord = {
        tableName: 'models',
        recordId: 'model-1',
        userId: 'user-1',
        conflictType: 'concurrent_edit',
        timestamp: new Date(),
        fdbVersion: {
          id: 'model-1',
          name: 'FDB',
          updated_at: '2024-01-01T10:00:00Z',
        },
        deviceVersion: {
          id: 'model-1',
          name: 'Device',
          updated_at: '2024-01-01T10:05:00Z',
        },
      }

      const result = await resolver.resolve(conflict)

      expect(result.resolved).toBe(true)
      expect(result.winnerVersion.name).toBe('Device')
    })

    it('should handle numeric timestamps (milliseconds)', async () => {
      const fdbMs = new Date('2024-01-01T10:00:00Z').getTime()
      const deviceMs = new Date('2024-01-01T10:05:00Z').getTime()

      const conflict: ConflictRecord = {
        tableName: 'prompts',
        recordId: 'prompt-1',
        userId: 'user-1',
        conflictType: 'concurrent_edit',
        timestamp: new Date(),
        fdbVersion: { id: 'prompt-1', prompt: 'FDB', timestamp: fdbMs },
        deviceVersion: { id: 'prompt-1', prompt: 'Device', timestamp: deviceMs },
      }

      const result = await resolver.resolve(conflict)

      expect(result.resolved).toBe(true)
      expect(result.winnerVersion.prompt).toBe('Device')
    })
  })

  describe('Audit logging', () => {
    it('should log all conflicts', async () => {
      const conflict: ConflictRecord = {
        tableName: 'chat_messages',
        recordId: 'msg-1',
        userId: 'user-1',
        conflictType: 'concurrent_edit',
        timestamp: new Date(),
        fdbVersion: { id: 'msg-1', content: 'A' },
        deviceVersion: { id: 'msg-1', content: 'B' },
      }

      await resolver.resolve(conflict)

      const logs = resolver.getAuditLog()
      expect(logs.length).toBe(1)
      expect(logs[0].recordId).toBe('msg-1')
    })

    it('should filter audit logs by userId', async () => {
      const conflict1: ConflictRecord = {
        tableName: 'chat_messages',
        recordId: 'msg-1',
        userId: 'user-1',
        conflictType: 'concurrent_edit',
        timestamp: new Date(),
        fdbVersion: { id: 'msg-1', content: 'A' },
        deviceVersion: { id: 'msg-1', content: 'B' },
      }

      const conflict2: ConflictRecord = {
        tableName: 'chat_messages',
        recordId: 'msg-2',
        userId: 'user-2',
        conflictType: 'concurrent_edit',
        timestamp: new Date(),
        fdbVersion: { id: 'msg-2', content: 'A' },
        deviceVersion: { id: 'msg-2', content: 'B' },
      }

      await resolver.resolve(conflict1)
      await resolver.resolve(conflict2)

      const user1Logs = resolver.getAuditLog('user-1')
      expect(user1Logs.length).toBe(1)
      expect(user1Logs[0].userId).toBe('user-1')
    })

    it('should support audit log limit', async () => {
      for (let i = 0; i < 5; i++) {
        const conflict: ConflictRecord = {
          tableName: 'tasks',
          recordId: `task-${i}`,
          userId: 'user-1',
          conflictType: 'concurrent_edit',
          timestamp: new Date(),
          fdbVersion: { id: `task-${i}`, item: 'A' },
          deviceVersion: { id: `task-${i}`, item: 'B' },
        }
        await resolver.resolve(conflict)
      }

      const logs = resolver.getAuditLog(undefined, 2)
      expect(logs.length).toBe(2)
      expect(logs[0].recordId).toBe('task-3')
      expect(logs[1].recordId).toBe('task-4')
    })

    it('should clear audit log', async () => {
      const conflict: ConflictRecord = {
        tableName: 'chat_messages',
        recordId: 'msg-1',
        userId: 'user-1',
        conflictType: 'concurrent_edit',
        timestamp: new Date(),
        fdbVersion: { id: 'msg-1', content: 'A' },
        deviceVersion: { id: 'msg-1', content: 'B' },
      }

      await resolver.resolve(conflict)
      expect(resolver.getAuditLog().length).toBe(1)

      resolver.clearAuditLog()
      expect(resolver.getAuditLog().length).toBe(0)
    })
  })

  describe('Conflict statistics', () => {
    it('should compute conflict stats by table and type', async () => {
      const conflicts: ConflictRecord[] = [
        {
          tableName: 'chat_messages',
          recordId: 'msg-1',
          userId: 'user-1',
          conflictType: 'concurrent_edit',
          timestamp: new Date(),
          fdbVersion: { id: 'msg-1', content: 'A' },
          deviceVersion: { id: 'msg-1', content: 'B' },
        },
        {
          tableName: 'chat_messages',
          recordId: 'msg-2',
          userId: 'user-1',
          conflictType: 'delete_vs_update',
          timestamp: new Date(),
          fdbVersion: { id: 'msg-2', content: 'A' },
          deviceVersion: { id: 'msg-2', content: 'B' },
        },
        {
          tableName: 'tasks',
          recordId: 'task-1',
          userId: 'user-1',
          conflictType: 'concurrent_edit',
          timestamp: new Date(),
          fdbVersion: { id: 'task-1', item: 'A' },
          deviceVersion: { id: 'task-1', item: 'B' },
        },
      ]

      for (const conflict of conflicts) {
        await resolver.resolve(conflict)
      }

      const stats = resolver.getStats()

      expect(stats.totalConflicts).toBe(3)
      expect(stats.byTable.chat_messages).toBe(2)
      expect(stats.byTable.tasks).toBe(1)
      expect(stats.byType.concurrent_edit).toBe(2)
      expect(stats.byType.delete_vs_update).toBe(1)
    })
  })
})

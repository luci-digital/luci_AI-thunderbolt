/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { user } from '@/db/auth-schema'
import { workspaceMembersTable, workspacesTable } from '@/db/schema'
import { createTestDb } from '@/test-utils/db'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { isActiveWorkspaceMember } from './workspaces'

describe('workspaces DAL', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>['db']
  let cleanup: () => Promise<void>

  const insertUser = async (id: string, email: string) => {
    const now = new Date()
    await db.insert(user).values({
      id,
      name: id,
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
  }

  const insertWorkspace = async (id: string, createdBy: string) => {
    await db.insert(workspacesTable).values({
      id,
      name: `Workspace ${id}`,
      createdBy,
      isPersonal: false,
    })
  }

  const insertMember = async (
    workspaceId: string,
    userId: string,
    { role = 'member', removedAt = null }: { role?: 'owner' | 'admin' | 'member'; removedAt?: Date | null } = {},
  ) => {
    await db.insert(workspaceMembersTable).values({
      workspaceId,
      userId,
      role,
      joinedAt: new Date(),
      removedAt,
    })
  }

  beforeEach(async () => {
    const testEnv = await createTestDb()
    db = testEnv.db
    cleanup = testEnv.cleanup
  })

  afterEach(async () => {
    await cleanup()
  })

  describe('isActiveWorkspaceMember', () => {
    it('returns true for an active member', async () => {
      await insertUser('u-active', 'active@test.com')
      await insertWorkspace('ws-active', 'u-active')
      await insertMember('ws-active', 'u-active', { role: 'owner' })

      expect(await isActiveWorkspaceMember(db, 'ws-active', 'u-active')).toBe(true)
    })

    it('returns false when the user has no membership row', async () => {
      await insertUser('u-stranger', 'stranger@test.com')
      await insertUser('u-owner', 'owner@test.com')
      await insertWorkspace('ws-stranger', 'u-owner')
      await insertMember('ws-stranger', 'u-owner', { role: 'owner' })

      expect(await isActiveWorkspaceMember(db, 'ws-stranger', 'u-stranger')).toBe(false)
    })

    it('returns false when the membership has removed_at set', async () => {
      await insertUser('u-removed', 'removed@test.com')
      await insertWorkspace('ws-removed', 'u-removed')
      await insertMember('ws-removed', 'u-removed', { role: 'member', removedAt: new Date() })

      expect(await isActiveWorkspaceMember(db, 'ws-removed', 'u-removed')).toBe(false)
    })

    it('returns false when the workspace does not exist', async () => {
      await insertUser('u-ghost', 'ghost@test.com')

      expect(await isActiveWorkspaceMember(db, 'ws-does-not-exist', 'u-ghost')).toBe(false)
    })

    it('isolates membership per (workspace, user) — one user is active, another is not', async () => {
      await insertUser('u-alice', 'alice@test.com')
      await insertUser('u-bob', 'bob@test.com')
      await insertWorkspace('ws-shared', 'u-alice')
      await insertMember('ws-shared', 'u-alice', { role: 'owner' })
      await insertMember('ws-shared', 'u-bob', { role: 'member', removedAt: new Date() })

      expect(await isActiveWorkspaceMember(db, 'ws-shared', 'u-alice')).toBe(true)
      expect(await isActiveWorkspaceMember(db, 'ws-shared', 'u-bob')).toBe(false)
    })

    it('isolates membership per workspace — same user active in one, not in another', async () => {
      await insertUser('u-multi', 'multi@test.com')
      await insertWorkspace('ws-a', 'u-multi')
      await insertWorkspace('ws-b', 'u-multi')
      await insertMember('ws-a', 'u-multi', { role: 'owner' })
      // No membership row in ws-b

      expect(await isActiveWorkspaceMember(db, 'ws-a', 'u-multi')).toBe(true)
      expect(await isActiveWorkspaceMember(db, 'ws-b', 'u-multi')).toBe(false)
    })
  })
})

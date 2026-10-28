/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { user } from '@/db/auth-schema'
import { createTestDb } from '@/test-utils/db'
import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { deleteUser, getUserByEmail, getUserById, markUserNotNew } from './users'

describe('users DAL', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>['db']
  let cleanup: () => Promise<void>

  const insertUser = async (id: string, email: string, isNew = true) => {
    const now = new Date()
    await db.insert(user).values({
      id,
      name: 'Test User',
      email,
      emailVerified: true,
      isNew,
      createdAt: now,
      updatedAt: now,
    })
  }

  beforeEach(async () => {
    const testEnv = await createTestDb()
    db = testEnv.db
    cleanup = testEnv.cleanup
  })

  afterEach(async () => {
    if (cleanup) {
      await cleanup()
    }
  })

  describe('getUserById', () => {
    it('returns user when found', async () => {
      await insertUser('u1', 'u1@test.com')
      const result = await getUserById(db, 'u1')
      expect(result).toEqual({ id: 'u1', isAnonymous: false, name: 'Test User', email: 'u1@test.com' })
    })

    it('returns null when not found', async () => {
      const result = await getUserById(db, 'nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('returns user when found', async () => {
      await insertUser('u2', 'u2@test.com')
      const result = await getUserByEmail(db, 'u2@test.com')
      expect(result).toEqual({ id: 'u2', name: 'Test User', email: 'u2@test.com' })
    })

    it('returns null when not found', async () => {
      const result = await getUserByEmail(db, 'nobody@test.com')
      expect(result).toBeNull()
    })
  })

  describe('deleteUser', () => {
    it('deletes the user', async () => {
      await insertUser('u3', 'u3@test.com')
      await deleteUser(db, 'u3')
      const rows = await db.select().from(user).where(eq(user.id, 'u3'))
      expect(rows).toHaveLength(0)
    })
  })

  describe('markUserNotNew', () => {
    it('sets isNew to false', async () => {
      await insertUser('u4', 'u4@test.com', true)
      await markUserNotNew(db, 'u4')
      const rows = await db.select().from(user).where(eq(user.id, 'u4'))
      expect(rows[0].isNew).toBe(false)
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

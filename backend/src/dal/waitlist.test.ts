/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { waitlist } from '@/db/schema'
import { createTestDb } from '@/test-utils/db'
import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { approveWaitlistEntry, createWaitlistEntry, getWaitlistByEmail } from './waitlist'

describe('waitlist DAL', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>['db']
  let cleanup: () => Promise<void>

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

  describe('getWaitlistByEmail', () => {
    it('returns entry when found', async () => {
      await db.insert(waitlist).values({ id: 'w1', email: 'w1@test.com', status: 'pending' })
      const result = await getWaitlistByEmail(db, 'w1@test.com')
      expect(result).toEqual({ id: 'w1', status: 'pending' })
    })

    it('returns null when not found', async () => {
      const result = await getWaitlistByEmail(db, 'nobody@test.com')
      expect(result).toBeNull()
    })
  })

  describe('createWaitlistEntry', () => {
    it('creates a new entry', async () => {
      await createWaitlistEntry(db, { id: 'w3', email: 'w3@test.com', status: 'pending' })
      const rows = await db.select().from(waitlist).where(eq(waitlist.email, 'w3@test.com'))
      expect(rows).toHaveLength(1)
      expect(rows[0].status).toBe('pending')
    })

    it('does nothing on conflict (same email)', async () => {
      await createWaitlistEntry(db, { id: 'w4', email: 'w4@test.com', status: 'pending' })
      await createWaitlistEntry(db, { id: 'w5', email: 'w4@test.com', status: 'approved' })
      const rows = await db.select().from(waitlist).where(eq(waitlist.email, 'w4@test.com'))
      expect(rows).toHaveLength(1)
      expect(rows[0].id).toBe('w4')
      expect(rows[0].status).toBe('pending')
    })
  })

  describe('approveWaitlistEntry', () => {
    it('sets status to approved', async () => {
      await db.insert(waitlist).values({ id: 'w6', email: 'w6@test.com', status: 'pending' })
      await approveWaitlistEntry(db, 'w6')
      const rows = await db.select().from(waitlist).where(eq(waitlist.id, 'w6'))
      expect(rows[0].status).toBe('approved')
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

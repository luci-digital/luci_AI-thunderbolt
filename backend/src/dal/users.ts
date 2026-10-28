/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { db as DbType } from '@/db/client'
import { user } from '@/db/auth-schema'
import { eq } from 'drizzle-orm'

/** Get a user by ID. Returns null if not found. */
export const getUserById = async (database: typeof DbType, id: string) =>
  database
    .select({ id: user.id, isAnonymous: user.isAnonymous, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null)

/** Get a user by email. Returns null if not found. */
export const getUserByEmail = async (database: typeof DbType, email: string) =>
  database
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.email, email))
    .limit(1)
    .then((rows) => rows[0] ?? null)

/** Hard-delete a user. Cascades to all related tables via FK constraints. */
export const deleteUser = async (database: typeof DbType, id: string) => database.delete(user).where(eq(user.id, id))

/** Mark a user as no longer new (after first sign-in). */
export const markUserNotNew = async (database: typeof DbType, id: string) =>
  database.update(user).set({ isNew: false }).where(eq(user.id, id))

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

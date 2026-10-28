/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { db as DbType } from '@/db/client'
import { session } from '@/db/auth-schema'
import { and, eq, gt } from 'drizzle-orm'

/** Get an active (non-expired) session by bearer token. Returns null if not found or expired. */
export const getActiveSessionByToken = async (database: typeof DbType, token: string) =>
  database
    .select({ userId: session.userId })
    .from(session)
    .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
    .limit(1)
    .then((rows) => rows[0] ?? null)

/** Link a session to a device by setting the deviceId column. Only updates if session belongs to the user. */
export const linkSessionToDevice = async (
  database: typeof DbType,
  sessionId: string,
  deviceId: string,
  userId: string,
) =>
  database
    .update(session)
    .set({ deviceId })
    .where(and(eq(session.id, sessionId), eq(session.userId, userId)))

/** Revoke (delete) all sessions linked to a specific device for a given user. */
export const revokeDeviceSessions = async (database: typeof DbType, deviceId: string, userId: string) =>
  database.delete(session).where(and(eq(session.deviceId, deviceId), eq(session.userId, userId)))

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

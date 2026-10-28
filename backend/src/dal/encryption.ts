/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { db as DbType } from '@/db/client'
import { encryptionMetadataTable, envelopesTable } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

/** Get an envelope by device ID and user ID. */
export const getEnvelopeByDeviceId = async (database: typeof DbType, deviceId: string, userId: string) =>
  database
    .select({ wrappedCk: envelopesTable.wrappedCk })
    .from(envelopesTable)
    .where(and(eq(envelopesTable.deviceId, deviceId), eq(envelopesTable.userId, userId)))
    .limit(1)
    .then((rows) => rows[0] ?? null)

/** Check if any envelopes exist for a user. */
export const hasEnvelopesForUser = async (database: typeof DbType, userId: string) =>
  database
    .select({ deviceId: envelopesTable.deviceId })
    .from(envelopesTable)
    .where(eq(envelopesTable.userId, userId))
    .limit(1)
    .then((rows) => rows.length > 0)

/** Upsert an envelope for a device. Only updates if userId matches (defense-in-depth). */
export const upsertEnvelope = async (
  database: typeof DbType,
  envelope: { deviceId: string; userId: string; wrappedCk: string },
) =>
  database
    .insert(envelopesTable)
    .values({
      deviceId: envelope.deviceId,
      userId: envelope.userId,
      wrappedCk: envelope.wrappedCk,
    })
    .onConflictDoUpdate({
      target: envelopesTable.deviceId,
      set: { wrappedCk: envelope.wrappedCk, updatedAt: new Date() },
      setWhere: eq(envelopesTable.userId, envelope.userId),
    })

/** Delete an envelope for a device. Scoped by userId to prevent cross-user deletion. */
export const deleteEnvelope = async (database: typeof DbType, deviceId: string, userId: string) =>
  database.delete(envelopesTable).where(and(eq(envelopesTable.deviceId, deviceId), eq(envelopesTable.userId, userId)))

/** Get encryption metadata (canary) for a user. */
export const getEncryptionMetadata = async (database: typeof DbType, userId: string) =>
  database
    .select({
      canaryIv: encryptionMetadataTable.canaryIv,
      canaryCtext: encryptionMetadataTable.canaryCtext,
      canarySecretHash: encryptionMetadataTable.canarySecretHash,
    })
    .from(encryptionMetadataTable)
    .where(eq(encryptionMetadataTable.userId, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null)

/** Insert encryption metadata (canary) for a user. Idempotent — does nothing if row already exists. */
export const insertEncryptionMetadataIfNotExists = async (
  database: typeof DbType,
  metadata: { userId: string; canaryIv: string; canaryCtext: string; canarySecretHash?: string },
) =>
  database
    .insert(encryptionMetadataTable)
    .values(metadata)
    .onConflictDoNothing({ target: encryptionMetadataTable.userId })

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

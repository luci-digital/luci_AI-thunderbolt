/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { and, desc, eq, isNull } from 'drizzle-orm'
import type { AnyDrizzleDatabase } from '@/db/database-interface'
import { devicesTable } from '@/db/tables'
import type { DrizzleQueryWithPromise } from '@/types'

export type Device = {
  id: string
  userId: string
  name: string
  trusted: number | null
  approvalPending: number | null
  publicKey: string | null
  mlkemPublicKey: string | null
  lastSeen: string | null
  createdAt: string | null
  revokedAt: string | null
}

/**
 * Gets a single device by id from the local DB (synced via PowerSync).
 */
export const getDevice = (db: AnyDrizzleDatabase, deviceId: string) => {
  const query = db.select().from(devicesTable).where(eq(devicesTable.id, deviceId))
  return query as typeof query & DrizzleQueryWithPromise<Device>
}

/**
 * Gets all devices for the current user from the local DB (synced via PowerSync).
 */
export const getAllDevices = (db: AnyDrizzleDatabase) => {
  const query = db.select().from(devicesTable).orderBy(desc(devicesTable.lastSeen))
  return query as typeof query & DrizzleQueryWithPromise<Device>
}

/**
 * Gets untrusted, non-revoked devices (pending approval) synced via PowerSync.
 */
export const getPendingDevices = (db: AnyDrizzleDatabase) => {
  const query = db
    .select()
    .from(devicesTable)
    .where(and(eq(devicesTable.trusted, 0), eq(devicesTable.approvalPending, 1), isNull(devicesTable.revokedAt)))
    .orderBy(desc(devicesTable.createdAt))
  return query as typeof query & DrizzleQueryWithPromise<Device>
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

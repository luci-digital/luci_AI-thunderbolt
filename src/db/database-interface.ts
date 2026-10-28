/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type * as schema from './schema'

/**
 * How the initial-sync gate resolved during app init (telemetry):
 * - `disabled`: sync is off (or the database type doesn't sync) — nothing to wait for
 * - `synced`: priority-1 buckets completed (instant for returning users via offline-status restore)
 * - `timed_out`: sync didn't complete within the timeout (e.g. network down)
 * - `failed`: the wait rejected unexpectedly; app boots regardless
 */
export type InitialSyncOutcome = 'disabled' | 'synced' | 'timed_out' | 'failed'

export type DatabaseInterface = {
  db: BaseSQLiteDatabase<'async', any, typeof schema>
  initialize(path: string): Promise<void>
  close?(): Promise<void>
  /** Wait for initial sync to complete (PowerSync only) */
  waitForInitialSync?(): Promise<InitialSyncOutcome>
}

export type AnyDrizzleDatabase = BaseSQLiteDatabase<'async', any, typeof schema>

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

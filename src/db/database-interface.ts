/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type * as schema from './schema'

/**
 * How the initial-sync gate resolved during app init (telemetry):
 * - `disabled`: sync is off (or the database type doesn't sync) — nothing to wait for
 * - `synced`: priority-1 buckets completed (instant for returning users via offline-status restore)
 * - `timed_out`: sync didn't complete within the timeout (e.g. network down)
 * - `failed`: the wait rejected unexpectedly; app boots regardless
 * - `not_required`: local DB already has reconciled data, so the wait was skipped.
 *   `reconcileDefaults` is a no-op for unchanged rows (line 76 in reconcile-defaults.ts),
 *   so a populated local DB can reconcile immediately without racing the sync stream.
 */
export type InitialSyncOutcome = 'disabled' | 'synced' | 'timed_out' | 'failed' | 'not_required'

export type DatabaseInterface = {
  db: BaseSQLiteDatabase<'async', any, typeof schema>
  initialize(path: string): Promise<void>
  close?(): Promise<void>
  /** Wait for initial sync to complete (PowerSync only) */
  waitForInitialSync?(): Promise<InitialSyncOutcome>
}

export type AnyDrizzleDatabase = BaseSQLiteDatabase<'async', any, typeof schema>

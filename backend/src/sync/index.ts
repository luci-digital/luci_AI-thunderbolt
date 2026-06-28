/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * FDB-PowerSync sync coordination and data consistency layer.
 *
 * Modules:
 * - conflict-resolver.ts: Conflict resolution strategies (LWW, CRDT, custom)
 * - fdb-powersync-bridge.ts: Batches FDB changes and syncs to PowerSync
 * - fdb-sync-middleware.ts: Express middleware for automatic sync
 */

export { ConflictResolver, ConflictResolutionStrategy } from './conflict-resolver'
export type {
  ConflictRecord,
  ConflictType,
  ConflictResolutionResult,
  ConflictResolutionConfig,
} from './conflict-resolver'

export { FdbToPowerSyncBridge } from './fdb-powersync-bridge'
export type { HealthStatus, FdbPowerSyncBridgeConfig } from './fdb-powersync-bridge'

export { fdbSyncMiddleware, withFdbSync } from './fdb-sync-middleware'
export type { SyncMetadata } from './fdb-sync-middleware'

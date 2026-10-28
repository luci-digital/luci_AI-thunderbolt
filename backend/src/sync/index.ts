/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

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

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

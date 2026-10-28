/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { BucketStorageAdapter } from '@powersync/common'
import { PowerSyncDatabase } from '@powersync/web'
import type { WebPowerSyncDatabaseOptions } from '@powersync/web'
import { TransformableBucketStorage } from './TransformableBucketStorage'
import type { DataTransformMiddleware } from './TransformableBucketStorage'

export type ThunderboltPowerSyncOptions = WebPowerSyncDatabaseOptions & {
  transformers?: DataTransformMiddleware[]
}

/**
 * PowerSync database with optional data transformation middleware.
 *
 * Extends PowerSyncDatabase to use TransformableBucketStorage instead of SqliteBucketStorage,
 * enabling middleware to transform sync data before it is written to the local database.
 */
export class ThunderboltPowerSyncDatabase extends PowerSyncDatabase {
  constructor(options: ThunderboltPowerSyncOptions) {
    super(options)
  }

  /**
   * Override: Returns TransformableBucketStorage instead of SqliteBucketStorage.
   *
   * Why: PowerSyncDatabase creates a plain SqliteBucketStorage by default. We need our
   * TransformableBucketStorage so we can intercept control() and run middleware.
   *
   * What it does: Creates TransformableBucketStorage, registers any transformers from
   * options.transformers, and returns it. The adapter is used for all sync operations.
   */
  protected generateBucketStorageAdapter(): BucketStorageAdapter {
    const storage = new TransformableBucketStorage(this.database)
    const transformers = (this.options as ThunderboltPowerSyncOptions).transformers ?? []
    for (const t of transformers) {
      storage.addTransformer(t)
    }
    return storage
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

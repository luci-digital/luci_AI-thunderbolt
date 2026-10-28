/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Shared naming convention for the PowerSync `SharedWorker`. The main thread sets
 * `name: workerNameFor(dbFilename)` when constructing the worker; the worker (which
 * has no `localStorage` and thus can't hydrate the trust-domain registry) recovers
 * its own `serverId` from `self.name` via `serverIdFromWorkerName`. Co-locating the
 * producer + consumer here makes the round-trip a single source of truth — if the
 * format ever changes, both ends stay in sync.
 */

const prefix = 'shared-sync-'
const serverPattern = /^shared-sync-server-(.+)\.db$/

/** Build the SharedWorker `name` for the given DB filename. */
export const workerNameFor = (dbFilename: string): string => `${prefix}${dbFilename}`

/**
 * Recover the active server's `serverId` from a worker `name`, or `undefined` for the
 * standalone worker (where no server is associated). Used by `src/crypto/key-storage.ts`
 * to namespace the encryption-keys IDB from inside the SharedWorker context.
 */
export const serverIdFromWorkerName = (workerName: string | undefined): string | undefined => {
  return workerName?.match(serverPattern)?.[1]
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

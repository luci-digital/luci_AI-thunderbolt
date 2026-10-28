/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { getDbFilenameFor } from './database-path'
import { serverIdFromWorkerName, workerNameFor } from './sync-worker-name'

describe('sync-worker-name', () => {
  describe('round-trip with getDbFilenameFor', () => {
    it('server trust domain: workerNameFor → serverIdFromWorkerName recovers the serverId', () => {
      const serverId = '11111111-2222-3333-4444-555555555555'
      const dbFilename = getDbFilenameFor({ kind: 'server', serverId })
      const workerName = workerNameFor(dbFilename)

      expect(workerName).toBe('shared-sync-server-11111111-2222-3333-4444-555555555555.db')
      expect(serverIdFromWorkerName(workerName)).toBe(serverId)
    })

    it('standalone trust domain: workerNameFor produces a non-server name (no recoverable serverId)', () => {
      const dbFilename = getDbFilenameFor({ kind: 'standalone' })
      const workerName = workerNameFor(dbFilename)

      expect(workerName).toBe('shared-sync-standalone.db')
      expect(serverIdFromWorkerName(workerName)).toBeUndefined()
    })
  })

  describe('serverIdFromWorkerName edge cases', () => {
    it('returns undefined for an empty string', () => {
      expect(serverIdFromWorkerName('')).toBeUndefined()
    })

    it('returns undefined for undefined', () => {
      expect(serverIdFromWorkerName(undefined)).toBeUndefined()
    })

    it('returns undefined for an unrelated worker name', () => {
      expect(serverIdFromWorkerName('some-other-worker')).toBeUndefined()
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

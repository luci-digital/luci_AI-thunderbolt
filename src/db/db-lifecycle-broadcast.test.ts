/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { broadcastDbLifecycle, setupDbLifecycleReloadOnRemoteClose } from './db-lifecycle-broadcast'

// The wrapper is intentionally thin — these tests guard against accidental regressions
// in the public surface (broadcast is fire-and-forget no-throw, setup is idempotent).
// Round-trip behavior between tabs is exercised by manual QA — same-realm
// BroadcastChannel delivery in Bun's test loop is unreliable.

describe('db-lifecycle broadcast', () => {
  it('broadcastDbLifecycle does not throw for any event kind', () => {
    expect(() => broadcastDbLifecycle({ kind: 'db-closing', trustDomain: { kind: 'standalone' } })).not.toThrow()
    expect(() =>
      broadcastDbLifecycle({
        kind: 'db-deleted',
        trustDomain: { kind: 'server', serverId: '11111111-1111-1111-1111-111111111111' },
      }),
    ).not.toThrow()
  })

  it('setupDbLifecycleReloadOnRemoteClose is safe to call repeatedly', () => {
    expect(() => setupDbLifecycleReloadOnRemoteClose()).not.toThrow()
    expect(() => setupDbLifecycleReloadOnRemoteClose()).not.toThrow()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

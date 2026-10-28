/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { ActiveTrustDomain } from '@/stores/trust-domain-registry'

/**
 * Filename for the SQLite file that holds the given trust domain's data.
 *
 *   { kind: 'standalone' }              → 'standalone.db'           (one per device)
 *   { kind: 'server', serverId: 'abc' } → 'server-abc.db'           (one per server)
 *
 * The architecture is N-trust-domain ready; v1 production only ever reaches the server file.
 */
export const getDbFilenameFor = (domain: ActiveTrustDomain): string => {
  if (domain.kind === 'standalone') {
    return 'standalone.db'
  }
  return `server-${domain.serverId}.db`
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

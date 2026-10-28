/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useMemo, useState } from 'react'
import { filterRegistry } from '@/lib/agent-registry-filter'
import type { RegistryEntry } from '@/types/registry'

/**
 * Owns the catalogue's search query and derives the filtered results during
 * render — no effect, since the results are pure state of `entries` + `query`.
 */
export const useAgentRegistrySearch = (entries: ReadonlyArray<RegistryEntry>) => {
  const [query, setQuery] = useState('')
  const results = useMemo(() => filterRegistry(entries, query), [entries, query])
  return { query, setQuery, results, isEmpty: results.length === 0 }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

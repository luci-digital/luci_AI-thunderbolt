/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useHttpClient } from '@/contexts/http-client-context'
import { unitsOptionsResponseSchema } from '@/schemas/api'
import type { UnitsOptionsData } from '@/types'
import { useQuery } from '@tanstack/react-query'

/**
 * Fetches units options data from the backend API
 * Results are cached for 24 hours to avoid multiple requests
 */
export const useUnitsOptions = () => {
  const httpClient = useHttpClient()

  return useQuery({
    queryKey: ['units-options'],
    queryFn: async (): Promise<UnitsOptionsData> => {
      const response = await httpClient.get('units-options').json()
      const validatedData = unitsOptionsResponseSchema.parse(response)
      return validatedData
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
    retryDelay: 1000,
  })
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

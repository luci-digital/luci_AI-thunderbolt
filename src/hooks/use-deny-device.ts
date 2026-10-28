/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useHttpClient } from '@/contexts'
import { denyDeviceWithProof } from '@/services/encryption'
import { useMutation } from '@tanstack/react-query'

/**
 * Mutation for denying a pending device without revoking it.
 * Sets approval_pending = false so the device disappears from the pending list
 * but stays registered and can re-request approval.
 * Requires proof-of-CK-possession (canary secret) to prevent X-Device-ID spoofing.
 */
export const useDenyDevice = () => {
  const httpClient = useHttpClient()

  return useMutation({
    mutationFn: (deviceId: string) => denyDeviceWithProof(httpClient, deviceId),
  })
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

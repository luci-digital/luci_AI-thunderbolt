/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useHttpClient } from '@/contexts'
import type { Device } from '@/dal'
import { approveDevice } from '@/services/encryption'
import { useMutation } from '@tanstack/react-query'

/**
 * Shared mutation for approving a pending device.
 * Used by both the pending device modal and the devices settings page.
 */
export const useApproveDevice = (pendingDevices: Device[]) => {
  const httpClient = useHttpClient()

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const device = pendingDevices.find((d) => d.id === deviceId)
      if (!device?.publicKey || !device?.mlkemPublicKey) {
        throw new Error('Device is missing public key(s)')
      }
      await approveDevice(httpClient, deviceId, device.publicKey, device.mlkemPublicKey)
    },
  })
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

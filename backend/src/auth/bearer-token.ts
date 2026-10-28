/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verify a signed bearer token (format: `rawToken.base64Signature`) and return the raw session token.
 * Returns null if the token is unsigned, malformed, or the signature doesn't match.
 */
export const verifySignedBearerToken = (bearerValue: string, secret: string): string | null => {
  const dotIndex = bearerValue.lastIndexOf('.')
  if (dotIndex < 1) {
    return null
  }

  const rawToken = bearerValue.substring(0, dotIndex)
  const signature = bearerValue.substring(dotIndex + 1)

  const expected = createHmac('sha256', secret).update(rawToken).digest('base64')
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  return rawToken
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

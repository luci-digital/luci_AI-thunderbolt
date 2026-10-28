/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { encrypt, decrypt } from './primitives'
import { DecryptionError } from './errors'

const canaryPrefix = 'thunderbolt-canary-v1'
const secretLength = 32 // bytes

type Canary = {
  canaryIv: string
  canaryCtext: string
  canarySecret: string
}

type CanaryVerification = {
  valid: boolean
  canarySecret?: string
}

/** Generate a random hex secret for the canary. */
const generateCanarySecret = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(secretLength))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Create a canary by encrypting a known prefix + random secret with CK. */
export const createCanary = async (ck: CryptoKey): Promise<Canary> => {
  const canarySecret = generateCanarySecret()
  const plaintext = `${canaryPrefix}:${canarySecret}`
  const { iv, ciphertext } = await encrypt(plaintext, ck)
  return { canaryIv: iv, canaryCtext: ciphertext, canarySecret }
}

/**
 * Verify a recovery key by decrypting the canary and comparing to the known prefix.
 * Returns the embedded secret on success (needed for proof-of-possession on the server).
 */
export const verifyCanary = async (
  ck: CryptoKey,
  canaryIv: string,
  canaryCtext: string,
): Promise<CanaryVerification> => {
  try {
    const decrypted = await decrypt({ iv: canaryIv, ciphertext: canaryCtext }, ck)
    if (!decrypted.startsWith(`${canaryPrefix}:`)) {
      return { valid: false }
    }
    const canarySecret = decrypted.slice(canaryPrefix.length + 1)
    return { valid: true, canarySecret }
  } catch (err) {
    if (err instanceof DecryptionError) {
      return { valid: false }
    }
    throw err
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

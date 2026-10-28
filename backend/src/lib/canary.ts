/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { getEncryptionMetadata } from '@/dal'
import type { db as DbType } from '@/db/client'
import { timingSafeEqual } from 'crypto'

/** Hash a canary secret using SHA-256. Returns hex-encoded hash. */
export const hashCanarySecret = async (secret: string): Promise<string> => {
  const encoded = new TextEncoder().encode(secret)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Compare a canary secret against a stored hash using timing-safe comparison. */
const verifyAgainstHash = async (canarySecret: string, storedHash: string): Promise<boolean> => {
  const hash = await hashCanarySecret(canarySecret)
  const hashBuf = Buffer.from(hash)
  const storedBuf = Buffer.from(storedHash)
  if (hashBuf.length !== storedBuf.length) {
    return false
  }
  return timingSafeEqual(hashBuf, storedBuf)
}

/**
 * Verify proof-of-CK-possession by comparing SHA-256(canarySecret) against stored hash.
 * Used to gate trust-sensitive operations (device approval, deny, revoke) — prevents X-Device-ID spoofing
 * because only a device that possesses the Content Key can decrypt the canary and extract the secret.
 */
export const verifyCanaryProof = async (db: typeof DbType, userId: string, canarySecret: string): Promise<boolean> => {
  const metadata = await getEncryptionMetadata(db, userId)
  if (!metadata?.canarySecretHash) {
    return false
  }
  return verifyAgainstHash(canarySecret, metadata.canarySecretHash)
}

/**
 * Verify canary proof against pre-fetched metadata. Avoids a redundant getEncryptionMetadata call
 * when the caller already has the metadata (e.g., to decide whether E2EE is active).
 */
export const verifyCanaryProofWithMetadata = async (
  canarySecret: string,
  storedHash: string | null | undefined,
): Promise<boolean> => {
  if (!storedHash) {
    return false
  }
  return verifyAgainstHash(canarySecret, storedHash)
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

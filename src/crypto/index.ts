/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

// Primitives
export {
  generateKeyPair,
  generateMlKemKeyPair,
  generateCK,
  reimportAsNonExtractable,
  exportPublicKey,
  importPublicKey,
  exportMlKemPublicKey,
  importMlKemPublicKey,
  wrapCK,
  rewrapCK,
  unwrapCK,
  encrypt,
  decrypt,
  type MlKemKeyPair,
} from './primitives'

// Canary
export { createCanary, verifyCanary } from './canary'

// Recovery key
export { encodeRecoveryKey, decodeRecoveryKey } from './recovery-key'

// Key storage (IndexedDB)
export { storeKeyPair, getKeyPair, storeCK, getCK, clearCK, clearAllKeys, type StoredKeyPair } from './key-storage'

// Errors
export { EncryptionError, DecryptionError, StorageError, ValidationError } from './errors'

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

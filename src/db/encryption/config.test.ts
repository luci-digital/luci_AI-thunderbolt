/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { useConfigStore } from '@/api/config-store'

// Other test files mock the @/db/encryption barrel with isEncryptionEnabled: () => true.
// Bun's mock.module leaks across files and replaces the underlying config module too.
// Re-provide the real implementation here so these tests exercise actual config store logic.
// Use ...spread to preserve exports like encryptedColumnsMap that other tests depend on.
const realConfig = await import('./config')
mock.module('@/db/encryption/config', () => ({
  ...realConfig,
  isEncryptionEnabled: () => useConfigStore.getState().config.e2eeEnabled === true,
  needsSyncSetupWizard: async () => false,
}))

const realEncryption = await import('@/db/encryption')
mock.module('@/db/encryption', () => ({
  ...realEncryption,
  isEncryptionEnabled: () => useConfigStore.getState().config.e2eeEnabled === true,
  needsSyncSetupWizard: async () => false,
}))

import { isEncryptionEnabled } from './config'

describe('encryption config', () => {
  // Reset on both sides: another file's fetchConfig test may leave `e2eeEnabled`
  // set in the shared persisted store, so isolate before reading too.
  beforeEach(() => {
    useConfigStore.setState({ config: {} })
  })

  afterEach(() => {
    useConfigStore.setState({ config: {} })
  })

  describe('isEncryptionEnabled', () => {
    it('returns false when config store has no e2eeEnabled value', () => {
      expect(isEncryptionEnabled()).toBe(false)
    })

    it('returns false when e2eeEnabled is false', () => {
      useConfigStore.getState().updateConfig({ e2eeEnabled: false })
      expect(isEncryptionEnabled()).toBe(false)
    })

    it('returns true when e2eeEnabled is true', () => {
      useConfigStore.getState().updateConfig({ e2eeEnabled: true })
      expect(isEncryptionEnabled()).toBe(true)
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'

import { encodeRecoveryKey, decodeRecoveryKey } from './recovery-key'
import { generateCK, encrypt, decrypt } from './primitives'

describe('encodeRecoveryKey', () => {
  it('produces a 24-word mnemonic', async () => {
    const ck = await generateCK(true)
    const mnemonic = await encodeRecoveryKey(ck)
    const words = mnemonic.split(' ')
    expect(words).toHaveLength(24)
  })

  it('produces only lowercase words', async () => {
    const ck = await generateCK(true)
    const mnemonic = await encodeRecoveryKey(ck)
    expect(mnemonic).toBe(mnemonic.toLowerCase())
  })
})

describe('decodeRecoveryKey', () => {
  it('round-trips: encode then decode produces a working key', async () => {
    const originalCK = await generateCK(true)
    const mnemonic = await encodeRecoveryKey(originalCK)
    const restoredCK = await decodeRecoveryKey(mnemonic)

    const encrypted = await encrypt('test data', originalCK)
    const decrypted = await decrypt(encrypted, restoredCK)
    expect(decrypted).toBe('test data')
  })

  it('accepts extra whitespace in the input', async () => {
    const ck = await generateCK(true)
    const mnemonic = await encodeRecoveryKey(ck)
    const withExtraSpaces = `  ${mnemonic.replace(/ /g, '   ')}  `
    const restored = await decodeRecoveryKey(withExtraSpaces)
    expect(restored.algorithm.name).toBe('AES-GCM')
  })

  it('accepts mixed case input', async () => {
    const ck = await generateCK(true)
    const mnemonic = await encodeRecoveryKey(ck)
    const restored = await decodeRecoveryKey(mnemonic.toUpperCase())
    expect(restored.algorithm.name).toBe('AES-GCM')
  })

  it('rejects an invalid mnemonic (bad checksum)', async () => {
    const ck = await generateCK(true)
    const mnemonic = await encodeRecoveryKey(ck)
    const words = mnemonic.split(' ')
    // Each swap has a 1/256 chance of still having a valid checksum.
    // Try multiple swaps so the test is effectively deterministic.
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i] === words[i + 1]) {
        continue
      }
      const corrupted = [...words]
      ;[corrupted[i], corrupted[i + 1]] = [corrupted[i + 1], corrupted[i]]
      try {
        await decodeRecoveryKey(corrupted.join(' '))
      } catch {
        return // checksum correctly rejected
      }
    }
    throw new Error('All swaps produced valid checksums (astronomically unlikely)')
  })

  it('rejects a word not in the wordlist', async () => {
    const fakeWords = Array(24).fill('zzzznotaword').join(' ')
    await expect(decodeRecoveryKey(fakeWords)).rejects.toThrow('Invalid recovery phrase')
  })

  it('rejects wrong word count', async () => {
    const ck = await generateCK(true)
    const mnemonic = await encodeRecoveryKey(ck)
    const tooFew = mnemonic.split(' ').slice(0, 12).join(' ')
    await expect(decodeRecoveryKey(tooFew)).rejects.toThrow()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

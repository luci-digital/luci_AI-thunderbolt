/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { ImportFormatError } from '@/dal'
import { readJsonFile } from './import-upload'

const fileOf = (name: string, content: string): File => new File([content], name, { type: 'application/json' })

/** Build a File whose `.size` reports `bytes` without actually allocating that much memory. */
const oversizedFile = (name: string, bytes: number): File => {
  const file = new File(['{}'], name, { type: 'application/json' })
  Object.defineProperty(file, 'size', { value: bytes })
  return file
}

describe('readJsonFile', () => {
  it('parses well-formed JSON', async () => {
    const file = fileOf('export.json', JSON.stringify({ hello: 'world', n: 42 }))
    const parsed = await readJsonFile(file)
    expect(parsed).toEqual({ hello: 'world', n: 42 })
  })

  it('returns arrays and primitives as-is (caller is responsible for envelope checks)', async () => {
    const arr = fileOf('a.json', '[1, 2, 3]')
    await expect(readJsonFile(arr)).resolves.toEqual([1, 2, 3])

    const str = fileOf('s.json', '"hi"')
    await expect(readJsonFile(str)).resolves.toBe('hi')
  })

  it('throws a SyntaxError mentioning the file name on malformed JSON', async () => {
    const file = fileOf('bad.json', '{ not: valid }')
    await expect(readJsonFile(file)).rejects.toBeInstanceOf(SyntaxError)
    await expect(readJsonFile(file)).rejects.toThrow(/bad\.json/)
  })

  it('rejects oversized files with ImportFormatError before reading them into memory', async () => {
    const file = oversizedFile('huge.json', 300 * 1024 * 1024)
    await expect(readJsonFile(file)).rejects.toBeInstanceOf(ImportFormatError)
    await expect(readJsonFile(file)).rejects.toThrow(/huge\.json/)
    await expect(readJsonFile(file)).rejects.toThrow(/too large/i)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

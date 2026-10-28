/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import '@/testing-library'

import type { HttpClient } from '@/contexts'
import { getClock } from '@/testing-library'
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { act, renderHook } from '@testing-library/react'
import { useDocumentBlob } from './use-document-blob'

/** Builds an injectable HttpClient whose `get` resolves to a Response-like
 *  object exposing the given blob, or rejects with the given error. */
const makeHttpClient = (resolve: { blob?: Blob; error?: Error }): HttpClient =>
  ({
    get: () => {
      if (resolve.error) {
        return Promise.reject(resolve.error) as never
      }
      const response = { blob: async () => resolve.blob } as unknown as Response
      return Promise.resolve(response) as never
    },
    post: () => {
      throw new Error('not used')
    },
    delete: () => {
      throw new Error('not used')
    },
  }) as HttpClient

/** Flushes the hook's async fetch + reducer dispatch. */
const flush = async () => {
  await act(async () => {
    await getClock().runAllAsync()
  })
}

describe('useDocumentBlob', () => {
  let revokeSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    revokeSpy = spyOn(URL, 'revokeObjectURL')
  })

  afterEach(() => {
    revokeSpy.mockRestore()
  })

  it('starts in the loading state', () => {
    const httpClient = makeHttpClient({ blob: new Blob(['pdf']) })
    const { result } = renderHook(() => useDocumentBlob('file-1', 'pdf', httpClient))
    expect(result.current.status).toBe('loading')
  })

  it('resolves a PDF to a ready state with a blob url and no docx html', async () => {
    const httpClient = makeHttpClient({ blob: new Blob(['pdf']) })
    const { result } = renderHook(() => useDocumentBlob('file-1', 'pdf', httpClient))

    await flush()
    if (result.current.status !== 'ready') {
      throw new Error(`expected ready state, got ${result.current.status}`)
    }
    expect(result.current.blobUrl).toMatch(/^blob:/)
    expect(result.current.docxHtml).toBeNull()
  })

  it('resolves an unsupported file to ready (download still works) without docx html', async () => {
    const httpClient = makeHttpClient({ blob: new Blob(['raw']) })
    const { result } = renderHook(() => useDocumentBlob('file-2', 'unsupported', httpClient))

    await flush()
    if (result.current.status !== 'ready') {
      throw new Error(`expected ready state, got ${result.current.status}`)
    }
    expect(result.current.docxHtml).toBeNull()
  })

  it('surfaces the error message when the fetch fails', async () => {
    const httpClient = makeHttpClient({ error: new Error('upstream 401') })
    const { result } = renderHook(() => useDocumentBlob('file-3', 'pdf', httpClient))

    await flush()
    if (result.current.status !== 'error') {
      throw new Error(`expected error state, got ${result.current.status}`)
    }
    expect(result.current.message).toBe('upstream 401')
  })

  it('revokes the created object url on unmount', async () => {
    const httpClient = makeHttpClient({ blob: new Blob(['pdf']) })
    const { result, unmount } = renderHook(() => useDocumentBlob('file-4', 'pdf', httpClient))

    await flush()
    expect(result.current.status).toBe('ready')
    unmount()
    expect(revokeSpy).toHaveBeenCalledTimes(1)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

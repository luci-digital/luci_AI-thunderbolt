/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useCallback } from 'react'
import { useLocalStorage } from './use-local-storage'

const draftKeyPrefix = 'draft:'

/**
 * Persists prompt input text to localStorage, keyed by chat thread ID.
 * Debounces writes so rapid typing doesn't thrash storage.
 * Returns [input, setInput, clearDraft] — drop-in replacement for useState('').
 */
export const useDraftInput = (chatThreadId: string, { persist = true }: { persist?: boolean } = {}) => {
  const [input, setInput] = useLocalStorage(`${draftKeyPrefix}${chatThreadId}`, '', {
    debounceMs: 300,
    disabled: !persist,
  })

  const clearDraft = useCallback(() => {
    setInput('', { immediate: true })
  }, [setInput])

  return [input, setInput, clearDraft] as const
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

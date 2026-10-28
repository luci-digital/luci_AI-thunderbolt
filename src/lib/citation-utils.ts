/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { isSafeUrl } from '@/lib/url-utils'
import type { CitationSource } from '@/types/citation'
import { z } from 'zod'

/**
 * Schema for validating citation sources at runtime.
 * Ensures all required fields are present and URLs are safe (http/https only).
 */
const citationSourceSchema = z.object({
  id: z.string().min(1, 'Source ID is required'),
  title: z.string().min(1, 'Source title is required'),
  url: z.string().url('Invalid URL').refine(isSafeUrl, 'URL must use http or https'),
  siteName: z.string().optional(),
  favicon: z.string().url('Invalid favicon').refine(isSafeUrl, 'Favicon must use http or https').optional(),
  isPrimary: z.boolean().optional(),
})

/**
 * Parses a JSON string (raw or base64-encoded) into CitationSource[].
 * Validates each source against the schema, rejecting all sources if any are invalid (all-or-nothing).
 * Tries raw JSON first, then base64 decode as fallback for backward compatibility.
 * Returns null if parsing fails, validation fails, or sources are empty.
 */
export const decodeCitationSources = (sourcesStr: string): CitationSource[] | null => {
  const parseJson = (json: string): CitationSource[] | null => {
    try {
      const parsed = JSON.parse(json)

      if (!Array.isArray(parsed)) {
        return null
      }

      // Validate each source — all-or-nothing validation
      const validatedSources: CitationSource[] = []
      for (const item of parsed) {
        const result = citationSourceSchema.safeParse(item)
        if (!result.success) {
          return null
        }
        validatedSources.push(result.data)
      }

      return validatedSources.length > 0 ? validatedSources : null
    } catch {
      return null
    }
  }

  const trimmed = sourcesStr.trim()
  if (trimmed.startsWith('[')) {
    return parseJson(trimmed)
  }

  // Fallback: base64-encoded JSON (backward compatibility)
  try {
    return parseJson(atob(trimmed))
  } catch {
    return null
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

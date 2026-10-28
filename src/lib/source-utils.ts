/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { CitationSource } from '@/types/citation'
import type { SourceMetadata } from '@/types/source'

/**
 * Converts a SourceMetadata entry to a CitationSource for the rendering pipeline.
 * Maps index to id (as string), preserves url/title/siteName/favicon.
 * @param isPrimary - Whether this is the primary (displayed) source in a group. Defaults to true.
 */
export const sourceToCitation = (source: SourceMetadata, isPrimary = true): CitationSource => ({
  id: String(source.index),
  title: source.title,
  url: source.url,
  siteName: source.siteName,
  favicon: source.favicon ?? undefined,
  isPrimary,
})

/**
 * Derives a site name from a URL's hostname.
 * Strips "www." prefix and returns the remaining hostname.
 * Returns undefined if the URL is invalid.
 */
export const deriveSiteName = (url: string): string | undefined => {
  try {
    const hostname = new URL(url).hostname
    return hostname.startsWith('www.') ? hostname.slice(4) : hostname
  } catch {
    return undefined
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

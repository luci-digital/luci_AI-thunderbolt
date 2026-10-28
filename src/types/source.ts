/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Metadata for a single source collected from tool results.
 * Stored on UIMessageMetadata.sources for the source registry.
 */
export type SourceMetadata = {
  /** 1-based sequential index, matches AI's [N] reference */
  index: number
  /** Full URL of the source */
  url: string
  /** Title of the source page/article (fallback to URL) */
  title: string
  /** Description or summary (from search summary or fetch_content text snippet) */
  description?: string
  /** Image URL if available */
  image?: string | null
  /** Favicon URL if available */
  favicon?: string | null
  /** Display name of the website (derived from hostname) */
  siteName?: string
  /** Author of the source content */
  author?: string | null
  /** Publication date of the source */
  publishedDate?: string | null
  /** Which tool produced this source */
  toolName: 'search' | 'fetch_content'
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

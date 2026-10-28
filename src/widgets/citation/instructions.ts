/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * AI Instructions for the citation widget
 */
export const instructions = `## Citations
Cite each source ONCE with [N] after the period at the end of the LAST sentence using that source. Add a space before the bracket. Do not repeat the same [N] across paragraphs or bullets.

Good: Fortaleza was founded in 1726. It is the fifth largest city in Brazil. [1] Recife has 1.6 million residents. [2]
Bad: Fortaleza was founded in 1726. [1] It is the fifth largest city in Brazil. [1]
Bad: According to [Source 1], Fortaleza was founded in 1726.

Do not use <widget:citation> tags, 【1】 brackets, footnotes, or source lists at the end.`

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Generates a title from a chat message by extracting key words
 *
 * @param message - The chat message to generate a title from
 * @param options - Optional configuration object
 * @param options.words - Number of words to include in the title (default: 6)
 * @returns A formatted title with capitalized words or "New Chat" if no words are found
 */

export const generateTitle = (message: string, options?: { words?: number }): string => {
  // Clean and extract key words
  const cleaned = message
    .replace(/^(hey|hi|hello|please|can you|could you|help me|what|how|why)/i, '')
    .replace(/[\n\r]+/g, ' ')
    .trim()

  const words = cleaned.split(' ').filter((w) => w.length > 2)

  // Use the specified number of words or default to 6
  const maxWords = options?.words ?? 6
  const selectedWords = words.slice(0, maxWords)
  const title = selectedWords.join(' ')

  // If the title is longer than 50 characters, truncate at word boundary
  const maxLength = 50
  let finalTitle = title
  if (title.length > maxLength) {
    // Find the last space before the character limit
    const truncated = title.slice(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    finalTitle = lastSpaceIndex > 0 ? truncated.slice(0, lastSpaceIndex) : truncated
  }

  // Remove punctuation from the final title
  finalTitle = finalTitle.replace(/[.,!?;:'"()[\]{}]/g, '')

  return (
    finalTitle
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') || 'New Chat'
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Append a `/slug` token to `value` for the chat composer, normalizing
 * surrounding whitespace.
 *
 * If the *last* slash token already in the input matches the slug we're
 * about to add, the call is a no-op (returns the existing value) — clicking
 * the same chip twice shouldn't double-insert, and clicking a different
 * chip back-to-back shouldn't keep appending the new one if it's already at
 * the end either.
 *
 * Otherwise the result is one of:
 *
 * - `"/slug "` — when the input was empty.
 * - `"<existing> /slug "` — otherwise. Any trailing whitespace on the
 *   existing content is collapsed to a single space.
 *
 * Pulled out of `chat-prompt-input.tsx` so the rule (and its edge cases) is
 * unit-testable without spinning up the chat-store / draft-input stack.
 */
export const appendSlashToken = (value: string, slug: string): string => {
  const token = `/${slug}`
  if (value.length === 0) {
    return `${token} `
  }
  // Last token in the input — defined as the trailing run after the final
  // whitespace, ignoring any trailing whitespace itself. If that already
  // matches the token we're adding, skip the append.
  const trimmedRight = value.replace(/\s+$/, '')
  const lastSpace = Math.max(
    trimmedRight.lastIndexOf(' '),
    trimmedRight.lastIndexOf('\n'),
    trimmedRight.lastIndexOf('\t'),
  )
  const lastToken = trimmedRight.slice(lastSpace + 1)
  if (lastToken === token) {
    // Preserve the existing trailing space behaviour: if there was no space
    // after the token, add one so the caret lands clear of the slug.
    return value.endsWith(' ') ? value : `${trimmedRight} `
  }
  return `${trimmedRight} ${token} `
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

const maxLength = 64

/**
 * Convert an arbitrary title (e.g. an automation name like "Daily Brief")
 * into a slug that satisfies the AgentSkills spec:
 *
 * - Lowercase a–z, 0–9, hyphens only
 * - 1–64 chars
 * - No leading / trailing hyphens
 * - No consecutive hyphens
 *
 * Returns `null` when the input would produce an empty slug (e.g. only
 * punctuation or whitespace). Callers should skip migration for those rows
 * — there's no honest name to give the migrated skill.
 */
export const slugifySkillName = (title: string): string | null => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/, '')
  return slug.length > 0 ? slug : null
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

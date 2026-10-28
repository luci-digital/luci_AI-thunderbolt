/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { Skill } from '@/types'

/**
 * Finds skills whose `description` or `instruction` references the target
 * skill's slash token (`/name` followed by anything that isn't a continuation
 * of the slug — whitespace, punctuation, or end-of-string). Skill names are
 * stored as bare slugs; the `/` is the chat trigger added at display + parse
 * time. Because slugs are `[a-z0-9-]+` per the AgentSkills spec, the lookahead
 * `(?![a-z0-9-])` accepts every legitimate terminator — comma, period, paren,
 * newline — without falsely matching a longer slug like `/foo-bar` for `/foo`.
 * The match rule mirrors what the slash autocomplete (THU-535) will look for,
 * so what the user *sees* as a reference is what we *count* as a dependency.
 */
export const findDependents = (targetName: string, library: Skill[]): Skill[] => {
  const escaped = targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`/${escaped}(?![a-z0-9-])`)
  return library.filter((s) => s.name !== targetName && (pattern.test(s.description) || pattern.test(s.instruction)))
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

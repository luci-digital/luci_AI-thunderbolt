/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { createParser } from '@/lib/create-parser'
import { z } from 'zod'
import type { AskCacheEntry } from './lib'

const optionShape = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean().optional(),
})

/**
 * The `options` attribute arrives as a JSON-encoded string (widget attributes
 * are always strings). Parse it leniently, then validate the decoded shape.
 */
const optionsAttr = z
  .string()
  .transform((value, ctx) => {
    try {
      return JSON.parse(value)
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'options must be valid JSON' })
      return z.NEVER
    }
  })
  .pipe(z.array(optionShape).min(2))

export const schema = z.object({
  widget: z.literal('ask'),
  args: z.object({
    prompt: z.string().min(1),
    mode: z.enum(['single', 'multiple', 'choice', 'free']),
    // Optional: `free` (open text-response) prompts carry no options. The other
    // modes still emit them; `optionsAttr` enforces min-2 when present. (A
    // cross-field "non-free ⇒ options required" rule can't live here without
    // wrapping args in `.refine()`, which would break `createParser`'s reliance
    // on `args.shape`.)
    options: optionsAttr.optional(),
    explanation: z.string().optional(),
  }),
})

export type AskWidget = z.infer<typeof schema>

/** The user's persisted response to a single ask, stored in the message cache. */
export type CacheData = AskCacheEntry

export const parse = createParser(schema)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

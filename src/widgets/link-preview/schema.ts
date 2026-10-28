/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { type LinkPreviewData } from '@/integrations/thunderbolt-pro/schemas'
import { createParser } from '@/lib/create-parser'
import { z } from 'zod'

/**
 * Zod schema for link-preview widget
 */
export const schema = z.object({
  widget: z.literal('link-preview'),
  args: z.object({
    url: z.string().url('Invalid URL').min(1, 'URL is required'),
    source: z.string().optional(),
  }),
})

export type LinkPreviewWidget = z.infer<typeof schema>

/**
 * Type of data cached by this widget
 */
export type CacheData = LinkPreviewData

/**
 * Parse function - auto-generated from schema
 */
export const parse = createParser(schema)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

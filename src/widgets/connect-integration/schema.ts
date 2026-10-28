/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { createParser } from '@/lib/create-parser'
import { z } from 'zod'

/**
 * Zod schema for connect-integration widget
 */
export const schema = z.object({
  widget: z.literal('connect-integration'),
  args: z.object({
    provider: z.enum(['google', 'microsoft', '']),
    service: z.enum(['email', 'calendar', 'both']),
    reason: z.string(),
    override: z.enum(['true', '']),
  }),
})

export type ConnectIntegrationWidget = z.infer<typeof schema>

/**
 * Type of data cached by this widget
 * isHidden: Whether the widget should be hidden after integration completion
 */
export type CacheData = {
  isHidden?: boolean
}

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

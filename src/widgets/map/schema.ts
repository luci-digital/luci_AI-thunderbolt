/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { createParser } from '@/lib/create-parser'
import { z } from 'zod'
import { parseFeatureCollection } from './geojson'

/**
 * Zod schema for the map widget. `data` carries a GeoJSON FeatureCollection as
 * a JSON string (kept as a string in args — the same pattern as the citation
 * widget's `sources`); the `.refine` rejects anything that isn't a valid
 * FeatureCollection so a malformed tag never renders an empty map. Parsing into
 * the typed collection happens in the component.
 */
export const schema = z.object({
  widget: z.literal('map'),
  args: z.object({
    data: z
      .string()
      .min(1, 'GeoJSON data is required')
      .refine((value) => parseFeatureCollection(value) !== null, 'Invalid GeoJSON: must be a valid FeatureCollection'),
    title: z.string().optional(),
  }),
})

export type MapWidget = z.infer<typeof schema>

/** Parse function — auto-generated from schema. */
export const parse = createParser(schema)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

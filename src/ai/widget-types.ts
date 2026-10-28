/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Widget type definitions
 *
 * This file auto-generates types from the widget registry.
 * To add a new widget type, update src/widgets/index.ts
 */

import { widgetSchemas } from '@/widgets'
import { z } from 'zod'

/**
 * Union of all possible widget types - auto-generated from widget registry
 * Type assertion is safe because we know the schemas are discriminated unions at runtime
 */
const _widgetSchema = z.discriminatedUnion(
  'widget',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  widgetSchemas as any,
)

export type Widget = z.infer<typeof _widgetSchema>

/**
 * Individual widget types - import these from widget folders directly:
 *
 * import type { WeatherForecastWidgetType } from '@/widgets/weather-forecast'
 * import type { LinkPreviewWidgetType } from '@/widgets/link-preview'
 */

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

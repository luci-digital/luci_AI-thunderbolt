/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { z } from 'zod'

/**
 * Creates a parse function from a widget schema, eliminating duplication
 * of widget name and args structure.
 *
 * @example
 * const schema = z.object({
 *   widget: z.literal('my-widget'),
 *   args: z.object({ foo: z.string() })
 * })
 * export const parse = createParser(schema)
 */
export const createParser = <T extends z.ZodObject<any>>(
  schema: T,
): ((attrs: Record<string, string>) => z.infer<T> | null) => {
  // Extract widget name from schema (literal values are stored as an array)
  const widgetName = schema.shape.widget._def.values[0] as string

  // Extract args keys from schema, separating required from optional
  const argsSchema = schema.shape.args as z.ZodObject<any>
  const argsKeys = Object.keys(argsSchema.shape)
  const requiredKeys = argsKeys.filter((key) => !argsSchema.shape[key].isOptional())

  return (attrs: Record<string, string>): z.infer<T> | null => {
    // Quick check: ensure all required args are present (optional args may be absent)
    const hasRequiredArgs = requiredKeys.every((key) => attrs[key] !== undefined)
    if (!hasRequiredArgs) {
      return null
    }

    // Build the widget object from attrs (only include keys that are present)
    const args = Object.fromEntries(argsKeys.filter((key) => attrs[key] !== undefined).map((key) => [key, attrs[key]]))

    // Validate with schema
    const result = schema.safeParse({
      widget: widgetName,
      args,
    })

    return result.success ? result.data : null
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

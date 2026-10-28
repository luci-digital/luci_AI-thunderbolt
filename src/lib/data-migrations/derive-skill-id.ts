/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Derive a deterministic skill id from an automation (prompt) id.
 *
 * Two devices running the `automations-to-skills` migration on the same
 * automation must produce the same skill id so the backend's upload-side
 * `onConflictDoNothing` settles the cross-device race correctly. A pure
 * SHA-256 over the automation id (with a static prefix so the hash never
 * collides with anything else we might derive ids from in the future)
 * formatted as a UUID-ish string gives us that without needing extra
 * schema columns to remember the source mapping.
 */
export const deriveSkillIdFromAutomationId = async (automationId: string): Promise<string> => {
  const buf = new TextEncoder().encode(`migrated_automation:${automationId}`)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

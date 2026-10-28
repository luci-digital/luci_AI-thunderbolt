/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Single source of truth for the authenticated User shape, shared by backend and frontend.
 *
 * The backend Drizzle schema in `backend/src/db/auth-schema.ts` is the canonical definition;
 * this type mirrors `typeof user.$inferSelect` so frontend code can import it without
 * depending on Drizzle or the backend package.
 *
 * Drift between this type and the Drizzle schema is caught at compile time by the
 * `_userTypeDriftCheck` assertion in `backend/src/db/auth-schema.ts` — if the schema
 * changes, update this type in lockstep or the backend type-check will fail.
 */
export type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  isNew: boolean
  isAnonymous: boolean
  createdAt: Date
  updatedAt: Date
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

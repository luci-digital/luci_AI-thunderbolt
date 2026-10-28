/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth-schema'
import { devicesTable } from './powersync-schema'

/**
 * Encryption tables — server-side only, never synced via PowerSync.
 * These tables store wrapped keys and canary data for E2E encryption.
 */

/** One row per trusted device. Each device fetches only its own row via API. */
export const envelopesTable = pgTable(
  'envelopes',
  {
    deviceId: text('device_id')
      .primaryKey()
      .references(() => devicesTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    wrappedCk: text('wrapped_ck').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('idx_envelopes_user_id').on(table.userId)],
)

/** One row per user account. Stores canary for recovery key verification. */
export const encryptionMetadataTable = pgTable('encryption_metadata', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  canaryIv: text('canary_iv').notNull(),
  canaryCtext: text('canary_ctext').notNull(),
  canarySecretHash: text('canary_secret_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

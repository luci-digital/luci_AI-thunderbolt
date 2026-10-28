/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { relations } from 'drizzle-orm'
import { chatMessagesTable, chatThreadsTable, modelProfilesTable, modelsTable } from './tables'

export const chatThreadsRelations = relations(chatThreadsTable, ({ many }) => ({
  messages: many(chatMessagesTable),
}))

export const chatMessagesRelations = relations(chatMessagesTable, ({ one, many }) => ({
  thread: one(chatThreadsTable, {
    fields: [chatMessagesTable.chatThreadId],
    references: [chatThreadsTable.id],
  }),
  model: one(modelsTable, {
    fields: [chatMessagesTable.modelId],
    references: [modelsTable.id],
  }),
  parent: one(chatMessagesTable, {
    fields: [chatMessagesTable.parentId],
    references: [chatMessagesTable.id],
    relationName: 'messageThread',
  }),
  children: many(chatMessagesTable, {
    relationName: 'messageThread',
  }),
}))

export const modelsRelations = relations(modelsTable, ({ one, many }) => ({
  chatMessages: many(chatMessagesTable),
  profile: one(modelProfilesTable, {
    fields: [modelsTable.id],
    references: [modelProfilesTable.modelId],
  }),
}))

export const modelProfilesRelations = relations(modelProfilesTable, ({ one }) => ({
  model: one(modelsTable, {
    fields: [modelProfilesTable.modelId],
    references: [modelsTable.id],
  }),
}))

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

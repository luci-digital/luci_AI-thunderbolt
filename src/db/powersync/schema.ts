/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { PowerSyncTableName } from '@shared/powersync-tables'
import { DrizzleAppSchema, type DrizzleTableWithPowerSyncOptions } from '@powersync/drizzle-driver'
import * as tables from '../tables'

/**
 * Synced tables — type-checked against PowerSyncTableName.
 * Keys are snake_case (table names). The driver uses the table's config name, not our keys.
 */
export const syncedTables = {
  settings: tables.settingsTable,
  chat_threads: tables.chatThreadsTable,
  chat_messages: tables.chatMessagesTable,
  tasks: tables.tasksTable,
  models: tables.modelsTable,
  prompts: tables.promptsTable,
  skills: tables.skillsTable,
  triggers: tables.triggersTable,
  modes: tables.modesTable,
  model_profiles: tables.modelProfilesTable,
  devices: tables.devicesTable,
  agents: tables.agentsTable,
  workspaces: tables.workspacesTable,
  workspace_memberships: tables.workspaceMembershipsTable,
  workspace_pending_memberships: tables.workspacePendingMembershipsTable,
  workspace_permissions: tables.workspacePermissionsTable,
} satisfies Record<PowerSyncTableName, unknown>

/** Local-only tables — created in SQLite but never synced via PowerSync. */
export const localOnlyTables = {
  integrations_secrets: {
    tableDefinition: tables.integrationsSecretsTable,
    options: { localOnly: true },
  } satisfies DrizzleTableWithPowerSyncOptions,
  mcp_servers: {
    tableDefinition: tables.mcpServersTable,
    options: { localOnly: true },
  } satisfies DrizzleTableWithPowerSyncOptions,
  mcp_secrets: {
    tableDefinition: tables.mcpSecretsTable,
    options: { localOnly: true },
  } satisfies DrizzleTableWithPowerSyncOptions,
  agents_system: {
    tableDefinition: tables.agentsSystemTable,
    options: { localOnly: true },
  } satisfies DrizzleTableWithPowerSyncOptions,
  agents_secrets: {
    tableDefinition: tables.agentsSecretsTable,
    options: { localOnly: true },
  } satisfies DrizzleTableWithPowerSyncOptions,
}

/**
 * Combined Drizzle schema for PowerSync AppSchema.
 */
export const drizzleSchema = {
  ...syncedTables,
  ...localOnlyTables,
}

/**
 * PowerSync AppSchema derived from Drizzle table definitions.
 */
export const AppSchema = new DrizzleAppSchema(drizzleSchema)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

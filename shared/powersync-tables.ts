/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Single source of truth for PowerSync-synced table names and React Query invalidation.
 * Used by backend (validTables), frontend (use-powersync-invalidation), and sync rules (config.yaml).
 * When adding a table: add here, then to src/db/tables.ts, backend/src/db/powersync-schema.ts,
 * src/db/powersync/schema.ts, and powersync-service/config/config.yaml.
 */

export const powersyncTableNames = [
  'settings',
  'chat_threads',
  'chat_messages',
  'tasks',
  'models',
  'prompts',
  'skills',
  'triggers',
  'modes',
  'model_profiles',
  'devices',
  'agents',
  'workspaces',
  'workspace_memberships',
  'workspace_pending_memberships',
  'workspace_permissions',
] as const

export type PowerSyncTableName = (typeof powersyncTableNames)[number]

/**
 * Map of PowerSync table names to React Query keys to invalidate when the table changes.
 * Keys are type-checked against powersyncTableNames; every table must have an entry.
 * Prefix keys (e.g. ['settings']) invalidate all queries starting with that prefix.
 */
export const powersyncTableToQueryKeys: {
  [K in PowerSyncTableName]: string[][]
} = {
  settings: [['settings']],
  chat_threads: [['chatThreads']],
  chat_messages: [['messages'], ['messageCache']],
  tasks: [['tasks']],
  models: [['models']],
  prompts: [['prompts']],
  skills: [['skills']],
  triggers: [['triggers']],
  modes: [['modes']],
  model_profiles: [['modelProfiles']],
  devices: [['devices']],
  agents: [['agents']],
  workspaces: [['workspaces']],
  workspace_memberships: [['workspaceMemberships']],
  workspace_pending_memberships: [['workspacePendingMemberships']],
  workspace_permissions: [['workspacePermissions']],
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

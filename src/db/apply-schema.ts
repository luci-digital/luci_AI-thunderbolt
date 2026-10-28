/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { AnyDrizzleDatabase } from '@/db/database-interface'
import { getTableConfig } from 'drizzle-orm/sqlite-core'
import type { Index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import * as tablesModule from './tables'

const tables = Object.values(tablesModule) as SQLiteTable[]

type SQLiteColumnLike = { getSQLType?: () => string; name: string; primary?: boolean; notNull?: boolean }

/** Quote identifier for SQL (reserved words like "order" must be quoted) */
const quoteId = (name: string): string => `"${name.replace(/"/g, '""')}"`

/**
 * Build CREATE TABLE SQL from a Drizzle table config.
 * Used for tests so we apply schema at init (like PowerSync) without migrations.
 */
const buildCreateTableSQL = (table: SQLiteTable): string => {
  const config = getTableConfig(table)
  const parts: string[] = []

  for (const col of config.columns) {
    const sqliteCol = col as SQLiteColumnLike
    const type = typeof sqliteCol.getSQLType === 'function' ? sqliteCol.getSQLType() : 'text'
    const name = quoteId(sqliteCol.name)
    const constraints: string[] = [name, type]
    if (sqliteCol.primary) {
      constraints.push('PRIMARY KEY')
    }
    if (sqliteCol.notNull && !sqliteCol.primary) {
      constraints.push('NOT NULL')
    }
    parts.push(constraints.join(' '))
  }

  return `CREATE TABLE IF NOT EXISTS ${quoteId(config.name)} (${parts.join(', ')})`
}

type IndexConfigLike = { name: string; columns: { name: string }[]; unique: boolean; where?: unknown }

/**
 * Build CREATE INDEX SQL from an index config.
 * Skips partial indexes (with WHERE) since serializing SQL is non-trivial.
 */
const buildCreateIndexSQL = (tableName: string, index: Index): string => {
  const config = index.config as IndexConfigLike
  if (config.where) {
    return '' // Skip partial indexes
  }
  const unique = config.unique ? 'UNIQUE ' : ''
  const columnNames = config.columns.map((c) => quoteId(c.name)).filter(Boolean)
  if (columnNames.length === 0) {
    return ''
  }
  return `CREATE ${unique}INDEX IF NOT EXISTS ${quoteId(config.name)} ON ${quoteId(tableName)} (${columnNames.join(', ')})`
}

/**
 * Apply the app schema (create tables and indexes) to a Drizzle SQLite database.
 * Use in tests instead of migrations: PowerSync applies schema at init, so tests do the same.
 *
 * @param db - Drizzle SQLite database (e.g. Bun SQLite for tests)
 */
export const applySchema = async (db: AnyDrizzleDatabase): Promise<void> => {
  for (const table of tables) {
    const createTableSQL = buildCreateTableSQL(table)
    await db.run(sql.raw(createTableSQL))
  }

  for (const table of tables) {
    const config = getTableConfig(table)
    for (const index of config.indexes) {
      const createIndexSQL = buildCreateIndexSQL(config.name, index)
      if (createIndexSQL) {
        await db.run(sql.raw(createIndexSQL))
      }
    }
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import type { DatabaseInterface } from './database-interface'
import * as schema from './schema'

/**
 * Converts Bun SQLite row objects to arrays to match Drizzle sqlite-proxy format
 * Example: {id: 1, name: 'foo'} => [1, 'foo']
 */
const rowToArray = (row: Record<string, any>): any[] => Object.values(row)

export class BunSQLiteDatabase implements DatabaseInterface {
  private _db: ReturnType<typeof drizzle<typeof schema>> | null = null
  private sqlite: Database | null = null

  get db() {
    if (!this._db) {
      throw new Error('BunSQLiteDatabase not initialized. Call initialize() first.')
    }
    return this._db
  }

  async initialize(path: string): Promise<void> {
    if (this._db) {
      return // Already initialized
    }

    // Bun SQLite supports :memory: natively for in-memory databases
    this.sqlite = new Database(path)

    // Use sqlite-proxy to transform results to match Drizzle's expected format
    // Bun SQLite returns objects {id: 1, name: 'foo'}
    // Drizzle sqlite-proxy expects arrays [1, 'foo']
    this._db = drizzle(
      async (sql: string, params?: any[], method?: 'all' | 'get' | 'values' | 'run'): Promise<{ rows: any }> => {
        if (!this.sqlite) {
          throw new Error('Database not initialized')
        }

        try {
          if (method === 'run' || method === 'values') {
            // For INSERT, UPDATE, DELETE, etc.
            this.sqlite.run(sql, params ?? [])
            return { rows: [] }
          }

          // For SELECT queries
          const stmt = this.sqlite.prepare(sql)
          const result = params ? stmt.all(...params) : stmt.all()

          if (method === 'get') {
            // Return single row as array, or undefined if no results
            const row = Array.isArray(result) && result.length > 0 ? result[0] : undefined
            return { rows: row ? rowToArray(row) : undefined }
          }

          // method === 'all'
          // Return array of arrays
          const rows = Array.isArray(result) ? result.map((row) => rowToArray(row as Record<string, any>)) : []
          return { rows }
        } catch (error) {
          console.error('Database query error:', error)
          throw error
        }
      },
      { schema },
    )
  }

  async close(): Promise<void> {
    if (this.sqlite) {
      this.sqlite.close()
      this.sqlite = null
      this._db = null
    }
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

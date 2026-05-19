/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { db as DbType } from '@/db/client'
import {
  powersyncConflictTarget,
  powersyncDbNameToSchemaKey,
  powersyncPkColumn,
  powersyncTablesByName,
} from '@/db/powersync-schema'
import type { PowerSyncTableName } from '@shared/powersync-tables'
import { and, eq } from 'drizzle-orm'
import type { AnyPgTable } from 'drizzle-orm/pg-core'
import { isActiveWorkspaceMember } from './workspaces'

/**
 * Tables clients may write to via PowerSync upload. Everything else (including new synced tables)
 * is rejected by default — workspace config writes flow through REST endpoints per Decision 14
 * of the workspaces spec. Narrowing this set is also the security boundary that prevents a
 * malicious client from inserting a `workspace_members` row to self-promote.
 */
const writableTables = new Set<string>(['chat_threads', 'chat_messages', 'tasks', 'settings'])

/**
 * Subset of writable tables that are workspace-scoped (require an active membership check on PUT).
 * `settings` is account-level and is excluded — the user_id override on its write path is enough.
 */
const workspaceScopedWritableTables = new Set<string>(['chat_threads', 'chat_messages', 'tasks'])

type PowerSyncOperation = {
  op: 'PUT' | 'PATCH' | 'DELETE'
  type: string
  id: string
  data?: Record<string, unknown>
}

/** DB column names that use Drizzle timestamp(); JSON sends them as ISO strings, so we convert to Date. */
const timestampDbColumns = new Set(['deleted_at', 'last_seen', 'created_at', 'revoked_at', 'updated_at'])

/**
 * Convert payload with DB column names to schema keys and filter to valid columns only.
 * Timestamp columns arrive as ISO strings from JSON; convert to Date for Drizzle.
 */
const toSchemaRecord = (
  dbRecord: Record<string, unknown>,
  validDbNames: Set<string>,
  dbNameToKey: Record<string, string>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const [dbName, value] of Object.entries(dbRecord)) {
    if (!validDbNames.has(dbName)) {
      continue
    }
    const schemaKey = dbNameToKey[dbName]
    if (schemaKey && value !== undefined) {
      let mapped = value
      if (timestampDbColumns.has(dbName) && typeof value === 'string') {
        const d = new Date(value)
        mapped = Number.isNaN(d.getTime()) ? value : d
      }
      out[schemaKey] = mapped
    }
  }
  return out
}

type MembershipCache = Map<string, boolean>

/**
 * Look up workspace membership through the cache, populating it on miss. The cache is scoped
 * to a single upload batch — see `applyOperations`.
 */
const checkMembershipCached = async (
  database: typeof DbType,
  workspaceId: string,
  userId: string,
  cache: MembershipCache,
): Promise<boolean> => {
  const key = `${workspaceId}:${userId}`
  const cached = cache.get(key)
  if (cached !== undefined) {
    return cached
  }
  const isMember = await isActiveWorkspaceMember(database, workspaceId, userId)
  cache.set(key, isMember)
  return isMember
}

/**
 * Apply a single PowerSync upload operation using Drizzle's query builder (parameterized, no raw SQL).
 *
 * The user_id is always overridden with the authenticated user's id to prevent forgery. Writes are
 * rejected for any table not in `writableTables`. For workspace-scoped writable tables, PUT
 * operations additionally require an active workspace membership.
 *
 * Pass a shared `membershipCache` when applying multiple operations in the same upload batch to
 * avoid redundant `workspace_members` lookups — see `applyOperations`.
 */
export const applyOperation = async (
  database: typeof DbType,
  op: PowerSyncOperation,
  userId: string,
  membershipCache: MembershipCache = new Map(),
): Promise<boolean> => {
  if (!writableTables.has(op.type)) {
    return false
  }

  const tableName = op.type as PowerSyncTableName
  const table = powersyncTablesByName[tableName]
  const dbNameToKey = powersyncDbNameToSchemaKey[tableName]
  const pkColumn = powersyncPkColumn[tableName]
  const conflictTarget = powersyncConflictTarget[tableName]
  if (!table || !dbNameToKey || !pkColumn || !conflictTarget) {
    return false
  }

  const validDbNames = new Set(Object.keys(dbNameToKey))
  const tableWithUserId = table as AnyPgTable & { userId: typeof table.userId }

  // PUT on workspace-scoped writable tables must include a workspace_id in the payload, and the
  // authenticated user must be an active member of that workspace. settings is exempt — it's
  // account-level and protected by the user_id override alone.
  if (op.op === 'PUT' && workspaceScopedWritableTables.has(op.type)) {
    const workspaceId = op.data?.workspace_id
    if (typeof workspaceId !== 'string' || workspaceId.length === 0) {
      return false
    }
    const isMember = await checkMembershipCached(database, workspaceId, userId, membershipCache)
    if (!isMember) {
      return false
    }
  }

  switch (op.op) {
    case 'PUT': {
      const payload = { ...(op.data ?? {}) } as Record<string, unknown>
      delete payload.id
      delete payload.user_id
      const rawData: Record<string, unknown> = { ...payload, id: op.id, user_id: userId }
      const schemaValues = toSchemaRecord(rawData, validDbNames, dbNameToKey)
      if (Object.keys(schemaValues).length === 0) {
        return false
      }

      const updateSet = { ...schemaValues }
      delete updateSet.id
      delete updateSet.key
      delete updateSet.userId

      const insertQuery = database.insert(table).values(schemaValues as never)
      if (Object.keys(updateSet).length > 0) {
        await insertQuery.onConflictDoUpdate({
          target: conflictTarget,
          set: updateSet as never,
          setWhere: eq(tableWithUserId.userId, userId),
        })
      } else {
        await insertQuery.onConflictDoNothing({ target: conflictTarget })
      }
      return true
    }
    case 'PATCH': {
      if (!op.data || Object.keys(op.data).length === 0) {
        return true
      }
      const patchPayload = { ...op.data } as Record<string, unknown>
      delete patchPayload.id
      delete patchPayload.user_id
      const schemaPatch = toSchemaRecord(patchPayload, validDbNames, dbNameToKey)
      if (Object.keys(schemaPatch).length === 0) {
        return false
      }

      const patched = await database
        .update(table)
        .set(schemaPatch as never)
        .where(and(eq(pkColumn, op.id), eq(tableWithUserId.userId, userId)))
        .returning()

      return patched.length > 0
    }
    case 'DELETE': {
      const deleted = await database
        .delete(table)
        .where(and(eq(pkColumn, op.id), eq(tableWithUserId.userId, userId)))
        .returning()

      return deleted.length > 0
    }
  }
}

export type ApplyOperationsResult =
  | { ok: true }
  | {
      ok: false
      failure: { table: string; id: string; op: 'PUT' | 'PATCH' | 'DELETE' }
    }

/**
 * Apply a batch of PowerSync upload operations sequentially. Workspace-membership lookups are
 * memoized for the lifetime of the call so a batch with many ops in the same workspace only
 * hits `workspace_members` once.
 *
 * Ops targeting a non-writable table are skipped (logged, not surfaced) so a stale or buggy
 * client can't poison the batch — retry would never resolve a table-not-allowlisted condition.
 * Every other failure (missing workspace_id, removed member, no matching row on PATCH/DELETE,
 * etc.) bubbles up so the API returns 4xx and PowerSync retries.
 */
export const applyOperations = async (
  database: typeof DbType,
  operations: PowerSyncOperation[],
  userId: string,
): Promise<ApplyOperationsResult> => {
  const membershipCache: MembershipCache = new Map()
  for (const op of operations) {
    if (!writableTables.has(op.type)) {
      console.warn('powersync.upload.dropped_non_writable', {
        table: op.type,
        op: op.op,
        id: op.id,
        userId,
      })
      continue
    }
    const ok = await applyOperation(database, op, userId, membershipCache)
    if (!ok) {
      return { ok: false, failure: { table: op.type, id: op.id, op: op.op } }
    }
  }
  return { ok: true }
}

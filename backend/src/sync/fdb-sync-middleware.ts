/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { Request, Response, NextFunction } from 'express'
import type { FdbToPowerSyncBridge } from './fdb-powersync-bridge'
import type { PowerSyncTableName } from '@shared/powersync-tables'

/**
 * Metadata for sync tracking on a request.
 */
export type SyncMetadata = {
  tableName?: PowerSyncTableName
  recordId?: string
  operation?: 'INSERT' | 'UPDATE' | 'DELETE'
  syncedToFdb?: boolean
  syncedToPowerSync?: boolean
  conflictResolved?: boolean
}

/**
 * Express middleware that automatically syncs mutations to FDB and PowerSync.
 *
 * Usage:
 * ```typescript
 * app.post('/chat-messages', fdbSyncMiddleware({ table: 'chat_messages' }), async (req, res) => {
 *   // Normal handler code
 *   // Middleware automatically syncs INSERT to FDB and PowerSync
 * })
 * ```
 */
export const fdbSyncMiddleware =
  (bridge: FdbToPowerSyncBridge | null, config: { table?: PowerSyncTableName } = {}) =>
  async (req: Request, res: Response, next: NextFunction) => {
    // If bridge not configured, skip sync
    if (!bridge) {
      return next()
    }

    // Attach sync metadata to request for handler access
    req.syncMetadata = { tableName: config.table } as SyncMetadata

    // Capture the original json/send to intercept response
    const originalJson = res.json
    const originalSend = res.send

    res.json = function (data: any) {
      // Intercept successful responses and queue sync
      if (res.statusCode < 300 && data && config.table) {
        queueSync(bridge, req, config.table, data).catch((err) => {
          console.error('[fdbSyncMiddleware] Failed to queue sync:', err)
          // Don't fail the response; sync is fire-and-forget
        })
      }
      return originalJson.call(this, data)
    }

    res.send = function (data: any) {
      if (res.statusCode < 300 && data && config.table && typeof data === 'object') {
        queueSync(bridge, req, config.table, data).catch((err) => {
          console.error('[fdbSyncMiddleware] Failed to queue sync:', err)
        })
      }
      return originalSend.call(this, data)
    }

    next()
  }

/**
 * Queue a sync operation based on the HTTP method and response data.
 */
async function queueSync(
  bridge: FdbToPowerSyncBridge,
  req: Request,
  tableName: PowerSyncTableName,
  data: any,
): Promise<void> {
  const userId = (req as any).userId
  if (!userId) {
    return // User not authenticated
  }

  // Determine operation type from HTTP method
  let operation: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT'
  if (req.method === 'PATCH') {
    operation = 'UPDATE'
  } else if (req.method === 'DELETE') {
    operation = 'DELETE'
  }

  // Extract record ID from response data or request
  const recordId = data?.id || data?.[Object.keys(data)[0]]?.id || req.params?.id

  if (!recordId) {
    return // Can't sync without record ID
  }

  // Queue the sync
  await bridge.syncTable(tableName, recordId, userId, data, operation)

  // Update metadata
  if ((req as any).syncMetadata) {
    ;(req as any).syncMetadata.operation = operation
    ;(req as any).syncMetadata.recordId = recordId
    ;(req as any).syncMetadata.syncedToPowerSync = true
  }
}

/**
 * Express middleware factory that creates a POST/PATCH/DELETE handler wrapper.
 * Automatically determines table and operation type.
 *
 * Usage:
 * ```typescript
 * const syncChatMessages = withFdbSync(bridge, 'chat_messages')
 * app.post('/chat-messages', async (req, res) => {
 *   const message = await createChatMessage(...)
 *   res.json(message) // Automatically synced
 * })
 * ```
 */
export const withFdbSync =
  (bridge: FdbToPowerSyncBridge | null, tableName: PowerSyncTableName) =>
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) =>
  async (req: Request, res: Response, next: NextFunction) => {
    // Call the original handler
    const result = handler(req, res, next)

    // If handler returns a promise, wait for it
    if (result instanceof Promise) {
      await result
    }

    // After handler completes, sync if successful
    if (!bridge || res.statusCode >= 300) {
      return
    }

    const userId = (req as any).userId
    if (!userId) {
      return
    }

    // Determine operation
    let operation: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT'
    if (req.method === 'PATCH') {
      operation = 'UPDATE'
    } else if (req.method === 'DELETE') {
      operation = 'DELETE'
    }

    // Extract record ID
    const data = (res as any).locals?.data || req.body
    const recordId = data?.id || req.params?.id

    if (recordId) {
      await bridge.syncTable(tableName, recordId, userId, data, operation)
    }
  }

/**
 * Extend Express Request type to include sync metadata.
 */
declare global {
  namespace Express {
    interface Request {
      syncMetadata?: SyncMetadata
    }
  }
}

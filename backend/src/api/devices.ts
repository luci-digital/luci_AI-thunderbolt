/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { Auth } from '@/auth/elysia-plugin'
import { createAuthMacro } from '@/auth/elysia-plugin'
import { getDeviceById, revokeDevice } from '@/dal'
import type { db as DbType } from '@/db/client'
import { devicesTable } from '@/db/schema'
import { safeErrorHandler } from '@/middleware/error-handling'
import { Elysia, t } from 'elysia'
import { and, eq } from 'drizzle-orm'

type DeviceStatus = 'pending_approval' | 'approved' | 'rejected'

type DeviceListItem = {
  id: string
  name: string
  status: DeviceStatus
  createdAt: string
  lastSeen: string
  appVersion?: string | null
}

type RegisterDeviceResponse = {
  deviceId: string
  status: DeviceStatus
}

type ApproveDeviceResponse = {
  approved: boolean
  powerSyncToken?: string
}

/**
 * Get the current status of a device.
 */
const getDeviceStatus = (
  device:
    | { trusted: boolean | null; approvalPending: boolean | null; revokedAt: Date | null }
    | null,
): DeviceStatus => {
  if (!device) return 'rejected'
  if (device.revokedAt) return 'rejected'
  if (device.trusted) return 'approved'
  if (device.approvalPending) return 'pending_approval'
  return 'rejected'
}

/**
 * Device management API routes. All routes require authentication.
 *
 * POST /devices/register - Register a new device (requires x-device-id header)
 * POST /devices/approve - Admin approves a device
 * GET /devices - List all devices for the authenticated user
 * DELETE /devices/:deviceId - Revoke a device
 */
export const createDeviceRoutes = (auth: Auth, database: typeof DbType) => {
  return new Elysia({ prefix: '/devices' })
    .onError(safeErrorHandler)
    .use(createAuthMacro(auth))
    .post(
      '/register',
      async ({ body, request, set, user }) => {
        const userId = user!.id
        const callerDeviceId = body.deviceId

        if (!callerDeviceId || callerDeviceId.trim().length === 0) {
          set.status = 400
          return { error: 'Device ID is required' }
        }

        if (!body.platform || body.platform.trim().length === 0) {
          set.status = 400
          return { error: 'Platform is required' }
        }

        const deviceName = body.deviceName?.trim() || 'Unknown device'

        // Check if device already exists
        const existing = await getDeviceById(database, callerDeviceId)

        if (existing) {
          if (existing.userId !== userId) {
            set.status = 409
            return { error: 'Device ID is already in use' }
          }

          // Device already registered to this user
          const status = getDeviceStatus(existing)
          return { deviceId: callerDeviceId, status } satisfies RegisterDeviceResponse
        }

        // Insert new device as pending approval
        const now = new Date()
        await database
          .insert(devicesTable)
          .values({
            id: callerDeviceId,
            userId,
            name: deviceName,
            approvalPending: true,
            trusted: false,
            createdAt: now,
            lastSeen: now,
          })
          .onConflictDoNothing()

        return { deviceId: callerDeviceId, status: 'pending_approval' } satisfies RegisterDeviceResponse
      },
      {
        auth: true,
        body: t.Object({
          deviceId: t.String({ maxLength: 256 }),
          platform: t.String({ maxLength: 50 }),
          deviceName: t.Optional(t.String({ maxLength: 100 })),
        }),
      },
    )
    .post(
      '/approve',
      async ({ body, set, user }) => {
        const userId = user!.id
        const { deviceId, approve } = body

        if (!deviceId || deviceId.trim().length === 0) {
          set.status = 400
          return { error: 'Device ID is required' }
        }

        const device = await getDeviceById(database, deviceId)

        if (!device) {
          set.status = 404
          return { error: 'Device not found' }
        }

        if (device.userId !== userId) {
          set.status = 403
          return { error: 'Cannot approve device belonging to another user' }
        }

        if (approve) {
          // Mark device as trusted
          await database
            .update(devicesTable)
            .set({ trusted: true, approvalPending: false })
            .where(and(eq(devicesTable.id, deviceId), eq(devicesTable.userId, userId)))

          return { approved: true, powerSyncToken: 'token-issued-via-powersync-route' } satisfies ApproveDeviceResponse
        } else {
          // Deny device
          await database
            .update(devicesTable)
            .set({ approvalPending: false, trusted: false })
            .where(and(eq(devicesTable.id, deviceId), eq(devicesTable.userId, userId)))

          return { approved: false } satisfies ApproveDeviceResponse
        }
      },
      {
        auth: true,
        body: t.Object({
          deviceId: t.String({ maxLength: 256 }),
          approve: t.Boolean(),
        }),
      },
    )
    .get(
      '/',
      async ({ user }) => {
        const userId = user!.id

        const devices = await database
          .select({
            id: devicesTable.id,
            name: devicesTable.name,
            trusted: devicesTable.trusted,
            approvalPending: devicesTable.approvalPending,
            revokedAt: devicesTable.revokedAt,
            createdAt: devicesTable.createdAt,
            lastSeen: devicesTable.lastSeen,
            appVersion: devicesTable.appVersion,
          })
          .from(devicesTable)
          .where(eq(devicesTable.userId, userId))

        const formattedDevices: DeviceListItem[] = devices.map((d) => ({
          id: d.id,
          name: d.name || 'Unknown device',
          status: getDeviceStatus({
            trusted: d.trusted,
            approvalPending: d.approvalPending,
            revokedAt: d.revokedAt,
          }),
          createdAt: d.createdAt?.toISOString() || new Date().toISOString(),
          lastSeen: d.lastSeen?.toISOString() || new Date().toISOString(),
          appVersion: d.appVersion,
        }))

        return { devices: formattedDevices }
      },
      { auth: true },
    )
    .delete(
      '/:deviceId',
      async ({ params, set, user }) => {
        const userId = user!.id
        const { deviceId } = params

        if (!deviceId || deviceId.trim().length === 0) {
          set.status = 400
          return { error: 'Device ID is required' }
        }

        const device = await getDeviceById(database, deviceId)

        if (!device) {
          set.status = 404
          return { error: 'Device not found' }
        }

        if (device.userId !== userId) {
          set.status = 403
          return { error: 'Cannot revoke device belonging to another user' }
        }

        if (device.revokedAt) {
          set.status = 410
          return { error: 'Device is already revoked' }
        }

        const rows = await revokeDevice(database, deviceId, userId)

        if (rows.length === 0) {
          set.status = 404
          return { error: 'Device not found or already revoked' }
        }

        set.status = 204
      },
      { auth: true },
    )
}

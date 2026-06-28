/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createAuth } from '@/auth/auth'
import { session as sessionTable, user } from '@/db/auth-schema'
import { devicesTable } from '@/db/schema'
import { createTestDb } from '@/test-utils/db'
import { createHmac } from 'crypto'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { createDeviceRoutes } from './devices'

const betterAuthSecret = 'better-auth-secret-12345678901234567890'
const signToken = (token: string): string => {
  const sig = createHmac('sha256', betterAuthSecret).update(token).digest('base64')
  return `${token}.${sig}`
}

const counterKey = Symbol.for('devices-test-runId')
;(globalThis as Record<symbol, number>)[counterKey] ??= 0

describe('Device API', () => {
  let app: ReturnType<typeof createDeviceRoutes>
  let db: Awaited<ReturnType<typeof createTestDb>>['db']
  let cleanup: () => Promise<void>
  let p: (id: string) => string

  beforeEach(async () => {
    const rid = ++(globalThis as Record<symbol, number>)[counterKey]
    p = (id: string) => `${rid}-${id}`
    const testEnv = await createTestDb()
    db = testEnv.db
    cleanup = testEnv.cleanup
    const auth = createAuth(db)
    app = new Elysia({ prefix: '/v1' }).use(createDeviceRoutes(auth, db)) as unknown as ReturnType<
      typeof createDeviceRoutes
    >
  })

  afterEach(async () => {
    if (cleanup) {
      await cleanup()
    }
  })

  const createUserSession = async (userId: string, token: string) => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 3600 * 1000)

    await db.insert(user).values({
      id: userId,
      name: 'Test User',
      email: `${userId}@example.com`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(sessionTable).values({
      id: `session-${userId}`,
      expiresAt,
      token,
      createdAt: now,
      updatedAt: now,
      userId,
    })

    return now
  }

  const registerRequest = (
    token: string,
    deviceId: string,
    platform: string,
    deviceName?: string,
  ) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${signToken(token)}`,
      'Content-Type': 'application/json',
    }
    const body = JSON.stringify({ deviceId, platform, ...(deviceName ? { deviceName } : {}) })
    return new Request('http://localhost/v1/devices/register', {
      method: 'POST',
      headers,
      body,
    })
  }

  const approveRequest = (token: string, deviceId: string, approve: boolean) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${signToken(token)}`,
      'Content-Type': 'application/json',
    }
    const body = JSON.stringify({ deviceId, approve })
    return new Request('http://localhost/v1/devices/approve', {
      method: 'POST',
      headers,
      body,
    })
  }

  const listRequest = (token: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${signToken(token)}`,
      'Content-Type': 'application/json',
    }
    return new Request('http://localhost/v1/devices/', {
      method: 'GET',
      headers,
    })
  }

  const revokeRequest = (token: string, deviceId: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${signToken(token)}`,
      'Content-Type': 'application/json',
    }
    return new Request(`http://localhost/v1/devices/${deviceId}`, {
      method: 'DELETE',
      headers,
    })
  }

  describe('POST /v1/devices/register', () => {
    it('registers a new device as pending approval', async () => {
      const userId = p('register-user')
      const token = p('register-token')
      const deviceId = p('device-1')

      await createUserSession(userId, token)

      const req = registerRequest(token, deviceId, 'ios', 'My iPhone')
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.deviceId).toBe(deviceId)
      expect(body.status).toBe('pending_approval')
    })

    it('returns existing device status for re-registration', async () => {
      const userId = p('reregister-user')
      const token = p('reregister-token')
      const deviceId = p('device-1')
      const now = new Date()

      await createUserSession(userId, token)

      // Insert device as approved
      await db.insert(devicesTable).values({
        id: deviceId,
        userId,
        name: 'My iPhone',
        trusted: true,
        approvalPending: false,
        createdAt: now,
        lastSeen: now,
      })

      const req = registerRequest(token, deviceId, 'ios', 'My iPhone')
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.deviceId).toBe(deviceId)
      expect(body.status).toBe('approved')
    })

    it('rejects device ID from another user', async () => {
      const userId1 = p('user-1')
      const userId2 = p('user-2')
      const token2 = p('token-2')
      const deviceId = p('device-1')
      const now = new Date()

      // Create two users and register device to user 1
      await createUserSession(userId1, p('token-1'))
      await createUserSession(userId2, token2)

      await db.insert(devicesTable).values({
        id: deviceId,
        userId: userId1,
        name: 'Device 1',
        trusted: true,
        createdAt: now,
        lastSeen: now,
      })

      // Try to register same device ID for user 2
      const req = registerRequest(token2, deviceId, 'ios', 'User 2 Device')
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(409)
      expect(body.error).toBe('Device ID is already in use')
    })

    it('rejects missing device ID', async () => {
      const userId = p('missing-id-user')
      const token = p('missing-id-token')

      await createUserSession(userId, token)

      const headers: Record<string, string> = {
        Authorization: `Bearer ${signToken(token)}`,
        'Content-Type': 'application/json',
      }
      const body = JSON.stringify({ deviceId: '', platform: 'ios' })
      const req = new Request('http://localhost/v1/devices/register', {
        method: 'POST',
        headers,
        body,
      })

      const res = await app.handle(req)
      const responseBody = await res.json()

      expect(res.status).toBe(400)
      expect(responseBody.error).toContain('Device ID')
    })

    it('rejects missing platform', async () => {
      const userId = p('missing-platform-user')
      const token = p('missing-platform-token')
      const deviceId = p('device-1')

      await createUserSession(userId, token)

      const headers: Record<string, string> = {
        Authorization: `Bearer ${signToken(token)}`,
        'Content-Type': 'application/json',
      }
      const body = JSON.stringify({ deviceId, platform: '' })
      const req = new Request('http://localhost/v1/devices/register', {
        method: 'POST',
        headers,
        body,
      })

      const res = await app.handle(req)
      const responseBody = await res.json()

      expect(res.status).toBe(400)
      expect(responseBody.error).toContain('Platform')
    })
  })

  describe('POST /v1/devices/approve', () => {
    it('approves a pending device', async () => {
      const userId = p('approve-user')
      const token = p('approve-token')
      const deviceId = p('device-1')
      const now = new Date()

      await createUserSession(userId, token)

      // Register device as pending
      await db.insert(devicesTable).values({
        id: deviceId,
        userId,
        name: 'Device 1',
        approvalPending: true,
        trusted: false,
        createdAt: now,
        lastSeen: now,
      })

      const req = approveRequest(token, deviceId, true)
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.approved).toBe(true)

      // Verify device is now trusted
      const updated = await db.query.devicesTable.findFirst({
        where: (t) => t.id === deviceId,
      })
      expect(updated?.trusted).toBe(true)
      expect(updated?.approvalPending).toBe(false)
    })

    it('denies a pending device', async () => {
      const userId = p('deny-user')
      const token = p('deny-token')
      const deviceId = p('device-1')
      const now = new Date()

      await createUserSession(userId, token)

      await db.insert(devicesTable).values({
        id: deviceId,
        userId,
        name: 'Device 1',
        approvalPending: true,
        trusted: false,
        createdAt: now,
        lastSeen: now,
      })

      const req = approveRequest(token, deviceId, false)
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.approved).toBe(false)

      // Verify device is still untrusted and not pending
      const updated = await db.query.devicesTable.findFirst({
        where: (t) => t.id === deviceId,
      })
      expect(updated?.trusted).toBe(false)
      expect(updated?.approvalPending).toBe(false)
    })

    it('rejects non-existent device', async () => {
      const userId = p('not-found-user')
      const token = p('not-found-token')
      const deviceId = p('nonexistent')

      await createUserSession(userId, token)

      const req = approveRequest(token, deviceId, true)
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(404)
      expect(body.error).toContain('not found')
    })

    it('rejects approval for device belonging to another user', async () => {
      const userId1 = p('user-1')
      const userId2 = p('user-2')
      const token2 = p('token-2')
      const deviceId = p('device-1')
      const now = new Date()

      await createUserSession(userId1, p('token-1'))
      await createUserSession(userId2, token2)

      // Create device for user 1
      await db.insert(devicesTable).values({
        id: deviceId,
        userId: userId1,
        name: 'Device 1',
        approvalPending: true,
        trusted: false,
        createdAt: now,
        lastSeen: now,
      })

      // Try to approve as user 2
      const req = approveRequest(token2, deviceId, true)
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(403)
      expect(body.error).toContain('another user')
    })
  })

  describe('GET /v1/devices/', () => {
    it('lists all devices for a user', async () => {
      const userId = p('list-user')
      const token = p('list-token')
      const now = new Date()

      await createUserSession(userId, token)

      // Insert multiple devices with different statuses
      await db.insert(devicesTable).values([
        {
          id: p('device-1'),
          userId,
          name: 'iPhone',
          trusted: true,
          approvalPending: false,
          createdAt: now,
          lastSeen: now,
        },
        {
          id: p('device-2'),
          userId,
          name: 'Android',
          trusted: false,
          approvalPending: true,
          createdAt: now,
          lastSeen: now,
        },
      ])

      const req = listRequest(token)
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.devices).toHaveLength(2)
      expect(body.devices[0].status).toBe('approved')
      expect(body.devices[1].status).toBe('pending_approval')
    })

    it('excludes revoked devices from listing', async () => {
      const userId = p('revoked-list-user')
      const token = p('revoked-list-token')
      const now = new Date()

      await createUserSession(userId, token)

      await db.insert(devicesTable).values([
        {
          id: p('device-1'),
          userId,
          name: 'Active Device',
          trusted: true,
          approvalPending: false,
          createdAt: now,
          lastSeen: now,
          revokedAt: null,
        },
        {
          id: p('device-2'),
          userId,
          name: 'Revoked Device',
          trusted: true,
          approvalPending: false,
          createdAt: now,
          lastSeen: now,
          revokedAt: now,
        },
      ])

      const req = listRequest(token)
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.devices).toHaveLength(2)
      expect(body.devices.find((d: any) => d.id === p('device-2'))?.status).toBe('rejected')
    })

    it('returns empty list for user with no devices', async () => {
      const userId = p('empty-user')
      const token = p('empty-token')

      await createUserSession(userId, token)

      const req = listRequest(token)
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.devices).toHaveLength(0)
    })
  })

  describe('DELETE /v1/devices/:deviceId', () => {
    it('revokes a device', async () => {
      const userId = p('revoke-user')
      const token = p('revoke-token')
      const deviceId = p('device-1')
      const now = new Date()

      await createUserSession(userId, token)

      await db.insert(devicesTable).values({
        id: deviceId,
        userId,
        name: 'Device 1',
        trusted: true,
        approvalPending: false,
        createdAt: now,
        lastSeen: now,
        revokedAt: null,
      })

      const req = revokeRequest(token, deviceId)
      const res = await app.handle(req)

      expect(res.status).toBe(204)

      // Verify device is revoked
      const updated = await db.query.devicesTable.findFirst({
        where: (t) => t.id === deviceId,
      })
      expect(updated?.revokedAt).not.toBeNull()
    })

    it('rejects revoke of non-existent device', async () => {
      const userId = p('revoke-not-found-user')
      const token = p('revoke-not-found-token')
      const deviceId = p('nonexistent')

      await createUserSession(userId, token)

      const req = revokeRequest(token, deviceId)
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(404)
      expect(body.error).toContain('not found')
    })

    it('rejects revoke of already revoked device', async () => {
      const userId = p('revoke-twice-user')
      const token = p('revoke-twice-token')
      const deviceId = p('device-1')
      const now = new Date()

      await createUserSession(userId, token)

      await db.insert(devicesTable).values({
        id: deviceId,
        userId,
        name: 'Device 1',
        trusted: true,
        approvalPending: false,
        createdAt: now,
        lastSeen: now,
        revokedAt: now,
      })

      const req = revokeRequest(token, deviceId)
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(410)
      expect(body.error).toContain('already revoked')
    })

    it('rejects revoke of device belonging to another user', async () => {
      const userId1 = p('revoke-user-1')
      const userId2 = p('revoke-user-2')
      const token2 = p('revoke-token-2')
      const deviceId = p('device-1')
      const now = new Date()

      await createUserSession(userId1, p('revoke-token-1'))
      await createUserSession(userId2, token2)

      // Create device for user 1
      await db.insert(devicesTable).values({
        id: deviceId,
        userId: userId1,
        name: 'Device 1',
        trusted: true,
        approvalPending: false,
        createdAt: now,
        lastSeen: now,
      })

      // Try to revoke as user 2
      const req = revokeRequest(token2, deviceId)
      const res = await app.handle(req)
      const body = await res.json()

      expect(res.status).toBe(403)
      expect(body.error).toContain('another user')
    })
  })

  describe('Authentication', () => {
    it('rejects requests without authentication', async () => {
      const req = new Request('http://localhost/v1/devices/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const res = await app.handle(req)
      expect(res.status).toBe(401)
    })
  })
})

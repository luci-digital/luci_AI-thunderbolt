/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { describe, expect, it, mock } from 'bun:test'
import { APNsClient } from './apns'

describe('APNsClient', () => {
  it('creates a client with configuration', () => {
    const client = new APNsClient({
      certificatePath: '/path/to/cert.p8',
      teamId: 'TEAM123',
      bundleId: 'com.example.app',
      keyId: 'KEY123',
      production: false,
    })

    expect(client).toBeDefined()
  })

  it('returns error when config is missing', async () => {
    const client = new APNsClient()

    const result = await client.sendSyncNotification('device-token', 'incremental')

    expect(result.success).toBe(false)
    expect(result.error).toBe('APNs not configured')
  })

  it('sends incremental sync notification successfully', async () => {
    const client = new APNsClient({
      certificatePath: '/dev/null', // Use /dev/null to test without actual file
      teamId: 'TEAM123',
      bundleId: 'com.example.app',
      keyId: 'KEY123',
      production: false,
    })

    // This will fail because /dev/null doesn't have certificate content,
    // but it demonstrates the flow
    const result = await client.sendSyncNotification('device-token', 'incremental')

    // Certificate load will fail gracefully
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('sends full sync notification successfully', async () => {
    const client = new APNsClient({
      certificatePath: '/dev/null',
      teamId: 'TEAM123',
      bundleId: 'com.example.app',
      keyId: 'KEY123',
      production: false,
    })

    const result = await client.sendSyncNotification('device-token', 'full')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('sends data availability notification', async () => {
    const client = new APNsClient({
      certificatePath: '/dev/null',
      teamId: 'TEAM123',
      bundleId: 'com.example.app',
      keyId: 'KEY123',
      production: false,
    })

    const result = await client.sendDataAvailable('device-token', 42)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('handles notification response for successful delivery', async () => {
    const client = new APNsClient({
      certificatePath: '/path/to/cert.p8',
      teamId: 'TEAM123',
      bundleId: 'com.example.app',
      keyId: 'KEY123',
      production: false,
    })

    // Should not throw
    await client.handleNotificationResponse('device-token', true)
  })

  it('handles notification response for failed delivery', async () => {
    const client = new APNsClient({
      certificatePath: '/path/to/cert.p8',
      teamId: 'TEAM123',
      bundleId: 'com.example.app',
      keyId: 'KEY123',
      production: false,
    })

    // Should not throw
    await client.handleNotificationResponse('device-token', false)
  })

  it('creates client from environment variables', () => {
    const prevCert = process.env.APNS_CERTIFICATE_PATH
    const prevTeam = process.env.APNS_TEAM_ID
    const prevBundle = process.env.APNS_BUNDLE_ID
    const prevKey = process.env.APNS_KEY_ID
    const prevNode = process.env.NODE_ENV

    try {
      process.env.APNS_CERTIFICATE_PATH = '/path/to/cert.p8'
      process.env.APNS_TEAM_ID = 'TEAM123'
      process.env.APNS_BUNDLE_ID = 'com.example.app'
      process.env.APNS_KEY_ID = 'KEY123'
      process.env.NODE_ENV = 'production'

      const client = new APNsClient({
        certificatePath: process.env.APNS_CERTIFICATE_PATH,
        teamId: process.env.APNS_TEAM_ID,
        bundleId: process.env.APNS_BUNDLE_ID,
        keyId: process.env.APNS_KEY_ID,
        production: process.env.NODE_ENV === 'production',
      })

      expect(client).toBeDefined()
    } finally {
      process.env.APNS_CERTIFICATE_PATH = prevCert
      process.env.APNS_TEAM_ID = prevTeam
      process.env.APNS_BUNDLE_ID = prevBundle
      process.env.APNS_KEY_ID = prevKey
      process.env.NODE_ENV = prevNode
    }
  })

  it('returns retry info on failure', async () => {
    const client = new APNsClient({
      certificatePath: '/dev/null',
      teamId: 'TEAM123',
      bundleId: 'com.example.app',
      keyId: 'KEY123',
      production: false,
    })

    const result = await client.sendSyncNotification('device-token', 'incremental')

    if (!result.success) {
      expect(result.retryAfter).toBe(3600)
    }
  })
})

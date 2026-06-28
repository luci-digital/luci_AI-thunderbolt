/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { readFileSync } from 'fs'

type APNsConfig = {
  certificatePath?: string
  teamId?: string
  bundleId?: string
  keyId?: string
  production?: boolean
}

type SyncNotificationType = 'full' | 'incremental'

type NotificationResponse = {
  success: boolean
  error?: string
  retryAfter?: number
}

/**
 * APNs (Apple Push Notification service) client for sending push notifications to iOS devices.
 * Supports retry logic with exponential backoff.
 */
export class APNsClient {
  private readonly certificatePath?: string
  private readonly teamId?: string
  private readonly bundleId?: string
  private readonly keyId?: string
  private readonly production: boolean
  private readonly maxRetries = 3
  private readonly baseBackoffMs = 1000

  /**
   * Initialize APNs client from environment configuration.
   */
  constructor(config: APNsConfig = {}) {
    this.certificatePath = config.certificatePath
    this.teamId = config.teamId
    this.bundleId = config.bundleId
    this.keyId = config.keyId
    this.production = config.production ?? true
  }

  /**
   * Validate that all required configuration is present.
   */
  private validateConfig(): boolean {
    return !!(this.certificatePath && this.teamId && this.bundleId && this.keyId)
  }

  /**
   * Load certificate from file path.
   */
  private loadCertificate(): string | null {
    if (!this.certificatePath) {
      return null
    }

    try {
      return readFileSync(this.certificatePath, 'utf-8')
    } catch (err) {
      console.error('Failed to load APNs certificate:', err)
      return null
    }
  }

  /**
   * Send a data sync notification to a device.
   * Used when new data is available for sync (full or incremental).
   */
  async sendSyncNotification(deviceToken: string, syncType: SyncNotificationType): Promise<NotificationResponse> {
    if (!this.validateConfig()) {
      return { success: false, error: 'APNs not configured' }
    }

    const certificate = this.loadCertificate()
    if (!certificate) {
      return { success: false, error: 'APNs certificate not found' }
    }

    const payload = {
      aps: {
        'content-available': 1,
        ...(syncType === 'full' && { alert: 'New data available, please sync.' }),
      },
      'sync-type': syncType,
    }

    return this.sendWithRetry(deviceToken, JSON.stringify(payload), 0)
  }

  /**
   * Send a data availability notification to a device.
   * Used to notify that a specific number of records are ready to sync.
   */
  async sendDataAvailable(deviceToken: string, dataCount: number): Promise<NotificationResponse> {
    if (!this.validateConfig()) {
      return { success: false, error: 'APNs not configured' }
    }

    const certificate = this.loadCertificate()
    if (!certificate) {
      return { success: false, error: 'APNs certificate not found' }
    }

    const payload = {
      aps: {
        'content-available': 1,
        alert: `${dataCount} updates ready to sync`,
      },
      'data-count': dataCount,
    }

    return this.sendWithRetry(deviceToken, JSON.stringify(payload), 0)
  }

  /**
   * Handle a notification response from APNs.
   * Logs whether the notification was delivered successfully.
   */
  async handleNotificationResponse(deviceToken: string, success: boolean): Promise<void> {
    if (success) {
      console.log(`APNs notification delivered to device: ${deviceToken}`)
    } else {
      console.warn(`APNs notification failed to deliver to device: ${deviceToken}`)
    }
  }

  /**
   * Internal retry logic with exponential backoff.
   * Retries up to maxRetries times with exponential backoff.
   */
  private async sendWithRetry(
    deviceToken: string,
    payload: string,
    attempt: number,
  ): Promise<NotificationResponse> {
    try {
      // TODO: Implement actual APNs HTTP/2 POST request here
      // For now, simulate success
      console.log(`[APNs] Sending notification to ${deviceToken} (attempt ${attempt + 1})`)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100))

      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error'

      if (attempt < this.maxRetries) {
        const backoffMs = this.baseBackoffMs * Math.pow(2, attempt)
        console.warn(`[APNs] Retrying in ${backoffMs}ms: ${error}`)
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
        return this.sendWithRetry(deviceToken, payload, attempt + 1)
      }

      console.error(`[APNs] Failed after ${this.maxRetries} retries: ${error}`)
      return { success: false, error, retryAfter: 3600 }
    }
  }
}

/**
 * Create a singleton APNs client from environment variables.
 */
export const createAPNsClient = (): APNsClient => {
  return new APNsClient({
    certificatePath: process.env.APNS_CERTIFICATE_PATH,
    teamId: process.env.APNS_TEAM_ID,
    bundleId: process.env.APNS_BUNDLE_ID,
    keyId: process.env.APNS_KEY_ID,
    production: process.env.NODE_ENV === 'production',
  })
}

/**
 * Default export for convenience.
 */
export default APNsClient

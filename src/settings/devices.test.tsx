/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import '@/lib/dayjs'
import { getDb } from '@/db/database'
import { devicesTable } from '@/db/tables'
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '@/dal/test-utils'
import { renderWithReactivity, waitForElement } from '@/test-utils/powersync-reactivity-test'
import { createMockHttpClient } from '@/test-utils/http-client'
import { HttpClientProvider } from '@/contexts/http-client-context'
import { getClock } from '@/testing-library'
import '@testing-library/jest-dom'
import { act, cleanup, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import type { ReactNode } from 'react'

const deviceId1 = uuidv7()
const deviceId2 = uuidv7()

const deviceIdKey = 'thunderbolt_device_id'
const authTokenKey = 'thunderbolt_auth_token'

import DevicesSettingsPage from './devices'

const HttpClientWrapper = ({ children }: { children: ReactNode }) => (
  <HttpClientProvider httpClient={createMockHttpClient()}>{children}</HttpClientProvider>
)

describe('DevicesSettingsPage reactivity', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await resetTestDatabase()
    localStorage.setItem(deviceIdKey, deviceId1)
    localStorage.setItem(authTokenKey, 'test-token')
  })

  afterEach(() => {
    localStorage.removeItem(deviceIdKey)
    localStorage.removeItem(authTokenKey)
    cleanup()
  })

  it('updates when devices table changes (revocation)', async () => {
    const db = getDb()

    await db.insert(devicesTable).values([
      { id: deviceId1, userId: 'user-1', name: 'This Device', lastSeen: new Date().toISOString(), trusted: 1 },
      { id: deviceId2, userId: 'user-1', name: 'Other Device', lastSeen: new Date().toISOString(), trusted: 1 },
    ])

    const { triggerChange } = renderWithReactivity(<DevicesSettingsPage />, {
      tables: ['devices'],
      wrapper: HttpClientWrapper,
    })

    await waitForElement(() => screen.queryByText('Other Device'))
    expect(screen.getByText('Other Device')).toBeInTheDocument()
    expect(screen.queryByText('Revoked')).not.toBeInTheDocument()

    await db.update(devicesTable).set({ revokedAt: new Date().toISOString() }).where(eq(devicesTable.id, deviceId2))
    triggerChange(['devices'])

    await act(async () => {
      await getClock().runAllAsync()
    })

    expect(screen.getByText('Revoked')).toBeInTheDocument()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

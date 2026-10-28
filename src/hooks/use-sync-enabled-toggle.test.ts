/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

const mockSetSyncEnabled = mock(() => Promise.resolve())
const mockTrackEvent = mock(() => {})

// Partial mock: spread the REAL module so every other export (incl. reconnectSync,
// which powersync-status.test.tsx consumes for real) survives if this registration
// leaks across files under `--randomize`. Only `setSyncEnabled` is overridden with
// the local spy this suite asserts on. See docs/development/testing.md §65.
const realPowersync = await import('@/db/powersync/sync-state')
mock.module('@/db/powersync/sync-state', () => ({
  ...realPowersync,
  setSyncEnabled: mockSetSyncEnabled,
}))

// Spread the REAL modules so every untouched export survives if these
// registrations leak across files under `--randomize`; only the symbols this
// suite drives are overridden. See docs/development/testing.md §65.
const realPosthog = await import('@/lib/posthog')
mock.module('@/lib/posthog', () => ({
  ...realPosthog,
  trackEvent: mockTrackEvent,
}))

const mockGetCK = mock(() => Promise.resolve(null))

const realEncryption = await import('@/db/encryption')
mock.module('@/db/encryption', () => ({
  ...realEncryption,
  isEncryptionEnabled: () => true,
  needsSyncSetupWizard: async () => !(await mockGetCK()),
}))

const realKeyStorage = await import('@/crypto/key-storage')
mock.module('@/crypto/key-storage', () => ({
  ...realKeyStorage,
  getCK: mockGetCK,
}))

import { useSyncEnabledToggle } from './use-sync-enabled-toggle'

describe('useSyncEnabledToggle', () => {
  beforeEach(() => {
    mockSetSyncEnabled.mockClear()
    mockTrackEvent.mockClear()
    mockGetCK.mockClear()
    mockGetCK.mockImplementation(() => Promise.resolve(null))
  })

  afterEach(() => {
    mockSetSyncEnabled.mockRestore?.()
    mockTrackEvent.mockRestore?.()
    mockGetCK.mockRestore?.()
  })

  it('returns sync toggle state and handlers', () => {
    const { result } = renderHook(() => useSyncEnabledToggle())

    expect(result.current).toMatchObject({
      syncEnabled: expect.any(Boolean),
      syncSetupOpen: false,
      setSyncSetupOpen: expect.any(Function),
      handleSyncToggle: expect.any(Function),
      handleSyncSetupComplete: expect.any(Function),
    })
  })

  it('handleSyncToggle(true) opens sync setup modal', async () => {
    const { result } = renderHook(() => useSyncEnabledToggle())

    await act(async () => {
      await result.current.handleSyncToggle(true)
    })

    expect(result.current.syncSetupOpen).toBe(true)
  })

  it('handleSyncToggle(false) disables sync and tracks event', async () => {
    const { result } = renderHook(() => useSyncEnabledToggle())

    await act(async () => {
      await result.current.handleSyncToggle(false)
    })

    expect(result.current.syncEnabled).toBe(false)
    expect(mockSetSyncEnabled).toHaveBeenCalledWith(false)
    expect(mockTrackEvent).toHaveBeenCalledWith('settings_sync_disabled')
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

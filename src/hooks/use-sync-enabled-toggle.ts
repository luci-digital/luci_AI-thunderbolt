/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { needsSyncSetupWizard } from '@/db/encryption'
import { isSyncEnabled, setSyncEnabled, syncEnabledChangeEvent } from '@/db/powersync/sync-state'
import { trackEvent } from '@/lib/posthog'
import { useEffect, useState } from 'react'

/**
 * Shared hook for sync toggle state and handlers used by PowerSyncStatus and
 * PreferencesSettingsPage. Manages syncEnabled state, the sync setup modal,
 * and event listener for external changes (e.g. sign-in flow).
 *
 * On mount, detects pre-encryption users (sync ON + encryption enabled + no CK)
 * and auto-disables sync. The user re-enables sync via the toggle, which opens
 * the wizard through the normal flow.
 */
export const useSyncEnabledToggle = () => {
  const [syncEnabled, setSyncEnabledState] = useState(isSyncEnabled())
  const [syncSetupOpen, setSyncSetupOpen] = useState(false)

  useEffect(() => {
    const handleSyncEnabledChange = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>
      setSyncEnabledState(customEvent.detail)
    }

    window.addEventListener(syncEnabledChangeEvent, handleSyncEnabledChange)
    return () => window.removeEventListener(syncEnabledChangeEvent, handleSyncEnabledChange)
  }, [])

  // Detect pre-encryption users: sync ON + encryption enabled + no CK in IndexedDB
  useEffect(() => {
    const checkEncryptionMigration = async () => {
      if (!isSyncEnabled()) {
        return
      }
      if (!(await needsSyncSetupWizard())) {
        return
      }
      // Pre-encryption user: disable sync silently.
      // User will notice sync is off, toggle it on, and the normal wizard flow handles the rest.
      await setSyncEnabled(false)
      setSyncEnabledState(false)
    }
    checkEncryptionMigration()
  }, [])

  const handleSyncToggle = async (enabled: boolean) => {
    if (!enabled) {
      await setSyncEnabled(false)
      setSyncEnabledState(false)
      trackEvent('settings_sync_disabled')
      return
    }
    if (await needsSyncSetupWizard()) {
      setSyncSetupOpen(true)
      return
    }
    await setSyncEnabled(true)
    setSyncEnabledState(true)
    trackEvent('settings_sync_enabled')
  }

  const handleSyncSetupComplete = async () => {
    await setSyncEnabled(true)
    setSyncEnabledState(true)
    trackEvent('settings_sync_enabled')
    setSyncSetupOpen(false)
  }

  return {
    syncEnabled,
    syncSetupOpen,
    setSyncSetupOpen,
    handleSyncToggle,
    handleSyncSetupComplete,
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

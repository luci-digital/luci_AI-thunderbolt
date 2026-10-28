/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { invoke } from '@tauri-apps/api/core'
import { isTauri } from './platform'

type SetAndroidBarColorDeps = {
  isTauri: () => boolean
  invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
}

const defaultDeps: SetAndroidBarColorDeps = { isTauri, invoke }

/**
 * Sets the Android status bar and navigation bar icon appearance.
 * @param style - "dark" for dark icons (use on light backgrounds), "light" for light icons (use on dark backgrounds)
 */
export const setAndroidBarColor = async (
  style: 'dark' | 'light',
  deps: SetAndroidBarColorDeps = defaultDeps,
): Promise<void> => {
  if (!deps.isTauri()) {
    return
  }
  await deps.invoke('plugin:platform-utils|set_bar_color', { style })
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

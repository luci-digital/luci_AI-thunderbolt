/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { setAndroidBarColor } from './set-android-bar-color'

describe('setAndroidBarColor', () => {
  it('calls invoke with plugin command and style "dark" when Tauri', async () => {
    let invokedWith: { command: string; args: Record<string, string> } | null = null

    await setAndroidBarColor('dark', {
      isTauri: () => true,
      invoke: (cmd, args) => {
        invokedWith = { command: cmd, args: args as Record<string, string> }
        return Promise.resolve()
      },
    })

    expect(invokedWith!).toEqual({ command: 'plugin:platform-utils|set_bar_color', args: { style: 'dark' } })
  })

  it('calls invoke with plugin command and style "light" when Tauri', async () => {
    let invokedWith: { command: string; args: Record<string, string> } | null = null

    await setAndroidBarColor('light', {
      isTauri: () => true,
      invoke: (cmd, args) => {
        invokedWith = { command: cmd, args: args as Record<string, string> }
        return Promise.resolve()
      },
    })

    expect(invokedWith!).toEqual({ command: 'plugin:platform-utils|set_bar_color', args: { style: 'light' } })
  })

  it('does not call invoke when not running in Tauri', async () => {
    let invokeCalled = false

    await setAndroidBarColor('dark', {
      isTauri: () => false,
      invoke: () => {
        invokeCalled = true
        return Promise.resolve()
      },
    })

    expect(invokeCalled).toBe(false)
  })

  it('propagates invoke errors (no silent catch)', async () => {
    const error = new Error('command failed')

    const promise = setAndroidBarColor('dark', {
      isTauri: () => true,
      invoke: () => Promise.reject(error),
    })

    await expect(promise).rejects.toThrow('command failed')
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

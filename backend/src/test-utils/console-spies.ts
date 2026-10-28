/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { spyOn } from 'bun:test'

type ConsoleSpy = ReturnType<typeof spyOn>

export type ConsoleSpies = {
  log: ConsoleSpy
  info: ConsoleSpy
  error: ConsoleSpy
  warn: ConsoleSpy
  restore: () => void
}

/**
 * Creates spies for all console methods to reduce test noise.
 * Call the returned `restore()` function in `afterAll()` to clean up.
 *
 * @example
 * ```ts
 * let consoleSpies: ConsoleSpies
 *
 * beforeAll(() => {
 *   consoleSpies = setupConsoleSpy()
 * })
 *
 * afterAll(() => {
 *   consoleSpies.restore()
 * })
 * ```
 */
export const setupConsoleSpy = (): ConsoleSpies => {
  const log = spyOn(console, 'log').mockImplementation(() => {})
  const info = spyOn(console, 'info').mockImplementation(() => {})
  const error = spyOn(console, 'error').mockImplementation(() => {})
  const warn = spyOn(console, 'warn').mockImplementation(() => {})

  const restore = () => {
    log?.mockRestore()
    info?.mockRestore()
    error?.mockRestore()
    warn?.mockRestore()
  }

  return { log, info, error, warn, restore }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

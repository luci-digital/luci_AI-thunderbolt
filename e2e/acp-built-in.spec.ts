/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { test, expect } from '@playwright/test'
import { collectPageErrors, loginViaOidc } from './helpers'

/**
 * Smoke test for the built-in adapter pipeline.
 *
 * The ACP refactor introduces a per-session agent selection that routes
 * `Chat.sendMessage` through an `AgentAdapter`. The built-in agent is a thin
 * wrapper around the existing Vercel AI SDK streaming path
 * (`aiFetchStreamingResponse`), so a successful login + open-chat handshake is
 * the strongest signal we can produce in the OIDC e2e harness without standing
 * up real upstream model providers. We verify the chat shell renders the
 * prompt input and that no JS errors surface — a regression in the adapter
 * factory or hydration of the default agent would manifest as either a missing
 * textarea or a thrown error during render.
 */
test.describe('ACP built-in adapter', () => {
  test('login and open chat exposes the prompt input without errors', async ({ page }) => {
    const errors = collectPageErrors(page)

    await loginViaOidc(page)

    // The built-in adapter is hydrated when ChatDetailPage mounts. If the
    // adapter factory or default-agent resolution failed, the textarea would
    // never render.
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 10_000 })
    await expect(textarea).toBeEnabled()

    expect(errors).toHaveLength(0)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

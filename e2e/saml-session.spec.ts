/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { test, expect } from '@playwright/test'
import { loginViaSaml } from './helpers'

test.describe('SAML session', () => {
  test('chat UI is fully functional after SAML login', async ({ page }) => {
    await loginViaSaml(page)

    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.click()
    await textarea.pressSequentially('Hello from SAML e2e test')
    await expect(textarea).toHaveValue('Hello from SAML e2e test')
  })

  test('sidebar navigation works after SAML login', async ({ page }) => {
    await loginViaSaml(page)

    const sidebar = page.locator('aside, [data-sidebar]').first()
    await expect(sidebar).toBeVisible({ timeout: 10_000 })
  })

  test('user is signed in after SAML login', async ({ page }) => {
    await loginViaSaml(page)

    await page.goto('/settings')
    await expect(page.getByText('Settings').first()).toBeVisible({ timeout: 10_000 })

    await expect(page.getByRole('button', { name: 'Sign In' })).not.toBeVisible({ timeout: 5_000 })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

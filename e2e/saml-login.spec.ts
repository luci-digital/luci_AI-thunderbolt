/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { test, expect } from '@playwright/test'
import { loginViaSaml, collectPageErrors } from './helpers'

test.describe('SAML login flow', () => {
  test('unauthenticated user is redirected through SAML and lands on chat', async ({ page }) => {
    const errors = collectPageErrors(page)

    await loginViaSaml(page)

    await expect(page).toHaveURL(/\/chats\//)
    expect(errors).toHaveLength(0)
  })

  test('authenticated session persists across navigation', async ({ page }) => {
    await loginViaSaml(page)

    await page.goto('/settings')
    await expect(page.getByText('Settings').first()).toBeVisible({ timeout: 10_000 })

    await page.goto('/chats/new')
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10_000 })

    await expect(page).not.toHaveURL(/sso-redirect/)
  })

  test('page loads without critical JS errors after SAML login', async ({ page }) => {
    const errors = collectPageErrors(page)

    await loginViaSaml(page)

    await page.goto('/settings')
    await expect(page.getByText('Settings').first()).toBeVisible({ timeout: 10_000 })
    await page.goto('/chats/new')
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10_000 })

    expect(errors).toHaveLength(0)
  })
})

test.describe('SAML redirect behavior', () => {
  test('unauthenticated visit triggers SAML flow', async ({ page }) => {
    // Visit the app — should eventually hit the mock SAML IdP
    const responsePromise = page.waitForResponse(/\/saml\/sso/, { timeout: 15_000 })

    await page.goto('/')

    const response = await responsePromise
    const url = new URL(response.url())
    expect(url.searchParams.get('SAMLRequest')).toBeTruthy()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

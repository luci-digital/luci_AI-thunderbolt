/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { expect, type Page } from '@playwright/test'

/**
 * Navigate to the app root, let the SSO flow complete naturally through
 * the mock identity provider, and wait for the authenticated chat UI to render.
 *
 * Onboarding is disabled via VITE_SKIP_ONBOARDING env var in playwright.config.ts.
 */

/**
 * OIDC flow: / -> AuthGate -> /sso-redirect -> POST sign-in/sso -> mock IdP /authorize
 * (auto-approves) -> backend callback -> token exchange -> session -> app
 */
export const loginViaOidc = async (page: Page) => {
  await page.goto('/')
  const textarea = page.locator('textarea')
  await expect(textarea).toBeVisible({ timeout: 30_000 })
}

/**
 * SAML flow: / -> AuthGate -> /sso-redirect -> POST sign-in/sso -> mock IdP /saml/sso
 * (auto-generates SAMLResponse) -> POST to ACS -> session -> app
 */
export const loginViaSaml = async (page: Page) => {
  await page.goto('/')
  const textarea = page.locator('textarea')
  await expect(textarea).toBeVisible({ timeout: 30_000 })
}

/**
 * Open the account popover, click "Log out", confirm in the modal, and wait
 * for the signed-out landing page to appear.
 *
 * Expects the caller to have already authenticated (e.g. via loginViaOidc / loginViaSaml).
 */
export const logoutViaSidebar = async (page: Page, option: 'keep' | 'delete' = 'keep') => {
  // Open account popover in sidebar footer
  const accountTrigger = page.locator('[data-sidebar="footer"]').getByRole('button').first()
  await accountTrigger.click()

  // Click "Log out" menu item
  await page.getByText('Log out', { exact: true }).click()

  // Pick the data option if "delete" is requested (default is "keep")
  if (option === 'delete') {
    await page.getByText('Delete data from device').click()
  }

  // Confirm logout
  await page.getByRole('button', { name: 'Log out' }).click()

  // Should land on the signed-out page
  await expect(page.getByRole('heading', { name: 'Signed Out' })).toBeVisible({ timeout: 10_000 })
}

/**
 * Collect uncaught JS errors, filtering Tauri-specific noise.
 */
export const collectPageErrors = (page: Page): string[] => {
  const errors: string[] = []
  page.on('pageerror', (error) => {
    if (
      !error.message.includes('__TAURI__') &&
      !error.message.includes('tauri') &&
      !error.message.includes('window.__TAURI_INTERNALS__') &&
      !error.message.includes('convertFileSrc')
    ) {
      errors.push(error.message)
    }
  })
  return errors
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

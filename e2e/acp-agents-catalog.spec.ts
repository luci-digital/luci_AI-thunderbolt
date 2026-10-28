/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { test, expect } from '@playwright/test'
import { collectPageErrors, loginViaOidc } from './helpers'

test.describe('Agents catalog', () => {
  test('browse, link out, search, and empty state work without page errors', async ({ page }) => {
    const errors = collectPageErrors(page)
    await loginViaOidc(page)

    await page.goto('/settings/agents')

    // The bundled ACP registry snapshot renders immediately — no live network needed.
    // Assert a few known registry cards by id.
    const geminiCard = page.getByTestId('agent-catalog-card-gemini')
    await expect(geminiCard).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('agent-catalog-card-claude-acp')).toBeVisible()
    await expect(page.getByTestId('agent-catalog-card-goose')).toBeVisible()

    // At least one link-out is present on a card.
    await expect(geminiCard.getByRole('link').first()).toBeVisible()

    // Search filters the grid: 'gemini' keeps the gemini card, drops claude-acp.
    const search = page.getByPlaceholder('Search agents')
    await search.fill('gemini')
    await expect(page.getByTestId('agent-catalog-card-gemini')).toBeVisible()
    await expect(page.getByTestId('agent-catalog-card-claude-acp')).toHaveCount(0)

    // The clear (X) button resets the query and restores the filtered-out card.
    await page.getByRole('button', { name: /clear search/i }).click()
    await expect(search).toHaveValue('')
    await expect(page.getByTestId('agent-catalog-card-claude-acp')).toBeVisible()

    // A guaranteed-no-match query shows the empty state.
    await search.fill('zzzqqqxx')
    await expect(page.getByText(/no agents found/i)).toBeVisible()

    // The background CDN fetch must not surface page errors even if it fails —
    // the snapshot fallback covers it.
    expect(errors).toEqual([])
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

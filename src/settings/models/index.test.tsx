/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { createModel } from '@/dal'
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase, wsId } from '@/dal/test-utils'
import { getDb } from '@/db/database'
import {
  renderWithReactivity,
  waitForElement,
  resetTestTrustDomain,
  seedTestTrustDomain,
} from '@/test-utils/powersync-reactivity-test'
import { getClock } from '@/testing-library'
import '@testing-library/jest-dom'
import { act, cleanup, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { v7 as uuidv7 } from 'uuid'
import ModelsPage from './index'

const fakeUseWorkspacePermission = (isAllowed: boolean) =>
  (() => ({
    requiredRole: 'admin' as const,
    isAllowed,
    isResolved: true,
  })) as unknown as typeof import('@/hooks/use-workspace-permission').useWorkspacePermission

describe('ModelsPage reactivity', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    seedTestTrustDomain()
    await resetTestDatabase()
  })

  afterEach(() => {
    resetTestTrustDomain()
    cleanup()
  })

  it('updates when models table changes', async () => {
    const db = getDb()
    const modelId1 = uuidv7()
    await createModel(db, wsId, {
      id: modelId1,
      provider: 'openai',
      name: 'First Model',
      model: 'gpt-4',
      isSystem: 0,
      enabled: 1,
    })

    const { triggerChange } = renderWithReactivity(<ModelsPage />, {
      tables: ['models'],
    })

    await waitForElement(() => screen.queryByText('First Model'))
    expect(screen.getByText('First Model')).toBeInTheDocument()

    const modelId2 = uuidv7()
    await createModel(db, wsId, {
      id: modelId2,
      provider: 'anthropic',
      name: 'Second Model',
      model: 'claude-3',
      isSystem: 0,
      enabled: 1,
    })
    triggerChange(['models'])

    await act(async () => {
      await getClock().runAllAsync()
    })

    expect(screen.getByText('Second Model')).toBeInTheDocument()
  })
})

describe('ModelsPage — permission gating', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    seedTestTrustDomain()
    await resetTestDatabase()
  })

  afterEach(() => {
    resetTestTrustDomain()
    cleanup()
  })

  it('renders the header Add button when add_models is allowed', async () => {
    renderWithReactivity(<ModelsPage useWorkspacePermission={fakeUseWorkspacePermission(true)} />, {
      tables: ['models'],
    })

    await waitForElement(() => screen.queryByRole('heading', { name: 'Models' }))
    // Empty-state CTA ("Add Model") fires here since no models seeded. The
    // header `+` button has no accessible name; covering it requires the empty
    // state's labelled button instead.
    expect(screen.getByRole('button', { name: 'Add Model' })).toBeInTheDocument()
  })

  it('hides every Add Model affordance when add_models is denied', async () => {
    renderWithReactivity(<ModelsPage useWorkspacePermission={fakeUseWorkspacePermission(false)} />, {
      tables: ['models'],
    })

    await waitForElement(() => screen.queryByRole('heading', { name: 'Models' }))
    expect(screen.queryByRole('button', { name: 'Add Model' })).not.toBeInTheDocument()
  })

  it('disables the row Switch + Edit button when add_models is denied', async () => {
    const db = getDb()
    await createModel(db, wsId, {
      id: uuidv7(),
      provider: 'openai',
      name: 'Configured Model',
      model: 'gpt-4',
      isSystem: 0,
      enabled: 1,
    })

    renderWithReactivity(<ModelsPage useWorkspacePermission={fakeUseWorkspacePermission(false)} />, {
      tables: ['models'],
    })

    await waitForElement(() => screen.queryByText('Configured Model'))
    expect(screen.getByRole('switch')).toBeDisabled()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

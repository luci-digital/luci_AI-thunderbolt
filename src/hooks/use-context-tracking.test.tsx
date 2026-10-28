/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { createChatThread, createModel, getModel, updateChatThread } from '@/dal'
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase, wsId } from '@/dal/test-utils'
import { getDb } from '@/db/database'
import {
  renderWithReactivity,
  waitForElement,
  resetTestTrustDomain,
  seedTestTrustDomain,
} from '@/test-utils/powersync-reactivity-test'
import { getClock } from '@/testing-library'
import type { Model } from '@/types'
import '@testing-library/jest-dom'
import { act, cleanup, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { v7 as uuidv7 } from 'uuid'
import { useContextTracking } from './use-context-tracking'

const TestContextTrackingComponent = ({ chatThreadId, model }: { chatThreadId: string; model: Model }) => {
  const { usedTokens } = useContextTracking({
    model,
    chatThreadId,
    currentInput: '',
  })
  return <span data-testid="used-tokens">{usedTokens ?? 'null'}</span>
}

const TestOverflowComponent = ({
  chatThreadId,
  model,
  currentInput,
  additionalInputTokens,
}: {
  chatThreadId: string
  model: Model
  currentInput: string
  additionalInputTokens: number
}) => {
  const { isOverflowing } = useContextTracking({
    model,
    chatThreadId,
    currentInput,
    additionalInputTokens,
  })
  return <span data-testid="is-overflowing">{String(isOverflowing)}</span>
}

describe('useContextTracking reactivity', () => {
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

  it('updates when chat_threads contextSize changes', async () => {
    const db = getDb()
    const modelId = uuidv7()
    const threadId = uuidv7()

    await createModel(db, wsId, {
      id: modelId,
      provider: 'openai',
      name: 'Test Model',
      model: 'gpt-4',
      isSystem: 0,
      enabled: 1,
      contextWindow: 128000,
    })

    const model = await getModel(db, wsId, modelId)
    if (!model) {
      throw new Error('Model not found')
    }

    await createChatThread(
      db,
      wsId,
      { id: threadId, title: 'Test', contextSize: null, triggeredBy: null, wasTriggeredByAutomation: 0 },
      model,
    )

    const { triggerChange } = renderWithReactivity(
      <TestContextTrackingComponent chatThreadId={threadId} model={model} />,
      { tables: ['chat_threads'] },
    )

    await waitForElement(() => screen.queryByTestId('used-tokens'))
    expect(screen.getByTestId('used-tokens').textContent).toBe('null')

    await act(async () => {
      await getClock().runAllAsync()
    })

    await updateChatThread(db, wsId, threadId, { contextSize: 500 })
    triggerChange(['chat_threads'])

    await act(async () => {
      await getClock().runAllAsync()
    })

    await waitForElement(() => {
      const el = screen.queryByTestId('used-tokens')
      return el?.textContent === '500' ? el : null
    })
    expect(screen.getByTestId('used-tokens').textContent).toBe('500')
  })

  it('flips isOverflowing to true when additionalInputTokens (Skills v1) pushes total past the context window', async () => {
    const db = getDb()
    const modelId = uuidv7()
    const threadId = uuidv7()

    // Tiny model: 100-token window. Easy to overflow with skill instructions.
    await createModel(db, wsId, {
      id: modelId,
      provider: 'openai',
      name: 'Tiny Model',
      model: 'gpt-4',
      isSystem: 0,
      enabled: 1,
      contextWindow: 100,
    })
    const model = await getModel(db, wsId, modelId)
    if (!model) {
      throw new Error('Model not found')
    }

    // 60 tokens already used in the thread.
    await createChatThread(
      db,
      wsId,
      { id: threadId, title: 'Test', contextSize: 60, triggeredBy: null, wasTriggeredByAutomation: 0 },
      model,
    )

    // 60 (already used) + ~1 (user input) + 50 (skill instruction) = 111 > 100.
    renderWithReactivity(
      <TestOverflowComponent chatThreadId={threadId} model={model} currentInput="hi" additionalInputTokens={50} />,
      { tables: ['chat_threads'] },
    )

    await waitForElement(() => {
      const el = screen.queryByTestId('is-overflowing')
      return el?.textContent === 'true' ? el : null
    })
    expect(screen.getByTestId('is-overflowing').textContent).toBe('true')
  })

  it('keeps isOverflowing false when additionalInputTokens is zero and the thread is well under the window', async () => {
    const db = getDb()
    const modelId = uuidv7()
    const threadId = uuidv7()
    await createModel(db, wsId, {
      id: modelId,
      provider: 'openai',
      name: 'Big Model',
      model: 'gpt-4',
      isSystem: 0,
      enabled: 1,
      contextWindow: 100_000,
    })
    const model = await getModel(db, wsId, modelId)
    if (!model) {
      throw new Error('Model not found')
    }
    await createChatThread(
      db,
      wsId,
      { id: threadId, title: 'Test', contextSize: 200, triggeredBy: null, wasTriggeredByAutomation: 0 },
      model,
    )
    renderWithReactivity(
      <TestOverflowComponent
        chatThreadId={threadId}
        model={model}
        currentInput="hello world"
        additionalInputTokens={0}
      />,
      { tables: ['chat_threads'] },
    )
    await waitForElement(() => {
      const el = screen.queryByTestId('is-overflowing')
      return el?.textContent === 'false' ? el : null
    })
    expect(screen.getByTestId('is-overflowing').textContent).toBe('false')
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

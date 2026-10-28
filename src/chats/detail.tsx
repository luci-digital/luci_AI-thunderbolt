/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import ChatUI from '@/components/chat/chat-ui'
import { useHydrateChatStore } from './use-hydrate-chat-store'
import { type PropsWithChildren, useEffect, useMemo } from 'react'
import { SavePartialAssistantMessagesHandler } from './save-partial-assistant-messages-handler'
import { useParams } from 'react-router'
import { v7 as uuidv7 } from 'uuid'
import { useHandleIntegrationCompletion } from '@/hooks/use-handle-integration-completion'

type ChatHydrateHandlerProps = PropsWithChildren<{
  id: string
  isNew: boolean
}>

const ChatHydrateHandler = ({ children, id, isNew }: ChatHydrateHandlerProps) => {
  const { hydrateChatStore, isReady, saveMessages, workspaceId } = useHydrateChatStore({ id, isNew })

  useHandleIntegrationCompletion({ saveMessages, workspaceId })

  useEffect(() => {
    void hydrateChatStore()
  }, [id, workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isReady) {
    return null
  }

  return (
    <SavePartialAssistantMessagesHandler saveMessages={saveMessages}>{children}</SavePartialAssistantMessagesHandler>
  )
}

export default function ChatDetailPage() {
  const params = useParams()

  const isNew = params.chatThreadId === 'new'

  const id = useMemo(() => (isNew ? uuidv7() : params.chatThreadId || null), [params.chatThreadId])

  if (!id) {
    return null
  }

  return (
    <ChatHydrateHandler key={id} id={id} isNew={isNew}>
      <ChatUI />
    </ChatHydrateHandler>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

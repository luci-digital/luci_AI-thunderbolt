/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useEffect, useRef } from 'react'
import { useCurrentChatSession } from './chat-store'
import { useChat as useChat_default } from '@ai-sdk/react'

type UseChatAutomationProps = {
  useChat?: typeof useChat_default
}

export const useChatAutomation = ({ useChat = useChat_default }: UseChatAutomationProps = {}) => {
  const { chatInstance } = useCurrentChatSession()

  const { messages } = useChat({ chat: chatInstance })

  const hasMessages = messages.length

  const hasTriggeredRef = useRef(false)

  // Auto-run assistant if thread ends with user message (e.g., automation) and no assistant response yet
  useEffect(() => {
    if (
      !hasTriggeredRef.current &&
      chatInstance?.status === 'ready' &&
      hasMessages &&
      chatInstance?.messages[chatInstance?.messages.length - 1].role === 'user'
    ) {
      hasTriggeredRef.current = true
      // Regenerate assistant response for the last user message
      chatInstance?.regenerate().catch((err) => {
        console.error('Auto regenerate error', err)
      })
    }
  }, [chatInstance, hasMessages])
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

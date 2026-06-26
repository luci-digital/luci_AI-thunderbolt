/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { AssistantMessage } from './assistant-message'
import { SyntheticLoadingPart } from './synthetic-loading-part'
import { UserMessage } from './user-message'
import { ErrorMessage } from './error-message'
import { useEffect, useMemo, useRef } from 'react'
import { useCurrentChatSession } from '@/chats/chat-store'
import { useChat as useChat_default } from '@ai-sdk/react'
import { shouldUseViewportPositioning } from '@/chats/use-chat-scroll-handler'
import { getAttachments, isAttachmentPart } from '@/lib/attachments'
import { hasTransformer } from '@/files/transformers'
import { useHaptics } from '@/hooks/use-haptics'

type ChatMessagesProps = {
  useChat?: typeof useChat_default
}

export const ChatMessages = ({ useChat = useChat_default }: ChatMessagesProps) => {
  const { chatInstance, retryCount, retriesExhausted } = useCurrentChatSession()

  const { error: chatError, status, messages, regenerate, setMessages } = useChat({ chat: chatInstance })
  const { triggerNotification } = useHaptics()

  const isStreaming = status === 'streaming'
  const wasStreaming = useRef(false)

  useEffect(() => {
    if (wasStreaming.current && !isStreaming) {
      triggerNotification(chatError ? 'error' : 'success')
    }
    wasStreaming.current = isStreaming
  }, [isStreaming, chatError, triggerNotification])

  const lastMessage = useMemo(() => messages[messages.length - 1], [messages])
  const lastAssistantMessage = useMemo(
    () => messages.findLast((m) => m.role === 'assistant' && (m.parts?.length ?? 0) > 0),
    [messages],
  )

  // "Convert to text & retry": the failed turn carries attachment(s) we can
  // re-deliver as extracted text (a transformer exists and they aren't already
  // text). Marking `deliverAs: 'text'` on the user message's parts makes the
  // next hydration emit text instead of native bytes; regenerate() re-runs it.
  const lastUserMessage = useMemo(() => messages.findLast((m) => m.role === 'user'), [messages])
  const canConvertToText = useMemo(
    () =>
      !!lastUserMessage &&
      getAttachments(lastUserMessage).some((a) => a.deliverAs !== 'text' && hasTransformer(a.mimeType, 'text')),
    [lastUserMessage],
  )
  const handleConvertToTextAndRetry = () => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === lastUserMessage?.id
          ? {
              ...message,
              parts: message.parts.map((part) =>
                isAttachmentPart(part) && hasTransformer(part.data.mimeType, 'text')
                  ? { ...part, data: { ...part.data, deliverAs: 'text' as const } }
                  : part,
              ),
            }
          : message,
      ),
    )
    regenerate()
  }

  // After the user sends a message, AI SDK reports status `submitted` until the
  // first assistant delta arrives. During that window there is no assistant
  // message to host the synthetic loading indicator, so render it inline here.
  const showSubmittedLoading = status === 'submitted' && lastMessage?.role !== 'assistant'

  const hasError = useMemo(() => {
    if (chatError) {
      return true
    }
    return lastMessage?.role === 'assistant' && !lastMessage.parts?.length && !isStreaming
  }, [chatError, lastMessage, isStreaming])

  return (
    <div>
      {messages.map((message) => {
        // Skip OAuth retry messages (they're hidden, only used to trigger regeneration)
        if (message.metadata?.oauthRetry === true) {
          return null
        }

        if (message.role === 'assistant') {
          // Hide empty assistant messages during errors — these are broken responses
          // that regenerate() will remove. Messages with parts are valid responses.
          if (hasError && !message.parts?.length) {
            return null
          }

          // Memoize last message check to avoid recalculating on every iteration
          const isLast = message === lastMessage
          // Only apply viewport positioning from second message onwards
          const shouldApplyViewport = isLast && shouldUseViewportPositioning(messages.length)

          return (
            <AssistantMessage
              key={message.id}
              message={message}
              isStreaming={isStreaming && isLast}
              isLastMessage={shouldApplyViewport}
              isLastAssistantMessage={message === lastAssistantMessage}
            />
          )
        }
        if (message.role === 'user') {
          return <UserMessage key={message.id} message={message} />
        }

        return null
      })}

      {showSubmittedLoading && <SyntheticLoadingPart isStreaming />}

      {/* Show error message if there's an error */}
      {hasError && (
        <ErrorMessage
          retryCount={retryCount}
          retriesExhausted={retriesExhausted}
          error={chatError}
          onRetry={() => regenerate()}
          onRetryAsText={canConvertToText ? handleConvertToTextAndRetry : undefined}
        />
      )}
    </div>
  )
}

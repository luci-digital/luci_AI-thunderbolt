/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useObjectView } from '@/content-view/context'
import { useAutoScroll } from '@/hooks/use-auto-scroll'
import { type ReasoningGroupItem, type ToolOrDynamicToolUIPart } from '@/lib/assistant-message'
import { computeWallClockTime } from '@/lib/utils'
import type { UIMessageMetadata } from '@/types'
import { type ReasoningUIPart } from 'ai'
import { CheckIcon, Loader2 } from 'lucide-react'
import { Expandable } from '../ui/expandable'
import { ReasoningDisplay } from './reasoning-display'
import { ReasoningGroupTitle } from './reasoning-group-title'
import { ReasoningItem } from './reasoning-item'

type ReasoningGroupProps = {
  parts: ReasoningGroupItem[]
  isStreaming: boolean
  isLastPartInMessage: boolean
  hasTextPart: boolean
  reasoningTime: Record<string, number>
  reasoningStartTimes?: Record<string, number>
  mcpTools?: UIMessageMetadata['mcpTools']
}

export const ReasoningGroup = ({
  parts,
  isStreaming,
  isLastPartInMessage,
  hasTextPart,
  reasoningTime,
  reasoningStartTimes,
  mcpTools,
}: ReasoningGroupProps) => {
  const { openObjectSidebar } = useObjectView()

  const tools = parts.filter((part) => part.type === 'tool').map((part) => part.content) as ToolOrDynamicToolUIPart[]

  const currentReasoningPart = parts
    .filter((part) => part.type === 'reasoning')
    .pop() as ReasoningGroupItem<ReasoningUIPart> | null

  const isGroupReasoning = isLastPartInMessage && (isStreaming || currentReasoningPart?.content.state === 'streaming')

  // Create unique instance key for reasoning display
  const reasoningInstanceKey = currentReasoningPart
    ? `reasoning-${currentReasoningPart.content.text.substring(0, 50)}-${parts.indexOf(currentReasoningPart)}`
    : ''

  const totalDuration = (() => {
    if (!reasoningStartTimes) {
      return parts.reduce((sum, part) => sum + (reasoningTime?.[part.id] ?? 0), 0)
    }

    const intervals = parts.flatMap((part) => {
      const start = reasoningStartTimes[part.id]
      const duration = reasoningTime?.[part.id]
      if (start === undefined || duration === undefined) {
        return []
      }
      return [{ start, end: start + duration }]
    })

    return computeWallClockTime(intervals)
  })()

  const { scrollContainerRef, scrollTargetRef } = useAutoScroll({
    dependencies: [parts.length],
    smooth: true,
    isStreaming: false,
    rootMargin: '0px',
  })

  return (
    <div className="mt-6">
      <Expandable
        className="shadow-none tool-invocation-card rounded-xl overflow-hidden transition-colors"
        icon={
          isGroupReasoning ? (
            <Loader2 className={`h-4 w-4 animate-spin text-muted-foreground`} />
          ) : (
            <CheckIcon className="h-4 w-4 text-muted-foreground" />
          )
        }
        defaultOpen={false}
        title={
          <ReasoningGroupTitle
            totalDuration={totalDuration}
            isGroupReasoning={isGroupReasoning}
            tools={tools}
            mcpTools={mcpTools}
          />
        }
      >
        <div className="max-h-[200px] overflow-y-auto" ref={scrollContainerRef}>
          {parts.map((part, index) => {
            return (
              <ReasoningItem
                key={index}
                part={part}
                onClick={() => openObjectSidebar(part.content as ToolOrDynamicToolUIPart | ReasoningUIPart, mcpTools)}
                reasoningTime={reasoningTime?.[part.id]}
                isGroupReasoning={isGroupReasoning}
                mcpTools={mcpTools}
              />
            )
          })}
          <div ref={scrollTargetRef} />
        </div>
      </Expandable>
      {!hasTextPart && (
        <ReasoningDisplay
          text={currentReasoningPart?.content.text}
          isStreaming={currentReasoningPart?.content.state === 'streaming'}
          instanceKey={reasoningInstanceKey}
        />
      )}
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

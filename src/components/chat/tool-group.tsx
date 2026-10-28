/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useObjectView } from '@/content-view/context'
import type { ToolUIPart } from 'ai'
import { m } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { ToolIcon } from './tool-icon'
import { ToolItem } from './tool-item'

type UseToolGroupStateParams = {
  tools: ToolUIPart[]
  isStreaming: boolean
  isLastPartInMessage: boolean
  hasTextInMessage: boolean
}

/**
 * Computes the display state for a tool group, including completion status
 * and whether to show a loading indicator for the next action.
 * @internal - Exported for testing only
 */
export const useToolGroupState = ({
  tools,
  isStreaming,
  isLastPartInMessage,
  hasTextInMessage,
}: UseToolGroupStateParams) => {
  const allToolsComplete = tools.every((tool) => tool.state === 'output-available' || tool.state === 'output-error')

  const showLoadingNext = isStreaming && isLastPartInMessage && allToolsComplete && !hasTextInMessage

  return { showLoadingNext, allToolsComplete }
}

type ToolGroupProps = {
  tools: ToolUIPart[]
  isStreaming: boolean
  isLastPartInMessage: boolean
  hasTextInMessage: boolean
}

export const ToolGroup = ({ tools, isStreaming, isLastPartInMessage, hasTextInMessage }: ToolGroupProps) => {
  const { openObjectSidebar } = useObjectView()

  const { showLoadingNext } = useToolGroupState({
    tools,
    isStreaming,
    isLastPartInMessage,
    hasTextInMessage,
  })

  return (
    <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 -space-y-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale p-1 mt-6 mb-4 flex-wrap">
      {tools.map((tool, index) => (
        <ToolItem
          key={tool.toolCallId ?? `${tool.type}-${index}`}
          tool={tool}
          index={index}
          onOpenDetails={openObjectSidebar}
        />
      ))}
      {showLoadingNext && (
        <Tooltip>
          <TooltipTrigger asChild>
            <m.div
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
              }}
            >
              <ToolIcon
                toolName="processing"
                toolOutput={undefined}
                Icon={null}
                initials="..."
                isLoading={true}
                isError={false}
                tooltipKey="next-action-loading"
                onClick={() => {}}
              />
            </m.div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">Thinking...</p>
          </TooltipContent>
        </Tooltip>
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

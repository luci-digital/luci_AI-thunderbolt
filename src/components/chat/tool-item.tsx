/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { getToolMetadataSync } from '@/lib/tool-metadata'
import { splitPartType } from '@/lib/utils'
import type { ToolUIPart } from 'ai'
import { m } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { ToolIcon } from './tool-icon'

type UseToolItemStateParams = {
  tool: ToolUIPart
  index: number
}

/**
 * Computes the display state for a tool item, including metadata, loading/error states,
 * and a stable tooltip key for animations.
 * @internal - Exported for testing only
 */
export const useToolItemState = ({ tool, index }: UseToolItemStateParams) => {
  const [, toolName] = splitPartType(tool.type)
  const metadata = getToolMetadataSync(toolName, tool.input)
  const Icon = metadata.icon
  const isError = tool.state === 'output-error'
  const isLoading = (tool.state !== 'output-available' || !tool.output) && !isError
  const tooltipKey = tool.toolCallId ?? `${toolName}-${index}`

  return {
    toolName,
    metadata,
    Icon,
    isError,
    isLoading,
    tooltipKey,
  }
}

type ToolItemProps = {
  tool: ToolUIPart
  index: number
  onOpenDetails: (tool: ToolUIPart) => void
}

export const ToolItem = ({ tool, index, onOpenDetails }: ToolItemProps) => {
  const { toolName, metadata, Icon, isError, isLoading, tooltipKey } = useToolItemState({ tool, index })

  return (
    <Tooltip key={tooltipKey}>
      <TooltipTrigger asChild>
        <m.div
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
          }}
        >
          <ToolIcon
            toolName={toolName}
            toolOutput={tool.output}
            Icon={Icon}
            initials={metadata.initials}
            isLoading={isLoading}
            isError={isError}
            tooltipKey={tooltipKey}
            onClick={() => !isLoading && !isError && onOpenDetails(tool)}
          />
        </m.div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-medium">{metadata.displayName}</p>
        {isLoading ? <p className="text-xs text-muted-foreground">{metadata.loadingMessage}</p> : null}
      </TooltipContent>
    </Tooltip>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

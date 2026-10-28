/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { cn, formatNumber } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

type ContextUsageIndicatorProps = {
  usedTokens: number
  maxTokens: number
  className?: string
}

/**
 * Context usage indicator component showing token usage as a progress ring
 */
export const ContextUsageIndicator = ({ usedTokens = 0, maxTokens, className }: ContextUsageIndicatorProps) => {
  const percentage = Math.min((usedTokens / maxTokens) * 100, 100)
  const roundedPercentage = Math.round(percentage)

  const strokeColor = 'rgb(107 114 128)' // gray-500 - consistent darker gray

  // SVG circle parameters
  const size = 24
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const percentageText = `${roundedPercentage}%`

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative flex items-center justify-center">
              <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="rgb(229 231 235)"
                  strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-in-out"
                />
              </svg>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Using {formatNumber(usedTokens)} of {formatNumber(maxTokens)} Context Window
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{percentageText}</span>
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

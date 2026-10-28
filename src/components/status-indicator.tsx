/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { cn } from '@/lib/utils'
import type { FC } from 'react'

/**
 * Simple status indicator dot used across the application to visualise
 * connectivity state (online/offline/connecting, …).
 *
 * @example
 *   <StatusIndicator status="online" />
 */
export type StatusState = 'online' | 'offline' | 'connected' | 'disconnected' | 'connecting' | 'error' | 'neutral'

export type StatusIndicatorProps = {
  /**
   * The current state that should be visualised.
   */
  status: StatusState
  /**
   * Visual size variant. `sm` renders a 0.5rem dot, `md` a 0.75rem dot and
   * `lg` a 1rem dot. Defaults to `md`.
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Optional additional Tailwind classes.
   */
  className?: string
}

const sizeClasses: Record<NonNullable<StatusIndicatorProps['size']>, string> = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
}

const stateClasses: Record<StatusState, string> = {
  online: 'bg-green-500',
  connected: 'bg-green-500',
  offline: 'bg-red-500',
  disconnected: 'bg-red-500',
  connecting: 'bg-yellow-500',
  error: 'bg-destructive',
  neutral: 'bg-muted-foreground/30',
}

export const StatusIndicator: FC<StatusIndicatorProps> = ({ status, size = 'md', className }) => {
  return (
    <span
      className={cn('inline-block rounded-full flex-shrink-0', sizeClasses[size], stateClasses[status], className)}
    />
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

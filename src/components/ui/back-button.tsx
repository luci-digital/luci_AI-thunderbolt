/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type BackButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Button size variant */
  size?: 'sm' | 'md'
}

const sizeClasses = {
  sm: { button: 'size-6', icon: 'size-3' },
  md: { button: 'size-8', icon: 'size-5' },
} as const

/**
 * Circular back button with arrow icon.
 * Used for navigation in modals, cards, and overlays.
 */
export const BackButton = ({ size = 'md', className, ...props }: BackButtonProps) => {
  const sizes = sizeClasses[size]

  return (
    <button
      type="button"
      aria-label="Go back"
      className={cn(
        'flex cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted',
        sizes.button,
        className,
      )}
      {...props}
    >
      <ArrowLeft className={sizes.icon} />
    </button>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

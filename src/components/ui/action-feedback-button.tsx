/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Check, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { Button } from './button'

type ActionFeedbackButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  /** The action to perform when clicked. Returns true on success to show feedback. */
  onClick: () => Promise<boolean> | boolean
  /** Duration in ms to show success state (default: 2000) */
  feedbackDuration?: number
  /** Content to show in idle state */
  children: ReactNode
  /** Content to show during loading (default: spinner) */
  loadingContent?: ReactNode
  /** Content to show on success (default: check icon + "Sent") */
  successContent?: ReactNode
}

/**
 * A button that shows loading and success feedback states after an action.
 * Useful for actions like "Resend email", "Copy", etc.
 */
export const ActionFeedbackButton = ({
  onClick,
  feedbackDuration = 2000,
  children,
  loadingContent,
  successContent,
  disabled,
  ...props
}: ActionFeedbackButtonProps) => {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleClick = useCallback(async () => {
    if (state !== 'idle') {
      return
    }

    setState('loading')

    try {
      const success = await onClick()
      if (success) {
        setState('success')
        timeoutRef.current = setTimeout(() => setState('idle'), feedbackDuration)
      } else {
        setState('idle')
      }
    } catch (error) {
      console.error('ActionFeedbackButton error:', error)
      setState('idle')
    }
  }, [onClick, feedbackDuration, state])

  const content = (() => {
    switch (state) {
      case 'loading':
        return (
          loadingContent ?? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          )
        )
      case 'success':
        return (
          <span className="inline-flex items-center animate-[fadeOut_2s_ease-in-out]">
            {successContent ?? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Sent
              </>
            )}
          </span>
        )
      default:
        return children
    }
  })()

  return (
    <Button onClick={handleClick} disabled={disabled || state !== 'idle'} {...props}>
      {content}
    </Button>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

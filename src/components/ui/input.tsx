/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  'border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex min-w-0 rounded-lg border bg-transparent px-3 py-1 text-[length:var(--font-size-body)] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        filled:
          'bg-muted/50 focus-visible:bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        outline: 'border-2 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]',
        ghost: 'border-none focus-visible:bg-accent/50 focus-visible:ring-0',
      },
      inputSize: {
        default: 'h-[var(--touch-height-default)] w-full',
        sm: 'h-[var(--touch-height-sm)] w-full text-xs px-2 py-1 rounded-lg',
        lg: 'h-[var(--touch-height-lg)] w-full text-base px-4 py-2 rounded-lg',
        xl: 'h-[var(--touch-height-xl)] w-full text-lg px-6 py-1.5 rounded-lg',
      },
      state: {
        default: '',
        error: 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        success: 'border-green-500 focus-visible:border-green-600 focus-visible:ring-green-300/50',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
      state: 'default',
    },
  },
)

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & VariantProps<typeof inputVariants>

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, state, ...props }, ref) => {
    return (
      <input
        aria-invalid={state === 'error' ? 'true' : undefined}
        type={type}
        data-slot="input"
        className={cn(inputVariants({ variant, inputSize, state, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input, inputVariants }

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

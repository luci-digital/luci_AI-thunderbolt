/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { ArrowRight } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { Skill } from '@/types'

export type DependentsAction = 'disable' | 'delete'

const verbLower: Record<DependentsAction, string> = {
  disable: 'disable',
  delete: 'delete',
}

const verbLabel: Record<DependentsAction, string> = {
  disable: 'Disable',
  delete: 'Delete',
}

export const DependentsDialog = ({
  open,
  onOpenChange,
  action,
  targetName,
  dependents,
  onConfirm,
  onJumpToDependent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: DependentsAction
  targetName: string
  dependents: Skill[]
  onConfirm: () => void
  onJumpToDependent: (id: string) => void
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {verbLabel[action]} /{targetName}?
        </AlertDialogTitle>
        <AlertDialogDescription>
          {dependents.length === 1 ? 'One skill references' : `${dependents.length} skills reference`} this. If you{' '}
          {verbLower[action]} it, they may no longer resolve:
        </AlertDialogDescription>
      </AlertDialogHeader>
      <ul className="flex flex-col gap-1.5">
        {dependents.map((dep) => (
          <li key={dep.id}>
            <button
              type="button"
              onClick={() => onJumpToDependent(dep.id)}
              className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <span>/{dep.name}</span>
              <ArrowRight size={14} className="text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button variant="destructive" onClick={onConfirm}>
          {verbLabel[action]} skill
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { PermissionOption, RequestPermissionRequest, RequestPermissionResponse } from '@agentclientprotocol/sdk'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'
import { useState } from 'react'

type PermissionDialogProps = {
  request: RequestPermissionRequest
  onRespond: (response: RequestPermissionResponse) => void
}

const toolKindLabel = (kind?: string | null) => {
  switch (kind) {
    case 'edit':
      return 'Edit file'
    case 'delete':
      return 'Delete'
    case 'execute':
      return 'Run command'
    case 'move':
      return 'Move file'
    default:
      return 'Action'
  }
}

const optionVariant = (kind: PermissionOption['kind']): 'default' | 'destructive' | 'outline' | 'secondary' => {
  switch (kind) {
    case 'allow_once':
      return 'default'
    case 'allow_always':
      return 'secondary'
    case 'reject_once':
      return 'outline'
    case 'reject_always':
      return 'destructive'
  }
}

/**
 * Inline permission prompt rendered above the prompt input when an ACP agent
 * issues a `requestPermission` for a tool call. The dialog disables itself
 * after the first selection so a fast double-click can't fire two responses.
 */
export const PermissionDialog = ({ request, onRespond }: PermissionDialogProps) => {
  const [responded, setResponded] = useState(false)

  const toolCall = request.toolCall
  const title = toolCall?.title ?? 'Permission Required'
  const kind = toolCall?.kind

  const handleSelect = (option: PermissionOption) => {
    if (responded) {
      return
    }
    setResponded(true)
    onRespond({
      outcome: { outcome: 'selected', optionId: option.optionId },
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 my-2" role="dialog">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-amber-500" />
        <span className="font-medium text-[length:var(--font-size-body)]">{toolKindLabel(kind)}</span>
      </div>

      <p className="text-[length:var(--font-size-sm)] text-muted-foreground">{title}</p>

      {toolCall?.locations && toolCall.locations.length > 0 && (
        <div className="text-[length:var(--font-size-xs)] text-muted-foreground font-mono">
          {toolCall.locations.map((loc, i) => (
            <div key={i}>
              {loc.path}
              {loc.line != null && `:${loc.line}`}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {request.options.map((option) => (
          <Button
            key={option.optionId}
            variant={optionVariant(option.kind)}
            size="sm"
            disabled={responded}
            onClick={() => handleSelect(option)}
          >
            {option.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

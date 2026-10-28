/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { ReasoningUIPart } from 'ai'
import { Check, Loader2 } from 'lucide-react'
import { Expandable } from '../ui/expandable'

type ReasoningPartProps = {
  part: ReasoningUIPart
}

export const ReasoningPart = ({ part }: ReasoningPartProps) => {
  const state = part.state

  return (
    <Expandable
      title={<span className="text-muted-foreground">Thinking</span>}
      className="shadow-none"
      icon={
        state === 'streaming' ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" data-testid="reasoning-loading" />
        ) : (
          <Check className="h-4 w-4 text-muted-foreground" data-testid="reasoning-completed" />
        )
      }
      defaultOpen={false}
    >
      <div className="text-muted-foreground leading-relaxed text-sm">{part.text}</div>
    </Expandable>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

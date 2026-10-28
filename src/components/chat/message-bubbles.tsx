/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { UIMessage } from 'ai'
import { MemoizedMarkdown } from './memoized-markdown'

type MessageBubblesProps = {
  message: UIMessage
}

export const MessageBubbles = ({ message }: MessageBubblesProps) =>
  message.parts
    .filter((part) => part.type === 'text')
    .map((part, j) => (
      <div key={j} className="px-4 rounded-2xl max-w-3/4 bg-muted dark:bg-secondary/60 ml-auto mt-6">
        <div className="space-y-2">
          <MemoizedMarkdown id={`${message.id}_${j}`} content={part.text || ''} />
        </div>
      </div>
    ))

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

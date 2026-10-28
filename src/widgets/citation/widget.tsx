/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { CitationBadge } from '@/components/chat/citation-badge'
import { decodeCitationSources } from '@/lib/citation-utils'

type CitationWidgetProps = {
  sources: string
}

/**
 * Citation widget component - wrapper that receives parsed widget data
 * and renders CitationBadge with deserialized sources.
 *
 * Rendered outside a CitationPopoverProvider, so CitationBadge uses its
 * self-contained Popover/Sheet (no streaming re-render concerns here).
 */
export const CitationWidgetComponent = ({ sources: sourcesJson }: CitationWidgetProps) => {
  const sources = decodeCitationSources(sourcesJson)

  if (!sources) {
    return null
  }

  return <CitationBadge sources={sources} />
}

export { CitationWidgetComponent as Component }

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

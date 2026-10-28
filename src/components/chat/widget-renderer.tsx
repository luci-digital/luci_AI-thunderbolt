/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Widget renderer
 *
 * This file auto-wires widget components from the widget registry.
 * To add a new widget, update src/widgets/index.ts
 */

import type { Widget } from '@/ai/widget-types'
import type { SourceMetadata } from '@/types/source'
import { widgetRegistry } from '@/widgets'
import { type ComponentType, createElement, memo } from 'react'
import { useWidgetHiddenState } from '@/widgets/connect-integration/use-widget-hidden-state'

type WidgetRendererProps = {
  widget: Widget
  messageId: string
  sources?: SourceMetadata[]
}

/**
 * Renders a widget component based on its type
 * Passes messageId to each component - they handle their own enrichment
 *
 * Components are auto-loaded from the widget registry
 * Filters out widgets marked as hidden via message cache
 */
export const WidgetRenderer = memo(({ widget, messageId, sources }: WidgetRendererProps) => {
  const isHidden = useWidgetHiddenState(messageId, widget.widget)

  if (widget.widget === 'connect-integration' && isHidden) {
    return null
  }

  const widgetConfig = widgetRegistry.find((w) => w.name === widget.widget)

  if (!widgetConfig) {
    return null
  }

  // Type safety is ensured by the widget registry - widget.args matches the component's props
  return createElement(
    widgetConfig.module.Component as ComponentType<Record<string, unknown> & { messageId: string }>,
    {
      ...widget.args,
      messageId,
      sources,
    },
  )
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

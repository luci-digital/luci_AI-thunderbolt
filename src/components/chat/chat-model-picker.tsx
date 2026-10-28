/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useChatStore, useCurrentChatSession } from '@/chats/chat-store'
import { ModelSelector } from '@/components/ui/model-selector'
import { useIsMobile } from '@/hooks/use-mobile'
import { useWorkspacePermission as useWorkspacePermission_default } from '@/hooks/use-workspace-permission'
import { useWorkspaceNavigate } from '@/lib/active-workspace'

/**
 * Model picker for the chat composer. Renders to the immediate right of the
 * ChatModePicker and only for the built-in Thunderbolt agent — managed-acp and
 * remote-acp agents own their own model selection upstream, so it is hidden for
 * them (mirroring {@link ChatModePicker}).
 *
 * Uses the `bordered` ModelSelector variant so it visually pairs with the
 * ModeSelector sitting beside it, and mirrors its open direction (down on
 * desktop, up on mobile) so the two dropdowns stay consistent.
 */
type ChatModelPickerProps = {
  /** Test seam — defaults to the real hook. Pages exercise this via tests
   *  that inject a fake to assert the gated-affordance is hidden. */
  useWorkspacePermission?: typeof useWorkspacePermission_default
}

export const ChatModelPicker = ({
  useWorkspacePermission = useWorkspacePermission_default,
}: ChatModelPickerProps = {}) => {
  const models = useChatStore((state) => state.models)
  const setSelectedModel = useChatStore((state) => state.setSelectedModel)
  const navigate = useWorkspaceNavigate()
  const { isMobile } = useIsMobile()
  const { id: chatThreadId, selectedAgent, selectedModel, chatThread } = useCurrentChatSession()
  // Suppress the "Add Models" footer when the user can't add — they'd land on
  // a settings page where the affordance is also hidden.
  const { isAllowed: canAddModels } = useWorkspacePermission('add_models')

  if (selectedAgent.type !== 'built-in' || models.length === 0) {
    return null
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModel(chatThreadId, modelId).catch(console.error)
  }

  return (
    <ModelSelector
      variant="bordered"
      models={models}
      selectedModel={selectedModel ?? null}
      chatThread={chatThread ?? null}
      onModelChange={handleModelChange}
      onAddModels={canAddModels ? () => navigate('/settings/models') : undefined}
      side={isMobile ? 'top' : 'bottom'}
      align="start"
    />
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

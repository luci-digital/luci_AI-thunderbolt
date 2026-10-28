/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { DeleteAllChatsDialogRef } from '@/components/delete-all-chats-dialog'
import type { DeleteChatDialogRef } from '@/components/delete-chat-dialog'
import type { UseMutationResult } from '@tanstack/react-query'
import type { MouseEvent, RefObject } from 'react'

export type ChatThread = {
  id: string
  title: string | null
  isEncrypted: number
}

export type DeleteChatMutationType = UseMutationResult<void, Error, { id: string }, unknown>

export type DeleteAllChatsMutationType = UseMutationResult<void, Error, void, unknown>

export type ChatActionsProps = {
  isCollapsed: boolean
  debouncedSearchQuery: string
  deleteAllChatsMutation: DeleteAllChatsMutationType
  deleteAllChatsDialogRef: RefObject<DeleteAllChatsDialogRef | null>
  onSearchClick: (e?: MouseEvent) => void
}

export type ChatListProps = {
  chatThreads: ChatThread[]
  currentChatThreadId?: string
  isCollapsed: boolean
  isMobile: boolean
  debouncedSearchQuery: string
  deleteAllChatsMutation: DeleteAllChatsMutationType
  deleteChatMutation: DeleteChatMutationType
  deleteAllChatsDialogRef: RefObject<DeleteAllChatsDialogRef | null>
  deleteChatDialogRef: RefObject<DeleteChatDialogRef | null>
  threadIdRef: RefObject<string | null>
  searchQuery: string
  showSearch: boolean
  searchInputRef: RefObject<HTMLInputElement | null>
  onChatClick: (threadId: string) => void
  onRename: (threadId: string, title: string) => void
  onSearchClick: (e?: MouseEvent) => void
  onSearchQueryChange: (value: string) => void
}

export type ChatListItemProps = {
  thread: ChatThread
  isActive: boolean
  isCollapsed: boolean
  isMobile: boolean
  deleteChatMutation: DeleteChatMutationType
  threadIdRef: RefObject<string | null>
  deleteChatDialogRef: RefObject<DeleteChatDialogRef | null>
  onChatClick: (threadId: string) => void
  onRename: (threadId: string, title: string) => void
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

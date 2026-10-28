/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { DeleteAllChatsDialogRef } from '@/components/delete-all-chats-dialog'
import type { DeleteChatDialogRef } from '@/components/delete-chat-dialog'
import { SidebarFooter } from '@/components/sidebar-footer'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import type { DeleteAllChatsMutationType, DeleteChatMutationType } from '@/layout/sidebar/types'
import type { MouseEvent, RefObject } from 'react'
import { useLocation } from 'react-router'
import { ChatList } from './chat-list'
import { NavigationMenu } from './navigation-menu'
import { SidebarHeader } from './sidebar-header'
import type { ChatThread } from './types'

type ChatSidebarContentProps = {
  isMobile: boolean
  isCollapsed: boolean
  chatThreads: ChatThread[]
  currentChatThreadId?: string
  searchQuery: string
  debouncedSearchQuery: string
  showSearch: boolean
  searchInputRef: RefObject<HTMLInputElement | null>
  deleteAllChatsMutation: DeleteAllChatsMutationType
  deleteChatMutation: DeleteChatMutationType
  deleteAllChatsDialogRef: RefObject<DeleteAllChatsDialogRef | null>
  deleteChatDialogRef: RefObject<DeleteChatDialogRef | null>
  threadIdRef: RefObject<string | null>
  showTasks: boolean
  onCreateNewChat: () => void
  onChatClick: (threadId: string) => void
  onRename: (threadId: string, title: string) => void
  onSearchClick: (e?: MouseEvent) => void
  onSearchQueryChange: (value: string) => void
  onSettingsClick: () => void
}

export const ChatSidebarContent = ({
  isMobile,
  isCollapsed,
  chatThreads,
  currentChatThreadId,
  searchQuery,
  debouncedSearchQuery,
  showSearch,
  searchInputRef,
  deleteAllChatsMutation,
  deleteChatMutation,
  deleteAllChatsDialogRef,
  deleteChatDialogRef,
  threadIdRef,
  showTasks,
  onCreateNewChat,
  onChatClick,
  onRename,
  onSearchClick,
  onSearchQueryChange,
  onSettingsClick,
}: ChatSidebarContentProps) => {
  const { toggleSidebar } = useSidebar()
  const location = useLocation()

  return (
    <SidebarContent className="flex flex-col h-full overflow-hidden">
      <SidebarHeader onToggle={toggleSidebar} />

      <SidebarGroup className="flex-shrink-0">
        <SidebarGroupContent>
          <SidebarMenu>
            <NavigationMenu
              isMobile={isMobile}
              currentPath={location.pathname}
              showTasks={showTasks}
              onCreateNewChat={onCreateNewChat}
              onSettingsClick={onSettingsClick}
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator className="m-0 flex-shrink-0" />

      <ChatList
        chatThreads={chatThreads}
        currentChatThreadId={currentChatThreadId}
        isCollapsed={isCollapsed}
        isMobile={isMobile}
        debouncedSearchQuery={debouncedSearchQuery}
        deleteAllChatsMutation={deleteAllChatsMutation}
        deleteChatMutation={deleteChatMutation}
        deleteAllChatsDialogRef={deleteAllChatsDialogRef}
        deleteChatDialogRef={deleteChatDialogRef}
        threadIdRef={threadIdRef}
        searchQuery={searchQuery}
        showSearch={showSearch}
        searchInputRef={searchInputRef}
        onChatClick={onChatClick}
        onRename={onRename}
        onSearchClick={onSearchClick}
        onSearchQueryChange={onSearchQueryChange}
      />

      <SidebarFooter className="flex-shrink-0" />
    </SidebarContent>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

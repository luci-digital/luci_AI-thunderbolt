/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { NavLink } from '@/components/ui/nav-link'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { stripWorkspacePrefix, useWorkspaceUrl } from '@/lib/active-workspace'
import { CheckSquare, MessageCirclePlus, Settings } from 'lucide-react'

type NavigationMenuProps = {
  isMobile: boolean
  currentPath: string
  showTasks: boolean
  onCreateNewChat: () => void
  onSettingsClick: () => void
}

export const NavigationMenu = ({
  isMobile,
  currentPath,
  showTasks,
  onCreateNewChat,
  onSettingsClick,
}: NavigationMenuProps) => {
  // `isActive` highlighting reads the sub-path so the same matching rules work
  // for both personal (`/tasks`) and shared (`/w/<id>/tasks`) URLs.
  const subPath = stripWorkspacePrefix(currentPath)
  const tasksUrl = useWorkspaceUrl('/tasks')
  const settingsUrl = useWorkspaceUrl('/settings/preferences')
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={onCreateNewChat}
          tooltip="New Chat"
          className="cursor-pointer"
          isActive={subPath === '/chats/new'}
        >
          <MessageCirclePlus className="size-[var(--icon-size-default)]" />
          <span>New Chat</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {showTasks && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Tasks" isActive={subPath.startsWith('/tasks')}>
            <NavLink to={tasksUrl}>
              <CheckSquare className="size-[var(--icon-size-default)]" />
              <span>Tasks</span>
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      <SidebarMenuItem>
        {isMobile ? (
          <SidebarMenuButton
            onClick={onSettingsClick}
            isActive={subPath.startsWith('/settings')}
            className="cursor-pointer"
          >
            <Settings className="size-[var(--icon-size-default)]" />
            <span>Settings</span>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton asChild tooltip="Settings" isActive={subPath.startsWith('/settings')}>
            <NavLink to={settingsUrl}>
              <Settings className="size-[var(--icon-size-default)]" />
              <span>Settings</span>
            </NavLink>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { PowerSyncStatus } from '@/components/powersync-status'
import { useIsMobile } from '@/hooks/use-mobile'
import { PanelLeft } from 'lucide-react'
import { useState } from 'react'
import { WorkspaceSelector } from './workspace-selector'

type SidebarHeaderProps = {
  onToggle: () => void
}

export const SidebarHeader = ({ onToggle }: SidebarHeaderProps) => {
  const { isMobile } = useIsMobile()
  const { state } = useSidebar()
  const [showExpandButton, setShowExpandButton] = useState(false)

  // On mobile, always treat the sidebar as expanded when it's open
  const isExpanded = isMobile || state === 'expanded'

  return (
    <div className="h-[var(--touch-height-xl)] border-b border-border flex items-center px-2 gap-8 flex-shrink-0">
      <div
        className="flex items-center h-8 relative flex-1 min-w-0"
        onMouseEnter={() => !isMobile && !isExpanded && setShowExpandButton(true)}
        onMouseLeave={() => !isMobile && !isExpanded && setShowExpandButton(false)}
      >
        {!isExpanded && showExpandButton ? (
          <SidebarGroup className="p-0 absolute left-0 right-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onToggle} tooltip="Expand Sidebar" className="cursor-pointer">
                    <PanelLeft className="size-[var(--icon-size-default)]" />
                    <span className="sr-only">Expand Sidebar</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <WorkspaceSelector collapsed={!isExpanded} />
        )}
      </div>
      {isExpanded && (
        <div className="flex items-center">
          {isMobile ? (
            <PowerSyncStatus />
          ) : (
            <SidebarGroup className="p-0 w-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem className="w-auto">
                    <SidebarMenuButton
                      onClick={onToggle}
                      tooltip="Toggle Sidebar"
                      className="cursor-pointer size-8 justify-center"
                    >
                      <PanelLeft className="size-[var(--icon-size-default)]" />
                      <span className="sr-only">Toggle Sidebar</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      )}
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { SidebarProvider } from '@/components/ui/sidebar'
import { useSettings } from '@/hooks/use-settings'
import SidebarComponent from '@/layout/sidebar'
import { Outlet } from 'react-router'
import './index.css'

export default function Layout() {
  const { sidebarState } = useSettings({
    sidebar_state: true,
  })

  const open = sidebarState.value
  const setOpen = (value: boolean) => sidebarState.setValue(value)

  // this avoids the sidebar from flashing after load sidebarState
  if (sidebarState.isLoading) {
    return null
  }

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <main className="flex flex-row h-full w-full overflow-hidden">
        <SidebarComponent />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

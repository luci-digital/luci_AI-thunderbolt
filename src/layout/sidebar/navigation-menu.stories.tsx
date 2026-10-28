/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BrowserRouter } from 'react-router'
import { NavigationMenu } from './navigation-menu'

const meta = {
  title: 'layout/sidebar/NavigationMenu',
  component: NavigationMenu,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Navigation menu items for Tasks and Settings.',
      },
    },
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <SidebarProvider>
          <TooltipProvider>
            <div className="w-64 border rounded-lg p-2 bg-sidebar">
              <Story />
            </div>
          </TooltipProvider>
        </SidebarProvider>
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof NavigationMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: {
    isMobile: false,
    currentPath: '/chats/123',
    showTasks: true,
    onCreateNewChat: () => console.log('New chat clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Desktop navigation menu with all items including Tasks feature.',
      },
    },
  },
}

export const DesktopWithoutTasks: Story = {
  args: {
    isMobile: false,
    currentPath: '/chats/123',
    showTasks: false,
    onCreateNewChat: () => console.log('New chat clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Desktop navigation menu without experimental Tasks feature.',
      },
    },
  },
}

export const Mobile: Story = {
  args: {
    isMobile: true,
    currentPath: '/chats/123',
    showTasks: true,
    onCreateNewChat: () => console.log('New chat clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile navigation menu - Settings uses onClick instead of NavLink.',
      },
    },
  },
}

export const OnSettingsPage: Story = {
  args: {
    isMobile: false,
    currentPath: '/settings/preferences',
    showTasks: true,
    onCreateNewChat: () => console.log('New chat clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigation menu when on a Settings page (active state).',
      },
    },
  },
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

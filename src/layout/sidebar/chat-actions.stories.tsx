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
import { ChatActions } from './chat-actions'

const meta = {
  title: 'layout/sidebar/ChatActions',
  component: ChatActions,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Action buttons for searching chats and clearing all chats.',
      },
    },
  },
  decorators: [
    (Story) => (
      <SidebarProvider>
        <TooltipProvider>
          <div className="w-64 border rounded-lg p-2 bg-sidebar">
            <Story />
          </div>
        </TooltipProvider>
      </SidebarProvider>
    ),
  ],
} satisfies Meta<typeof ChatActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isCollapsed: false,
    debouncedSearchQuery: '',
    deleteAllChatsMutation: {
      mutate: () => console.log('Delete all clicked'),
      isPending: false,
    } as any,
    deleteAllChatsDialogRef: {
      current: { open: () => console.log('Open dialog'), close: () => console.log('Close dialog') },
    } as any,
    onSearchClick: () => console.log('Search clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state with search and clear all buttons.',
      },
    },
  },
}

export const WithActiveSearch: Story = {
  args: {
    isCollapsed: false,
    debouncedSearchQuery: 'test query',
    deleteAllChatsMutation: {
      mutate: () => console.log('Delete all clicked'),
      isPending: false,
    } as any,
    deleteAllChatsDialogRef: {
      current: { open: () => console.log('Open dialog'), close: () => console.log('Close dialog') },
    } as any,
    onSearchClick: () => console.log('Search clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'State when a search query is active (search icon highlighted).',
      },
    },
  },
}

export const DeletingAllChats: Story = {
  args: {
    isCollapsed: false,
    debouncedSearchQuery: '',
    deleteAllChatsMutation: {
      mutate: () => console.log('Delete all clicked'),
      isPending: true,
    } as any,
    deleteAllChatsDialogRef: {
      current: { open: () => console.log('Open dialog'), close: () => console.log('Close dialog') },
    } as any,
    onSearchClick: () => console.log('Search clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'State when deletion is in progress (showing spinner).',
      },
    },
  },
}

export const Collapsed: Story = {
  args: {
    isCollapsed: true,
    debouncedSearchQuery: '',
    deleteAllChatsMutation: {
      mutate: () => console.log('Delete all clicked'),
      isPending: false,
    } as any,
    deleteAllChatsDialogRef: {
      current: { open: () => console.log('Open dialog'), close: () => console.log('Close dialog') },
    } as any,
    onSearchClick: () => console.log('Search clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'When sidebar is collapsed, actions are hidden (returns null).',
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

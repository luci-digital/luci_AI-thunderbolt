/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { AppErrorScreen } from './app-error-screen'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HandleError } from '@/types/handle-errors'
import { createHandleError } from '@/lib/error-utils'

const meta: Meta<typeof AppErrorScreen> = {
  title: 'Components/AppErrorScreen',
  component: AppErrorScreen,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    error: {
      control: 'object',
    },
    isClearingDatabase: {
      control: 'boolean',
    },
    onClearDatabase: {
      action: 'clearDatabase',
    },
  },
}

export default meta
type Story = StoryObj<typeof AppErrorScreen>

const createError = (code: HandleError['code'], message: string): HandleError =>
  createHandleError(code, message, new Error('Test error'))

export const DatabaseError: Story = {
  args: {
    error: createError('MIGRATION_FAILED', 'Failed to run database migrations'),
    isClearingDatabase: false,
  },
}

export const DatabaseErrorClearing: Story = {
  args: {
    error: createError('MIGRATION_FAILED', 'Failed to run database migrations'),
    isClearingDatabase: true,
  },
}

export const DatabaseInitError: Story = {
  args: {
    error: createError('DATABASE_INIT_FAILED', 'Failed to initialize database'),
    isClearingDatabase: false,
  },
}

export const PostHogError: Story = {
  args: {
    error: createError('POSTHOG_FETCH_FAILED', 'Failed to initialize analytics'),
    isClearingDatabase: false,
  },
}

export const AppDirError: Story = {
  args: {
    error: createError('APP_DIR_CREATION_FAILED', 'Failed to create app directory'),
    isClearingDatabase: false,
  },
}

export const ReconcileDefaultsError: Story = {
  args: {
    error: createError('RECONCILE_DEFAULTS_FAILED', 'Failed to reconcile default settings'),
    isClearingDatabase: false,
  },
}

export const DatabasePathError: Story = {
  args: {
    error: createError('DATABASE_PATH_FAILED', 'Failed to resolve database path'),
    isClearingDatabase: false,
  },
}

export const UnknownError: Story = {
  args: {
    error: createError('UNKNOWN_ERROR', 'An unexpected error occurred during initialization'),
    isClearingDatabase: false,
  },
}

export const LongErrorMessage: Story = {
  args: {
    error: createError(
      'MIGRATION_FAILED',
      'Failed to run database migrations: SQLite error: database is locked. This usually happens when another process is accessing the database file or when the database is in an inconsistent state. Please try again or contact support if the issue persists.',
    ),
    isClearingDatabase: false,
  },
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

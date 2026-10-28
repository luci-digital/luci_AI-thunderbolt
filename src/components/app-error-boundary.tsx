/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AppErrorScreen } from './app-error-screen'

type AppErrorBoundaryState = {
  error: Error | null
}

/**
 * Catches uncaught render-time errors so a failed bootstrap (e.g. the
 * `SessionToWorkspaceBootstrap` throw in `auth-context.tsx`) lands on an
 * actionable error screen instead of a blank page. Mounted just above
 * `BrowserRouter` so the boundary scope covers every route.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AppErrorBoundary] Uncaught render error:', error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (error) {
      return (
        <AppErrorScreen
          error={{
            code: 'UNKNOWN_ERROR',
            message: error.message,
            stackTrace: error.stack,
            originalError: error,
          }}
          isClearingDatabase={false}
          // Reload as the universal recovery for non-DB render errors. The DB
          // wipe affordance is gated inside AppErrorScreen on init-specific
          // error codes and doesn't render for UNKNOWN_ERROR.
          onClearDatabase={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

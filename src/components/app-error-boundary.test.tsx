/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { setupConsoleSpy, type ConsoleSpies } from '@/test-utils/console-spies'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { AppErrorBoundary } from './app-error-boundary'

const Boom = ({ message }: { message: string }) => {
  throw new Error(message)
}

describe('AppErrorBoundary', () => {
  let consoleSpies: ConsoleSpies

  beforeEach(() => {
    consoleSpies = setupConsoleSpy()
  })

  afterEach(() => {
    consoleSpies.restore()
  })

  it('renders the children when no error is thrown', () => {
    render(
      <AppErrorBoundary>
        <span>OK</span>
      </AppErrorBoundary>,
    )
    expect(screen.getByText('OK')).toBeInTheDocument()
  })

  it('renders AppErrorScreen with the caught message when a child throws', () => {
    render(
      <AppErrorBoundary>
        <Boom message="bootstrap failed" />
      </AppErrorBoundary>,
    )
    expect(screen.getByText('Failed to initialize app')).toBeInTheDocument()
    expect(screen.getByText('bootstrap failed')).toBeInTheDocument()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

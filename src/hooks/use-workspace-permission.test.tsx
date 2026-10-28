/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { DatabaseProvider } from '@/contexts'
import { otherWsId, resetTestDatabase, setupTestDatabase, teardownTestDatabase, testUserId } from '@/dal/test-utils'
import { getDb } from '@/db/database'
import { workspaceMembershipsTable, workspacePermissionsTable, workspacesTable } from '@/db/tables'
import {
  renderWithReactivity,
  resetTestTrustDomain,
  seedTestTrustDomain,
  waitForElement,
} from '@/test-utils/powersync-reactivity-test'
import '@testing-library/jest-dom'
import { cleanup, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import type { ReactNode } from 'react'
import { useWorkspacePermission } from './use-workspace-permission'

const DbWrapper = ({ children }: { children: ReactNode }) => (
  <DatabaseProvider db={getDb()}>{children}</DatabaseProvider>
)

const Probe = () => {
  const { requiredRole, isAllowed, isResolved } = useWorkspacePermission('manage_members')
  return (
    <div>
      <span data-testid="required-role">{requiredRole}</span>
      <span data-testid="is-allowed">{String(isAllowed)}</span>
      <span data-testid="is-resolved">{String(isResolved)}</span>
    </div>
  )
}

const seedWorkspace = async () => {
  await getDb().insert(workspacesTable).values({ id: otherWsId, name: 'Acme', isPersonal: 0, ownerUserId: null })
}

const seedMembership = async (role: 'admin' | 'member') => {
  await getDb()
    .insert(workspaceMembershipsTable)
    .values({ id: `${otherWsId}-${testUserId}`, workspaceId: otherWsId, userId: testUserId, role })
}

const seedPermission = async (key: 'manage_members' | 'change_roles', requiredRole: 'admin' | 'member') => {
  await getDb()
    .insert(workspacePermissionsTable)
    .values({ id: `${otherWsId}-${key}`, workspaceId: otherWsId, permissionKey: key, requiredRole })
}

describe('useWorkspacePermission', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await resetTestDatabase()
    seedTestTrustDomain()
  })

  afterEach(() => {
    resetTestTrustDomain()
    cleanup()
  })

  it('defaults requiredRole to admin when no permission row exists', async () => {
    await seedWorkspace()
    await seedMembership('admin')

    renderWithReactivity(<Probe />, {
      route: `/w/${otherWsId}/settings/workspace/members`,
      routePath: '/*',
      tables: ['workspace_memberships', 'workspace_permissions'],
      wrapper: DbWrapper,
    })

    await waitForElement(() =>
      screen.getByTestId('is-resolved').textContent === 'true' ? screen.getByTestId('is-resolved') : null,
    )
    expect(screen.getByTestId('required-role').textContent).toBe('admin')
    expect(screen.getByTestId('is-allowed').textContent).toBe('true')
  })

  it('denies a member when requiredRole defaults to admin', async () => {
    await seedWorkspace()
    await seedMembership('member')

    renderWithReactivity(<Probe />, {
      route: `/w/${otherWsId}/settings/workspace/members`,
      routePath: '/*',
      tables: ['workspace_memberships', 'workspace_permissions'],
      wrapper: DbWrapper,
    })

    await waitForElement(() =>
      screen.getByTestId('is-resolved').textContent === 'true' ? screen.getByTestId('is-resolved') : null,
    )
    expect(screen.getByTestId('is-allowed').textContent).toBe('false')
  })

  it('lets a member through when an explicit row sets requiredRole=member', async () => {
    await seedWorkspace()
    await seedMembership('member')
    await seedPermission('manage_members', 'member')

    renderWithReactivity(<Probe />, {
      route: `/w/${otherWsId}/settings/workspace/members`,
      routePath: '/*',
      tables: ['workspace_memberships', 'workspace_permissions'],
      wrapper: DbWrapper,
    })

    await waitForElement(() =>
      screen.getByTestId('required-role').textContent === 'member' ? screen.getByTestId('required-role') : null,
    )
    expect(screen.getByTestId('is-allowed').textContent).toBe('true')
  })

  it('reports isResolved=false until membership lands', async () => {
    // Workspace exists but no membership row — `isResolved` should remain false.
    await seedWorkspace()

    renderWithReactivity(<Probe />, {
      route: `/w/${otherWsId}/settings/workspace/members`,
      routePath: '/*',
      tables: ['workspace_memberships', 'workspace_permissions'],
      wrapper: DbWrapper,
    })

    // We can't easily prove a "never resolves" state in a finite test, but we
    // can assert that without a membership row the probe sticks at false.
    await waitForElement(() => screen.getByTestId('is-resolved'))
    expect(screen.getByTestId('is-resolved').textContent).toBe('false')
    expect(screen.getByTestId('is-allowed').textContent).toBe('false')
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { getDb } from '@/db/database'
import { workspacePermissionsTable } from '@/db/tables'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import { getRequiredRoleForPermission, setWorkspacePermissionRequiredRole } from './workspace-permissions'
import { otherWsId, resetTestDatabase, setupTestDatabase, teardownTestDatabase, wsId } from './test-utils'

beforeAll(async () => {
  await setupTestDatabase()
})

afterAll(async () => {
  await teardownTestDatabase()
})

describe('Workspace Permissions DAL', () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })

  describe('setWorkspacePermissionRequiredRole', () => {
    it('updates the existing row when one is present, keeping its id', async () => {
      const db = getDb()
      const existingId = uuidv7()
      await db.insert(workspacePermissionsTable).values({
        id: existingId,
        workspaceId: wsId,
        permissionKey: 'manage_members',
        requiredRole: 'admin',
      })

      await setWorkspacePermissionRequiredRole(db, wsId, 'manage_members', 'member')

      const rows = await db
        .select()
        .from(workspacePermissionsTable)
        .where(
          and(
            eq(workspacePermissionsTable.workspaceId, wsId),
            eq(workspacePermissionsTable.permissionKey, 'manage_members'),
          ),
        )
        .all()
      expect(rows).toHaveLength(1)
      expect(rows[0]?.id).toBe(existingId)
      expect(rows[0]?.requiredRole).toBe('member')
    })

    it('inserts a new row when none exists for the (workspaceId, permissionKey) pair', async () => {
      const db = getDb()

      await setWorkspacePermissionRequiredRole(db, wsId, 'change_roles', 'member')

      const value = await getRequiredRoleForPermission(db, wsId, 'change_roles')
      expect(value).toBe('member')
      const rows = await db
        .select()
        .from(workspacePermissionsTable)
        .where(
          and(
            eq(workspacePermissionsTable.workspaceId, wsId),
            eq(workspacePermissionsTable.permissionKey, 'change_roles'),
          ),
        )
        .all()
      expect(rows).toHaveLength(1)
      expect(rows[0]?.id).toBeDefined()
    })

    it('does not affect rows for other workspaces or other permission keys', async () => {
      const db = getDb()
      const otherKeyId = uuidv7()
      const otherWsRowId = uuidv7()
      await db.insert(workspacePermissionsTable).values([
        // Same workspace, different key — must stay untouched.
        {
          id: otherKeyId,
          workspaceId: wsId,
          permissionKey: 'change_roles',
          requiredRole: 'admin',
        },
        // Different workspace, same key — must stay untouched.
        {
          id: otherWsRowId,
          workspaceId: otherWsId,
          permissionKey: 'manage_members',
          requiredRole: 'admin',
        },
      ])

      await setWorkspacePermissionRequiredRole(db, wsId, 'manage_members', 'member')

      expect(await getRequiredRoleForPermission(db, wsId, 'change_roles')).toBe('admin')
      expect(await getRequiredRoleForPermission(db, otherWsId, 'manage_members')).toBe('admin')
      expect(await getRequiredRoleForPermission(db, wsId, 'manage_members')).toBe('member')
    })
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

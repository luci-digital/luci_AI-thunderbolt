/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { db as DbType } from '@/db/client'
import { workspaceMembersTable } from '@/db/powersync-schema'
import { and, eq, isNull } from 'drizzle-orm'

/**
 * Returns true if the user has a `workspace_members` row in the workspace with `removed_at IS NULL`.
 * The PowerSync upload handler uses this on every PUT to workspace-scoped tables; the REST
 * workspace endpoints will use it in the `workspaceAuth` middleware (BE-3).
 */
export const isActiveWorkspaceMember = async (
  database: typeof DbType,
  workspaceId: string,
  userId: string,
): Promise<boolean> => {
  const rows = await database
    .select({ workspaceId: workspaceMembersTable.workspaceId })
    .from(workspaceMembersTable)
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.userId, userId),
        isNull(workspaceMembersTable.removedAt),
      ),
    )
    .limit(1)

  return rows.length > 0
}

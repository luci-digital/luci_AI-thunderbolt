/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useDatabase } from '@/contexts'
import { getRemoteMcpServers } from '@/dal'
import { useActiveWorkspaceId } from '@/lib/active-workspace'
import { useMCP } from '@/lib/mcp-provider'
import { toCompilableQuery } from '@powersync/drizzle-driver'
import { useQuery } from '@powersync/tanstack-react-query'
import { useEffect } from 'react'

export const useMcpSync = () => {
  const db = useDatabase()
  const workspaceId = useActiveWorkspaceId()
  const { servers, addServer, removeServer, updateServerStatus } = useMCP()

  const { data: dbServers = [] } = useQuery({
    queryKey: ['mcp-servers', workspaceId],
    query: toCompilableQuery(getRemoteMcpServers(db, workspaceId ?? '')),
    enabled: !!workspaceId,
  })

  // Sync database servers with MCP provider
  useEffect(() => {
    const syncServers = async () => {
      // Get current server IDs in the provider
      const providerServerIds = new Set(servers.map((s) => s.id))

      // Add new servers from database that aren't in provider
      for (const dbServer of dbServers) {
        if (!providerServerIds.has(dbServer.id)) {
          await addServer({
            id: dbServer.id,
            name: dbServer.name ?? '',
            url: dbServer.url || '',
            type: dbServer.type === 'sse' ? 'sse' : 'http',
            enabled: dbServer.enabled === 1,
          })
        }
      }

      // Remove servers from provider that aren't in database
      const dbServerIds = new Set(dbServers.map((s) => s.id))
      for (const providerServer of servers) {
        if (!dbServerIds.has(providerServer.id)) {
          removeServer(providerServer.id)
        }
      }

      // Update server status for existing servers
      for (const dbServer of dbServers) {
        const providerServer = servers.find((s) => s.id === dbServer.id)
        if (providerServer && providerServer.enabled !== (dbServer.enabled === 1)) {
          updateServerStatus(dbServer.id, dbServer.enabled === 1)
        }
      }
    }

    syncServers()
  }, [dbServers, servers, addServer, removeServer, updateServerStatus])

  return { servers, dbServers }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { Settings } from '@/config/settings'
import { safeErrorHandler } from '@/middleware/error-handling'
import { Elysia } from 'elysia'

/**
 * Public app config — the single source of deployment-level UI capability flags
 * (no auth, fetched at boot). The frontend mirrors this into its config store and
 * falls back to the cached value when offline (standalone mode keeps working).
 */
export const createConfigRoutes = (settings: Settings) =>
  new Elysia({ prefix: '/config' }).onError(safeErrorHandler).get('/', () => ({
    serverId: settings.serverId,
    e2eeEnabled: settings.e2eeEnabled,
    allowAnonUsers: settings.authAllowAnonymous,
    allowWorkspaceCreationByAnon: settings.allowWorkspaceCreationByAnon,
    allowWorkspaceCreationByMembers: settings.allowWorkspaceCreationByMembers,
    allowUserScopedResources: settings.allowUserScopedResources,
    // Inverted so the env reads as an opt-in switch ("disable") while the wire
    // contract reads as a positive capability ("enabled").
    builtInAgentEnabled: !settings.disableBuiltInAgent,
    allowCustomAgents: settings.allowCustomAgents,
    // Omit when unset so the frontend treats it as "no enforcement" without parsing an empty string as semver.
    minAppVersion: settings.minAppVersion || undefined,
  }))

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

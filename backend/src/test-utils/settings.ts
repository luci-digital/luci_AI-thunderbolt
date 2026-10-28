/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { Settings } from '@/config/settings'

/**
 * Creates a fully-populated `Settings` object for tests.
 * Pass `overrides` to set specific fields; everything else gets safe defaults
 * matching the schema in `@/config/settings`.
 */
export const createTestSettings = (overrides: Partial<Settings> = {}): Settings => ({
  serverId: '00000000-0000-0000-0000-000000000000',
  fireworksApiKey: '',
  mistralApiKey: '',
  anthropicApiKey: '',
  exaApiKey: '',
  tinfoilApiKey: '',
  tinfoilEnclaveUrl: 'https://inference.tinfoil.sh/v1',
  monitoringToken: '',
  googleClientId: '',
  googleClientSecret: '',
  microsoftClientId: '',
  microsoftClientSecret: '',
  authMode: 'consumer' as const,
  authAllowAnonymous: false,
  allowWorkspaceCreationByAnon: false,
  allowWorkspaceCreationByMembers: false,
  allowUserScopedResources: true,
  oidcClientId: '',
  oidcClientSecret: '',
  oidcIssuer: '',
  oidcDiscoveryUrl: '',
  samlEntryPoint: '',
  samlEntityId: '',
  samlIdpIssuer: '',
  samlCert: '',
  betterAuthUrl: 'http://localhost:8000',
  betterAuthSecret: 'test-secret-at-least-32-chars-long!!',
  logLevel: 'INFO' as const,
  port: 8000,
  appUrl: 'http://localhost:1420',
  posthogHost: 'https://us.i.posthog.com',
  posthogApiKey: '',
  waitlistEnabled: false,
  waitlistAutoApproveDomains: '',
  powersyncUrl: '',
  powersyncJwtKid: '',
  powersyncJwtSecret: '',
  powersyncTokenExpirySeconds: 3600,
  corsOrigins: 'http://localhost:1420',
  corsAllowCredentials: true,
  corsAllowMethods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
  corsAllowHeaders: 'Content-Type,Authorization',
  corsExposeHeaders: '',
  e2eeEnabled: false,
  swaggerEnabled: false,
  rateLimitEnabled: false,
  trustedProxy: '' as const,
  enabledAgents: '',
  allowCustomAgents: true,
  disableBuiltInAgent: false,
  haystackBaseUrl: '',
  haystackApiKey: '',
  haystackWorkspace: '',
  haystackPipelines: '',
  minAppVersion: '',
  ...overrides,
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

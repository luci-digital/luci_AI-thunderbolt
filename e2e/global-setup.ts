/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { OAuth2Server } from 'oauth2-mock-server'
import { createMockSamlIdp } from './mock-saml-idp'

const mockOidcPort = Number(process.env.MOCK_OIDC_PORT ?? 9876)
const mockSamlPort = Number(process.env.MOCK_SAML_PORT ?? 9877)

const globalSetup = async () => {
  // --- Mock OIDC server ---
  const oidcServer = new OAuth2Server()
  await oidcServer.issuer.keys.generate('RS256')

  oidcServer.service.on('beforeTokenSigning', (token: Record<string, unknown>) => {
    token.sub = 'e2e-test-user'
    token.email = 'e2e@thunderbolt.test'
    token.name = 'E2E Test User'
    token.email_verified = true
  })

  oidcServer.service.on(
    'beforeUserinfo',
    (userInfoResponse: { body: Record<string, unknown>; statusCode: number }) => {
      userInfoResponse.body = {
        sub: 'e2e-test-user',
        email: 'e2e@thunderbolt.test',
        name: 'E2E Test User',
        email_verified: true,
      }
    },
  )

  await oidcServer.start(mockOidcPort, 'localhost')
  console.log(`Mock OIDC server started on port ${mockOidcPort}`)

  // --- Mock SAML IdP ---
  const samlServer = await createMockSamlIdp(mockSamlPort)

  // Store references for teardown
  ;(globalThis as Record<string, unknown>).__oidcServer = oidcServer
  ;(globalThis as Record<string, unknown>).__samlServer = samlServer
}

export default globalSetup

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

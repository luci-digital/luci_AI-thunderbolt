/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { getIntegrationCredentials, updateIntegrationCredentials } from '@/dal'
import { getDb } from '@/db/database'
import { refreshAccessToken, type OAuthProvider } from '@/lib/auth'
import type { HttpClient } from '@/lib/http'

export type OAuthCredentials = {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

/**
 * Retrieve stored OAuth credentials for the given provider.
 * Throws if the integration has not been connected yet.
 */
export const getOAuthCredentials = async (provider: OAuthProvider): Promise<OAuthCredentials> => {
  const db = getDb()
  const row = await getIntegrationCredentials(db, provider)
  if (!row) {
    throw new Error(`${provider} integration not connected`)
  }
  return row.credentials
}

/**
 * Check whether a token is still valid with a 60-second safety buffer.
 * Returns true when the token can be reused without refreshing.
 */
export const isTokenFresh = (expiresAt: number | undefined, now: number = Date.now()): boolean =>
  expiresAt !== undefined && expiresAt - 60_000 > now

/**
 * Ensure that we have a valid OAuth access token, refreshing it if necessary.
 * If refreshed, the stored credentials are updated automatically.
 */
export const ensureValidOAuthToken = async (
  httpClient: HttpClient,
  provider: OAuthProvider,
  credentials: OAuthCredentials,
): Promise<string> => {
  if (isTokenFresh(credentials.expires_at)) {
    return credentials.access_token
  }

  if (!credentials.refresh_token) {
    throw new Error('Access token expired and no refresh token available')
  }

  const newTokens = await refreshAccessToken(httpClient, provider, credentials.refresh_token)
  const updated: OAuthCredentials = {
    ...credentials,
    access_token: newTokens.access_token,
    expires_at: Date.now() + newTokens.expires_in * 1000,
  }

  const db = getDb()
  await updateIntegrationCredentials(db, provider, updated)

  return updated.access_token
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

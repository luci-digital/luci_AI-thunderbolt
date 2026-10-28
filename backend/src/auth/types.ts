/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { z } from 'zod'

/**
 * Standard OAuth token response schema
 */
export const oauthTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().nullable().optional(),
  expires_in: z.number(),
  token_type: z.string(),
  scope: z.string().nullable().optional(),
})

export type OAuthTokenResponse = z.infer<typeof oauthTokenResponseSchema>

/**
 * Request body schema for exchanging authorization codes
 */
export const codeRequestSchema = z.object({
  code: z.string(),
  code_verifier: z.string(),
  redirect_uri: z.string(),
})

export type CodeRequest = z.infer<typeof codeRequestSchema>

/**
 * Request body schema for refreshing tokens
 */
export const refreshRequestSchema = z.object({
  refresh_token: z.string(),
})

export type RefreshRequest = z.infer<typeof refreshRequestSchema>

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

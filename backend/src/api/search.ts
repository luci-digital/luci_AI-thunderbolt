/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { Auth } from '@/auth/elysia-plugin'
import { createAuthMacro } from '@/auth/elysia-plugin'
import { safeErrorHandler } from '@/middleware/error-handling'
import { getExaClient } from '@/pro/exa'
import { ensureHttps } from '@/utils/url-validation'
import { deriveFaviconUrl } from '@shared/url'
import { Elysia, t, type AnyElysia } from 'elysia'
import type { Exa } from 'exa-js'

export type SearchResultDto = {
  title: string
  pageUrl: string
  faviconUrl: string | null
  previewImageUrl: string | null
}

export type SearchResponseDto = {
  results: SearchResultDto[]
}

/** A stubbed Exa client shape used by tests via `createApp({ searchExaClient })`.
 *  Matches the structural surface we actually call. */
export type SearchExaClient = { search: Exa['search'] }

type SearchDeps = { exaClient?: SearchExaClient | null }

export const createSearchRoutes = (auth: Auth, rateLimit?: AnyElysia, deps: SearchDeps = {}) =>
  new Elysia({ name: 'search-routes' })
    .onError(safeErrorHandler)
    .use(createAuthMacro(auth))
    .guard({ auth: true }, (g) => {
      if (rateLimit) {
        g.use(rateLimit)
      }
      return g.get(
        '/search',
        async ({ query, set }): Promise<SearchResponseDto | { error: string }> => {
          const client = deps.exaClient ?? getExaClient()
          if (!client) {
            set.status = 503
            return { error: 'Search service is not configured' }
          }

          const limit = query.limit ? Math.min(Math.max(query.limit, 1), 25) : 10
          const response = await client.search(query.q, {
            numResults: limit,
            useAutoprompt: true,
            type: 'fast',
          })

          const results: SearchResultDto[] = []
          for (const r of response.results) {
            const pageUrl = ensureHttps(r.url)
            if (!pageUrl) {
              continue
            }
            const faviconUrl = ensureHttps(r.favicon ?? null) ?? deriveFaviconUrl(pageUrl)
            const previewImageUrl = ensureHttps(r.image ?? null)
            results.push({
              title: r.title ?? new URL(pageUrl).hostname,
              pageUrl,
              faviconUrl,
              previewImageUrl,
            })
          }

          return { results }
        },
        {
          query: t.Object({
            q: t.String(),
            limit: t.Optional(t.Numeric()),
          }),
        },
      )
    })

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

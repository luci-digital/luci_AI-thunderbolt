/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import {
  SiCloudflare,
  SiGithub,
  SiLinear,
  SiNotion,
  SiRender,
  SiSentry,
  SiStripe,
  SiSupabase,
  SiVercel,
} from '@icons-pack/react-simple-icons'
import { Blocks } from 'lucide-react'
import { describe, expect, it } from 'bun:test'
import { getMcpIcon } from './mcp-icons'

describe('getMcpIcon', () => {
  it('maps known brand domains to their icon', () => {
    expect(getMcpIcon('https://mcp.linear.app/sse').icon).toBe(SiLinear)
    expect(getMcpIcon('https://github.com').icon).toBe(SiGithub)
    expect(getMcpIcon('https://notion.so/mcp').icon).toBe(SiNotion)
    expect(getMcpIcon('https://render.com').icon).toBe(SiRender)
    expect(getMcpIcon('https://sentry.io').icon).toBe(SiSentry)
    expect(getMcpIcon('https://supabase.com').icon).toBe(SiSupabase)
    expect(getMcpIcon('https://vercel.com').icon).toBe(SiVercel)
    expect(getMcpIcon('https://cloudflare.com').icon).toBe(SiCloudflare)
    expect(getMcpIcon('https://stripe.com').icon).toBe(SiStripe)
  })

  it('maps domain aliases to the canonical brand icon', () => {
    expect(getMcpIcon('https://api.githubcopilot.com/mcp').icon).toBe(SiGithub)
    expect(getMcpIcon('https://www.notion.com/mcp').icon).toBe(SiNotion)
  })

  it('matches subdomains of a known domain', () => {
    expect(getMcpIcon('https://api.github.com/mcp').icon).toBe(SiGithub)
    expect(getMcpIcon('https://mcp.sentry.io').icon).toBe(SiSentry)
  })

  it('does not match a domain merely contained in another host', () => {
    // notgithub.com must not match github.com
    expect(getMcpIcon('https://notgithub.com').icon).toBe(Blocks)
    // github.com.evil.example must not match github.com
    expect(getMcpIcon('https://github.com.evil.example').icon).toBe(Blocks)
  })

  it('falls back to the monochrome Blocks glyph for unknown / self-hosted hosts', () => {
    expect(getMcpIcon('https://mcp.internal.acme.corp').icon).toBe(Blocks)
    expect(getMcpIcon('https://example.com').icon).toBe(Blocks)
  })

  it('tolerates bare hosts without a scheme', () => {
    expect(getMcpIcon('linear.app').icon).toBe(SiLinear)
    expect(getMcpIcon('api.github.com/mcp').icon).toBe(SiGithub)
  })

  it('falls back when the URL is empty or unparseable', () => {
    expect(getMcpIcon('').icon).toBe(Blocks)
    expect(getMcpIcon('   ').icon).toBe(Blocks)
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

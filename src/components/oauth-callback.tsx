/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { isMcpOAuthCallback } from '@/lib/mcp-auth/mcp-oauth-state'
import { getOAuthState } from '@/lib/oauth-state'
import Loading from '@/loading'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export default function OAuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Parse the URL parameters
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    // RFC 9207 issuer identifier — forwarded for MCP OAuth callbacks that must
    // validate it against the discovered authorization server. Harmless for the
    // integrations flow, which ignores it.
    const iss = params.get('iss')
    const error = params.get('error')
    const errorDescription = params.get('error_description')
    // Single error signal — some authorization servers send only
    // `error_description`. The popup message, the MCP routing claim, and the
    // navigation payload must all share this one value: claiming on the raw
    // `error` while the payload coalesces would misroute description-only MCP
    // errors to the integrations flow, leaving the MCP handshake pending.
    const oauthError = errorDescription || error

    // Send message to parent window if this was opened as a popup
    if (window.opener && !window.opener.closed) {
      if (oauthError) {
        window.opener.postMessage(
          {
            type: 'oauth-callback',
            error: oauthError,
          },
          window.location.origin,
        )
      } else if (code && state) {
        window.opener.postMessage(
          {
            type: 'oauth-callback',
            code,
            state,
          },
          window.location.origin,
        )
      }

      // Close this window after a short delay
      setTimeout(() => {
        window.close()
      }, 1000)
    } else {
      /**
       * defer OAuth redirect to fix the race condition issue
       */
      const t = setTimeout(async () => {
        const oauthPayload = { code, state, iss, error: oauthError }

        // An MCP OAuth callback is claimed by handshake ownership (nonce match,
        // or an otherwise-unattributable error redirect while an MCP handshake is
        // pending), independent of the shared return-context slot — so a
        // concurrent integrations flow can't misroute it to the wrong page.
        if (isMcpOAuthCallback({ code, state, error: oauthError })) {
          navigate('/settings/mcp-servers', { state: { oauth: oauthPayload } })
          return
        }

        const oauthState = await getOAuthState()
        const returnContext = oauthState.returnContext

        if (returnContext?.startsWith('/') && !returnContext.startsWith('//')) {
          navigate(returnContext, { state: { oauth: oauthPayload } })
        } else if (returnContext === 'onboarding') {
          navigate('/chats/new', { state: { oauth: oauthPayload } })
        } else {
          navigate('/settings/integrations', { state: { oauth: oauthPayload } })
        }
      }, 500)

      return () => clearTimeout(t)
    }
  }, [navigate])

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <Loading />
      </div>
    </div>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

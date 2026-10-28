/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Button } from '@/components/ui/button'
import { useOAuthConnect } from '@/hooks/use-oauth-connect'
import { type OAuthProvider } from '@/lib/auth'
import { Check, Loader2, X } from 'lucide-react'
import { useState } from 'react'

type ConnectProviderButtonProps = {
  provider: OAuthProvider
  isConnected?: boolean
  isProcessing?: boolean
  onSuccess?: () => void
  onError?: (error: Error) => void
  onDisconnect?: () => void
  setPreferredName?: boolean
  returnContext?: 'onboarding' | 'integrations'
  className?: string
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  connectLabel?: string
  connectingLabel?: string
  connectedLabel?: string
  allowDisconnect?: boolean
  // Optional dependency injection for testing
  useOAuthConnectHook?: typeof useOAuthConnect
}

/**
 * Reusable button for connecting OAuth providers (Google, Microsoft)
 */
export const ConnectProviderButton = ({
  provider,
  isConnected = false,
  isProcessing = false,
  onSuccess,
  onError,
  onDisconnect,
  setPreferredName = false,
  returnContext = 'integrations',
  className,
  variant,
  size,
  connectLabel,
  connectingLabel = 'Connecting...',
  connectedLabel = 'Connected!',
  allowDisconnect = false,
  useOAuthConnectHook,
}: ConnectProviderButtonProps) => {
  const [isHovered, setIsHovered] = useState(false)

  // Use injected hook for testing, or real implementation in production
  const oauthHook = useOAuthConnectHook ?? useOAuthConnect
  const { connect, isConnecting: isConnectingFromHook } = oauthHook({
    connectingKey: provider,
    onSuccess,
    onError,
    setPreferredName,
    returnContext,
  })

  const isConnecting = isConnectingFromHook || isProcessing

  const handleClick = async () => {
    if (isConnected && allowDisconnect) {
      onDisconnect?.()
      return
    }
    if (isConnected || isConnecting) {
      return
    }

    await connect(provider)
  }

  const providerName = provider === 'microsoft' ? 'Microsoft' : 'Google'
  const defaultConnectLabel = connectLabel || `Connect ${providerName}`

  const showDisconnect = isConnected && allowDisconnect && isHovered

  return (
    <Button
      onClick={handleClick}
      disabled={isConnecting || (isConnected && !allowDisconnect)}
      variant={isConnected ? 'ghost' : variant}
      size={size}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isConnected ? (
        showDisconnect ? (
          <>
            <X className="w-4 h-4 mr-2" />
            Disconnect
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2 text-green-600" />
            {connectedLabel}
          </>
        )
      ) : isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {connectingLabel}
        </>
      ) : (
        defaultConnectLabel
      )}
    </Button>
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

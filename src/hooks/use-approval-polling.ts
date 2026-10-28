/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useEffect, useRef, useState } from 'react'
import { HttpError } from '@/lib/http'

type UseApprovalPollingOptions = {
  enabled: boolean
  checkApproval: () => Promise<boolean>
  onApproved: () => void
  onRevoked?: () => void
  onDenied?: () => void
  intervalMs?: number
}

/**
 * Polls to detect when this device has been approved by a trusted device.
 * Calls `checkApproval` at a regular interval; on success, fires `onApproved`.
 * If a 403 is received (device revoked), fires `onRevoked` and stops polling.
 * Other errors are silently ignored — the manual Continue button serves as fallback.
 */
export const useApprovalPolling = ({
  enabled,
  checkApproval,
  onApproved,
  onRevoked,
  onDenied,
  intervalMs = 3000,
}: UseApprovalPollingOptions) => {
  const [isPolling, setIsPolling] = useState(false)
  const isCheckingRef = useRef(false)
  const onApprovedRef = useRef(onApproved)
  onApprovedRef.current = onApproved
  const onRevokedRef = useRef(onRevoked)
  onRevokedRef.current = onRevoked
  const onDeniedRef = useRef(onDenied)
  onDeniedRef.current = onDenied
  const checkApprovalRef = useRef(checkApproval)
  checkApprovalRef.current = checkApproval

  // Legitimate useEffect: manages a polling interval (external side effect) with cleanup.
  // Refs avoid stale closures without adding callbacks to the dependency array.
  useEffect(() => {
    if (!enabled) {
      setIsPolling(false)
      return
    }

    let cancelled = false
    setIsPolling(true)

    const check = async () => {
      if (isCheckingRef.current) {
        return
      }
      isCheckingRef.current = true

      try {
        const approved = await checkApprovalRef.current()
        if (approved && !cancelled) {
          clearInterval(intervalId)
          setIsPolling(false)
          onApprovedRef.current()
        }
      } catch (err) {
        if (err instanceof HttpError && !cancelled) {
          if (err.response.status === 403) {
            clearInterval(intervalId)
            setIsPolling(false)
            onRevokedRef.current?.()
            return
          }
          if (err.response.status === 422) {
            clearInterval(intervalId)
            setIsPolling(false)
            onDeniedRef.current?.()
            return
          }
        }
        // Silently continue for other errors — manual button is fallback
      } finally {
        isCheckingRef.current = false
      }
    }

    const intervalId = setInterval(check, intervalMs)

    return () => {
      cancelled = true
      clearInterval(intervalId)
      setIsPolling(false)
    }
  }, [enabled, intervalMs])

  return { isPolling }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

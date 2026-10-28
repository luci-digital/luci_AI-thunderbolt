/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Listens for an OAuth callback delivered via `postMessage` from a popup window.
 * Only accepts messages whose origin matches `window.location.origin` to prevent
 * cross-origin spoofing.
 */
export const waitForOAuthCallback = (
  popup: Window | null,
  eventTarget: EventTarget = window,
): Promise<{ code: string; state: string }> =>
  new Promise<{ code: string; state: string }>((resolve, reject) => {
    const cleanup = () => {
      eventTarget.removeEventListener('message', handler)
      clearTimeout(timeoutId)
    }

    const handler = (event: Event) => {
      const msg = event as MessageEvent
      if (msg.origin !== window.location.origin) {
        return
      }
      if (msg.data?.type === 'oauth-callback') {
        cleanup()
        if (popup && !popup.closed) {
          popup.close()
        }

        if (msg.data.error) {
          reject(new Error(msg.data.error))
        } else if (msg.data.code && msg.data.state) {
          resolve({ code: msg.data.code, state: msg.data.state })
        } else {
          reject(new Error('Invalid OAuth callback: missing code or state'))
        }
      }
    }

    eventTarget.addEventListener('message', handler)

    const timeoutId = setTimeout(
      () => {
        cleanup()
        reject(new Error('OAuth timeout - please try again'))
      },
      10 * 60 * 1000,
    )
  })

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, spyOn } from 'bun:test'
import { useCredentialEvents, showRevokedDeviceModalEvent } from './use-credential-events'

describe('useCredentialEvents', () => {
  const dispatchRevokedDeviceEvent = () => window.dispatchEvent(new CustomEvent(showRevokedDeviceModalEvent))

  it('returns revokedDeviceOpen as false initially', () => {
    const { result } = renderHook(() => useCredentialEvents())
    expect(result.current.revokedDeviceOpen).toBe(false)
  })

  it('sets revokedDeviceOpen to true when show_revoked_device_modal event is dispatched', () => {
    const { result } = renderHook(() => useCredentialEvents())

    act(() => {
      dispatchRevokedDeviceEvent()
    })

    expect(result.current.revokedDeviceOpen).toBe(true)
  })

  it('responds to multiple event dispatches', () => {
    const { result } = renderHook(() => useCredentialEvents())

    act(() => {
      dispatchRevokedDeviceEvent()
    })
    expect(result.current.revokedDeviceOpen).toBe(true)

    act(() => {
      dispatchRevokedDeviceEvent()
    })
    expect(result.current.revokedDeviceOpen).toBe(true)
  })

  it('removes event listener on unmount', () => {
    const addSpy = spyOn(window, 'addEventListener')
    const removeSpy = spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useCredentialEvents())

    expect(addSpy).toHaveBeenCalledWith(showRevokedDeviceModalEvent, expect.any(Function))

    unmount()

    expect(removeSpy).toHaveBeenCalledWith(showRevokedDeviceModalEvent, expect.any(Function))

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

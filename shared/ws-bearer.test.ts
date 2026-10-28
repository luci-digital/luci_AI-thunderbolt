/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { describe, expect, it } from 'bun:test'
import { decodeWsBearer, encodeWsBearer, wsBearerSubprotocolPrefix, wsCarrierSubprotocol } from './ws-bearer'

describe('ws-bearer carrier subprotocol', () => {
  it('pins the wire value the client offers and both server routes echo', () => {
    // Hardcoded literal (not the imported const) so this test independently
    // pins the wire value — a refactor that changes the const would fail here.
    expect(wsCarrierSubprotocol).toBe('thunderbolt.v1')
  })
})

describe('ws-bearer codec', () => {
  it('round-trips a Better Auth bearer (sessionToken.base64Signature)', () => {
    // Real bearers contain `.`, `+`, `/`, `=` — none of which are RFC 6455
    // subprotocol-token-safe, which is why we base64url them for transport.
    const bearer = 'aBcD1234ef.gh+IJ/klMNop=='
    const encoded = encodeWsBearer(bearer)
    // The encoded form must be subprotocol-safe (base64url charset only).
    expect(/^[A-Za-z0-9_-]+$/.test(encoded)).toBe(true)
    expect(decodeWsBearer(encoded)).toBe(bearer)
  })

  it('the full subprotocol entry is a valid RFC 6455 token', () => {
    const entry = `${wsBearerSubprotocolPrefix}${encodeWsBearer('tok.en+with/chars==')}`
    // RFC 6455 subprotocol tokens: visible ASCII without separators/whitespace.
    // Our prefix uses `.` (allowed in tokens) and the payload is base64url.
    expect(/^[A-Za-z0-9._-]+$/.test(entry)).toBe(true)
  })

  it('decodeWsBearer returns null for empty input', () => {
    expect(decodeWsBearer('')).toBeNull()
  })
})

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

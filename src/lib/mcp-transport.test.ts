/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { describe, expect, it } from 'bun:test'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { buildMcpHeaders, createMcpTransport, resolveMcpFetch } from './mcp-transport'
import type { FetchFn } from './proxy-fetch'

const url = 'https://mcp.example.com/server'
const cloudUrl = 'https://cloud.example.com'

describe('createMcpTransport', () => {
  it('returns an SSEClientTransport for the "sse" type', () => {
    const transport = createMcpTransport(url, 'sse', cloudUrl, {})
    expect(transport).toBeInstanceOf(SSEClientTransport)
  })

  it('returns a StreamableHTTPClientTransport for the "http" type', () => {
    const transport = createMcpTransport(url, 'http', cloudUrl, {})
    expect(transport).toBeInstanceOf(StreamableHTTPClientTransport)
  })

  // `@ai-sdk/mcp`'s `init()` writes the negotiated protocol via a direct `transport.protocolVersion =`
  // assignment, but the SDK's StreamableHTTPClientTransport exposes `protocolVersion` as a getter-only
  // accessor (write goes through `setProtocolVersion()`). Without the seam adapter this throws
  // `TypeError: Cannot set property protocolVersion ... which has only a getter` and breaks connect.
  // The casts model `@ai-sdk/mcp`'s untyped runtime write; the SDK types forbid it (read-only/absent).
  type MutableProtocol = { protocolVersion: string; setProtocolVersion: (v: string) => void }

  it('allows the http transport protocolVersion to be set by direct assignment (round-trips)', () => {
    const transport = createMcpTransport(url, 'http', cloudUrl, {}) as unknown as MutableProtocol
    expect(() => {
      transport.protocolVersion = '2025-06-18'
    }).not.toThrow()
    expect(transport.protocolVersion).toBe('2025-06-18')
  })

  it('routes the assignment through the SDK setProtocolVersion setter', () => {
    const transport = createMcpTransport(url, 'http', cloudUrl, {}) as unknown as MutableProtocol
    transport.setProtocolVersion('2024-11-05')
    expect(transport.protocolVersion).toBe('2024-11-05')
    transport.protocolVersion = '2025-06-18'
    expect(transport.protocolVersion).toBe('2025-06-18')
  })

  it('allows the sse transport protocolVersion to be set by direct assignment', () => {
    const transport = createMcpTransport(url, 'sse', cloudUrl, {}) as unknown as MutableProtocol
    expect(() => {
      transport.protocolVersion = '2025-06-18'
    }).not.toThrow()
    expect(transport.protocolVersion).toBe('2025-06-18')
  })
})

describe('resolveMcpFetch', () => {
  const stub = (label: string): FetchFn =>
    Object.assign(() => Promise.resolve(new Response(label)), { preconnect: () => Promise.resolve(false) })
  const proxy = stub('proxy')
  const native = stub('native')

  it.each([
    'http://localhost:8765/mcp',
    'http://127.0.0.1:8765/mcp',
    'http://127.5.4.3:8765/mcp',
    'http://[::1]:8765/mcp',
    'http://foo.localhost:8765/mcp',
  ])('uses the native fetch for the loopback target %s', (url) => {
    expect(resolveMcpFetch(url, proxy, native)).toBe(native)
  })

  it.each([
    'https://mcp.example.com/server',
    'http://192.168.1.10:8765/mcp',
    'http://10.0.0.5/mcp',
    'http://example.com/mcp',
    'not-a-url',
  ])('uses the proxy fetch for the non-loopback target %s', (url) => {
    expect(resolveMcpFetch(url, proxy, native)).toBe(proxy)
  })
})

describe('buildMcpHeaders', () => {
  it('sets a plain Bearer Authorization header when a token is provided', () => {
    const headers = buildMcpHeaders('tok')
    expect(headers.Authorization).toBe('Bearer tok')
    expect(headers.Accept).toBe('application/json, text/event-stream')
  })

  it('omits Authorization but keeps Accept when no token is provided', () => {
    const headers = buildMcpHeaders()
    expect(headers.Authorization).toBeUndefined()
    expect(headers.Accept).toBe('application/json, text/event-stream')
  })
})

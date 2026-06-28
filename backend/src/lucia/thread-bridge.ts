/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export type ThreadLink = {
  did: string
  cid: string
  frequencyHz: number
  timestampNs: string
}

export type ThreadEntry = {
  threadId: string
  links: ThreadLink[]
}

export type ThreadBridgeConfig = {
  luciaDir: string
  repoDid: string
  frequencyHz: number
}

/**
 * Thread bridge connects FDB-PowerSync sync events to .lucia/ thread links.
 * When a sync batch completes, the bridge creates a thread link in the
 * frequency-sharded thread index.
 */
export class ThreadBridge {
  private readonly config: ThreadBridgeConfig

  constructor(config?: Partial<ThreadBridgeConfig>) {
    const root = resolve(process.cwd(), '..')
    this.config = {
      luciaDir: config?.luciaDir ?? join(root, '.lucia'),
      repoDid: config?.repoDid ?? 'did:lucidigital:luci-ai-thunderbolt',
      frequencyHz: config?.frequencyHz ?? 741,
    }
  }

  /**
   * Generate a deterministic thread ID from sync context.
   * Thread ID = BLAKE3-style hash of (tableName, recordId, userId).
   * Falls back to SHA-256 since BLAKE3 isn't available in Node crypto.
   */
  static computeThreadId(tableName: string, recordId: string, userId: string): string {
    const input = `${tableName}:${recordId}:${userId}`
    const hash = createHash('sha256').update(input).digest('hex')
    return `thread-${hash}`
  }

  /**
   * Create a thread link after a sync batch completes.
   * Links the sync event back to a workflow CID in .lucia/threads/.
   */
  createSyncLink(tableName: string, recordId: string, userId: string, workflowCid?: string): ThreadEntry | null {
    const threadsDir = join(this.config.luciaDir, 'threads')
    if (!existsSync(threadsDir)) {
      return null
    }

    const threadId = ThreadBridge.computeThreadId(tableName, recordId, userId)
    const cid =
      workflowCid ??
      `bafk-sync-${createHash('sha256').update(`${tableName}:${recordId}:${Date.now()}`).digest('hex').slice(0, 32)}`

    const link: ThreadLink = {
      did: this.config.repoDid,
      cid,
      frequencyHz: this.config.frequencyHz,
      timestampNs: `${BigInt(Date.now()) * BigInt(1_000_000)}`,
    }

    const shardDir = join(threadsDir, 'frequency-shards', String(this.config.frequencyHz))
    mkdirSync(shardDir, { recursive: true })

    const shardFile = join(shardDir, `${threadId}.json`)
    const entry = existsSync(shardFile) ? this.mergeLink(shardFile, link) : { threadId, links: [link] }

    writeFileSync(shardFile, JSON.stringify(entry, null, 2))
    this.updateThreadMap(threadId, link)

    return entry
  }

  /**
   * Create a thread link for a circuit breaker state transition.
   * Records the transition as a workflow event in the threading index.
   */
  createCircuitBreakerLink(circuitName: string, fromState: string, toState: string): ThreadEntry | null {
    const threadId = `thread-cb-${createHash('sha256').update(circuitName).digest('hex').slice(0, 32)}`
    const cid = `bafk-cb-${fromState}-${toState}-${Date.now()}`

    const link: ThreadLink = {
      did: this.config.repoDid,
      cid,
      frequencyHz: this.config.frequencyHz,
      timestampNs: `${BigInt(Date.now()) * BigInt(1_000_000)}`,
    }

    const shardDir = join(this.config.luciaDir, 'threads', 'frequency-shards', String(this.config.frequencyHz))

    if (!existsSync(join(this.config.luciaDir, 'threads'))) {
      return null
    }

    mkdirSync(shardDir, { recursive: true })

    const shardFile = join(shardDir, `${threadId}.json`)
    const entry = existsSync(shardFile) ? this.mergeLink(shardFile, link) : { threadId, links: [link] }

    writeFileSync(shardFile, JSON.stringify(entry, null, 2))
    return entry
  }

  private mergeLink(filePath: string, link: ThreadLink): ThreadEntry {
    const existing = JSON.parse(readFileSync(filePath, 'utf-8')) as ThreadEntry
    const isDuplicate = existing.links.some((l) => l.did === link.did && l.cid === link.cid)
    if (!isDuplicate) {
      existing.links.push(link)
    }
    return existing
  }

  private updateThreadMap(threadId: string, link: ThreadLink): void {
    const mapPath = join(this.config.luciaDir, 'threads', 'thread-map.json')
    if (!existsSync(mapPath)) {
      return
    }

    const map = JSON.parse(readFileSync(mapPath, 'utf-8')) as Record<string, ThreadEntry>
    const entry = map[threadId] ?? { threadId, links: [] }
    const isDuplicate = entry.links.some((l) => l.did === link.did && l.cid === link.cid)
    if (!isDuplicate) {
      entry.links.push(link)
    }
    map[threadId] = entry
    writeFileSync(mapPath, JSON.stringify(map, null, 2))
  }
}

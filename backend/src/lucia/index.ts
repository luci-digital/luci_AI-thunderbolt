/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

export type LuciaIdentity = {
  repoName: string
  did: string
  frequencyHz: number
  ldsTier: string
  genesisBond: string
}

export type LuciaPeer = {
  did: string
  frequencyHz?: number
}

export type LuciaStorageConfig = {
  blockSize: number
  hash: string
  compression: string
  compressionLevel: number
}

export type LuciaConfig = {
  version: string
  identity: LuciaIdentity
  peers: Record<string, LuciaPeer>
  storage: LuciaStorageConfig
}

export type LuciaStatus = {
  available: boolean
  identity: LuciaIdentity | null
  peerCount: number
  workflowsPending: number
  metricsAvailable: boolean
}

/**
 * Parse a flat TOML file into nested sections.
 * Handles [section], key = "value", key = number, and inline tables { k = "v" }.
 */
const parseSimpleToml = (content: string): Record<string, Record<string, unknown>> => {
  const result: Record<string, Record<string, unknown>> = {}
  let currentSection = '_root'

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      if (!result[currentSection]) result[currentSection] = {}
      continue
    }

    const kvMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/)
    if (!kvMatch) continue

    const [, key, rawValue] = kvMatch
    if (!result[currentSection]) result[currentSection] = {}
    result[currentSection][key] = parseTomlValue(rawValue.trim())
  }

  return result
}

const parseTomlValue = (raw: string): unknown => {
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1)
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1)
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (/^-?\d+$/.test(raw)) return parseInt(raw, 10)
  if (/^-?\d+\.\d+$/.test(raw)) return parseFloat(raw)

  // Inline table: { key = "value", key2 = number }
  if (raw.startsWith('{') && raw.endsWith('}')) {
    const inner = raw.slice(1, -1).trim()
    const obj: Record<string, unknown> = {}
    for (const pair of inner.split(',')) {
      const m = pair.trim().match(/^(\w+)\s*=\s*(.+)$/)
      if (m) obj[m[1]] = parseTomlValue(m[2].trim())
    }
    return obj
  }

  return raw
}

/**
 * Read and parse the .lucia/config.toml from the project root.
 * Returns null if .lucia/ doesn't exist.
 */
export const loadLuciaConfig = (projectRoot?: string): LuciaConfig | null => {
  const root = projectRoot ?? resolve(process.cwd(), '..')
  const configPath = join(root, '.lucia', 'config.toml')

  if (!existsSync(configPath)) {
    return null
  }

  const raw = readFileSync(configPath, 'utf-8')
  const parsed = parseSimpleToml(raw)

  const identity = parsed['identity']
  if (!identity) {
    return null
  }

  const peers: Record<string, LuciaPeer> = {}
  const peersSection = parsed['peers']
  if (peersSection) {
    for (const [key, val] of Object.entries(peersSection)) {
      const peerObj = val as Record<string, unknown>
      peers[key] = {
        did: (peerObj['did'] as string) ?? '',
        frequencyHz: peerObj['frequency_hz'] as number | undefined,
      }
    }
  }

  return {
    version: (parsed['lucia']?.['version'] as string) ?? '0.1.0',
    identity: {
      repoName: (identity['repo_name'] as string) ?? '',
      did: (identity['did'] as string) ?? '',
      frequencyHz: (identity['frequency_hz'] as number) ?? 0,
      ldsTier: (identity['lds_tier'] as string) ?? '',
      genesisBond: (identity['genesis_bond'] as string) ?? '',
    },
    peers,
    storage: {
      blockSize: (parsed['storage']?.['block_size'] as number) ?? 1048576,
      hash: (parsed['storage']?.['hash'] as string) ?? 'blake3',
      compression: (parsed['storage']?.['compression'] as string) ?? 'zstd',
      compressionLevel: (parsed['storage']?.['compression_level'] as number) ?? 3,
    },
  }
}

/**
 * Get .lucia/ status for the health endpoint.
 * Checks if .lucia/ exists, reads identity, counts pending workflows.
 */
export const getLuciaStatus = (projectRoot?: string): LuciaStatus => {
  const config = loadLuciaConfig(projectRoot)

  if (!config) {
    return {
      available: false,
      identity: null,
      peerCount: 0,
      workflowsPending: 0,
      metricsAvailable: false,
    }
  }

  const root = projectRoot ?? resolve(process.cwd(), '..')
  const luciaDir = join(root, '.lucia')

  const pendingDir = join(luciaDir, 'workflows', 'pending')
  const workflowsPending = existsSync(pendingDir) ? countFiles(pendingDir) : 0

  const metricsPath = join(luciaDir, 'metrics', 'counters.json')
  const metricsAvailable = existsSync(metricsPath)

  return {
    available: true,
    identity: config.identity,
    peerCount: Object.keys(config.peers).length,
    workflowsPending,
    metricsAvailable,
  }
}

/**
 * Count files in a directory (non-recursive, skips dotfiles).
 */
const countFiles = (dir: string): number => {
  try {
    const entries = readdirSync(dir)
    return entries.filter((f) => !f.startsWith('.')).length
  } catch {
    return 0
  }
}

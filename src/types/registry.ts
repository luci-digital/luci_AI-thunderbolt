/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Types mirroring the official Agent Client Protocol registry
 * (https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json).
 *
 * Every shipped agent is a CLI (npx / uvx / binary). In Thunderbolt's
 * remote-only model there is nothing to install locally — the catalogue is a
 * read-only directory of "bridge" agents whose cards link out to their own
 * websites and source repositories.
 */

/** How an agent is distributed. Mirrors the registry's `distribution` object;
 *  `binary` is a per-platform record we only surface as a "Binary" badge, so its
 *  inner shape is left opaque. */
export type RegistryDistribution = {
  npx?: { package: string; args?: ReadonlyArray<string> }
  uvx?: { package: string; args?: ReadonlyArray<string> }
  binary?: Readonly<Record<string, unknown>>
}

export type RegistryEntry = {
  id: string
  name: string
  version: string
  description: string
  authors: ReadonlyArray<string>
  license: string
  repository?: string
  website?: string
  icon?: string
  distribution: RegistryDistribution
}

export type AgentRegistry = {
  version: string
  agents: ReadonlyArray<RegistryEntry>
  extensions?: ReadonlyArray<unknown>
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

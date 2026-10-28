/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * function, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * Compare two semver strings (major.minor.patch). Returns negative if `a < b`,
 * positive if `a > b`, zero if equal. Pre-release tags and build metadata are
 * stripped before comparison — we only enforce the numeric core, which is what
 * the backend's MIN_APP_VERSION gate uses.
 *
 * Returns 0 for any pair that cannot be parsed as `N.N.N` so a malformed value
 * never hard-blocks the app.
 */
export const compareSemver = (a: string, b: string): number => {
  const parse = (v: string): [number, number, number] | null => {
    const core = v.split(/[-+]/, 1)[0]
    const parts = core.split('.')
    if (parts.length !== 3) {
      return null
    }
    const nums = parts.map((p) => Number(p))
    if (nums.some((n) => !Number.isInteger(n) || n < 0)) {
      return null
    }
    return [nums[0], nums[1], nums[2]]
  }

  const av = parse(a)
  const bv = parse(b)
  if (!av || !bv) {
    return 0
  }

  for (let i = 0; i < 3; i++) {
    if (av[i] !== bv[i]) {
      return av[i] - bv[i]
    }
  }
  return 0
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

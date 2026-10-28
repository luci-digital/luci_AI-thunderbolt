/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/** Extracts a clean hostname from a URL (strips "www." prefix) */
export const getHostname = (url: string): string => {
  if (!url || !url.trim()) {
    return 'Unknown'
  }

  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace(/^www\./, '')
    return hostname || 'Unknown'
  } catch {
    // If URL parsing fails, try to extract hostname-like string from the input
    // This handles edge cases like malformed URLs while still providing some value
    const match = url.match(/^(?:https?:\/\/)?([^/\s?#]+)/i)
    if (match && match[1]) {
      const hostname = match[1].replace(/^www\./, '')
      return hostname.length > 50 ? `${hostname.slice(0, 47)}...` : hostname
    }
    return url.length > 50 ? `${url.slice(0, 47)}...` : url
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

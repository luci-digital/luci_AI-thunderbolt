/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/** @type {import('@lhci/types').LHCI.UserConfig} */
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        // Skip audits that aren't relevant for an SPA behind auth
        skipAudits: ['redirects-http', 'is-crawlable'],
      },
    },
    upload: {
      // Temporary public storage — no server needed.
      // Results are available for ~7 days at the printed URL.
      target: 'temporary-public-storage',
    },
    assert: {
      // Informational only — log warnings but never fail CI.
      preset: 'lighthouse:recommended',
      assertions: {
        // Override every category to warn-only so CI stays green.
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        // Key web vitals — warn thresholds only.
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
      },
    },
  },
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

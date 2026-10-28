/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import ReactDOM from 'react-dom/client'
import { App } from './app'
import './polyfills'

import './index.css'
import { markBundleEvaluated } from './lib/init-timing'
import { initializeLinkInterception } from './lib/intercept-links'
import { handlePostUpdateRedirect } from './lib/post-update-redirect'

// Running here means every static import above (the whole entry bundle) has
// been downloaded, parsed and evaluated — record that phase.
markBundleEvaluated()

// After an update+relaunch, the WebView may restore a stale route (e.g. /waitlist
// verify screen). Detect this and force a clean start at root.
const redirecting = handlePostUpdateRedirect()

if (!redirecting) {
  initializeLinkInterception()

  const root = document.getElementById('root') as HTMLElement

  ReactDOM.createRoot(root).render(<App />)
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

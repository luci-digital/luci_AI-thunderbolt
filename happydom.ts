/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

// Add comprehensive Node.js polyfills for better compatibility
import { ReadableStream, TransformStream, WritableStream } from 'stream/web'

// Polyfill Web Streams API
globalThis.ReadableStream = ReadableStream
globalThis.WritableStream = WritableStream
globalThis.TransformStream = TransformStream

// Add other Node.js globals that might be needed
if (typeof globalThis.process === 'undefined') {
  globalThis.process = process
}

// Add Node.js Buffer if needed
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}

// Fake timers are now managed in testing-library.ts
// This file just sets up the DOM environment

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

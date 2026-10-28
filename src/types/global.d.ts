/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Window {
  isTauri?: boolean
  __TAURI__: {
    invoke: (cmd: string, args: any) => Promise<any>
  }
}

// Wa-sqlite ships some entry points without .d.ts coverage. OPFSCoopSyncVFS
// is imported statically by the wa-sqlite worker (src/db/wa-sqlite-worker.ts);
// the legacy-reader (src/migrations/pre-workspaces-attach/legacy-reader.ts)
// loads `wa-sqlite-async-dynamic-main.mjs` via dynamic `import()` so Vite
// doesn't rewrite the URL away from the WASM sibling — TypeScript still
// needs a declaration for the path to resolve.
declare module '@journeyapps/wa-sqlite/src/examples/OPFSCoopSyncVFS.js' {
  export class OPFSCoopSyncVFS {
    static create(name: string, module: unknown, options?: unknown): Promise<OPFSCoopSyncVFS>
  }
}
declare module '@journeyapps/wa-sqlite/dist/wa-sqlite-async-dynamic-main.mjs' {
  const factory: () => Promise<unknown>
  export default factory
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

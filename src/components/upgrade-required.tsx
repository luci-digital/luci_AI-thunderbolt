/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

type UpgradeRequiredProps = {
  currentVersion: string
  minVersion: string
}

export const UpgradeRequired = ({ currentVersion, minVersion }: UpgradeRequiredProps) => (
  <div className="flex flex-col items-center justify-center w-full h-[100vh] p-4 text-center">
    <h1 className="text-[length:var(--font-size-body)] font-semibold mb-2">Update required</h1>
    <p className="text-[length:var(--font-size-sm)] text-muted-foreground max-w-md mb-4">
      This version of Thunderbolt is no longer supported. Update the app to keep chatting and syncing.
    </p>
    <p className="text-[length:var(--font-size-xs)] text-muted-foreground">
      Installed: {currentVersion} · Minimum required: {minVersion}
    </p>
  </div>
)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

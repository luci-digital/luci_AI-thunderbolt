/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { ImportFormatError } from '@/dal'

/**
 * Hard ceiling on the size of an import file we'll read into memory. Anything
 * larger almost certainly isn't a Thunderbolt export, so we refuse it before
 * paying the `file.text()` allocation: picking the wrong file on Tauri iOS
 * would otherwise freeze or OOM the WebView.
 */
const maxImportBytes = 200 * 1024 * 1024

/**
 * Reads a `File` (from an `<input type="file">`) and parses it as JSON.
 * Returns `unknown` so the caller validates the shape before using it.
 *
 * Throws an {@link ImportFormatError} when the file exceeds
 * {@link maxImportBytes}, and a `SyntaxError` with the original file name in
 * the message when the JSON doesn't parse — easier to surface in the UI than
 * the raw parser error.
 */
export const readJsonFile = async (file: File): Promise<unknown> => {
  if (file.size > maxImportBytes) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(0)
    const maxMb = maxImportBytes / 1024 / 1024
    throw new ImportFormatError(
      `"${file.name}" is too large (${sizeMb} MB). Maximum supported import size is ${maxMb} MB.`,
    )
  }
  const text = await file.text()
  try {
    return JSON.parse(text)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown parse error'
    throw new SyntaxError(`Could not parse "${file.name}" as JSON: ${reason}`, { cause: error })
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

export type HandleErrorCode =
  | 'MIGRATION_FAILED'
  | 'STORAGE_UNAVAILABLE'
  | 'DATABASE_INIT_FAILED'
  | 'RECONCILE_DEFAULTS_FAILED'
  | 'TRAY_INIT_FAILED'
  | 'POSTHOG_FETCH_FAILED'
  | 'APP_DIR_CREATION_FAILED'
  | 'DATABASE_PATH_FAILED'
  | 'HTTP_CLIENT_INIT_FAILED'
  | 'CANARY_EXTRACTION_FAILED'
  | 'SYNC_ENABLE_FAILED'
  | 'NO_TRUST_DOMAIN'
  | 'CONFIG_FETCH_FAILED'
  | 'STANDALONE_NOT_SUPPORTED'
  | 'NO_ACTIVE_USER'
  | 'PERSONAL_WORKSPACE_UNAVAILABLE'
  | 'PRE_WORKSPACES_IDB_MIGRATION_FAILED'
  | 'PRE_WORKSPACES_LOCAL_DB_MIGRATION_FAILED'
  | 'UNKNOWN_ERROR'

export type HandleError = {
  code: HandleErrorCode
  message: string
  originalError?: unknown
  stackTrace?: string
}

export type HandleResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: HandleError
    }

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

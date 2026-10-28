/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import { sharedParserOptions, sharedRules } from '../shared/eslint/base.js'

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['node_modules', 'dist'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: sharedParserOptions,
      globals: {
        ...globals.node,
        ...globals.es2022,
        BodyInit: 'readonly',
        HeadersInit: 'readonly',
        RequestInfo: 'readonly',
        RequestInit: 'readonly',
        // Bun runtime globals
        Bun: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: sharedRules,
  },
]

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

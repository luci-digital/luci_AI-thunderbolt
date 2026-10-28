/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import path from 'path'
import { fileURLToPath } from 'url'
import type { StorybookConfig } from '@storybook/react-vite'

// Storybook evaluates this file via CJS (esbuild-register), where
// import.meta.dirname is undefined. Fall back to __dirname for compat.
const currentDir =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(currentDir, '..')

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)', '../src/**/stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    // Exclude bun:sqlite from the build since it's a Bun runtime module
    // that doesn't exist in browser environments
    config.build = config.build || {}
    config.build.rolldownOptions = config.build.rolldownOptions || {}

    const existingExternal = config.build.rolldownOptions.external
    const externalArray: (string | RegExp)[] = Array.isArray(existingExternal)
      ? existingExternal
      : existingExternal
        ? [existingExternal as string | RegExp]
        : []

    config.build.rolldownOptions.external = [...externalArray, 'bun:sqlite']

    // Restrict @fs endpoint to frontend directories only (matches vite.config.ts)
    config.server = config.server || {}
    config.server.fs = {
      strict: true,
      allow: [
        path.resolve(rootDir, 'src'),
        path.resolve(rootDir, 'shared'),
        path.resolve(rootDir, 'public'),
        path.resolve(rootDir, 'node_modules'),
        path.resolve(rootDir, 'dist-isolation'),
        path.resolve(rootDir, '.storybook'),
        path.resolve(rootDir, 'index.html'),
      ],
    }

    return config
  },
}
export default config

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

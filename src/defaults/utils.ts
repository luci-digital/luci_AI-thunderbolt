/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { hashPrompt } from './automations'
import { hashModel } from './models'
import { hashSetting } from './settings'
import type { Model, Prompt, Setting } from '@/types'

/**
 * Check if a model has been modified from its default
 */
export const isModelModified = (model: Model): boolean => {
  if (!model.defaultHash) {
    return false
  }
  const currentHash = hashModel(model)
  return currentHash !== model.defaultHash
}

/**
 * Check if an automation has been modified from its default
 */
export const isAutomationModified = (prompt: Prompt): boolean => {
  if (!prompt.defaultHash) {
    return false
  }
  const currentHash = hashPrompt(prompt)
  return currentHash !== prompt.defaultHash
}

/**
 * Check if a setting has been modified from its default
 */
export const isSettingModified = (setting: Setting | undefined): boolean => {
  if (!setting || !setting.defaultHash) {
    return false
  }
  const currentHash = hashSetting(setting)
  return currentHash !== setting.defaultHash
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

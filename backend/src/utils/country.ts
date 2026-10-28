/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import countryMappingData from '../data/localization/country-mapping.json'
import unitsByCountryData from '../data/localization/units-by-country.json'

/**
 * Resolves a country name or code to a 2-letter ISO country code
 * @param countryInput - Country name, 2-letter code, or 3-letter code
 * @returns 2-letter ISO country code or null if not found
 */
export const resolveCountryCode = (countryInput: string): string | null => {
  if (!countryInput || typeof countryInput !== 'string') {
    return null
  }

  const trimmedInput = countryInput.trim()

  if (trimmedInput.length === 2 && /^[A-Z]{2}$/.test(trimmedInput)) {
    const exists = Object.values(countryMappingData).includes(trimmedInput)
    if (exists) {
      return trimmedInput
    }

    if (unitsByCountryData[trimmedInput as keyof typeof unitsByCountryData]) {
      return trimmedInput
    }
  }

  if (trimmedInput.length === 3 && /^[A-Z]{3}$/.test(trimmedInput)) {
    return countryMappingData[trimmedInput as keyof typeof countryMappingData] || null
  }

  const variations = [
    trimmedInput,
    trimmedInput.charAt(0).toUpperCase() + trimmedInput.slice(1).toLowerCase(),
    trimmedInput.toLowerCase(),
    trimmedInput.toUpperCase(),
  ]

  if (trimmedInput.includes(' ')) {
    const titleCase = trimmedInput
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    variations.push(titleCase)
  }

  for (const variation of variations) {
    const result = countryMappingData[variation as keyof typeof countryMappingData]
    if (result) {
      return result
    }
  }

  return null
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

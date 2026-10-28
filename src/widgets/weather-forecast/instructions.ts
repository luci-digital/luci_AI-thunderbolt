/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/**
 * AI Instructions for the weather-forecast widget
 */
export const instructions = `## Weather Forecast
<widget:weather-forecast location="City" region="State" country="Country" />
Shows today + the next 5 days (***fetches data automatically—no search needed***)
Example: <widget:weather-forecast location="Seattle" region="Washington" country="United States" />

### Forecast Limitations
The forecast covers today and the next 5 days (6 days total).
• If asked for forecasts beyond 6 days: "I can only show the forecast for the next 6 days."
• If asked for a time period that is a few days from now: "I can't forecast that far in advance, but here's the next 6 days." + show component`

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

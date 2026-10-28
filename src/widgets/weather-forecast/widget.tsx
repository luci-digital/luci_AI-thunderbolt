/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useMessageCache } from '@/hooks/use-message-cache'
import { useSettings } from '@/hooks/use-settings'
import { WeatherForecast, WeatherForecastSkeleton } from './display'
import { fetchWeatherForecast } from './fetch-forecast'
import type { WeatherForecastData } from './lib'

type WeatherForecastWidgetProps = {
  location: string
  region: string
  country: string
  messageId: string
}

/**
 * Wrapper component that fetches weather data and renders the WeatherForecast component
 * Fetches 6 days of weather data (today + 5 forecast days)
 */
export const WeatherForecastWidget = ({ location, region, country, messageId }: WeatherForecastWidgetProps) => {
  const { temperatureUnit } = useSettings({ temperature_unit: 'f' })
  const { data, error } = useMessageCache<WeatherForecastData>({
    messageId,
    cacheKey: ['weatherForecast', location, region, country, temperatureUnit.value],
    enabled: !temperatureUnit.isLoading,
    fetchFn: async () =>
      fetchWeatherForecast({
        location,
        region,
        country,
        days: 6,
        temperatureUnit: temperatureUnit.value === 'f' ? 'f' : 'c',
      }),
  })

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 my-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-sm text-red-800 dark:text-red-200">
          Unable to load weather forecast: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  // No data while the settings gate is closed or the fetch is in flight — the skeleton covers both.
  if (!data) {
    return <WeatherForecastSkeleton />
  }

  return <WeatherForecast {...data} />
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

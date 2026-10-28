/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Combobox, type ComboboxItem } from '@/components/ui/combobox'
import { useLocationSearch, type LocationData } from '@/hooks/use-location-search'
import type { ComponentPropsWithoutRef } from 'react'

type LocationSearchComboboxProps = Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'onSelect'> & {
  value?: string | null
  onSelect: (location: LocationData) => void | Promise<void>
  placeholder?: string
  autoOpen?: boolean
}

export const LocationSearchCombobox = ({
  value,
  onSelect,
  placeholder = 'Select location...',
  autoOpen = false,
  className,
  disabled,
  ...rest
}: LocationSearchComboboxProps) => {
  const locationSearch = useLocationSearch({ autoOpen })

  const items: ComboboxItem[] = locationSearch.locations.map((location) => ({
    id: `${location.coordinates.lat},${location.coordinates.lng}`,
    label: location.name,
  }))

  const handleValueChange = (id: string) => {
    const location = locationSearch.locations.find((l) => `${l.coordinates.lat},${l.coordinates.lng}` === id)
    if (location) {
      onSelect(location)
      locationSearch.setOpen(false)
    }
  }

  return (
    <Combobox
      items={items}
      onValueChange={handleValueChange}
      displayValue={value || undefined}
      placeholder={placeholder}
      searchPlaceholder="Search locations..."
      searchValue={locationSearch.searchQuery}
      onSearchChange={locationSearch.setSearchQuery}
      loading={locationSearch.searchQuery.trim().length > 0 && (locationSearch.isSearching || locationSearch.isPending)}
      emptyMessage={
        locationSearch.searchQuery.trim().length > 0 && locationSearch.locations.length === 0
          ? 'No locations found.'
          : ''
      }
      open={locationSearch.open}
      onOpenChange={(open) => {
        locationSearch.setOpen(open)
        if (!open) {
          locationSearch.clearSearch()
        }
      }}
      className={className}
      disabled={disabled}
      {...rest}
    />
  )
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

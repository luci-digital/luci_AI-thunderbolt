/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { useCallback, useEffect, useRef, useState } from 'react'

const defaultDebounceMs = 0

/**
 * React hook that syncs state to localStorage with optional debounced writes.
 * Removes the key when value equals the default, keeping localStorage clean.
 *
 * @param key - localStorage key
 * @param defaultValue - returned when key is absent; also used to detect "empty" state for cleanup
 * @param options.debounceMs - debounce writes by this many ms (0 = immediate)
 * @param options.disabled - when true, acts like useState without touching localStorage
 */
export const useLocalStorage = (
  key: string,
  defaultValue: string,
  options?: { debounceMs?: number; disabled?: boolean },
) => {
  const disabled = options?.disabled ?? false
  const debounceMs = options?.debounceMs ?? defaultDebounceMs
  const [value, setValueState] = useState(() => (disabled ? defaultValue : (localStorage.getItem(key) ?? defaultValue)))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingValueRef = useRef<string | null>(null)
  const keyRef = useRef(key)

  // When key changes, load the new key's value and flush any pending write for the old key
  useEffect(() => {
    // Capture current key before updating — cleanup needs to flush writes to THIS key,
    // not the next one (keyRef.current will already point to the new key by cleanup time)
    const currentKey = key
    keyRef.current = key
    if (disabled) {
      setValueState(defaultValue)
    } else {
      setValueState(localStorage.getItem(key) ?? defaultValue)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (!disabled && pendingValueRef.current !== null) {
        writeToStorage(currentKey, pendingValueRef.current, defaultValue)
        pendingValueRef.current = null
      }
    }
  }, [key, defaultValue, disabled])

  const setValue = useCallback(
    (next: string, setOptions?: { immediate?: boolean }) => {
      setValueState(next)

      if (disabled) {
        return
      }

      if (debounceMs === 0 || setOptions?.immediate) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        pendingValueRef.current = null
        writeToStorage(keyRef.current, next, defaultValue)
        return
      }

      pendingValueRef.current = next

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        writeToStorage(keyRef.current, next, defaultValue)
        timerRef.current = null
        pendingValueRef.current = null
      }, debounceMs)
    },
    [debounceMs, defaultValue, disabled],
  )

  return [value, setValue] as const
}

/** Write to localStorage, removing the key when value matches the default. */
const writeToStorage = (key: string, value: string, defaultValue: string) => {
  if (value === defaultValue) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, value)
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

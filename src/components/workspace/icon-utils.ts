/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

/** Target side length for the rendered icon, in pixels. */
export const iconRenderSize = 128

/**
 * True when the icon column value is a base64 data URL (image) rather than an
 * emoji. Used by the display layer to pick `<img>` vs text rendering.
 */
export const isDataUrlIcon = (icon: string | null | undefined): icon is string =>
  typeof icon === 'string' && icon.startsWith('data:')

/**
 * Read a `File` into a data URL string. Async wrapper around `FileReader`.
 */
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })

/**
 * Center-crops an uploaded image to a square and rescales it to
 * `iconRenderSize` pixels, then exports as JPEG (quality 0.8). Keeps the
 * synced payload small — a typical result is ~10–20 KB even for large source
 * photos, which is acceptable to round-trip through PowerSync.
 *
 * The result is a `data:image/jpeg;base64,...` URL suitable for direct storage
 * in the `workspaces.icon` text column.
 */
export const resizeImageToBase64 = async (file: File, size: number = iconRenderSize): Promise<string> => {
  const dataUrl = await fileToDataUrl(file)
  const img = await loadImage(dataUrl)
  const sourceSide = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - sourceSide) / 2
  const sy = (img.naturalHeight - sourceSide) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get 2D rendering context')
  }
  ctx.drawImage(img, sx, sy, sourceSide, sourceSide, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.8)
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { ChatCompletionChunk } from 'openai/resources/chat/completions'

type CompletionStream = AsyncIterable<ChatCompletionChunk> & { controller: AbortController }

/**
 * Creates a ReadableStream from an OpenAI completion stream with SSE formatting
 * @param completion - The OpenAI completion stream
 * @returns ReadableStream formatted for Server-Sent Events
 */
export const createSSEStreamFromCompletion = (completion: CompletionStream): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder()
  let isCancelled = false

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          // Stop processing if client disconnected
          if (isCancelled) {
            break
          }

          // Convert chunk back to SSE format for client compatibility
          const sseChunk = `data: ${JSON.stringify(chunk)}\n\n`

          try {
            controller.enqueue(encoder.encode(sseChunk))
          } catch {
            // Controller already closed (client disconnected)
            break
          }
        }

        // Send [DONE] message if not cancelled
        if (!isCancelled) {
          try {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          } catch {
            // Ignore if controller is closed
          }
        }

        if (controller.desiredSize !== null) {
          controller.close()
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('OpenAI streaming error:', error)
          controller.error(error)
        }
      }
    },
    cancel() {
      // Mark as cancelled to stop processing chunks
      isCancelled = true
      // Abort the OpenAI stream
      completion.controller.abort()
    },
  })
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

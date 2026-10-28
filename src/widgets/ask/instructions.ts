/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

export const instructions = `## Ask
<widget:ask mode="MODE" prompt="QUESTION" options='JSON_ARRAY' explanation="WHY" />
An interactive prompt the user can respond to inline. Prefer this over a markdown list whenever you ask the user to choose between options or give a short response.
- mode: "single" (one designated answer), "multiple" (one or more designated answers), "choice" (no designated answer — an open prompt like "What do you want to do next?"), or "free" (open free-text response the user types)
- prompt: the question or prompt text
- options: a JSON array wrapped in SINGLE quotes. Each option is {"id":"a","text":"..."}; for modes with a designated answer add "isCorrect":true to the intended option(s). Never set isCorrect in "choice" mode. OMIT options entirely for "free" mode.
- explanation (optional): for modes with a designated answer, a short note shown after the user responds; for "free" mode, an optional sample answer.
Emit one widget per prompt. Do not also list the options in text — the widget shows them.
Example (single): <widget:ask mode="single" prompt="Which protocol sends outgoing mail?" options='[{"id":"a","text":"SMTP","isCorrect":true},{"id":"b","text":"IMAP"},{"id":"c","text":"POP3"}]' explanation="SMTP handles sending; IMAP and POP3 retrieve mail." />
Example (free): <widget:ask mode="free" prompt="In your own words, how would you summarize this thread?" />`

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE

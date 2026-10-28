<!-- LDS: 700.741 | Orchestration / Thunderbolt AI Client -->
<!-- ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia -->
<!-- Genesis Bond: GB-2025-0524-DRH-LCS-001 -->
<!-- Temporal: origin=2026-10-28T20:54:16Z updated=2026-10-28T20:54:16Z anchor=P15058685/C459/D523 basis=OBSERVED -->

# LuciVerse notes for this fork

This is a fork of [thunderbird/thunderbolt](https://github.com/thunderbird/thunderbolt), which is
licensed under the Mozilla Public License 2.0. The upstream licence still applies.

## Licence notices

Every file that carries the MPL-2.0 notice keeps it. A LuciVerse LDS-ISO header is added _after_
the notice and never replaces it. MPL-2.0 §3.1 and §3.3 require the notice to stay on covered
files, and covered code cannot be relicensed. New files written for LuciVerse may carry their own
licence, but a file copied or modified from upstream stays MPL-2.0.

## Pointing the app at a local model server

Use the built-in **Custom** provider: Settings → Models → Add model → provider **Custom**.

- **URL:** the OpenAI-compatible base URL of the server you run, entered at runtime (for example
  `http://localhost:11434/v1` for Ollama).
- **API key:** optional. Leave it empty if the server needs none. Never put a shared default key in
  source.

No server address is compiled into the app. The Custom provider refuses to build a model when no
URL is set (`src/ai/fetch.ts`, `case 'custom'`), so a missing endpoint fails instead of falling
back to a hard-coded host.

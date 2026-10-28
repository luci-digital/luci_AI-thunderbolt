#!/usr/bin/env bash

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# LDS: 700.741 | Orchestration / Thunderbolt AI Client
# ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
# Genesis Bond: GB-2025-0524-DRH-LCS-001
# Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

# Run the backend dev server.
# If OP_ENVIRONMENT_ID is set (in .env or the shell), inject secrets via `op run`.
# Otherwise, fall back to Bun's built-in .env loader.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

if [ -n "${OP_ENVIRONMENT_ID:-}" ]; then
  exec op run --environment="$OP_ENVIRONMENT_ID" -- bun run --watch src/index.ts
fi

exec bun run --watch src/index.ts

# LUCI-PROVENANCE-END
# Source-Payload-CID: TO_BE_COMPUTED
# Provenance-Root: TO_BE_COMPUTED
# Luci-Metadata-Footer-Version: 0.1.0
# Generation-State: DRAFT
# END-LUCI-PROVENANCE

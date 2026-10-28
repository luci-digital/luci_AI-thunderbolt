#!/usr/bin/env bash

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# LDS: 700.741 | Orchestration / Thunderbolt AI Client
# ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
# Genesis Bond: GB-2025-0524-DRH-LCS-001
# Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

# -----------------------------------------------------------------------------
# reset-drizzle-migrations.sh
# -----------------------------------------------------------------------------
# Utility script intended to be run from any feature branch.
#
# 1. Fetches the latest `main` from origin.
# 2. Restores the contents of src/drizzle/ to exactly what is on main,
#    committing the reset.
# 3. Runs `bun db generate` (or your configured Drizzle generator command)
#    to create a single fresh migration representing *all* schema changes
#    introduced by the branch, and commits that migration.
#
# After the script succeeds your branch will carry **one** migration file,
# keeping PRs clean and avoiding merge-order conflicts.
# -----------------------------------------------------------------------------

set -euo pipefail

# Bail if there are unstaged changes – we need a clean working tree
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ Working tree is not clean. Please commit or stash changes first." >&2
  exit 1
fi

# Ensure we have an up-to-date view of main
printf "▶ Fetching origin/main…\n"
git fetch origin main

# Reset migrations folder to main's version
printf "▶ Restoring src/drizzle from origin/main…\n"
git restore --source origin/main --worktree src/drizzle

echo "▶ Reset of migrations folder complete (changes unstaged)…"

# Generate fresh migration (adjust the command if you use a different script)
printf "▶ Generating new migration via bun db generate…\n"
if ! bun db generate; then
  echo "❌ bun db generate failed" >&2
  exit 1
fi

bun run scripts/bundle-migrations.ts

echo "✅ Done! All migrations in the current branch were re-generated as a single migration." 

# LUCI-PROVENANCE-END
# Source-Payload-CID: TO_BE_COMPUTED
# Provenance-Root: TO_BE_COMPUTED
# Luci-Metadata-Footer-Version: 0.1.0
# Generation-State: DRAFT
# END-LUCI-PROVENANCE

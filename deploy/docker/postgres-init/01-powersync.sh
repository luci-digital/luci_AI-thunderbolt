#!/bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# LDS: 700.741 | Orchestration / Thunderbolt AI Client
# ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
# Genesis Bond: GB-2025-0524-DRH-LCS-001
# Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED
#
# PowerSync replication role + publication. Runs on first Postgres init only.
# Templated as a shell script (rather than plain SQL) so the role password can
# come from an env var — preview environments randomize POWERSYNC_DB_PASSWORD
# per stack via Pulumi; local + enterprise stacks fall back to the default.
# See https://docs.powersync.com/configuration/source-db/setup
#
# /bin/sh (not bash) — postgres:17-alpine doesn't ship bash.
set -eu

: "${POWERSYNC_DB_PASSWORD:?POWERSYNC_DB_PASSWORD must be set on the postgres container}"

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set powersync_pass="$POWERSYNC_DB_PASSWORD" <<-'EOSQL'
  CREATE SCHEMA IF NOT EXISTS "powersync";

  -- :'powersync_pass' is psql's safe-quoting form for variable substitution.
  CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN PASSWORD :'powersync_pass';

  -- Required in PostgreSQL 15+ where powersync schema privileges are revoked by default
  GRANT USAGE ON SCHEMA powersync TO powersync_role;

  GRANT SELECT ON ALL TABLES IN SCHEMA powersync TO powersync_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA powersync GRANT SELECT ON TABLES TO powersync_role;
  CREATE PUBLICATION powersync FOR ALL TABLES;

  -- Separate database for PowerSync bucket storage (avoids schema conflicts with app data).
  -- See https://docs.powersync.com/configuration/powersync-service/self-hosted-instances
  CREATE DATABASE powersync_storage OWNER postgres;
EOSQL

# LUCI-PROVENANCE-END
# Source-Payload-CID: TO_BE_COMPUTED
# Provenance-Root: TO_BE_COMPUTED
# Luci-Metadata-Footer-Version: 0.1.0
# Generation-State: DRAFT
# END-LUCI-PROVENANCE

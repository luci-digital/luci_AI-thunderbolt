# Rename `thunderbolt-stdio-bridge` → `zeus` (with `bridge` subcommand)

**Status:** approved 2026-06-25. Keep the current JS implementation verbatim; this is a **rename + a thin subcommand layer**, not a rewrite. No bridge logic (relay / ACP face / MCP face / multiplexer / tunnel / child supervisor) changes.

## Why
The bridge becomes the first subcommand of the future **Zeus CLI** (Linear "Zeus CLI" project — a general-purpose agent CLI that will "roll the mcp/acp bridge into it so users install Zeus all-in-one"). Renaming now to `zeus` + `zeus bridge …` pre-positions for that: today `zeus` ships only the `bridge` subcommand; later it grows (`zeus chat`, …). We do NOT implement anything else from the Zeus-CLI project here.

## Decisions (researched)
- **Handle:** `zeus`. **Invocation:** `zeus bridge --mode <acp|mcp> [opts] -- <launch>...`.
- **Keep `--`.** Confirmed still idiomatic: every wrapper CLI that execs a child (cargo/npm/npx/kubectl/docker/uv) uses `tool … -- <subprocess argv>`. Our hand-rolled parser already splits at the first bare `--` correctly. No change.
- **Delivery unchanged in shape** (curl|bash + GitHub Release asset + sha256). Homebrew tap is a future distribution add-on, out of scope.

## Surface map (old → new)
| Area | Old | New |
| --- | --- | --- |
| package dir | `thunderbolt-stdio-bridge/` | `zeus/` |
| package.json `name` / `bin` | `thunderbolt-stdio-bridge` | `zeus` → `{ "zeus": "bin/cli.js" }` |
| built artifact | `dist/bridge.cjs` + `thunderbolt-stdio-bridge.cmd` | `dist/zeus.cjs` + `zeus.cmd` |
| CLI invocation | `thunderbolt-stdio-bridge --mode acp -- …` | `zeus bridge --mode acp -- …` |
| release tag | `stdio-bridge-v*` | `zeus-v*` |
| workflow file | `stdio-bridge-release.yml` | `zeus-release.yml` (paths `zeus/**`, working-dir `zeus`) |
| install URL | `…/main/thunderbolt-stdio-bridge/install.sh` | `…/main/zeus/install.sh` |
| release asset(s) | `bridge.cjs` (+ `.sha256`) | `zeus.cjs` (+ `.sha256`) |

## Components

### 1. Bridge package (`zeus/`)
- **`src/args.js`** — add a thin subcommand layer. Rename the current flag parser to `parseBridgeArgs(argv)` (unchanged logic). New `parseArgs(argv)` dispatch:
  - `[]` or `-h`/`--help` → `{ help: 'root' }`
  - `-V`/`--version` → `{ version: true }`
  - `bridge` → `parseBridgeArgs(argv.slice(1))` (which itself returns `{ help: 'bridge' }` on `bridge --help`, or the resolved bridge opts, tagged `command: 'bridge'`)
  - anything else → `UsageError(unknown command: <x>)` (exit 64)
- **`bin/cli.js`** — dispatch on the parse result: root help (lists `bridge`), bridge help (the current flag usage), version, or run the bridge (unchanged). Help text uses `zeus bridge …`.
- **`scripts/build-cli.mjs`** — `outfile = dist/zeus.cjs`; `.cmd` → `dist/zeus.cmd` forwarding to `zeus.cjs`.
- **`install.sh`** — `CMD="zeus"`; asset `zeus.cjs` (+ `zeus.cjs.sha256`); raw URL `…/main/zeus/install.sh`; version resolved from `main`'s `zeus/package.json`.
- **`package.json`** — `name: "zeus"`, `bin: { "zeus": "bin/cli.js" }`, `files` unchanged, scripts unchanged.
- **`README.md`** — rewrite for `zeus` + `zeus bridge …`.

### 2. Delivery (`.github/workflows/`)
- Rename to `zeus-release.yml`; `paths: ['zeus/**']`; `working-directory: zeus`; tag `zeus-v*`; build `zeus.cjs`; smoke `zeus bridge --help` + ACP/MCP listening; attach `zeus.cjs` + `zeus.cjs.sha256`.

### 3. App glue (`src/`)
- **`src/lib/agent-bridge-command.ts`** — `bridgeBin = 'zeus'`; `composeBridgeCommand` → `zeus bridge --mode acp [--allow-origin '<origin>'] -- <launch>`; `composeInstallCommand` → the `…/zeus/install.sh` curl. (`needsAllowOrigin` unchanged.)
- **In-app tutorial** = `src/components/settings/agents/bridge-connect-dialog.tsx` (the "Connect via bridge" 3-step dialog). The commands render from the composers (auto-update); replace any literal `thunderbolt-stdio-bridge` in step copy + the `add-custom-agent-dialog.tsx` hint.

### 4. Tests
Update assertions to the new name/command: `zeus/{bin/cli.test.js, src/args.test.js}` (root vs bridge help, subcommand parsing, unknown-command), `src/lib/agent-bridge-command.test.ts` (×6), `bridge-connect-dialog.test.tsx`, `copyable-command.test.tsx`, `add-custom-agent-dialog.test.tsx`, `e2e/acp-agents-catalog.spec.ts`.

## Risks
- **Three names must stay in sync:** bin `zeus` ↔ install.sh (CMD + raw URL + asset) ↔ workflow (paths + tag + asset) ↔ `composeInstallCommand` URL. A mismatch silently breaks install or the connect command. The test suite + a live smoke catch most.
- **Dir rename** ripples into every relative path (build, workflow, install URL). Use `git mv`.
- Pre-merge (#1021 unmerged) ⇒ clean cutover, no `thunderbolt-stdio-bridge` alias / deprecation needed.

## Validation
`bun run check` + `bun test` (package + app) green; build `dist/zeus.cjs` (single shebang) + smoke `zeus bridge --help/--version/ACP listening/MCP listening`; re-run the live connect flow in the running desktop/web app (ACP + MCP via the renamed bridge). Then `/simplify` + blind GLM (glm cli) + Codex (codex cli) review; act on consensus.

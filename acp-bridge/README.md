# acp-bridge

A tiny CLI that lets [Thunderbolt](https://thunderbird.net) talk to a **local stdio
ACP agent** (Claude Code, Gemini, any [Agent Client Protocol](https://agentclientprotocol.com)
agent) over a localhost WebSocket.

Thunderbolt runs in the browser and can only reach an agent over a WebSocket.
Most ACP agents speak over **stdio** (newline-delimited JSON-RPC). `acp-bridge`
spawns the agent and relays its stdio to a `ws://127.0.0.1:PORT` socket — one
JSON object per WebSocket message, exactly what Thunderbolt expects.

```
Thunderbolt (browser)  ⇄  ws://127.0.0.1:PORT  ⇄  acp-bridge  ⇄  stdio  ⇄  your agent
```

## Usage

```bash
npx acp-bridge -- <agent-command> [agent-args...]
```

Everything after `--` is the agent command, passed **straight to the OS with no
shell** (no quoting bugs, no injection). For example:

```bash
npx acp-bridge -- npx -y @zed-industries/claude-code-acp
```

It prints a banner like:

```
acp-bridge ready
  Agent:     npx
  Listening: ws://127.0.0.1:51847

Paste this URL into Thunderbolt → Add Custom Agent:
  ws://127.0.0.1:51847

Ctrl-C to stop.
```

Copy the `ws://127.0.0.1:PORT` URL and paste it into Thunderbolt under
**Add Custom Agent**. Press **Ctrl-C** to stop the bridge (it cleanly shuts the
agent down too).

### Options

| Flag                 | Default     | Meaning                                                       |
| -------------------- | ----------- | ------------------------------------------------------------- |
| `--port <n>`         | ephemeral   | WebSocket port. Omit it to let the OS pick a free one.        |
| `--host <a>`         | `127.0.0.1` | Bind address. Loopback only by default — keep it that way. A non-loopback host prints a prominent warning (other machines on your network could then reach the agent). |
| `--allow-origin <o>` | —           | Extra WebSocket `Origin` to accept (repeatable). The Thunderbolt app origins are allowed by default; use this for dev/self-host. |
| `--allow-any-origin` | off         | Disable the `Origin` check entirely. Loud escape hatch — see [Origin allowlist](#origin-allowlist). |
| `--verbose`          | off         | Per-frame logging (method + size, **redacted** — never content). |
| `--json`             | off         | Emit logs as raw JSON instead of pretty one-liners.           |
| `--help`             |             | Show help.                                                    |
| `--version`          |             | Print the version.                                            |

### Origin allowlist

Browser WebSocket connections are **not** same-origin-protected: without a guard,
any web page open in a browser on your machine could connect to
`ws://127.0.0.1:PORT` and drive your local agent (read/write files, run terminal
commands). To close that, the bridge only accepts connections whose `Origin`
header is a known Thunderbolt app origin:

- `https://app.thunderbolt.io` (production web app)
- `tauri://localhost` and `http://tauri.localhost` (Tauri desktop/mobile webview)
- `http://localhost:1420` (Vite dev server — web + Tauri dev)
- a **missing/empty** `Origin` (native and Tauri webviews routinely send none)

A connection with any other `Origin` is rejected (WebSocket close code `1008`).
Extend the list with `--allow-origin <origin>` (repeatable) for dev or self-host.
`--allow-any-origin` turns the check off entirely and prints a startup warning —
only use it on a trusted machine.

## Desktop vs web

- **Thunderbolt desktop (Tauri):** the app can open the localhost WebSocket
  directly.
- **Thunderbolt web (browser):** the browser may ask permission to reach your
  local network (Chrome's Local Network Access prompt) — click **Allow**. The
  connection still goes browser → your own machine; nothing leaves your computer.

The bridge binds to `127.0.0.1` only by default, so it is reachable solely from
your own machine.

## Privacy

`acp-bridge` is a **dumb relay** — it forwards bytes between the agent and
Thunderbolt and never inspects, stores, or transmits your prompts or the agent's
output anywhere else.

Logging is **allowlist-based**: log lines only ever contain structural scalars
(timestamp, direction, message kind, a fixed set of known method names, JSON-RPC
id, byte size, status, integer error codes, lifecycle events). Prompt text, tool
output, file paths, tokens, and your full command line are **never** logged —
even with `--verbose`. The agent's own stderr passes through to your terminal
untouched.

## How it works

- **Framing.** ACP stdio is newline-delimited JSON-RPC; Thunderbolt's WebSocket
  expects one JSON object per message. The bridge splits the agent's stdout into
  lines and sends each non-empty line as exactly one WebSocket frame, and writes
  each inbound WebSocket message to the agent's stdin with a trailing newline.
  Non-JSON stdout lines are dropped (and warned about) so Thunderbolt's
  `JSON.parse` never chokes.
- **One persistent agent.** A single child process is spawned and reused across
  WebSocket reconnects, so session state survives Thunderbolt's reconnect
  attempts.
- **Clean shutdown.** Ctrl-C (or `SIGTERM`) closes the WebSocket and sends the
  agent `SIGTERM`, then waits for the agent to actually exit before exiting
  itself. If a stubborn agent ignores `SIGTERM`, a 2-second fallback escalates to
  `SIGKILL` and then exits — so the agent is never orphaned. If the agent exits
  on its own, the bridge tears down with it.

## Requirements

- Node.js ≥ 18
- One dependency: [`ws`](https://github.com/websockets/ws). Everything else is a
  Node built-in.

## Development

```bash
bun install
bun test
```

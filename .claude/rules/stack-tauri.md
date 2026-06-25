---
name: stack-tauri
description: Tauri 2 IPC contract, command conventions, event system, capabilities permissions, plugin calls
category: stack
trigger: on-touch
requires:
  - "@tauri-apps/api"
  - tauri
globs: src-tauri/src/commands/**, src/lib/**, src-tauri/capabilities/*, src-tauri/tauri.conf.json
evidence:
  - src-tauri/src/commands/session.rs
  - src-tauri/src/services/transfer_manager.rs
  - src/lib/session.ts
  - src/lib/sftp.ts
  - src/lib/error.ts
  - src/types/events.ts
  - src-tauri/capabilities/default.json
source_hashes:
  src/lib/session.ts: a729a6923290600502700c6a80ce5a3b39f08e0c596d4171b301bf05fdf59267
  src/lib/sftp.ts: acfc3ea10c262a687ddf3f2714d7cfb1726fc16f2f03b73cd6668bd27f08fbe6
  src/lib/error.ts: 74f8fdd5a6f8ae80025ddd11dd7163037d32c356d7150631b5505f0340286a3e
  src/types/events.ts: 116777c6654d469913e3065be28b02b8d1d81a1c069fd6f3c191eca534d6d28d
  src-tauri/capabilities/default.json: d411bc081134d697ae8d0b225a713668a6284a4bc940d4f824e516427d22fb05
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# Tauri 2

## Rust Command Template

```rust
#[tauri::command]
pub async fn session_connect(
    app: AppHandle,
    session_manager: State<'_, Arc<SessionManager>>,
    db: State<'_, Arc<Database>>,
    input: ConnectInput,
) -> AppResult<SessionConnectResult> {
    let sm = (*session_manager).clone();
    let db = (*db).clone();
    tokio::task::spawn_blocking(move || sm.connect(&db, /* ... */))
        .await
        .map_err(|e| AppError::internal(e.to_string()))??
}
```

**Hard rules**:

- All commands are `pub async fn` + `#[tauri::command]`, returning `AppResult<T>`
- Shared state is `State<'_, Arc<T>>`; clone before blocking: `(*state).clone()`
- Any `ssh2::*` / `rusqlite::*` call must go into `spawn_blocking`
- Input structs carry `#[serde(rename_all = "camelCase")]`
- Commands are registered in `src-tauri/src/lib.rs` via `tauri::Builder::invoke_handler(generate_handler![...])`

## TypeScript Wrappers (src/lib/)

All IPC goes through `timedInvoke` + Zod:

```typescript
import { z } from "zod";
import { parseInvokeResult, timedInvoke } from "./error";

const SessionConnectResultSchema = z.object({
  sessionId: z.string().nullable(),
  homePath: z.string().nullable(),
  needHostKeyConfirm: z.boolean(),
  serverFingerprint: z.string().nullable(),
  serverKeyType: z.string().nullable(),
  hostKeyMismatch: z.boolean(),
});

export async function connect(input: ConnectInput): Promise<SessionConnectResult> {
  const result = await timedInvoke("session_connect", { input });
  return parseInvokeResult(SessionConnectResultSchema, result, "session_connect");
}
```

- **30-second default timeout**: built into `timedInvoke`; long tasks (e.g. `sftp_delete_recursive`) must pass `300_000` explicitly
- **Argument name alignment**: if the Rust command signature uses `input: ConnectInput`, the TS side passes `{ input }`; if it's top-level args `{ sessionId, path }`, the TS side passes `{ sessionId, path }` directly

### File Organization

```
src/lib/
  error.ts        # timedInvoke / parseInvokeResult / showErrorToast / handleErrorByCode
  session.ts      # connect / disconnect / trustHostKey / reconnectWithTrustedKey
  profile.ts      # listProfiles / upsertProfile / deleteProfile
  sftp.ts         # listDir / stat / mkdir / rename / deleteItem / batchDelete
  transfer.ts     # startTransfer / cancelTransfer / listTasks
  terminal.ts     # openTerminal / writeInput / resize / close
  settings.ts     # loadSettings / saveSettings
  session.ts      # Session IPC
  platform.ts     # isMac / formatShortcut (browser API, no invoke)
  theme.tsx       # Theme context (not IPC)
  utils.ts        # cn (tailwind-merge + clsx)
  validation.ts   # Shared Zod schemas
```

## Event System

### Naming Convention

`domain:action` — lowercase, colon-separated:

| Event name           | payload                 | Source                  |
| -------------------- | ----------------------- | ----------------------- |
| `transfer:progress`  | `TransferProgressPayload` | `transfer_manager.rs`   |
| `transfer:status`    | `TransferStatusPayload` | `transfer_manager.rs`   |
| `session:status`     | `SessionStatusPayload`  | `session_manager.rs`    |
| `security:hostkey`   | `HostKeyPayload`        | `commands/security.rs`  |
| `terminal:output`    | `TerminalOutputPayload` | `terminal_manager.rs`   |
| `terminal:status`    | `TerminalStatusPayload` | `terminal_manager.rs`   |

Declare them centrally in the `EVENTS` constant in `src/types/events.ts`.

### Rust-Side Emit

```rust
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferProgressPayload { /* ... */ }

app.emit("transfer:progress", &payload).ok(); // ignore errors from the frontend closing the window
```

**Throttling high-frequency events**:

- `transfer:progress` — 200ms throttle (`transfer_manager::PROGRESS_THROTTLE_MS`)
- `terminal:output` — adaptive (interactive 4ms/4KB, bulk 16ms/16KB)

### Frontend Listening (StrictMode-safe Pattern)

```typescript
useEffect(() => {
  let cancelled = false;
  let unlisten: UnlistenFn | null = null;
  const setup = async () => {
    const fn = await listen<TransferProgressPayload>("transfer:progress", (e) => {
      if (cancelled) return;
      // handler using refs, not stale closure vars
    });
    if (cancelled) { fn(); } else { unlisten = fn; }
  };
  setup();
  return () => { cancelled = true; unlisten?.(); };
}, []);
```

Use `ref` to store mutable values (sessionId, remotePath) inside the handler to avoid stale closures.

## Capabilities Permissions

`src-tauri/capabilities/default.json` — the window points precisely to `["main"]`, with the narrowest-grained permissions:

```json
{
  "windows": ["main"],
  "permissions": ["core:default", "opener:default", "dialog:default", "fs:allow-stat"]
}
```

Before adding a new plugin API, declare the permission in this file first, or the IPC call will be rejected by the Tauri layer.

## Plugin Calls

```typescript
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { open as openLink } from "@tauri-apps/plugin-opener";

// dialog.open() returns null on cancel — you must check explicitly
const selected = await open({ multiple: false, directory: false });
if (!selected) return;
```

Installed plugins (see `package.json`): `@tauri-apps/plugin-dialog` / `@tauri-apps/plugin-fs` / `@tauri-apps/plugin-opener`.

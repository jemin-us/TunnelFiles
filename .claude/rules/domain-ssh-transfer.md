---
name: domain-ssh-transfer
description: SSH session isolation, SFTP channel reuse, Terminal independent session, transfer 64KB/200ms, auth lockout, keepalive
category: domain
trigger: on-touch
requires:
  - ssh2
  - tokio
  - tokio-util
globs: src-tauri/src/services/session_manager.rs, src-tauri/src/services/sftp_service.rs, src-tauri/src/services/transfer_manager.rs, src-tauri/src/services/terminal_manager.rs, src-tauri/src/commands/{session,sftp,transfer,terminal}.rs
evidence:
  - src-tauri/src/services/session_manager.rs
  - src-tauri/src/services/transfer_manager.rs
  - src-tauri/src/services/terminal_manager.rs
source_hashes:
  src-tauri/src/services/session_manager.rs: 5ac5d5fd9bd1bb881ea06470dab210a5c8a01016f9106768f7b4dc87a4894543
  src-tauri/src/services/transfer_manager.rs: d267faec60e3f6f8ee7170faadf7eab998293d8ce22b3268cfb64072cd4b5c0c
  src-tauri/src/services/terminal_manager.rs: d88c32156f21b98594bb83cc3eaf587a98add9e0fed37227f5731a6956eeeca7
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# SSH / SFTP / Transfer

## Session Isolation Model

```
┌─ ManagedSession (blocking SSH session)
│    ├── session: ssh2::Session         # Main SSH connection
│    ├── sftp: Mutex<ssh2::Sftp>        # Main SFTP channel (shared)
│    ├── cached_credentials             # Used to derive Terminal session
│    └── last_activity                  # Auto-cleaned after 30 min idle
│
├─ Terminal (independent SSH session, non-blocking)
│    ├── ssh_session: Mutex<Session>    # Independent connection, supports reconnect
│    └── channel: Mutex<Channel>        # PTY channel
│
└─ Transfer (spawn_blocking on the main session)
     └── create_sftp_channel()          # Independent SFTP channel from main session
```

**Hard rules**:

- SFTP operations (list/stat/mkdir/rename/delete/chmod) use the **main session's SFTP** (`lock_sftp()` serialized)
- Concurrent transfers use `create_sftp_channel()` to derive an **independent SFTP channel** (reuses the SSH connection but an independent channel)
- Terminal uses `create_terminal_session()` to create a **brand-new SSH session** (independent TCP connection + auth + non-blocking mode)
- Terminal failure does not affect the main session; when the main session fails the Terminal keeps living

## Authentication Credential Caching

```rust
pub struct CachedCredentials {
    password: Option<String>,
    passphrase: Option<String>,
}
// zeroize on Drop
```

When the Terminal is created it **borrows** (does not clone) via `with_cached_credentials(|pwd, pp| ...)`, and the copy returned by authentication is immediately `zeroize()`d after use. This avoids accessing the system keychain multiple times (macOS users don't need to re-authorize).

## TCP/SSH Connection Parameters

```rust
tcp.set_read_timeout(Some(timeout))?;
tcp.set_write_timeout(Some(timeout))?;
tcp.set_nodelay(true)?;   // Disable Nagle — reduces terminal input latency
session.set_timeout(timeout.as_millis() as u32);
session.set_keepalive(true, 60);  // 60-second keepalive
```

**Parameter source**: `timeout_secs` comes from `Settings::connection_timeout_secs` (user-configurable).

## Host Key Verification Flow

See `core-security.md` for details. In brief:

1. `verify_hostkey(db, host, port, key_type, fp)` → `FirstConnection` / `Mismatch` / `Matched`
2. The first two return `NeedHostKeyConfirm` to the frontend (via `SessionConnectResult.needHostKeyConfirm`)
3. After the user confirms, the frontend calls `trust_hostkey` + `session_connect_after_trust`, and **the backend re-verifies the fingerprint**

## Authentication Failure Lockout

```rust
const AUTH_FAILURE_THRESHOLD: u32 = 5;
const AUTH_LOCKOUT_SECS: u64 = 300;
```

5 failures lock for 5 minutes (per `profile_id`), reset to zero on success. During lockout `check_auth_lockout` first checks under a read lock, and upgrades to a write lock to clean up expired records.

## Idle Session Cleanup

A background thread at startup checks every **300 seconds** and closes sessions idle for **≥ 1800 seconds** (30 minutes):

```rust
std::thread::spawn(move || loop {
    std::thread::sleep(Duration::from_secs(300));
    sm_for_cleanup.cleanup_stale_sessions(1800);
});
```

`ManagedSession::touch()` is called on every `get_session()` — `RwLock<Instant>` updates `last_activity`.

## File Transfer

### Basic Parameters

```rust
const CHUNK_SIZE: usize = 64 * 1024;             // 64KB
const PROGRESS_THROTTLE_MS: u128 = 200;          // 200ms
```

**Hard rules**:

- **Forbidden** to `read_to_end` the entire file into memory — use 64KB chunk streaming
- **Forbidden** to emit progress on every chunk — throttle at 200ms (built into `ProgressTracker::update`)
- On 100% completion, must emit `ProgressTracker::finish()` once (guarantees the UI closes out)
- Transfer speed calculation: `bytes / elapsed_secs` (integer bytes/s)

### Cancellation

```rust
use tokio_util::sync::CancellationToken;

let token = CancellationToken::new();
// Check on every chunk loop iteration
if token.is_cancelled() {
    return Err(AppError::canceled());
}
```

After cancellation, fire a `transfer:status` event (`status: "canceled"`), handled by the frontend's `useTransferStore.updateStatus`.

### Concurrency and Retry

- `tokio::sync::Semaphore` controls concurrency (`settings.max_concurrent_transfers`)
- Auto-retry count `settings.transfer_retry_count`; only retryable errors (Timeout / NetworkLost / RemoteIoError) are retried
- Emit `retry_count` before retrying so the UI can display it

## Terminal (PTY + Adaptive Batching)

```rust
const DEFAULT_COLS: u16 = 80;
const DEFAULT_ROWS: u16 = 24;
const PTY_READ_BUFFER_SIZE: usize = 8192;
const INTERACTIVE_THROTTLE_MS: u64 = 4;      // Recent user input → interactive mode
const INTERACTIVE_BUFFER_LIMIT: usize = 4096;
const BULK_THROTTLE_MS: u64 = 16;            // No user input → bulk mode
const BULK_BUFFER_LIMIT: usize = 16384;
const INTERACTIVE_WINDOW_MS: u64 = 100;
const MAX_RECONNECT_ATTEMPTS: u8 = 3;
```

**Key mechanisms**:

- `last_input_ts: AtomicU64` is updated by `write_input`
- The reader thread reads `last_input_ts`; if it's < 100ms ago it uses interactive mode (4ms/4KB batching), otherwise bulk mode (16ms/16KB)
- Reconnect lock order is fixed at `channel → session` (prevents deadlock with resize)
- Reader `generation: AtomicU64` is a generation counter — incremented each time a new reader is started on reconnect; an old reader exits when it sees a mismatch

## SFTP Batch Delete

`sftp_delete_recursive` / `sftp_batch_delete` are long-running tasks:

- IPC timeout explicitly set to `300_000` (5 minutes) — see `src/lib/sftp.ts`
- The server side does canonicalization — if both a parent directory and a child path are in the list, skip the child path
- Directories must be deleted recursively, files are directly `unlink`ed
- Progress event `delete:progress` payload `{ path, deletedCount, totalCount, currentPath }`

## Prohibitions

- **Forbidden** to run SFTP over the Terminal (the Terminal session does not create an SFTP channel)
- **Forbidden** to share the main session's SFTP channel during file transfer (blocks other SFTP operations) — use `create_sftp_channel()`
- **Forbidden** to pass password/passphrase as `Clone` data — use borrows (`&str`) + `zeroize`
- **Forbidden** to modify `CHUNK_SIZE` / `PROGRESS_THROTTLE_MS` without evaluating:
  - Smaller chunk → more syscalls, lower throughput
  - Smaller throttle → frontend event backlog, UI jank
- **Forbidden** to call `ssh2::Session::*` directly in an `async fn` (use `spawn_blocking`, see `stack-rust.md`)
- **Forbidden** to add an `unsafe impl Send/Sync` type without documenting the SAFETY invariants

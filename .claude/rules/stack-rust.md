---
name: stack-rust
description: Rust backend constraints — thiserror, rusqlite PRAGMA, ssh2 blocking, spawn_blocking, unsafe Send/Sync, keyring
category: stack
trigger: on-touch
requires:
  - tauri
  - ssh2
  - rusqlite
  - tokio
  - thiserror
  - tracing
globs: src-tauri/src/**/*.rs, src-tauri/Cargo.toml
evidence:
  - src-tauri/src/services/session_manager.rs
  - src-tauri/src/services/transfer_manager.rs
  - src-tauri/src/services/storage_service.rs
  - src-tauri/src/models/error.rs
  - src-tauri/Cargo.toml
source_hashes:
  src-tauri/Cargo.toml: e2005c59c471124f1657fc14a50a18e102c156dd9a7f29798d08bb7a92555722
  src-tauri/src/services/session_manager.rs: 5ac5d5fd9bd1bb881ea06470dab210a5c8a01016f9106768f7b4dc87a4894543
  src-tauri/src/models/error.rs: 5dc7f8beb0a92063d7c7d2cf7675928ce6e26ccf498c2d4560e6d548a5e27984
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# Rust Backend

## Module Structure

```
src-tauri/src/
  commands/    # #[tauri::command] entry points (profile / session / sftp / terminal / transfer / security / settings)
  services/    # Business logic (SessionManager / SftpService / TerminalManager / TransferManager / Database)
  models/      # Data structs (Profile / FileEntry / Settings / TransferTask / AppError / ErrorCode)
  utils/       # path_security / logging
  lib.rs       # run() — init order: DB → Logging → Managers → Tauri Builder
  main.rs      # Entry point, calls lib::run()
```

Dependency flow: **commands → services → models/utils**. The command layer only does "argument parsing + spawn_blocking + error wrapping"; business logic lives in services.

## Error Handling (thiserror + AppError)

See `domain-errors.md` for details. Key rules:

- All `Result<T, _>` is aliased to `AppResult<T>` = `Result<T, AppError>`
- Domain constructors: `AppError::auth_failed("...")`, `AppError::not_found("...")`, `AppError::timeout("...")`, etc.
- Add context: `.with_detail(...)`, `.with_retryable(true)`
- `From` trait implementations live in `models/error.rs`: `ssh2::Error` / `std::io::Error` / `rusqlite::Error` / `serde_json::Error` / `keyring::Error` → `AppError`
- `?` automatically goes through the From conversion

## ssh2 Blocking Mode

ssh2 is a C FFI wrapper, **blocking + `!Send + !Sync`**. All calls must go into `tokio::task::spawn_blocking`:

```rust
// ✅ Correct
let sm = (*session_manager).clone();
tokio::task::spawn_blocking(move || {
    sm.list_dir(session_id, &path)
})
.await
.map_err(|e| AppError::internal(e.to_string()))??

// ❌ Wrong: blocks the tokio runtime, and ssh2 is not thread-safe
async fn bad_example(sm: Arc<SessionManager>) {
    sm.list_dir(/* ... */) // may compile (if Send is wrapped on), fails at runtime
}
```

## unsafe impl Send/Sync Invariants

`SessionManager` and `ManagedTerminal` both manually `unsafe impl Send + Sync` (see `session_manager.rs:916`, `terminal_manager.rs:76`). When maintaining them you must:

1. Keep all calls to `session.session` / `session.sftp` / `channel` inside `spawn_blocking`
2. Protect internal mutable state with `RwLock` / `Mutex` / `Atomic*` (no bare `Cell<T>`)
3. Keep a fixed lock order: `channel → session` (reconnect scenario)
4. Update the SAFETY comment next to the type definition when changing the structure

## SQLite (rusqlite)

Enable on every connection:

```rust
conn.execute_batch(
    "PRAGMA journal_mode=WAL;
     PRAGMA synchronous=NORMAL;
     PRAGMA cache_size=-64000;
     PRAGMA foreign_keys=ON;",
)?;
```

**Hard rules**:

- Parameterized queries: `params![name, age]` or `named_params!{":name": name}`; **forbidden** to build SQL with `format!`
- Use `conn.prepare_cached(SQL)?` for repeated queries
- Write/read separation: `Database` holds one `Mutex<Connection>` writer + a pool for readers (if any)
- Wrap bulk writes in a transaction: `let tx = conn.transaction()?; ...; tx.commit()?;`

## Choosing Concurrency Primitives

| Scenario                          | Choice                                      |
| --------------------------------- | ------------------------------------------- |
| Read-mostly + occasional write (session pool) | `RwLock<HashMap<K, Arc<V>>>`     |
| Single writer (SFTP channel)      | `Mutex<T>` (`std::sync::Mutex`)             |
| Atomic flags (`shutdown`/`cols`/`last_input_ts`) | `AtomicBool` / `AtomicU16` / `AtomicU64` |
| Async task concurrency control    | `tokio::sync::Semaphore`                    |
| Cancellable tasks                 | `tokio_util::sync::CancellationToken`       |

**Forbidden** to use `tokio::sync::Mutex` (async-aware lock) in ssh2-related code — ssh2 is blocking; hold a `std::sync::Mutex` inside `spawn_blocking`.

## tracing Logs

```rust
tracing::debug!(session_id = %id, host = %host, "session established");  // %x uses Display
tracing::warn!(error = %e, "connection failed");
tracing::info!(count = cleaned, "cleaned up idle sessions");
```

- **Forbidden** to use `println!` / `eprintln!` (except during startup before `init_logging()`)
- **Forbidden** for logs to contain a full fingerprint / password / private key (see core-security.md)
- The user setting `log_level` is mapped via `LogLevel::to_tracing_level()`

## Cargo Dependency Notes

Key dependencies (see `Cargo.toml`):

- `ssh2 = "0.9"` + `openssl` vendored
- `rusqlite = { version = "0.31", features = ["bundled"] }` — bundles SQLite, no system library needed
- `tokio = { features = ["full"] }`, `tokio-util = "0.7"`
- `keyring = { version = "3", features = ["apple-native", "windows-native", "linux-native"] }`
- `thiserror = "1"`, `uuid = { features = ["v4"] }`, `chrono = { features = ["serde"] }`
- `zeroize = "1"`, `sha2 = "0.10"`, `base64 = "0.22"`
- `ts-rs = "12.0.1"` in `[dev-dependencies]` (exports TS bindings only during tests)

## Unwrap Rules

- `unwrap()` is allowed only inside `#[cfg(test)]` modules
- Production code: `?` or `expect("reason describing why this can't fail")`
- Cloning an `Arc<T>` does not need `unwrap` — return the `Arc`, not an `Option`

## Code Style

```bash
cargo fmt --check           # Formatting
cargo clippy -- -D warnings # Static analysis, warnings treated as errors (CI requirement)
```

Before committing tests: `cd src-tauri && cargo test --lib --bins`.

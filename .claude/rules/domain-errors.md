---
name: domain-errors
description: AppError + the 13 ErrorCode classes, From conversion chain, toast tiers, handleErrorByCode dispatch, timedInvoke + Zod validation
category: domain
trigger: on-touch
requires:
  - zod
  - sonner
  - thiserror
globs: src/lib/error.ts, src-tauri/src/models/error.rs, src/types/error.ts, src-tauri/src/**/*.rs, src/lib/**/*.ts
evidence:
  - src/lib/error.ts
  - src-tauri/src/models/error.rs
  - src/types/events.ts
  - src/types/bindings/ErrorCode.ts
  - src/types/bindings/AppError.ts
source_hashes:
  src/lib/error.ts: 74f8fdd5a6f8ae80025ddd11dd7163037d32c356d7150631b5505f0340286a3e
  src-tauri/src/models/error.rs: 5dc7f8beb0a92063d7c7d2cf7675928ce6e26ccf498c2d4560e6d548a5e27984
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# Error Handling

## The 13 ErrorCode Classes (see `models/error.rs`)

| Code                  | When to use                                  | Retryable default |
| --------------------- | -------------------------------------------- | -------------- |
| `AuthFailed`          | SSH username/password/passphrase/key auth failure | false          |
| `HostkeyMismatch`     | TOFU fingerprint mismatch                    | false          |
| `Timeout`             | TCP connect / SSH handshake / IPC 30s timeout | true           |
| `NetworkLost`         | `ConnectionReset` / `ConnectionAborted` / banner not received | true |
| `NotFound`            | file/directory/profile/session/credential not found | false          |
| `PermissionDenied`    | local IO permission / SFTP `FX_PERMISSION_DENIED` | false          |
| `DirNotEmpty`         | `rmdir` on a non-empty directory (requires call-site conversion of `FX_FAILURE`) | false          |
| `AlreadyExists`       | SFTP `FX_FILE_ALREADY_EXISTS`                | false          |
| `LocalIoError`        | other local IO errors, SQLite, keyring, serde | true           |
| `RemoteIoError`       | other remote SSH/SFTP errors                 | true           |
| `Canceled`            | user-canceled transfer                       | false          |
| `InvalidArgument`     | address parse failure, path validation failure | false          |
| `Unknown`             | the should-never-happen fallback (e.g. lock poisoned) | false          |

Serialized as `SCREAMING_SNAKE_CASE` (`AUTH_FAILED` / `HOSTKEY_MISMATCH` ...).

## Rust side: domain constructors

```rust
AppError::auth_failed("密码错误")
AppError::timeout("连接超时")                    // default retryable=true
AppError::network_lost("服务器未响应")           // default retryable=true
AppError::not_found(format!("Profile {} 不存在", id))
AppError::permission_denied("禁止访问")
AppError::already_exists(path)
AppError::canceled()                             // fixed "操作已取消"
AppError::invalid_argument(msg)
AppError::new(ErrorCode::Unknown, msg)           // fallback

// Add context
err.with_detail(format!("期望: {}\n实际: {}", expected, actual))
   .with_retryable(false)
```

## From conversion chain

```rust
// ssh2 error code → AppError
impl From<ssh2::Error> for AppError {
    fn from(err: ssh2::Error) -> Self {
        match err.code() {
            ssh2::ErrorCode::Session(-18) => AppError::auth_failed(...),      // LIBSSH2_ERROR_AUTHENTICATION_FAILED
            ssh2::ErrorCode::Session(-13) => AppError::network_lost(...),     // LIBSSH2_ERROR_BANNER_RECV
            ssh2::ErrorCode::Session(-43) => AppError::timeout(...),          // LIBSSH2_ERROR_TIMEOUT
            ssh2::ErrorCode::SFTP(2) => AppError::not_found(...),             // LIBSSH2_FX_NO_SUCH_FILE
            ssh2::ErrorCode::SFTP(3) => AppError::permission_denied(...),     // LIBSSH2_FX_PERMISSION_DENIED
            ssh2::ErrorCode::SFTP(4) => AppError::remote_io_error(...),       // FX_FAILURE — call site may convert to DirNotEmpty
            ssh2::ErrorCode::SFTP(11) => AppError::already_exists(...),       // FX_FILE_ALREADY_EXISTS
            _ => AppError::new(ErrorCode::RemoteIoError, message),
        }
    }
}

// std::io::Error → AppError (NotFound/PermissionDenied/TimedOut/ConnectionReset/...)
// rusqlite::Error → AppError::LocalIoError (with "数据库错误:" prefix)
// keyring::Error::NoEntry → AppError::not_found("凭据不存在")
// serde_json::Error → AppError::LocalIoError (with "JSON 解析错误:" prefix)
```

A new `From` impl must add a corresponding test in the `#[cfg(test)] mod tests` of `models/error.rs` (see the existing `test_from_ssh2_error_*`).

## Call-site-specific mapping

`FX_FAILURE` (the generic failure code) is highly ambiguous; the call site must refine it by context:

```rust
// sftp_service.rs::rmdir
if let Err(e) = sftp.rmdir(path) {
    let app_err: AppError = e.into();
    if app_err.code == ErrorCode::RemoteIoError && /* heuristic: directory not empty */ {
        return Err(AppError::dir_not_empty("目录不为空"));
    }
    return Err(app_err);
}
```

## TS side: receiving and checking

```typescript
import { isAppError, getErrorCode, isRetryable } from "@/lib/error";
import { ErrorCode } from "@/types/error";

try {
  const result = await connect({ profileId });
} catch (error) {
  if (isAppError(error) && error.code === ErrorCode.AUTH_FAILED) {
    openPasswordDialog();
    return;
  }
  showErrorToast(error); // automatically shows message + detail + retry button
}
```

**ErrorCode constant names**: the TS side uses SCREAMING_SNAKE_CASE (`ErrorCode.AUTH_FAILED`), directly matching the Rust serialization result.

## handleErrorByCode dispatch

```typescript
import { handleErrorByCode } from "@/lib/error";

await handleErrorByCode(error, {
  [ErrorCode.AUTH_FAILED]: () => openPasswordDialog(),
  [ErrorCode.HOSTKEY_MISMATCH]: (e) => showHostKeyWarning(e),
  [ErrorCode.TIMEOUT]: () => retry(),
});
```

Unmatched codes default to `showErrorToast`.

## Toast tiers (fixed durations)

```typescript
export const TOAST_DURATION = {
  SUCCESS: 3000,   // brief confirmation
  ERROR:   6000,   // user needs time to read + decide whether to retry
  WARNING: 5000,   // needs attention but not urgent
  INFO:    4000,   // general notice
} as const;
```

**Forbidden** to stretch a single toast beyond 10s — use a Dialog for blocking issues, not a Toast.

## timedInvoke (30s IPC timeout)

```typescript
const IPC_TIMEOUT_MS = 30_000;

timedInvoke<T>(cmd, args, ms?)  // ms can override the default
```

Long tasks (e.g. `sftp_delete_recursive` / `sftp_batch_delete`) pass `300_000` (5 minutes) explicitly:

```typescript
await timedInvoke("sftp_delete_recursive", { input }, 300_000);
```

On timeout, throws an AppError-like object of the form `{ code: "TIMEOUT", retryable: true }`.

## parseInvokeResult (Zod validation)

```typescript
const result = await timedInvoke("session_connect", { input });
return parseInvokeResult(SessionConnectResultSchema, result, "session_connect");
```

On Zod failure, converts to an `AppError` with `code: "UNKNOWN"` and `detail: "path: message; path: message"`, avoiding exposing a Zod stack directly to the frontend.

## invokeWithErrorHandling (optional wrapper)

```typescript
const profiles = await invokeWithErrorHandling(
  () => timedInvoke("profile_list"),
  { showToast: true, silent: false, onRetry: () => refetch() }
);
```

`silent: true` returns `undefined` instead of throwing (suitable for background sync tasks).

## Prohibitions

- **Forbidden** to throw `new Error()` directly on the TS side — construct an AppError-like `{ code, message, detail?, retryable? }`
- **Forbidden** to use `String` as an error type on the Rust side — use `AppError`
- **Forbidden** to put a technical stack trace in `AppError.message` — use `.detail`
- **Forbidden** to add a new ErrorCode without updating the `ERROR_MESSAGES` default-wording table (`src/types/error.ts`)

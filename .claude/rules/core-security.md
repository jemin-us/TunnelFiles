---
name: core-security
description: Credential management, TOFU host keys, CSP, capabilities permissions, input validation, log redaction
category: core
trigger: always
requires:
  - keyring
  - zeroize
  - sha2
  - base64
evidence:
  - src-tauri/src/services/security_service.rs
  - src-tauri/src/services/session_manager.rs
  - src-tauri/tauri.conf.json
  - src-tauri/capabilities/default.json
  - src-tauri/src/utils/path_security.rs
source_hashes:
  src-tauri/src/services/security_service.rs: 69934aa0856764ecd20161915dc00aee3e3ce0cd904b61d15c70b917e5a5d1ca
  src-tauri/src/services/session_manager.rs: 5ac5d5fd9bd1bb881ea06470dab210a5c8a01016f9106768f7b4dc87a4894543
  src-tauri/tauri.conf.json: 00dc4a1c61c6a8ec701ebf16b20684a2b2cd32eadc506e2ca9aeb7fdb59c3c89
  src-tauri/capabilities/default.json: d411bc081134d697ae8d0b225a713668a6284a4bc940d4f824e516427d22fb05
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# Security

## Credential Storage (Keychain)

The service name is fixed to `com.tunnelfiles.app`; credential keys use a prefix + profile ID.

```rust
const SERVICE_NAME: &str = "com.tunnelfiles.app";
const PASSWORD_PREFIX: &str = "password";
const PASSPHRASE_PREFIX: &str = "passphrase";

// key format: "password:{profileId}" / "passphrase:{profileId}"
let entry = Entry::new(SERVICE_NAME, &format!("password:{}", profile_id))?;
```

- The database only stores `password_ref: Option<String>` (i.e. the keychain key); storing plaintext is **forbidden**
- On connect, retrieve via `credential_get(&password_ref)`
- When deleting a profile, also call `credential_delete_for_profile(&profile_id)`
- The `keyring` crate has the `apple-native`/`windows-native`/`linux-native` features enabled for all three platforms

## Memory Safety (zeroize)

Plaintext passwords/passphrases returned during authentication must be zeroed after use.

```rust
// ManagedSession holds CachedCredentials<password, passphrase>
// The Drop trait zeroes them automatically
impl Drop for CachedCredentials {
    fn drop(&mut self) {
        if let Some(ref mut pwd) = self.password { pwd.zeroize(); }
        if let Some(ref mut pp) = self.passphrase { pp.zeroize(); }
    }
}

// The auth-failure path also needs to zero immediately
Err(e) => { password.zeroize(); Err(AppError::auth_failed("...")) }
```

The terminal's standalone session borrows (does not clone) via `with_cached_credentials(|pwd, pp| ...)`; the copy returned by authentication is `zeroize()`d immediately.

## Host Key Verification (TOFU)

Both first connection (`FirstConnection`) and mismatch (`Mismatch`) return `NeedHostKeyConfirm` to the frontend for a decision:

```rust
match verify_hostkey(db, &host, port, &key_type, &fingerprint)? {
    HostKeyVerifyResult::FirstConnection(_) => Ok(NeedHostKeyConfirm { is_mismatch: false }),
    HostKeyVerifyResult::Mismatch { stored, received } => Ok(NeedHostKeyConfirm { is_mismatch: true }),
    HostKeyVerifyResult::Matched => /* proceed */,
}
```

After the user confirms, call `session_connect_after_trust`, where **the backend fetches the fingerprint again and compares it against the expected one** to prevent a TOFU-gap attack:

```rust
if fingerprint != expected_fingerprint {
    return Err(AppError::new(ErrorCode::Hostkey Mismatch, "服务器指纹在确认后发生变更"));
}
```

The fingerprint format is fixed to `SHA256:{base64(sha256(key))}` (see `session_manager::get_host_key_info`). Stored in the `known_hosts` table.

## Auth Failure Lockout

```rust
const AUTH_FAILURE_THRESHOLD: u32 = 5;
const AUTH_LOCKOUT_SECS: u64 = 300;
```

After 5 failures, lock out for 5 minutes (per `profile_id`). `check_auth_lockout` checks under a read lock; an expired lock is upgraded to a write lock for cleanup. A successful auth resets the counter.

## CSP (tauri.conf.json)

```json
"csp": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' asset: https://asset.localhost data: blob:; font-src 'self' data:; connect-src ipc: http://ipc.localhost; worker-src 'self' blob:"
```

- **Forbidden**: adding `unsafe-eval`, `*`, or an external `connect-src`
- Fonts are loaded via inline `@font-face` urls in `src/index.css` (bypassing the CSP `font-src` check)

## Capabilities Permissions

`src-tauri/capabilities/default.json` current configuration:

```json
{
  "windows": ["main"],
  "permissions": ["core:default", "opener:default", "dialog:default", "fs:allow-stat"]
}
```

- **Forbidden**: using a wildcard window (`["*"]`) — fixed to `["main"]`
- Use the narrowest permission (`fs:allow-stat` over `fs:allow-read`)
- A new plugin must be declared explicitly in this file, otherwise the IPC call is rejected by Tauri

## Input Validation

All IPC commands must validate input at the boundary:

- Remote paths: `utils/path_security.rs::validate_remote_path()` — checks for empty string, length, null bytes, and URL-encoded traversal (`%2e%2e`)
- Profile input: `trim()` first on the `commands/profile.rs` side, reject empty strings, and limit host length
- Numeric parameters: `port: u16` is bounded by serde, so no extra check is needed

## Log Redaction

- **Forbidden** in logs: passwords, passphrases, private key contents, full fingerprints
- Allowed: the first 16 characters of a fingerprint, key_type, user, host, port
- The user-visible `AppError.message`: generic wording; technical details go in `.detail`
- Production uses `tracing::debug!/info!/warn!`; `println!`/`eprintln!` is **forbidden** (except for startup failures)

## Private Key File Permission Check

On Unix, check `mode & 0o077 != 0` before `auth_key`; if group/other have read permission, only `tracing::warn!` (does not block).

## Prohibitions

- **Forbidden** to store plaintext password/passphrase in the database
- **Forbidden** to expose internal paths or stack traces from `AppError.message`
- **Forbidden** to bypass the TOFU flow (even "known hosts" must go through `verify_hostkey`)
- **Forbidden** to add `unsafe impl Send` to a new type without justifying the invariants (see the comments in `session_manager.rs`)

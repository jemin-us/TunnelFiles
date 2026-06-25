---
name: core-dont
description: Cross-cutting list of hard prohibitions — violating these rules causes security holes, deadlocks, or broken UX
category: core
trigger: always
evidence:
  - src-tauri/src/services/session_manager.rs
  - src/lib/error.ts
  - src/index.css
  - CLAUDE.md
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# Hard Prohibitions

## IPC Layer

- **NEVER** call `invoke()` from `@tauri-apps/api/core` directly in a component or hook
  - All IPC must go through `src/lib/*.ts` wrappers + `timedInvoke` + Zod validation
  - Rationale: type safety + 30-second timeout protection + unified error handling
- **NEVER** use the raw `@tauri-apps/api` API outside `src/lib/*.ts` (except `Event` / `listen`, which must follow the StrictMode cancelled-flag pattern)

## Rust SSH Layer

- **NEVER** call `ssh2::Session::*` or `Sftp::*` methods directly in an `async fn`
  - libssh2 is blocking and `!Send + !Sync`; you must use `tokio::task::spawn_blocking`
  - Good example: see the "correct example" in the `unsafe impl Send/Sync` comment at the end of `session_manager.rs`
- **NEVER** hold both the `channel` and `session` locks in a single `spawn_blocking` closure unless in a fixed order (`channel → session`), otherwise you deadlock with `reconnect()`
- **NEVER** add a new `unsafe impl Send/Sync` without justifying the invariants — write a SAFETY comment next to the type definition

## Database

- **NEVER** concatenate SQL strings; always use `params![]` / `named_params!{}`
- **NEVER** omit `PRAGMA journal_mode=WAL; synchronous=NORMAL; foreign_keys=ON` — every new connection must set them
- **NEVER** do bulk writes outside a transaction — wrap them in `conn.transaction()`

## Credentials & Logging

- **NEVER** store plaintext password / passphrase in the database `profiles` table — store only `password_ref` (keychain key)
- **NEVER** log the full fingerprint / password / private key content in `tracing::*` — truncate fingerprints to the first 16 characters
- **NEVER** expose technical details (paths, stack traces) in `AppError.message` — put technical content in `.detail`

## Frontend Styling

- **NEVER** modify the `font-size` of `:root` (`src/index.css` sets it to `16px`) — changing it breaks the Tailwind rem scale
- **NEVER** write hex / rgb colors directly — only use OKLCH tokens (`bg-background`, `text-foreground`, `text-destructive`)
- **NEVER** use bracket values in place of standard Tailwind classes (`min-w-[16px]` → `min-w-4`)
- **NEVER** forget the block override for `truncate` inside a ScrollArea (Radix `display:table` breaks truncation)
- **NEVER** wrap a shadcn Tooltip in an outer `<TooltipProvider>` — the shadcn Tooltip is self-contained

## State Management

- **NEVER** put server-side cache (profiles/settings/files) into Zustand — it must go through TanStack Query
- **NEVER** lift component-local UI state (dialog open, menu position) into Zustand — `useState` is enough
- **NEVER** import across feature directories (`components/terminal` must not import `components/connections`)
- **NEVER** set up a Tauri listener in `useEffect` without the cancelled-flag pattern (StrictMode double-invokes)

## Testing

- **NEVER** mock `@tauri-apps/api/core::invoke` directly as a replacement — mock at the `@/lib/*` boundary
- **NEVER** use WebDriver `text=` / `button*=` selectors in E2E — use XPath (`//button[contains(., '...')]`)
- **NEVER** skip Docker when running integration tests — only a real SSH captures the `LIBSSH2_ERROR_*` mapping

## Git Workflow

- **NEVER** use `--no-verify` to bypass pre-commit
- **NEVER** `git push --force` to `main`
- **NEVER** `--amend` a commit that has already been pushed
- **NEVER** sneak feature changes into a `chore:` commit

## Tauri Configuration

- **NEVER** use a window wildcard (`["*"]`) in capabilities — fix it to `["main"]`
- **NEVER** add `unsafe-eval` or an external `connect-src` to the CSP
- **NEVER** let version numbers drift out of sync (`package.json` / `Cargo.toml` / `tauri.conf.json` must all match)

## Code Style

- **NEVER** add `console.log` / `dbg!()` / `TODO: fix later` into main
- **NEVER** hand-write content in `src/types/bindings/*.ts` — run `pnpm generate:types`
- **NEVER** nest a render function inside the same `.tsx` file (prevents re-mounts) — extract it into a separate component

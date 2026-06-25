---
name: core-git-workflow
description: Conventional Commits convention, pre-commit quality gate, scope conventions
category: core
trigger: always
evidence:
  - CLAUDE.md
  - .github/workflows/ci.yml
source_hashes:
  .github/workflows/ci.yml: c1adef12950bb86851f6d23c9600526c677fc8ffb695c783424dbd94a99fa913
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# Git Workflow

## Commit Format

`type(scope): description`

**Allowed types**: `feat` / `fix` / `refactor` / `style` / `docs` / `test` / `chore`

Historical samples (from `git log`):

```
feat(terminal): add follow directory setting — auto-cd on navigation
fix(ssh): use configured timeout and improve handshake error messages
feat(connections): redesign with frequency-driven visual hierarchy
style: normalize UI consistency — size shorthand, shrink, aria-labels, title tooltips
chore(ci): upgrade actions to Node.js 24 compatible versions
fix(ci): fix SSH key auth in Docker test containers
fix(test): update integration tests for TransferManager::new signature
refactor: extract terminal font/scrollback constants, fix duplicate useSettings call
```

**Common scopes**: `terminal` / `ssh` / `connections` / `transfer` / `ci` / `test` / `sftp` / `settings` / `security`

## Scope Selection Guide

| Change location                       | scope         |
| ------------------------------------- | ------------- |
| `src/pages/ConnectionsPage.tsx`       | `connections` |
| `src/components/terminal/**`          | `terminal`    |
| `src-tauri/src/services/sftp_service.rs` | `sftp`     |
| `src-tauri/src/services/transfer_manager.rs` | `transfer` |
| `src-tauri/src/services/session_manager.rs` | `ssh`   |
| `src-tauri/src/services/security_service.rs` | `security` |
| `src/pages/SettingsPage.tsx`          | `settings`    |
| `.github/workflows/*`                 | `ci`          |
| `__tests__/**`                        | `test`        |
| Across multiple domains               | omit scope    |

## Pre-commit Quality Gate

CLAUDE.md mandates that the following must pass before committing:

```bash
pnpm lint && pnpm format:check && pnpm test:run
```

Backend changes must also pass:

```bash
cd src-tauri && cargo fmt --check && cargo clippy -- -D warnings && cargo test --lib --bins
```

## Version Alignment

The version number lives in **three files**, all of which must stay in sync:

- `package.json` → `"version": "3.0.0"`
- `src-tauri/Cargo.toml` → `version = "3.0.0"`
- `src-tauri/tauri.conf.json` → `"version": "3.0.0"`

Commit pattern for a version bump: `chore: bump version to X.Y.Z`, followed by `chore: update Cargo.lock for vX.Y.Z`.

## CI Overview (see `.github/workflows/ci.yml`)

- `frontend` job: pnpm lint / format:check / tsc --noEmit / test:run --coverage
- `backend` job: cargo fmt --check / clippy -D warnings / cargo test
- `bindings` job: the ts-rs-generated `src/types/bindings/` must stay in sync with the Rust source (CI re-runs and diffs)
- All jobs must be green before merging into `main`

## Prohibitions

- **NEVER** use `--no-verify` to bypass the pre-commit hook
- **NEVER** use `--amend` to modify a commit that has already been pushed (create a new commit instead)
- **NEVER** `git push --force` to `main` / `develop`
- **NEVER** merge code containing `console.log` / `dbg!()` / `TODO: fix before merge`
- **NEVER** sneak feature changes into a chore/docs commit

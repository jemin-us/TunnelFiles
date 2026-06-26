---
name: core-testing
description: Vitest + RTL frontend tests, WebKitWebDriver E2E, Docker SSH test environment, cargo test inline modules
category: core
trigger: always
requires:
  - vitest
  - "@testing-library/react"
  - jsdom
  - "@wdio/cli"
evidence:
  - test/unit/hooks/useConnect.test.tsx
  - test/unit/setup.ts
  - test/e2e/wdio.conf.ts
  - docker/setup-test-env.sh
  - package.json
source_hashes:
  package.json: 005e1b84a8d7ad6e0aa0391a4fe2a5ff6635d71114e21d2744af9fab5a0b56dc
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# Testing

## Frontend Unit Tests (Vitest + RTL)

### IPC Boundary Mocking

Mock the `@/lib/*` wrapper layer consistently; mocking the internals of `@tauri-apps/api/core` is **forbidden**:

```typescript
// Mock session lib (the wrapper, not @tauri-apps/api)
vi.mock("@/lib/session", () => ({
  connect: vi.fn(),
  trustHostKey: vi.fn(),
  reconnectWithTrustedKey: vi.fn(),
}));

// Partial mock — keep real helpers (like isAppError), stub side effects
vi.mock("@/lib/error", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/error")>();
  return {
    ...actual,
    showErrorToast: vi.fn(),
  };
});

beforeEach(() => vi.clearAllMocks());
```

### Test Commands

```bash
pnpm test              # Watch mode
pnpm test:run          # One-shot (CI)
pnpm test:coverage     # Coverage report
pnpm test:ui           # Vitest UI
```

### Testing Principles

- Test behavior, not implementation (the DOM, not internal state fields)
- Cover the four states: `empty` / `loading` (skeleton) / `error` (retry) / `success`
- Prefer `screen.getByRole()` > `getByLabelText()` > `getByText()` > `getByTestId()`
- Wrap async state changes in `act()`
- Don't use `import.meta.vitest` inline tests — all tests live in `test/unit/**`

### Test Fixture Locations

```
test/unit/
  setup.ts            # vitest setup, global mocks
  helpers/            # shared test fixtures (createMockProfile, etc.)
  mocks/              # IPC mock factories
  components/         # UI component tests
  hooks/              # Hook tests (useConnect/useFileList, etc.)
  lib/                # lib/ wrapper tests (error/validation, etc.)
  stores/             # Zustand store tests
  integration/        # cross-layer integration tests
```

## E2E Tests (WebKitWebDriver)

### WebKit Selector Limitations

WebKitWebDriver **does not support** the `text=`, `button=`, or `button*=` selectors; use XPath instead:

```typescript
// ✅ Correct
await $(`//button[contains(., '连接')]`).click();
await container.$(`.//span[text()='已连接']`).waitForDisplayed();

// ❌ Wrong
await $(`button*=连接`).click();
```

Nested queries via `element.$()` must use relative XPath (the `.//` prefix).

### URL Navigation

`browser.url("/connections")` does not work — use an absolute URL:

```typescript
const baseUrl = new URL(await browser.getUrl()).origin;
await browser.url(`${baseUrl}/connections`);
```

Vite preview has no SPA fallback, so accessing `/connections` directly returns a 404.

### CI Headless

```bash
# Fix the headless Linux blank screen
WEBKIT_DISABLE_DMABUF_RENDERER=1 pnpm test:e2e
```

`frontendDist: "http://127.0.0.1:1420"` lets WebKitGTK support ES modules.

### Commands

```bash
pnpm test:e2e                  # Local (auto-starts Docker)
pnpm test:e2e:with-env         # Ensure Docker is running
pnpm test:visual               # Visual regression
pnpm test:visual:update        # Update baseline
pnpm e2e:env:up                # Start the Docker SSH test server
pnpm e2e:env:down              # Stop it
```

## Backend Tests (cargo test)

### Inline Test Modules

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_ssh2_error_auth_failed() {
        let ssh_err = ssh2::Error::new(ssh2::ErrorCode::Session(-18), "auth failed");
        let app_err = AppError::from(ssh_err);
        assert_eq!(app_err.code, ErrorCode::AuthFailed);
    }
}
```

- `unwrap()` / `expect()` are allowed inside `#[cfg(test)]`
- Production code uses `?` or `expect("reason")` with a reason

### Commands

```bash
pnpm test:backend:unit                   # cargo test --lib --bins
pnpm test:backend:integration            # requires Docker to be started first
pnpm test:local                          # frontend + backend unit
```

Integration tests `cargo test --test integration_tests -- --test-threads=1` are forced serial to prevent SSH sessions from stepping on each other.

## Test Coverage Requirements

- New hooks / new components: must have a test plan (see CLAUDE.md Quality Gates)
- Bug fixes: must include a regression test covering the scenario (a CLAUDE.md hard requirement)
- CI enables `--coverage`; thresholds are in `vitest.config`

## Prohibitions

- **Forbidden** to mock `@tauri-apps/api/core::invoke` directly — mock at the `@/lib/*` boundary
- **Forbidden** to test a Zustand store's internal fields (`_sortedTasks`) — only test the getter (`getAllTasks()`)
- **Forbidden** to use WebDriver text selectors (`text=`/`button*=`) in E2E — use XPath
- **Forbidden** to skip Docker when running integration tests — only a real SSH connection can catch the correctness of `LIBSSH2_ERROR_*` mappings

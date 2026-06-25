---
name: stack-react
description: React 19 + shadcn/ui (new-york) + Tailwind 4, path aliases, component organization, cross-platform shortcuts
category: stack
trigger: on-touch
requires:
  - react
  - "@radix-ui/react-slot"
  - "class-variance-authority"
  - "tailwind-merge"
  - "lucide-react"
globs: src/**/*.tsx, src/**/*.ts, components.json
evidence:
  - components.json
  - src/components/ui/button.tsx
  - src/lib/utils.ts
  - src/lib/platform.ts
  - src/router.tsx
  - src/pages/ConnectionsPage.tsx
source_hashes:
  components.json: b08f7d9041f8796656aa56722c74d1712c34bf7df4acbf981f973842b09d4424
  src/components/ui/button.tsx: 95c58adb364c478a7dfc587c7eed081af83107b7a5e1af79f2de374b354917d0
  src/lib/utils.ts: d1f1e0d62cb8d8d1e04c26e14de842d8a151f75812d81b046c65b5d1fe8e4b27
  src/lib/platform.ts: 125d66750d472958e19c0b7d607e22f846cee5cac6bd695d8b398e99873b1bcb
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# React 19 + shadcn/ui

## Project Structure

```
src/
  pages/              # Route-level components (ConnectionsPage / FileManagerPage / SettingsPage)
  layouts/            # Layout shells
  components/ui/      # shadcn/ui primitives ONLY
  components/{feat}/  # Feature components (connections / file-browser / terminal / transfer / settings)
  hooks/              # Shared hooks (useProfiles / useConnect / useFileList ...)
  stores/             # Zustand stores (useTransferStore)
  lib/                # IPC wrappers + utils (see stack-tauri.md)
  types/              # Hand-written types + bindings/ (auto-generated via ts-rs)
  contexts/           # React Context (Theme, etc.)
  router.tsx          # react-router-dom 7 config
  main.tsx            # Entry point
  index.css           # Global styles + OKLCH tokens (see domain-styling.md)
```

Dependency flow: **pages/layouts → features → shared (ui/lib/hooks/types)**.

- Use only absolute `@/` alias imports; **forbidden** to use relative cross-feature imports (`../../terminal/*`)
- **Forbidden** for features to import each other (`connections` must not import `terminal`)
- **Forbidden** to use `export *` barrels — use explicit named exports

## Path Aliases (components.json + tsconfig)

```json
"aliases": {
  "components": "@/components",
  "utils": "@/lib/utils",
  "ui": "@/components/ui",
  "lib": "@/lib",
  "hooks": "@/hooks"
}
```

Import examples:

```typescript
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/hooks/useProfiles";
import type { Profile } from "@/types/profile";
```

## shadcn/ui Conventions

- Style: `new-york`
- Icons: `lucide-react`
- Base color: `neutral`, CSS variables mode
- TSX (not RSC)

**Adding a new component**:

```bash
# 1. Check whether src/components/ui/ already has it
# 2. If not, add it via the CLI
npx shadcn@latest add tabs
# 3. To change variants, edit src/components/ui/xxx.tsx locally (do not write back to the registry)
```

### Typical shadcn Component Structure (see `button.tsx`)

```typescript
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center ...", {
  variants: { variant: { default: "...", destructive: "..." }, size: { default: "h-9 px-4 py-2", icon: "size-9" } },
  defaultVariants: { variant: "default", size: "default" },
});

function Button({ className, variant, size, asChild = false, ...props }:
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
```

**Rules**:

- Use `function` for components (not `const` + arrow) for better devtools display
- Extend native HTML attributes via `React.ComponentProps<"button">` for props interfaces
- Must add `data-slot` for E2E test targeting
- Use `cva` for multiple variants; for a single variant just compose with `cn()`

## React 19 New Features

- `use()` replaces `useContext()` — supports conditional calls
- `ref` as a plain prop — **forbidden** to add new `forwardRef`
- `useActionState` is optional for single-file forms (keep using RHF if it's already in place)

## Component Props Scale

> 5 props, pick one:

- Compound component (`<Dialog.Root><Dialog.Trigger/></Dialog.Root>`)
- Grouped prop objects (`config={{ layout, density, variant }}`)
- Context propagation (across many layers)

Extract nested render functions into separate files — avoids React remounting subtrees.

## Cross-Platform Shortcuts

```typescript
import { formatShortcut } from "@/lib/platform";

// Source: "Mod+K"  → Mac: "⌘K"  / Win: "Ctrl+K"
<kbd>{formatShortcut("Mod+K")}</kbd>
```

`isMac()` detects via `navigator.userAgent`; **forbidden** to detect the platform any other way in conditional rendering.

## Routing

`react-router-dom` v7:

| Path                  | Page              | Component               |
| --------------------- | ----------------- | ----------------------- |
| `/connections`        | Connection list   | `ConnectionsPage.tsx`   |
| `/files/:sessionId`   | File browser + terminal | `FileManagerPage.tsx` |
| `/settings`           | Settings          | `SettingsPage.tsx`      |

Lazy-load heavy routes with `React.lazy()` + `<Suspense>` (see `router.tsx`).

## Performance

- Lists `> 100` items: `@tanstack/react-virtual` (see `VirtualizerOptions` in `FileListContainer` for reference)
- Every `useQuery` must set `staleTime` (see the layering in domain-state-mgmt.md)
- Real-time high-frequency data goes through Zustand, not Query

## Prohibited List

- **Forbidden** to bypass `cn()` via any shadcn call style outside `src/components/ui/`
- **Forbidden** to render `<Dialog>` directly without wrapping `<DialogContent>` — required by the Radix API
- **Forbidden** to use `useNavigate()` for direct navigation outside `pages/` — encapsulate business triggers in hooks
- **Forbidden** to use bracket Tailwind values instead of standard classes (`min-w-[16px]` → `min-w-4`)

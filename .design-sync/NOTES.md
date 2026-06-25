# design-sync notes — TunnelFiles

Repo-specific gotchas for `/design-sync`. Read before re-syncing.

## Shape: package (synth-via-barrel)

TunnelFiles is a Tauri **app**, not a published component library — there is no
`dist/` entry exporting components. So the bundle is built in an app-specific
"synth-via-barrel" way:

- `.design-sync/scripts/gen-entry.mjs` generates a barrel
  (`.design-sync/.cache/ds-entry.tsx`) that `export *`s every pinned UI file +
  `ThemeProvider`. `package-build.mjs` is pointed at it via `--entry` so
  `PKG_DIR` resolves by walking up to the repo's `package.json`.
- `cfg.componentSrcMap` pins exactly the **29 component families** (one parent
  per `src/components/ui/*.tsx` file). Without this, synth discovery would emit
  ~151 cards (every PascalCase sub-export: `AccordionItem`, `DialogContent`, …).
  Sub-components still ship in the bundle (the barrel `export *`s them) and are
  shown via each parent's authored preview — they just aren't separate cards.
- `cfg.tsconfig` = `tsconfig.json` so esbuild resolves `@/*` → `src/*`.

## .d.ts: generated from source (props are inline in .tsx)

The repo ships no `.d.ts` and declares props inline in each component signature
(`React.ComponentProps<…> & VariantProps<…> & {…}`), so the extractor would fall
back to `[key: string]: unknown` for all 29. `.design-sync/scripts/gen-dts.mjs`:

- Runs `tsc --emitDeclarationOnly` into **`build/ts/`** (NON-dot — ts-morph's
  scan uses fast-glob `dot:false`, so `.design-sync/.cache/dts` is invisible to
  it; `build/ts` is `findTypesRoot`'s first heuristic dir → narrowest glob).
- Writes **`index.d.ts`** at the repo root: named re-exports of exactly the 29
  parents from `build/ts/`. This is `projectFor`'s `entry` (props resolve via the
  call-signature fallback) AND what `exportedNames` reads — named (not `export *`)
  keeps the component list at 29, not ~140 sub-exports.
- Both `build/` and `/index.d.ts` are gitignored, regenerated each build.

## CSS: compiled Tailwind v4 (not raw index.css)

`src/index.css` is Tailwind v4 **source** (`@import "tailwindcss"`), not
materialized CSS. `.design-sync/scripts/build-css.mjs` compiles it (tokens +
all scanned utilities) via the on-disk `@tailwindcss/node` + `@tailwindcss/oxide`
(deps of `@tailwindcss/vite`, resolved from the pnpm store — no network). Output
`.design-sync/.cache/ds-styles.css` is `cfg.cssEntry` → appended into
`_ds_bundle.css` → `@import`ed by `styles.css`.

- Tokens: `:root` = **dark (Midnight Teal, default)**, `.light` = light (Arctic
  Teal). No separate `.dark` block — dark is `:root`.
- Provider: `cfg.provider` = `ThemeProvider` with `defaultTheme: "dark"` — gives
  consistent signature dark rendering AND resolves `Toaster`'s `useTheme()`
  (sonner.tsx calls it; it throws outside a ThemeProvider).

## Build order (cfg.buildCmd, run BEFORE package-build.mjs)

```
node .design-sync/scripts/build-css.mjs     # → .cache/ds-styles.css
node .design-sync/scripts/gen-entry.mjs     # → .cache/ds-entry.tsx
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry .design-sync/.cache/ds-entry.tsx --out ./ds-bundle
```

Re-compile CSS after authoring/adding previews so preview-only utility classes
are materialized (oxide scans `.design-sync/previews/`, which is not gitignored).

## Preview authoring patterns (validated on the calibration set)

- **Import from `"tunnelfiles"`** (the cfg.pkg shim → window.TunnelFiles). The IDE
  shows "Cannot find module 'tunnelfiles'" — EXPECTED (the preview compiler shims
  it); esbuild builds fine. Not a real error.
- **Dark frame** — the DS-pane card body is white but the app's signature theme is
  dark (Midnight Teal). Every cell wraps content in:
  `<div className="dark bg-background text-foreground p-6 …">`. The `dark` class
  makes `dark:` variants resolve; `bg-background` paints the real surface over white.
- **Overlays** (Dialog, AlertDialog, Sheet, Select, DropdownMenu, ContextMenu,
  Tooltip) portal to body. Use `defaultOpen` (Radix) and set
  `cfg.overrides.<Name> = {cardMode:"single", viewport:"WxH"}` — single-mode's
  transform wrapper becomes the containing block so the fixed overlay renders
  INSIDE the card. Make the frame `min-h-[<viewport-height>px]` so the dark surface
  fills the card (else a gray strip shows where body-white peeks under the overlay).
- **Form** uses react-hook-form; import `useForm` from `"tunnelfiles"` (exported via
  the barrel) so it shares the bundle's RHF instance — a second copy bundled into a
  preview won't share Form's context.
- **Realistic content**: SSH/SFTP/file-manager domain (hosts, ports, profiles,
  transfers, terminal, files/dirs) — never foo/bar.
- Captures: `node .ds-sync/lib/preview-rebuild.mjs --config .design-sync/config.json
--node-modules ./node_modules --out ./ds-bundle --components <names>` then
  `node .ds-sync/package-capture.mjs --out ./ds-bundle --components <names>`.

## Per-component authoring notes (from the wave that authored all 29)

- **ContextMenu** is interaction-only: Radix `ContextMenu` has NO `defaultOpen`; its
  menu opens only on a real right-click at the cursor, which can't be triggered in a
  static screenshot. Its card ships a styled `Trigger` cell only — this is CORRECT,
  not broken. A future sync must not treat the missing open menu as a failure.
- **AlertDialog**: `AlertDialogAction` has no `variant` prop (defaults to primary);
  for a destructive action style it via `className="bg-destructive text-white hover:bg-destructive/90"`.
- **Tooltip** self-contains its `TooltipProvider` — `<Tooltip defaultOpen>` alone works
  (no wrapping provider). `TooltipContent` renders inverted (`bg-foreground`) by design.
- **ResizablePanelGroup** collapses to 0 height without an explicit height — the
  wrapper `h-[…]` is load-bearing.
- **ErrorState** headlines come from the app's localized `ERROR_MESSAGES` table
  (Chinese); the English technical detail renders below. This is the app's real
  behavior — the cards intentionally show it.
- **Skeleton** pulses in `bg-accent` (teal in the dark theme), not gray — authentic.
- **CONFIG_STALE gotcha**: adding a per-component `cfg.overrides.<Name>` (cardMode/
  viewport) AFTER a full `package-build` leaves the bundle's stamped per-component
  `cfgSlice` stale, and scoped `preview-rebuild` then refuses that component. Fix:
  run a full `package-build` to re-stamp. (cardMode:`column` folds into the global
  slice and does NOT trip this; `single`+viewport does.) Set overrides before the
  build, or re-stamp after.

## Known render warns (triaged legitimate — a re-sync should not treat these as new)

- Components whose floor card renders near-blank when unauthored (tiny/invisible
  without composition): Checkbox, Progress, Slider, LoadingSpinner. All are AUTHORED
  now, so these only matter if a preview is ever removed.

## Re-sync risks

- `build-css.mjs` hard-resolves tailwind out of `node_modules/.pnpm` by name
  match (version-agnostic). A major Tailwind bump could change the node/oxide
  API — if the compile throws, re-derive the call from the installed
  `@tailwindcss/vite` plugin source.
- The 29-family scoping lives entirely in `cfg.componentSrcMap`. Adding a new
  `src/components/ui/*.tsx` file requires adding a pin (and its preview) — it
  won't be picked up automatically.

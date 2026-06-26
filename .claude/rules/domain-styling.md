---
name: domain-styling
description: TailwindCSS 4 + OKLCH tokens + Inter/JetBrains Mono dual font + 5 icon tiers + 3 animation tiers
category: domain
trigger: on-touch
requires:
  - tailwindcss
  - tailwind-merge
  - "tw-animate-css"
  - "@hugeicons/react"
globs: src/**/*.tsx, src/**/*.css, src/index.css, tailwind.config.*
evidence:
  - src/index.css
  - src/components/ui/button.tsx
  - src/lib/utils.ts
  - components.json
source_hashes:
  src/index.css: c1f4d8cae191ac494d1b41f3642da864b8898fa38b757c92e6fde57005cc5d36
  src/lib/utils.ts: d1f1e0d62cb8d8d1e04c26e14de842d8a151f75812d81b046c65b5d1fe8e4b27
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# Styling

## Design System

**Precision Engineering Theme** — near-achromatic background + restrained steel-blue accent color. All color values use OKLCH, defined in `src/index.css` `:root` / `.dark`.

### Core tokens (use class names only, never read the raw values)

| Token                  | Use                              |
| ---------------------- | -------------------------------- |
| `bg-background`        | Page base color                  |
| `bg-card`              | Elevated surfaces like Card      |
| `bg-popover`           | Popover / Menu                   |
| `bg-primary`           | Primary button, main action      |
| `bg-secondary`         | Secondary button                 |
| `bg-muted`             | Muted background (placeholder area) |
| `bg-accent`            | hover / active cell              |
| `bg-destructive`       | Delete / error                   |
| `text-foreground`      | Primary text                     |
| `text-muted-foreground`| Secondary text                   |
| `text-destructive`     | Error text (incl. form errors)   |
| `border-border`        | Default border                   |
| `border-input`         | Input border                     |
| `ring-ring` / `focus-visible:ring-ring/50` | Focus ring  |

### Fonts

`:root` has `font-size: 16px` (**forbidden** to modify — it breaks the Tailwind rem scale).

```css
--font-sans: "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "IBM Plex Mono", "SF Mono", "Fira Code", monospace;
```

- UI text (default body): Inter
- Code / technical data (fingerprints, hashes, paths): `font-mono` class → JetBrains Mono
- Font weights: three tiers, 400 / 500 / 600 (loaded via `@font-face`)

### Theme Switching

- The `.dark` selector is controlled by `ThemeProvider` (`src/lib/theme.tsx`)
- `tw-animate-css` provides transition classes
- `@custom-variant dark (&:is(.dark *))` is already declared at the top of the CSS

## Rules

### Colors

- **Only use** theme tokens (`bg-background` / `text-destructive`, etc.)
- **Forbidden** to write hex / rgb / hsl (`bg-[#ff0000]`, `text-[rgb(...)]`)
- When a custom color value is needed, extend the tokens first, then use the class

### Units

- **Forbidden** to use bracket values in place of standard Tailwind classes: `min-w-[16px]` → `min-w-4`, `gap-[8px]` → `gap-2`
- Pixel-precise control may use brackets (`h-[1px]` dividers, `w-[calc(...)]`)

### Truncation

All text that may overflow must have a `title` tooltip:

```typescript
<span className="truncate" title={fullPath}>
  {fullPath}
</span>
```

Inside a Radix `ScrollArea`, `truncate` may be broken by `display: table` — needs an override:

```typescript
<div className="block truncate">{text}</div>
```

### Icon Sizes — 5 Tiers

| Size       | Scenario                     | Example                           |
| ---------- | ---------------------------- | --------------------------------- |
| `size-3`   | Inline metadata (file size, status dot) | `<Circle className="size-3" />`   |
| `size-3.5` | Compact inline               | toolbar pill                      |
| `size-4`   | Standard (buttons, input prefix) | shadcn default `[&_svg]:size-4`   |
| `size-5`   | Toast / Notification         | `toast.error` icon                |
| `size-8`   | Empty state                  | `<Empty />` center icon           |

Button icon classes automatically apply `size-4` (see the `button.tsx` cva class).

### Animation — 3 Tiers (GPU-only)

| Duration        | Scenario                      |
| --------------- | ----------------------------- |
| `duration-100`  | Hover / micro feedback        |
| `duration-200`  | Expand / collapse             |
| `duration-300`  | Dialog / sheet (max allowed)  |

- Only use `transform` and `opacity` (GPU compositing layer)
- **Forbidden** to animate `width` / `height` / `left` / `top` — triggers layout
- Respect `prefers-reduced-motion`: `motion-safe:animate-*`

### Focus State

All interactive elements (button/input/radio/checkbox) must have a visible focus ring:

```typescript
className="focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```

shadcn components have this built in. Add it to custom components per this template.

### Click Target Size

- Minimum `24px` × `24px` (WCAG 2.2)
- A `size-4` icon should go inside a `w-8 h-8` button or a larger touch area
- Button size icon tiers: `icon-sm` (size-8) / `icon` (size-9) / `icon-lg` (size-10)

## cn() helper

```typescript
import { cn } from "@/lib/utils"; // twMerge(clsx(...))

<div className={cn(
  "flex items-center gap-2",        // base
  variant === "compact" && "py-1",  // conditional
  className,                         // consumer override
)} />
```

**Forbidden** to use `classnames` / `clsx` standalone — must go through `cn()` to support Tailwind conflict merging.

## Font Loading

Inter / JetBrains Mono / IBM Plex Mono are loaded from jsDelivr CDN's `@fontsource` (`src/index.css` `@font-face`). CSP allows `font-src data:`, but woff2 loaded from the CDN goes through `connect-src` / direct URL — **forbidden** to add other CDN fonts without reviewing them in the CSP.

## Prohibitions

- **Forbidden** to modify `:root { font-size }` — breaks the rem scale
- **Forbidden** to write hex/rgb values, only use tokens
- **Forbidden** to add animation durations beyond the 3 tiers
- **Forbidden** to add icon sizes beyond the 5 tiers without updating this doc
- **Forbidden** to wrap a shadcn Tooltip with an outer `TooltipProvider` (it already contains its own Provider)
- **Forbidden** to animate layout properties (`width` / `height` / `top` / `left`)

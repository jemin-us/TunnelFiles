# TunnelFiles UI — conventions

TunnelFiles is a cross-platform desktop SSH/SFTP file manager (Tauri + React 19).
Its components are shadcn/ui primitives on a restrained **"Midnight Teal"** theme:
near-black charcoal surfaces, a single cyan-teal accent, OKLCH color tokens.

## Theme & setup

- **Dark is the default.** The tokens live on `:root` (dark Midnight Teal); a
  `.light` class on an ancestor switches to the light "Arctic Teal" theme. Put the
  theme class on a wrapping element and add Tailwind's `dark:` variants inside it —
  e.g. `<div className="dark bg-background text-foreground">…</div>` — so both the
  base tokens and `dark:` utilities resolve. Most components need no provider
  (Radix primitives self-provide their context).
- **Two components need a companion import** (both shipped on the library global):
  - `Form` is react-hook-form's `FormProvider` — drive it with the exported
    `useForm`: `const form = useForm(); <Form {...form}>…<FormField control={form.control} …/></Form>`.
  - `Toaster` renders the notification region; fire toasts with the exported
    `toast` (e.g. `toast.success("Uploaded")`, `toast.error("…", { description })`).

## Styling idiom — Tailwind utilities + OKLCH tokens (never hex/rgb)

Style with Tailwind utility classes bound to theme tokens. Use the **token classes**,
never raw colors:

| Surface / text                | Class                                        |
| ----------------------------- | -------------------------------------------- |
| page / app background         | `bg-background`, `text-foreground`           |
| elevated card                 | `bg-card`, `text-card-foreground`            |
| popover / menu                | `bg-popover`                                 |
| muted / placeholder area      | `bg-muted`, `text-muted-foreground`          |
| hover / active cell           | `bg-accent`                                  |
| primary action (cyan)         | `bg-primary`, `text-primary-foreground`      |
| secondary                     | `bg-secondary`                               |
| destructive / error           | `bg-destructive`, `text-destructive`         |
| borders / inputs / focus ring | `border-border`, `border-input`, `ring-ring` |
| semantic status text          | `text-success`, `text-warning`, `text-info`  |

Layout uses standard Tailwind utilities (`flex`, `grid`, `gap-*`, `p-*`, `size-*`).
Code/technical data (paths, fingerprints, hashes) use `font-mono` (JetBrains Mono);
body text is Inter. Don't introduce arbitrary values when a token/standard class fits.

Component variants are props, not classes — e.g. `<Button variant="destructive" size="sm">`
(variants: default/secondary/destructive/outline/ghost/link; sizes: default/sm/lg/icon/icon-sm/icon-lg),
`<Badge variant="outline">`, `<Sidebar variant="floating" collapsible="icon">`. The exact
prop contract for each component is in its `<Name>.d.ts`; usage examples are in `<Name>.prompt.md`.

## Where the truth lives

- Tokens + every utility: the bound `styles.css` and its `@import` of `_ds_bundle.css`.
- Per-component API and example composition: `<Name>.d.ts` and `<Name>.prompt.md`.

## Idiomatic example

```tsx
<div className="dark bg-background text-foreground p-6">
  <Card className="max-w-sm">
    <CardHeader>
      <CardTitle>Production</CardTitle>
      <CardDescription>root@10.0.1.42 · port 22</CardDescription>
      <CardAction>
        <Badge variant="outline">SFTP</Badge>
      </CardAction>
    </CardHeader>
    <CardFooter className="gap-2">
      <Button size="sm">Connect</Button>
      <Button size="sm" variant="outline">
        Edit
      </Button>
    </CardFooter>
  </Card>
</div>
```

---
name: domain-forms
description: React Hook Form + Zod form conventions — schema-derived types, inline errors, submit disabling
category: domain
trigger: on-touch
requires:
  - react-hook-form
  - "@hookform/resolvers"
  - zod
globs: src/components/**/*.tsx, src/pages/**/*.tsx
evidence:
  - src/components/connections/ProfileForm.tsx
  - src/pages/SettingsPage.tsx
  - src/lib/validation.ts
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# Forms

## Unified Tech Stack

- `react-hook-form` v7 — state + validation orchestration
- `@hookform/resolvers/zod` — the adapter
- `zod` v4 — schema definition + type inference

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const ProfileSchema = z.object({
  name: z.string().trim().min(1, "名称不能为空").max(64),
  host: z.string().trim().min(1).max(255),
  port: z.coerce.number().int().min(1).max(65535).default(22),
  username: z.string().trim().min(1).max(64),
  authType: z.enum(["password", "key"]),
  privateKeyPath: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

function ProfileForm({ defaultValues, onSubmit }: Props) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input {...form.register("name")} placeholder="连接名称" />
      {form.formState.errors.name && (
        <p className="text-xs text-destructive">
          {form.formState.errors.name.message}
        </p>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <LoadingSpinner /> : "保存"}
      </Button>
    </form>
  );
}
```

## Hard Rules

- **Every form** must be wrapped in `<form onSubmit={form.handleSubmit(onSubmit)}>` (rather than hanging an onClick directly on the Button)
- Single-input forms (e.g. a search box) may capture Enter in `onKeyDown` and submit themselves
- Derive types via `z.infer<typeof Schema>`; hand-writing `interface FormValues` is **forbidden**
- Schema naming: `XxxSchema` (PascalCase + Schema suffix), exported in the same file as the component or in `src/lib/validation.ts`
- `z.coerce.number()` for numeric inputs (inputs pass strings)
- `z.string().trim()` handles leading/trailing whitespace by default

## Error Display

Inline error style:

```typescript
<p className="text-xs text-destructive">
  {form.formState.errors.fieldName.message}
</p>
```

- **Forbidden** to use `alert()` / Toast to show field-level errors — must be inline
- Toast is only for server errors after submission (via `showErrorToast(error)` from `@/lib/error`)

## Submit State

```typescript
<Button type="submit" disabled={form.formState.isSubmitting}>
  {form.formState.isSubmitting ? <LoadingSpinner size="sm" /> : "保存"}
</Button>
```

Use `form.formState.isSubmitting` (synchronous) or an external mutation's `isPending` (async network):

```typescript
const mutation = useUpsertProfile();
const onSubmit = (values: ProfileFormValues) => mutation.mutate(values);

<Button type="submit" disabled={mutation.isPending}>
  {mutation.isPending ? "保存中..." : "保存"}
</Button>;
```

**Forbidden** to use both at once — pick one (use the mutation when async, `isSubmitting` for a purely local form).

## Default Values and Reset

```typescript
// Default values at initialization
const form = useForm<ProfileFormValues>({
  resolver: zodResolver(ProfileSchema),
  defaultValues: existingProfile ?? DEFAULT_VALUES,
});

// When external data updates (e.g. switching the edit target)
useEffect(() => {
  if (existingProfile) form.reset(existingProfile);
}, [existingProfile, form]);
```

**Forbidden** to pass `defaultValues={props.data}` in `render` without using `reset()` — a prop change does not re-initialize the form.

## Conditional Fields

```typescript
const authType = form.watch("authType");

{authType === "key" && (
  <Input {...form.register("privateKeyPath")} />
)}
```

Use `z.discriminatedUnion` or `.superRefine` for the schema of conditional fields:

```typescript
const ProfileSchema = z.discriminatedUnion("authType", [
  z.object({ authType: z.literal("password"), /* ... */ }),
  z.object({ authType: z.literal("key"), privateKeyPath: z.string().min(1) }),
]);
```

## Wiring to IPC

After a form submits, fire IPC through the `src/lib/*.ts` wrappers:

```typescript
const mutation = useUpsertProfile(); // internally calls upsertProfile from @/lib/profile

const onSubmit = async (values: ProfileFormValues) => {
  try {
    await mutation.mutateAsync({ id: editingId, ...values });
    onClose();
  } catch (error) {
    // showErrorToast is already handled in mutation.onError, no need to repeat here
  }
};
```

**Forbidden** to call `invoke()` directly inside a form component — go through the `src/lib/*.ts` wrappers (see stack-tauri.md).

## Prohibitions

- **Forbidden** to hand-write `interface FormValues` — use `z.infer`
- **Forbidden** to use `alert()` / Toast to show field-level errors — inline
- **Forbidden** to hang an onClick-submit on a Button outside the `<form>`
- **Forbidden** to pass dynamic `defaultValues` at form init without using `form.reset()`
- **Forbidden** to omit `type="submit"` — otherwise Enter does not trigger submission

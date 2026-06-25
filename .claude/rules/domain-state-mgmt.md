---
name: domain-state-mgmt
description: TanStack Query (server cache) + Zustand (real-time UI) + useState (local) three-layer state model
category: domain
trigger: on-touch
requires:
  - "@tanstack/react-query"
  - zustand
globs: src/stores/**, src/hooks/**, src/components/**/*.tsx
evidence:
  - src/stores/useTransferStore.ts
  - src/hooks/useProfiles.ts
  - src/hooks/useConnect.ts
source_hashes:
  src/stores/useTransferStore.ts: 2bbe19965ed32258a41659c95a983fc3c630791391474d5da5f6754200307b99
  src/hooks/useProfiles.ts: 9aabdb2df79cf59a12b617ad073c285dd47afd1be95181c5429cf68788c5cf13
  src/hooks/useConnect.ts: acab1dadf35d85c9c3b3e431f35dce8ced00aee1242379a34398d7d6aedcf5e1
generated_at: 2026-04-16
generator_version: init-rules-v2
---

# State Management

## Three-Layer Decision

| Data nature                       | Tool              | Example                                                  |
| --------------------------------- | ----------------- | -------------------------------------------------------- |
| Component-local UI                | `useState` / `useReducer` | dialog open, menu position, hover state          |
| Cross-component shared + high-frequency real-time data | Zustand | `useTransferStore` (transfer progress updates every 200ms) |
| Server cache                      | TanStack Query    | `useProfiles` / `useFileList` / `useSettings`            |
| Form state                        | React Hook Form   | `useForm` + `zodResolver` (see `domain-forms.md`)        |
| Shareable state                   | URL search params | current path, filters                                    |

Start local, then lift up. Only lift to Zustand when **multiple unrelated** components need to share.

## Naming Conventions

- Zustand store: `useXxxStore` — `useTransferStore`
- Query hook: `useXxx()` — `useProfiles()`, `useFileList()`
- Mutation hook: `useActionXxx()` or `useXxxMutation` — `useUpsertProfile()`, `useDeleteProfile()`

## TanStack Query Template

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccessToast, showErrorToast } from "@/lib/error";
import { listProfiles, upsertProfile, deleteProfile } from "@/lib/profile";

const PROFILES_QUERY_KEY = ["profiles"] as const;

export function useProfiles() {
  return useQuery({
    queryKey: PROFILES_QUERY_KEY,
    queryFn: listProfiles,
    staleTime: 5 * 60 * 1000,        // 5 minutes
  });
}

export function useUpsertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertProfile,
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      showSuccessToast(vars.id ? "Connection updated" : "Connection added");
    },
    onError: (error) => showErrorToast(error),
  });
}
```

### staleTime Tiers

| Data type                 | staleTime     | Rationale                         |
| ------------------------- | ------------- | --------------------------------- |
| File list                 | `5_000`       | Files change anytime; too short causes repeated reads |
| Profiles / Settings       | `5 * 60_000`  | Only changes on explicit user edits |
| Known Hosts               | `5 * 60_000`  | Same as above                     |
| Real-time data (transfer/terminal) | **Not via Query** | Use Zustand + Tauri event instead |

Every `useQuery` must explicitly set `staleTime` — **forbidden** to rely on the default `0` (infinite refetching).

### Query Key Conventions

- Top level: `["profiles"]` / `["settings"]`
- With params: `["files", sessionId, path]`
- List item: `["profile", profileId]`

Declare the constant centrally as `PROFILES_QUERY_KEY = ["profiles"] as const` to avoid scattered strings.

### Error Handling

- `onError: (e) => showErrorToast(e)` (single call)
- Global errors go through `QueryClient`'s `defaultOptions.queries.onError` (if needed)
- **Forbidden** to `try/catch` inside `queryFn` and swallow the error

## Zustand Template (see `useTransferStore`)

```typescript
import { create } from "zustand";

interface TransferState {
  tasks: Map<string, TransferTask>;
  /** Pre-computed sorted list, updated on every mutation */
  _sortedTasks: TransferTask[];
  getTask: (id: string) => TransferTask | undefined;
  getAllTasks: () => TransferTask[];         // Returns the _sortedTasks reference
  addTask: (task: TransferTask) => void;
  updateProgress: (p: TransferProgressPayload) => void;
  // ...
}

export const useTransferStore = create<TransferState>((set, get) => ({
  tasks: new Map(),
  _sortedTasks: [],
  getAllTasks: () => get()._sortedTasks,
  // ...
}));
```

**Key patterns**:

- High-frequency setters must pre-compute the sorted list (`_sortedTasks`) to avoid `Array.from().sort()` on every `getAllTasks`
- `updateProgress` is the high-frequency path: swap the ref instead of re-sorting (order is preserved when `createdAt` is unchanged)
- `updateStatus` only re-sorts when changing `createdAt`/`completedAt` or adding/removing tasks
- Terminal states use a `Set<TransferStatus>` lookup: `const TERMINAL_STATUSES = new Set(["success", "failed", "canceled"])`

### Selector Constraints

When subscribing to a store in a component, you must use a selector to avoid re-rendering on the whole store:

```typescript
// ✅ Only subscribe to active tasks
const activeTasks = useTransferStore((s) => s.getActiveTasks());

// ❌ Subscribing to the whole store; a task progress update re-renders all subscribers
const store = useTransferStore();
```

## useState + Custom Hook (see `useConnect`)

For complex multi-state combinations (connection flow, form steps), use a hook + `useState<State>(INITIAL_STATE)`:

```typescript
const INITIAL_STATE: ConnectState = {
  isConnecting: false,
  connectingProfileId: null,
  needPassword: false,
  needPassphrase: false,
  hostKeyPayload: null,
  currentProfile: null,
  pendingCredentials: null,
};

export function useConnect() {
  const [state, setState] = useState<ConnectState>(INITIAL_STATE);
  const resetState = useCallback(() => setState(INITIAL_STATE), []);
  // ...
}
```

Avoid splitting the state machine into 5 separate `useState` calls — a single state object + `setState((prev) => ({ ...prev, ... }))` guarantees atomicity.

## Prohibitions

- **Forbidden** to store server data (files / profiles / settings) in Zustand — use Query
- **Forbidden** to lift component-level UI state (dialog open, input value) to Zustand — use `useState`
- **Forbidden** to omit `staleTime` — declare it explicitly on every `useQuery`
- **Forbidden** to do heavy computation in a Zustand getter — pre-compute `_sortedTasks`
- **Forbidden** to share a store across features (`useTerminalStore` cannot be used by `connections`)

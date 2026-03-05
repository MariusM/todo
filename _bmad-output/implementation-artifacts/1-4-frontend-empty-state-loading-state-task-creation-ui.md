# Story 1.4: Frontend — Empty State, Loading State & Task Creation UI

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want to open the app, see a welcoming empty state, type a task, and see it appear instantly,
so that I can capture my first thought in under 5 seconds (Clara's "aha" moment).

## Acceptance Criteria

1. **Given** the app loads and the API is being called **When** the page renders initially **Then** a loading state is displayed without layout shift (FR18)

2. **Given** no todos exist **When** the loading completes **Then** the EmptyState component displays with a muted checkbox icon, "No tasks yet" heading, and "Type a task above and press Enter to get started." instruction text (FR17) **And** the TaskInput field is visible with placeholder "What needs to be done?" **And** the input is auto-focused

3. **Given** the TaskInput is focused **When** I type "Buy milk" and press Enter **Then** the task appears instantly in the list below (FR1, FR14) **And** the input clears and retains focus for rapid sequential entry **And** the EmptyState disappears **And** an API POST call fires in the background

4. **Given** the TaskInput is focused **When** I press Enter with empty or whitespace-only input **Then** nothing happens — no error, no API call (FR12)

5. **Given** I have created todos **When** I refresh the browser **Then** all todos appear in the list, persisted from the database (FR8)

## Tasks / Subtasks

- [x] Task 1: API client module (AC: #3, #5)
  - [x] 1.1 Create `client/src/api/todos.ts` — typed fetch wrapper for POST /api/todos and GET /api/todos
  - [x] 1.2 `fetchTodos(): Promise<Todo[]>` — GET /api/todos, parse JSON, return typed array
  - [x] 1.3 `createTodo(request: CreateTodoRequest): Promise<Todo>` — POST /api/todos, send JSON, return created todo
  - [x] 1.4 Error handling: parse error responses into `ApiError` objects, throw typed errors
  - [x] 1.5 Use native `fetch` — NO axios (architecture constraint)

- [x] Task 2: useOptimisticTodos hook — initial version (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `client/src/hooks/useOptimisticTodos.ts`
  - [x] 2.2 State shape: `{ todos: Todo[], isLoading: boolean, errors: ErrorInfo[] }`
  - [x] 2.3 On mount: `setIsLoading(true)` → `fetchTodos()` → `setTodos(data)` → `setIsLoading(false)`
  - [x] 2.4 `addTodo(text)`: generate UUID via `crypto.randomUUID()`, snapshot state, optimistically add to `todos`, fire `createTodo()` in background, on failure rollback + add error
  - [x] 2.5 Client-side validation: if `text.trim()` is empty, silently return (no API call, no error)
  - [x] 2.6 Return `{ todos, isLoading, errors, addTodo }` from hook

- [x] Task 3: EmptyState component (AC: #2)
  - [x] 3.1 Create `client/src/components/EmptyState.tsx`
  - [x] 3.2 Render: 48px muted checkbox icon at 40% opacity, "No tasks yet" heading (18px, text-secondary, font-weight 500), instruction text (14px, text-secondary)
  - [x] 3.3 Center content with 48px vertical padding
  - [x] 3.4 No interactive elements — purely informational

- [x] Task 4: TaskInput component (AC: #3, #4)
  - [x] 4.1 Create `client/src/components/TaskInput.tsx`
  - [x] 4.2 Always-visible `<input>` with placeholder "What needs to be done?"
  - [x] 4.3 `aria-label="Add a new task"` for accessibility
  - [x] 4.4 onKeyDown: Enter → call `onAddTodo(text)` if non-empty after trim, clear input, retain focus
  - [x] 4.5 Enter on empty/whitespace → silent ignore (no error, no shake)
  - [x] 4.6 Auto-focus on mount via `useRef` + `useEffect`
  - [x] 4.7 Styling: 1px border, focus ring (2px solid border-focus, 2px offset), full width within container

- [x] Task 5: TaskList component (AC: #1, #2, #3, #5)
  - [x] 5.1 Create `client/src/components/TaskList.tsx`
  - [x] 5.2 Loading state: render a subtle loading indicator when `isLoading` is true
  - [x] 5.3 Empty state: render `<EmptyState />` when `todos.length === 0` and not loading
  - [x] 5.4 Populated state: render todos in `<ul role="list" aria-label="Task list">` with `<li>` items
  - [x] 5.5 Each task item: display task text with checkbox (read-only for now — completion is Epic 2)
  - [x] 5.6 Separators: 1px solid border between items (no separator above first / below last)
  - [x] 5.7 `aria-live="polite"` on container for screen reader announcements

- [x] Task 6: Wire components into App.tsx (AC: #1, #2, #3, #4, #5)
  - [x] 6.1 Update `client/src/App.tsx` — import and use `useOptimisticTodos` hook
  - [x] 6.2 Render `<TaskInput onAddTodo={addTodo} />` at the top
  - [x] 6.3 Render `<TaskList todos={todos} isLoading={isLoading} />` below
  - [x] 6.4 Layout: centered container (max 640px), 16px padding on mobile, generous whitespace on desktop
  - [x] 6.5 Page title "Todo" as heading

- [x] Task 7: Tests (AC: #1, #2, #3, #4, #5)
  - [x] 7.1 Create `client/src/api/todos.test.ts` — test fetchTodos success/error, createTodo success/error, error parsing
  - [x] 7.2 Create `client/src/hooks/useOptimisticTodos.test.ts` — test initial fetch sets todos, loading state transitions, addTodo optimistic add, addTodo with empty text ignored, addTodo rollback on API failure
  - [x] 7.3 Create `client/src/components/EmptyState.test.tsx` — test renders heading, instruction text, muted icon
  - [x] 7.4 Create `client/src/components/TaskInput.test.tsx` — test Enter submits non-empty text, Enter on empty does nothing, input clears after submit, auto-focus on mount, placeholder text
  - [x] 7.5 Create `client/src/components/TaskList.test.tsx` — test loading state, empty state, populated state, list semantics (role, aria-label)
  - [x] 7.6 Update `client/src/App.test.tsx` — test full integration: loading → empty state → add task → task visible
  - [x] 7.7 Verify all existing tests still pass (no regressions)

## Dev Notes

### Architecture Compliance

**This is the FIRST frontend story.** All components, hooks, and API client are created from scratch. The backend API (POST /api/todos, GET /api/todos) is fully functional from story 1.3.

**Component hierarchy for this story:**
```
App.tsx
  ├── TaskInput (always visible at top)
  └── TaskList
       ├── Loading indicator (isLoading === true)
       ├── EmptyState (todos.length === 0 && !isLoading)
       └── <ul> with task items (todos.length > 0)
```

**State flows through `useOptimisticTodos` hook — components NEVER call API directly.**

**Optimistic create flow:**
```
TaskInput (Enter) → App.addTodo(text)
  → useOptimisticTodos.addTodo(text)
    → Validate: text.trim() empty? → return silently
    → Generate UUID: crypto.randomUUID()
    → Snapshot current todos array
    → Optimistically add new todo to state (instant UI update)
    → Fire api/todos.ts createTodo({ id, text }) in background
    → On success: no-op (state already correct)
    → On failure: restore snapshot + add error to errors array
```

**Initial load flow:**
```
App mounts → useOptimisticTodos initializes
  → setIsLoading(true)
  → api/todos.ts fetchTodos() → GET /api/todos
  → setTodos(response)
  → setIsLoading(false)
```

### Existing Code to Reuse — DO NOT Reinvent

| Module | Location | What to use |
|--------|----------|-------------|
| `Todo` type | `client/src/types/todo.ts` | `{ id, text, completed, createdAt, updatedAt }` |
| `CreateTodoRequest` type | `client/src/types/todo.ts` | `{ id: string, text: string }` |
| `ApiError` type | `client/src/types/todo.ts` | `{ error: { message, code } }` |
| Design tokens | `client/src/index.css` | All CSS variables via @theme (colors, spacing, typography, transitions) |
| Vite API proxy | `client/vite.config.ts` | `/api` proxied to `http://localhost:3001` — use relative URLs |
| App scaffold | `client/src/App.tsx` | Existing layout structure with container classes |

### Technical Requirements

**React patterns — MUST follow:**
- `useOptimisticTodos` is the SINGLE source of truth — components receive data via props, emit events via callbacks
- Props down, callbacks up — no context, no global state, no event system
- No router — single view, App.tsx renders component tree directly
- Immutable state updates only — never mutate state directly
- No loading spinners for CRUD operations — `isLoading` only for initial page fetch

**API client — MUST follow:**
- Native `fetch` with typed wrapper — NO axios
- `client/src/api/todos.ts` is the ONLY module that makes HTTP requests
- Use relative URLs (`/api/todos`) — Vite proxy handles routing in dev
- Parse error responses into typed `ApiError` objects matching server format `{ error: { message, code } }`

**UUID generation:**
- Use `crypto.randomUUID()` — no library, supported in all target browsers

### Library & Framework Requirements

| Library | Version | Usage |
|---------|---------|-------|
| React | 19.2 | Components, hooks |
| TypeScript | 5.x | Strict mode, ES modules |
| Tailwind CSS | 4.2 | Styling via @theme CSS variables |
| Vitest | 4.0 | Unit + integration tests |
| @testing-library/react | (installed) | Component testing |

**Explicit exclusions:** No axios, no lodash, no external state library, no routing library.

### File Structure Requirements

**Files to CREATE:**

| File | Purpose |
|------|---------|
| `client/src/api/todos.ts` | Typed fetch wrapper: fetchTodos(), createTodo() |
| `client/src/api/todos.test.ts` | API client tests |
| `client/src/hooks/useOptimisticTodos.ts` | Core state hook: todos, isLoading, errors, addTodo |
| `client/src/hooks/useOptimisticTodos.test.ts` | Hook tests: loading, fetch, add, rollback |
| `client/src/components/EmptyState.tsx` | Zero-tasks prompt with icon, heading, instruction |
| `client/src/components/EmptyState.test.tsx` | EmptyState rendering tests |
| `client/src/components/TaskInput.tsx` | Always-visible input, Enter to submit |
| `client/src/components/TaskInput.test.tsx` | TaskInput behavior tests |
| `client/src/components/TaskList.tsx` | Container: loading, empty, populated states |
| `client/src/components/TaskList.test.tsx` | TaskList state rendering tests |

**Files to MODIFY:**

| File | Changes |
|------|---------|
| `client/src/App.tsx` | Replace scaffold with useOptimisticTodos + TaskInput + TaskList |
| `client/src/App.test.tsx` | Update test for new component structure |

### Testing Requirements

- **Co-locate tests** with source files (e.g., `TaskInput.test.tsx` next to `TaskInput.tsx`)
- **Mock `fetch`** in API client and hook tests — do not hit real server
- **Use React Testing Library** for component tests — test behavior, not implementation
- **Test accessibility:** verify `aria-label`, `role` attributes, focus behavior
- **No `__tests__/` directories** — tests live beside source files

### Architecture Compliance — Design System

**UX specifications for components in this story:**

**TaskInput:**
- Placeholder: "What needs to be done?"
- `aria-label="Add a new task"`
- Auto-focus on page load
- Focus ring: 2px solid `--color-border-focus` with 2px offset
- Full width within container

**EmptyState:**
- Icon: 48px muted checkbox at 40% opacity
- Heading: "No tasks yet" — 18px, `--color-text-secondary`, font-weight 500
- Body: "Type a task above and press Enter to get started." — 14px, `--color-text-secondary`
- 48px vertical padding, centered

**TaskList:**
- `<ul role="list" aria-label="Task list">`
- `aria-live="polite"` for dynamic updates
- Separators: 1px solid border between items
- Loading state during initial fetch

**Layout:**
- Max width: `var(--max-content-width)` (640px)
- Centered on desktop with generous whitespace
- 16px horizontal padding on mobile (full width)

### Previous Story Intelligence (1.3)

**Patterns established:**
- Factory pattern for dependency injection (queries, routes)
- Types in `client/src/types/todo.ts` already defined — reuse, don't recreate
- XSS sanitization is server-side — no need for client-side sanitization
- API returns camelCase fields directly — no client-side transformation needed
- Error response format: `{ error: { message, code } }` — parse this in API client

**Code review lessons from previous stories:**
- Ensure proper cleanup in tests (close connections, clear mocks)
- Don't use non-null assertions — throw explicit errors
- Don't catch errors silently — always log or re-throw

### Git Intelligence

**Recent commits (relevant patterns):**
- `a1de8dd` Fix code review issues for story 1.3 — XSS sanitization added
- `82f2798` Implement story 1.3 — todo-routes.ts, validate-todo.ts
- `a790f74` Fix code review issues for story 1.2
- `c1255a2` Implement story 1.2 — db/init.ts, db/queries.ts, health-routes.ts

**Conventions from git history:**
- Commit messages: "Implement story X.Y: [description]"
- Code review fixes as separate commits
- Files follow kebab-case (server) and PascalCase (React components)

### Scope Boundaries — What This Story Does NOT Include

- **No TaskItem component** with checkbox/edit/delete — that's Epic 2 (stories 2.1-2.4). TaskList renders simple task text display for now.
- **No ErrorBanner component** — that's Epic 3 (story 3.2). Errors are tracked in state but not displayed yet.
- **No optimistic update/delete** — only optimistic create. Update and delete come in Epic 2.
- **No inline editing** — Epic 2, story 2.3
- **No completion toggling** — Epic 2, story 2.2
- **No responsive breakpoints beyond basic container** — Epic 4, story 4.1 handles full responsive design
- **No keyboard navigation beyond input focus** — Epic 4, story 4.2

### Project Structure Notes

- All new files go in existing `client/src/` subdirectories (api/, hooks/, components/) created in story 1.1
- No new directories needed
- React components: PascalCase files (`TaskInput.tsx`, `EmptyState.tsx`, `TaskList.tsx`)
- Hooks: camelCase with `use` prefix (`useOptimisticTodos.ts`)
- API client: kebab-case is acceptable but `todos.ts` works (matches server convention)
- Co-locate tests: `TaskInput.test.tsx` next to `TaskInput.tsx`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow — Create Todo]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow — Initial Load]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TaskInput]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TaskList]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#EmptyState]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Loading feedback]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/implementation-artifacts/1-3-todo-rest-api-create-read.md#Dev Notes]
- [Source: client/src/types/todo.ts — Todo, CreateTodoRequest, ApiError types]
- [Source: client/src/index.css — Design system @theme tokens]
- [Source: client/vite.config.ts — API proxy configuration]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- Implemented typed API client (`todos.ts`) with `fetchTodos()` and `createTodo()` using native fetch. Error responses parsed into typed `ApiError` objects.
- Created `useOptimisticTodos` hook as single source of truth: manages todos, isLoading, errors state. Optimistic create with snapshot-based rollback on API failure. Empty/whitespace input silently ignored.
- Built `EmptyState` component with 48px SVG checkbox icon at 40% opacity, heading, and instruction text — centered with vertical padding.
- Built `TaskInput` component with auto-focus, Enter key submission, input clearing, focus retention, and whitespace validation. Styled with focus ring per design system.
- Built `TaskList` component with three states: loading indicator, EmptyState, and populated list with proper ARIA semantics (`role="list"`, `aria-label`, `aria-live="polite"`). Read-only checkboxes for now (completion is Epic 2).
- Wired all components into `App.tsx` with centered max-width layout.
- Added `@testing-library/user-event` dev dependency for component interaction tests.
- Full test coverage: 7 API tests, 7 hook tests, 3 EmptyState tests, 8 TaskInput tests, 7 TaskList tests, 4 App integration tests = 36 new client tests.
- All 79 tests pass (13 test files) with zero regressions.

### File List

**New files:**
- `client/src/api/todos.ts` — Typed fetch wrapper for GET/POST /api/todos
- `client/src/api/todos.test.ts` — API client unit tests (7 tests)
- `client/src/hooks/useOptimisticTodos.ts` — Core state hook with optimistic create
- `client/src/hooks/useOptimisticTodos.test.ts` — Hook tests (7 tests)
- `client/src/components/EmptyState.tsx` — Zero-tasks display component
- `client/src/components/EmptyState.test.tsx` — EmptyState tests (3 tests)
- `client/src/components/TaskInput.tsx` — Text input with Enter submission
- `client/src/components/TaskInput.test.tsx` — TaskInput behavior tests (8 tests)
- `client/src/components/TaskList.tsx` — Container for loading/empty/populated states
- `client/src/components/TaskList.test.tsx` — TaskList state tests (7 tests)

**Modified files:**
- `client/src/App.tsx` — Replaced scaffold with useOptimisticTodos + TaskInput + TaskList
- `client/src/App.test.tsx` — Updated integration tests (4 tests)
- `client/package.json` — Added @testing-library/user-event dev dependency
- `package-lock.json` — Updated lock file

### Change Log

- 2026-03-05: Implemented story 1.4 — Frontend empty state, loading state, and task creation UI. Created API client, useOptimisticTodos hook, EmptyState, TaskInput, TaskList components, wired into App.tsx. 36 new tests added, 79 total pass.

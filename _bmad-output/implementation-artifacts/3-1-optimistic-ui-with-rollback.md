# Story 3.1: Optimistic UI with Rollback

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want the app to respond instantly to my actions and safely revert if something fails behind the scenes,
so that the app feels fast but never loses or corrupts my data.

## Acceptance Criteria

1. **Given** I create a new todo **When** the API call fails (network error or server error) **Then** the optimistically added todo is removed from the list **And** the UI returns to the exact state before the action (FR16) **And** no data is lost or corrupted (NFR13).
2. **Given** I toggle a task's completion status **When** the PATCH API call fails **Then** the checkbox and text styling revert to the previous state (FR16).
3. **Given** I edit a task's text **When** the PATCH API call fails **Then** the text reverts to the original value before the edit (FR16).
4. **Given** I delete a task **When** the DELETE API call fails **Then** the task reappears in the list at its original position (FR16).
5. **Given** multiple API calls are in flight **When** one fails and others succeed **Then** only the failed operation rolls back -- successful operations are unaffected.

## Tasks / Subtasks

- [x] Task 1: Add `dismissError` method to `useOptimisticTodos` hook (AC: #1-5)
  - [x] 1.1 Add `dismissError(index: number)` function that removes an error from the `errors` array by index
  - [x] 1.2 Return `dismissError` from the hook alongside existing `errors`
- [x] Task 2: Wire `errors` and `dismissError` from hook to App.tsx (AC: #1-5)
  - [x] 2.1 Destructure `errors` and `dismissError` from `useOptimisticTodos()` in App.tsx
  - [x] 2.2 Store in state/ref for future ErrorBanner integration (Story 3.2)
  - [x] 2.3 Pass `errors` and `dismissError` as props -- ready for ErrorBanner in next story
- [x] Task 3: Fix delete rollback position preservation (AC: #4)
  - [x] 3.1 Current `removeTodo` appends restored item at end of array on rollback; fix to restore at original index
  - [x] 3.2 Capture the index (or use `created_at` ordering) before deletion, restore at same position
- [x] Task 4: Validate and fix concurrent operation isolation (AC: #5)
  - [x] 4.1 Verify that `todosRef.current` snapshot is captured per-operation, not shared
  - [x] 4.2 Add test: fire create + toggle concurrently, fail only create -- toggle state must persist
  - [x] 4.3 Add test: fire two updates concurrently, fail one -- other update must persist
- [x] Task 5: Hook unit tests for all rollback scenarios (AC: #1-5)
  - [x] 5.1 Test: `addTodo` rollback removes the optimistic todo on API failure
  - [x] 5.2 Test: `updateTodo` rollback reverts text change on API failure
  - [x] 5.3 Test: `updateTodo` rollback reverts completion toggle on API failure
  - [x] 5.4 Test: `removeTodo` rollback restores task at original position on API failure
  - [x] 5.5 Test: error is added to `errors` array with correct code and message for each failure type
  - [x] 5.6 Test: `dismissError` removes the error at given index
  - [x] 5.7 Test: concurrent operations -- only the failed one rolls back
- [x] Task 6: Integration test for rollback visual behavior (AC: #1-4)
  - [x] 6.1 Test: create todo with mocked API failure -- verify todo is removed from rendered list
  - [x] 6.2 Test: toggle completion with mocked API failure -- verify checkbox reverts
  - [x] 6.3 Test: edit text with mocked API failure -- verify text reverts
  - [x] 6.4 Test: delete task with mocked API failure -- verify task reappears in list

## Dev Notes

### What Already Exists -- DO NOT Recreate

| Module | Location | Notes |
|--------|----------|-------|
| `useOptimisticTodos` hook | `client/src/hooks/useOptimisticTodos.ts` | Snapshot-apply-rollback pattern already implemented for all CRUD ops |
| `todosRef` snapshot mechanism | `client/src/hooks/useOptimisticTodos.ts` | `useRef` tracks current todos for stale-closure-safe rollbacks |
| `errors` state array | `client/src/hooks/useOptimisticTodos.ts` | Tracks `ErrorInfo[]` with `message` and `code` fields |
| `extractErrorMessage()` | `client/src/hooks/useOptimisticTodos.ts` | Parses error objects into string messages |
| `ErrorInfo` interface | `client/src/hooks/useOptimisticTodos.ts` | `{ message: string; code: string }` |
| API client with error handling | `client/src/api/todos.ts` | `handleResponse<T>()` throws typed errors on non-OK responses |
| `ApiError` type | `client/src/types/todo.ts` | `{ error: { message: string; code: string } }` |
| All server-side CRUD routes | `server/src/routes/todo-routes.ts` | REST endpoints with proper error responses |
| Error handler middleware | `server/src/middleware/error-handler.ts` | Formats all errors as `{ error: { message, code } }` |

**The core optimistic update + rollback logic is already implemented. This story focuses on: (1) adding error dismissal, (2) wiring errors to the UI layer, (3) fixing delete rollback position, (4) validating concurrent operation isolation, and (5) comprehensive testing.**

### Architecture Constraints

- **Stack:** React 19.2, Vite 7.3, Tailwind CSS 4.2, TypeScript 5.x, Vitest 4.0
- **Component pattern:** Props down, callbacks up. No context, no global state.
- **Single source of truth:** `useOptimisticTodos` hook -- components never call API directly
- **API client:** `client/src/api/todos.ts` -- only module that makes HTTP requests
- **No external state library** -- React hooks only (useState, useEffect, useCallback, useRef)
- **ErrorBanner component does NOT exist yet** -- that's Story 3.2. This story prepares the data plumbing.

### Current Rollback Implementation (Reference)

The hook's snapshot-apply-rollback pattern:

```
1. Capture snapshot: const original = todosRef.current.find(...)
2. Apply optimistic change: setTodos(prev => ...)
3. Fire API call: await apiFunction(...)
4. On success: no-op (state already correct)
5. On failure: restore snapshot + push to errors array
```

Error codes used:
- `CREATE_ERROR` -- addTodo failure
- `UPDATE_ERROR` -- updateTodo failure (text edit or completion toggle)
- `DELETE_ERROR` -- removeTodo failure
- `FETCH_ERROR` -- initial fetchTodos failure

### Known Issue: Delete Rollback Position

Current `removeTodo` rollback (line ~86-90):
```ts
setTodos((prev) => [...prev, removed])
```
This appends the restored task at the **end** of the array. Per AC #4, the task must reappear "at its original position." Fix: capture the index before deletion and splice back at that index.

### Concurrent Operation Isolation

The hook uses `todosRef.current` to capture snapshots. Since each operation captures its own local `const original = todosRef.current.find(...)`, concurrent operations should be isolated. However, this needs explicit test coverage to verify:
- Two updates in flight, one fails -- the other's change persists
- Create + delete in flight, create fails -- delete still takes effect
- The `todosRef` is updated synchronously via `setTodos` + ref sync, so each operation sees the latest state

### Testing Approach

- **Unit tests:** Test hook in isolation using `@testing-library/react-hooks` (or `renderHook` from `@testing-library/react`)
- **Mock strategy:** Mock `fetch` globally via `vi.fn()` to simulate API failures
- **Integration tests:** Render App component with mocked fetch, verify DOM changes on failure
- **Existing test count:** 152 passing -- all must remain passing
- **Test files:**
  - `client/src/hooks/useOptimisticTodos.test.ts` (hook unit tests)
  - `client/src/App.test.tsx` (integration tests)

### Design Tokens Available (in `client/src/index.css`)

Error-related tokens (for future ErrorBanner in Story 3.2):
- `--color-error-bg`: #FEF2F2
- `--color-error-text`: #991B1B
- `--color-error-border`: #FECACA

### Previous Story Patterns to Follow

- **todosRef pattern** (from Epic 2): Always use `todosRef.current` for stale-closure-safe state access in async callbacks
- **skipBlurRef guard** (from story 2.3): Use refs to prevent double-fire of handlers
- **Test pattern:** Co-located tests, Vitest + @testing-library/react, mock callbacks with `vi.fn()`
- **Accessibility:** All interactive elements need aria-label, role, tabIndex as appropriate

### Code Review Lessons from Epic 2

- Move API side effects out of `setState` updater functions
- Use `todosRef` for stale-closure-safe operations in hook
- Add `toHaveBeenCalledTimes` assertions (not just `toHaveBeenCalled`)
- Test keyboard interactions (Enter, Escape, Tab)
- Ensure 44x44px touch targets on all interactive elements
- Add animation fallbacks for `prefers-reduced-motion`

### Project Structure Notes

- All components in `client/src/components/` (flat, no subdirectories)
- Tests co-located: `ComponentName.test.tsx` alongside `ComponentName.tsx`
- Hook tests: `client/src/hooks/useOptimisticTodos.test.ts`
- API tests: `client/src/api/todos.test.ts`
- Types: `client/src/types/todo.ts`
- Current test count: 152 passing

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 3, Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md - Optimistic UI Pattern, State Management, Error Handling]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - Error Recovery UX, Micro-interactions]
- [Source: _bmad-output/implementation-artifacts/2-4-task-deletion-visual-feedback.md - Delete Animation, Focus Management, Code Review Fixes]
- [Source: _bmad-output/project-context.md - AI Agent Rules, Framework Rules, Testing Rules]
- [Source: client/src/hooks/useOptimisticTodos.ts - Current rollback implementation]
- [Source: client/src/api/todos.ts - API error handling]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- Task 1: Added `dismissError(index: number)` method using `useCallback` with filter-by-index pattern. Returned from hook alongside existing `errors`.
- Task 2: Destructured `errors` and `dismissError` from `useOptimisticTodos()` in App.tsx. Values are available for ErrorBanner integration in Story 3.2.
- Task 3: Fixed delete rollback position preservation. Changed `removeTodo` to capture index via `findIndex` before deletion, then use `splice` to restore at original position on failure (was previously appending to end).
- Task 4: Verified concurrent operation isolation. The existing `todosRef.current` snapshot approach correctly captures per-operation state. Added explicit tests confirming: (a) create + toggle concurrent with only create failing, (b) two updates concurrent with only one failing.
- Task 5: Added comprehensive hook unit tests: completion toggle rollback, per-error-type code/message validation, dismissError behavior, and concurrent operation tests. Total: 18 hook unit tests.
- Task 6: Added 3 new integration tests in App.test.tsx: toggle rollback (checkbox reverts), edit text rollback (text reverts), delete rollback (task reappears). Create rollback test already existed. Total: 10 App integration tests.

### Change Log

- 2026-03-05: Implemented Story 3.1 - Optimistic UI with Rollback
  - Added `dismissError` method to `useOptimisticTodos` hook
  - Wired `errors` and `dismissError` in App.tsx for Story 3.2 readiness
  - Fixed delete rollback to restore at original position (was appending to end)
  - Validated concurrent operation isolation with explicit test coverage
  - Added 10 new tests (18 hook unit + 10 integration = 162 total, up from 152)

### File List

- client/src/hooks/useOptimisticTodos.ts (modified) - Added `dismissError`, fixed delete rollback position
- client/src/hooks/useOptimisticTodos.test.ts (modified) - Added 7 new unit tests
- client/src/App.tsx (modified) - Destructured `errors` and `dismissError`
- client/src/App.test.tsx (modified) - Added 3 new integration tests

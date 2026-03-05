# Story 3.2: Error Banner & User Communication

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want clear, reassuring error messages when something goes wrong,
so that I know what happened and what to do next without feeling alarmed.

## Acceptance Criteria

1. **Given** an API operation fails **When** the error banner appears **Then** it displays above the task list with warm messaging that identifies the failed action and suggests retry (FR15) **And** uses warm error color scheme (soft pink background `#FEF2F2`, muted red text `#991B1B`, soft red border `#FECACA`) **And** includes a dismiss button.
2. **Given** a create operation fails **When** the error banner appears **Then** the message identifies the action, e.g. "Adding that task didn't go through -- try again?"
3. **Given** an error banner is displayed **When** I perform other actions on my task list **Then** the banner does not block my interactions -- it is non-blocking (FR15).
4. **Given** an error banner is displayed **When** I click the dismiss button **Then** the banner is removed.
5. **Given** multiple operations fail **When** error banners are generated **Then** each failed action gets its own clear message.
6. **Given** an error banner is displayed **When** it appears **Then** it uses `role="alert"` for screen reader announcement.

## Tasks / Subtasks

- [ ] Task 1: Create ErrorBanner component (AC: #1, #2, #3, #4, #6)
  - [ ] 1.1 Create `client/src/components/ErrorBanner.tsx` with props: `errors: ErrorInfo[]`, `onDismiss: (index: number) => void`
  - [ ] 1.2 Render one banner per error in the `errors` array, each with: warning icon + message text + dismiss button (x)
  - [ ] 1.3 Style with design tokens: `bg-error-bg`, `border border-error-border`, `text-error-text`, `rounded-lg` (8px), `py-3 px-4` (12px/16px padding)
  - [ ] 1.4 Add `role="alert"` on each error banner for screen reader announcement
  - [ ] 1.5 Dismiss button: x character, `text-error-text` color, minimum 44x44px touch target, `aria-label="Dismiss error"`
  - [ ] 1.6 Add entry animation: slide down + fade in (~200ms, ease-in-out) and exit animation: fade out (~150ms, ease-out)
  - [ ] 1.7 Respect `prefers-reduced-motion` -- disable animations when user prefers reduced motion
- [ ] Task 2: Wire ErrorBanner into App.tsx (AC: #1, #3, #5)
  - [ ] 2.1 Remove `_` prefix from `errors` and `dismissError` destructuring in App.tsx
  - [ ] 2.2 Import and render `<ErrorBanner errors={errors} onDismiss={dismissError} />` between TaskInput and TaskList
  - [ ] 2.3 Conditionally render: only show ErrorBanner when `errors.length > 0`
- [ ] Task 3: Map error codes to warm user-facing messages (AC: #2)
  - [ ] 3.1 Create message mapping inside ErrorBanner (inline, NOT a separate utility file):
    - `CREATE_ERROR` -> "Adding that task didn't go through -- try again?"
    - `UPDATE_ERROR` -> "That didn't go through -- your task is safe. Try again?"
    - `DELETE_ERROR` -> "That didn't go through -- your task is still here."
    - `FETCH_ERROR` -> "Can't reach the server right now. Check your connection and try again."
    - Default fallback: use the raw `error.message` from the hook
  - [ ] 3.2 Display the warm message instead of raw error.message; never expose technical error details to the user
- [ ] Task 4: ErrorBanner unit tests (AC: #1-6)
  - [ ] 4.1 Create `client/src/components/ErrorBanner.test.tsx`
  - [ ] 4.2 Test: renders nothing when errors array is empty
  - [ ] 4.3 Test: renders one banner per error when multiple errors exist
  - [ ] 4.4 Test: displays correct warm message for each error code (CREATE_ERROR, UPDATE_ERROR, DELETE_ERROR, FETCH_ERROR)
  - [ ] 4.5 Test: calls `onDismiss` with correct index when dismiss button clicked
  - [ ] 4.6 Test: each banner has `role="alert"` attribute
  - [ ] 4.7 Test: dismiss button has `aria-label="Dismiss error"`
  - [ ] 4.8 Test: falls back to raw error.message for unknown error codes
- [ ] Task 5: Integration test -- ErrorBanner in App context (AC: #1, #3, #4, #5)
  - [ ] 5.1 In `client/src/App.test.tsx`: Test that error banner appears after a failed create (mock fetch to reject)
  - [ ] 5.2 Test: error banner shows warm message, not raw error
  - [ ] 5.3 Test: dismiss button removes the specific error banner
  - [ ] 5.4 Test: error banner does not block task list interactions (can still toggle/edit/delete while banner visible)
  - [ ] 5.5 Test: multiple errors display multiple banners

## Dev Notes

### What Already Exists -- DO NOT Recreate

| Module | Location | Notes |
|--------|----------|-------|
| `useOptimisticTodos` hook | `client/src/hooks/useOptimisticTodos.ts` | Already returns `errors: ErrorInfo[]` and `dismissError(index: number)` |
| `ErrorInfo` interface | `client/src/hooks/useOptimisticTodos.ts` | `{ message: string; code: string }` -- import this, do NOT redefine |
| Error codes | `useOptimisticTodos.ts` | `CREATE_ERROR`, `UPDATE_ERROR`, `DELETE_ERROR`, `FETCH_ERROR` -- already set by hook |
| `errors`/`dismissError` in App.tsx | `client/src/App.tsx` line 7 | Already destructured as `_errors` and `_dismissError` -- just remove underscore prefix |
| Design tokens | `client/src/index.css` | `--color-error-bg: #FEF2F2`, `--color-error-text: #991B1B`, `--color-error-border: #FECACA` |
| Test setup | `client/src/test-setup.ts` | Centralized cleanup + jest-dom matchers -- already configured in vite.config.ts |
| Animation keyframes | `client/src/index.css` | `task-enter` and `task-exit` exist -- add new `banner-enter` and `banner-exit` keyframes |

**The hook, error state management, and design tokens are all in place. This story ONLY creates the ErrorBanner component and wires it into App.tsx.**

### Architecture Constraints

- **Stack:** React 19.2, Vite 7.3, Tailwind CSS 4.2, TypeScript 5.x, Vitest 4.0
- **Component location:** `client/src/components/ErrorBanner.tsx` (flat, no subdirectories)
- **Test location:** `client/src/components/ErrorBanner.test.tsx` (co-located)
- **Props pattern:** Props down, callbacks up. ErrorBanner receives `errors` and `onDismiss` as props.
- **No context, no global state** -- ErrorBanner is a pure presentational component
- **No separate utility files** -- message mapping lives inside ErrorBanner component
- **Import ErrorInfo from hook:** `import type { ErrorInfo } from '../hooks/useOptimisticTodos'`

### ErrorBanner Visual Spec (from UX Design)

```
+---------------------------------------------+
| (!) Adding that task didn't go through    x  |
|     -- try again?                            |
+---------------------------------------------+
  ^ icon    ^ message text              ^ dismiss
```

- **Background:** `var(--color-error-bg)` / `#FEF2F2` (soft warm pink)
- **Border:** 1px solid `var(--color-error-border)` / `#FECACA` (soft red)
- **Border radius:** 8px (`rounded-lg`)
- **Padding:** 12px vertical, 16px horizontal (`py-3 px-4`)
- **Text color:** `var(--color-error-text)` / `#991B1B` (muted red)
- **Font size:** 14px caption size (`text-sm`)
- **Icon:** Warning icon (!) -- use inline SVG or unicode, no icon library
- **Dismiss button:** x character, same `error-text` color, min 44x44px touch target
- **Position:** Above task list, below TaskInput (between them in the DOM)
- **Layout:** Flex row -- icon | message (flex-1) | dismiss button
- **Multiple errors:** Stack vertically with 8px gap between banners

### Animation Spec

- **Entry:** `translateY(-8px) -> 0` + `opacity 0 -> 1` over 200ms ease-in-out
- **Exit:** `opacity 1 -> 0` over 150ms ease-out
- **Add to `client/src/index.css`:**
  - `@keyframes banner-enter` (translateY + opacity)
  - `@keyframes banner-exit` (opacity fade)
  - `.banner-enter` and `.banner-exit` CSS classes
- **Reduced motion:** Wrap in `@media (prefers-reduced-motion: no-preference)` or disable with Tailwind's `motion-safe:` prefix

### Warm Message Mapping (EXACT text from UX spec)

| Error Code | User-Facing Message |
|------------|-------------------|
| `CREATE_ERROR` | "Adding that task didn't go through -- try again?" |
| `UPDATE_ERROR` | "That didn't go through -- your task is safe. Try again?" |
| `DELETE_ERROR` | "That didn't go through -- your task is still here." |
| `FETCH_ERROR` | "Can't reach the server right now. Check your connection and try again." |
| Unknown/default | Use raw `error.message` from the hook |

### Accessibility Requirements

- Each banner: `role="alert"` (immediate screen reader announcement)
- Dismiss button: `aria-label="Dismiss error"`, keyboard accessible (Enter/Space to dismiss)
- Tab order: banner dismiss buttons should be reachable via Tab
- Banner appearance should NOT steal focus from current user interaction (non-blocking)
- Error text should NOT use technical jargon -- warm, human language only

### Current App.tsx Wiring (what to change)

**Before (line 7):**
```tsx
const { todos, isLoading, errors: _errors, addTodo, updateTodo, deleteTodo, dismissError: _dismissError } = useOptimisticTodos()
```

**After:**
```tsx
const { todos, isLoading, errors, addTodo, updateTodo, deleteTodo, dismissError } = useOptimisticTodos()
```

**Add between TaskInput and TaskList div:**
```tsx
{errors.length > 0 && <ErrorBanner errors={errors} onDismiss={dismissError} />}
```

### Testing Approach

- **Unit tests:** Render ErrorBanner with mock props using `@testing-library/react`
- **Mock strategy:** Pass `errors` array and `vi.fn()` for `onDismiss` callback
- **Integration tests:** In App.test.tsx, mock `fetch` to reject and verify banner appears
- **Existing test count:** 94 passing -- ALL must remain passing after changes
- **Test file:** `client/src/components/ErrorBanner.test.tsx` (co-located)
- **Integration additions:** In `client/src/App.test.tsx`

### Code Review Lessons from Story 3.1 (Apply Here)

- Add `toHaveBeenCalledTimes` assertions (not just `toHaveBeenCalled`)
- Ensure 44x44px touch targets on dismiss button
- Add `prefers-reduced-motion` fallback for animations
- Do NOT add unused imports or variables (no underscore prefixing)
- Test keyboard interactions (Tab to dismiss, Enter/Space to activate)

### Project Structure Notes

- All 5 architecture components after this story: TaskInput, TaskItem, TaskList, EmptyState, **ErrorBanner** (NEW)
- Tests co-located: `ErrorBanner.test.tsx` alongside `ErrorBanner.tsx`
- No new hooks, no new types, no new API calls -- purely presentational component
- After this story, Epic 3 is feature-complete (both FR15 and FR16 satisfied)

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 3, Story 3.2]
- [Source: _bmad-output/planning-artifacts/architecture.md - Frontend Architecture, Component Architecture, ErrorBanner]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - ErrorBanner Component Spec, Error Recovery UX, Animation Patterns, Message Templates]
- [Source: _bmad-output/implementation-artifacts/3-1-optimistic-ui-with-rollback.md - errors/dismissError implementation, code review fixes]
- [Source: _bmad-output/project-context.md - Framework Rules, Testing Rules, Anti-Patterns]
- [Source: client/src/hooks/useOptimisticTodos.ts - ErrorInfo interface, error codes, dismissError method]
- [Source: client/src/App.tsx - Current _errors/_dismissError wiring]
- [Source: client/src/index.css - Design tokens, existing animation keyframes]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

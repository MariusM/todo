# Story 4.3: Screen Reader Support & ARIA

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **screen reader user**,
I want to perceive all task statuses and perform all actions,
so that the app is fully usable without visual information (FR24, NFR11).

## Acceptance Criteria

1. **Given** the task list is rendered, **When** a screen reader reads the page, **Then** the list has `role="list"` with an `aria-label` (FR24)
2. **Given** a task exists, **When** a screen reader reads the task, **Then** the checkbox has `aria-checked` reflecting completion status (FR24)
3. **Given** I complete or uncomplete a task, **When** the status changes, **Then** the change is announced via an `aria-live="polite"` region (NFR11)
4. **Given** a task is added or deleted, **When** the list updates dynamically, **Then** the change is announced to screen readers (NFR11)
5. **Given** the empty state is displayed, **When** a screen reader reads the page, **Then** the empty state text is accessible and descriptive
6. **Given** an error banner appears, **When** it is rendered, **Then** it uses `role="alert"` for immediate announcement (NFR11)

## Tasks / Subtasks

- [x] Task 1: Enhance TaskList with proper ARIA live region announcements (AC: #1, #3, #4)
  - [x] 1.1 Verify `role="list"` and `aria-label="Task list"` are present on `<ul>` (already exists — confirm)
  - [x] 1.2 Add a visually-hidden status announcement `<div>` with `aria-live="polite"` for dynamic changes (task added, deleted, completed/uncompleted)
  - [x] 1.3 Implement announcement text generation: "Task added: {text}", "Task deleted: {text}", "Task completed: {text}", "Task marked incomplete: {text}"
  - [x] 1.4 Add `aria-busy="true"` during loading state on the live region wrapper
  - [x] 1.5 Write tests for live region announcements on add/delete/complete/uncomplete

- [x] Task 2: Enhance TaskItem with screen reader semantics (AC: #2)
  - [x] 2.1 Verify native `<input type="checkbox">` exposes `aria-checked` automatically (it does — confirm with test)
  - [x] 2.2 Ensure checkbox `checked` prop correctly reflects `todo.completed` state so `aria-checked` matches
  - [x] 2.3 Verify existing `aria-label` on checkbox reads "Mark '{text}' as complete/incomplete"
  - [x] 2.4 Write screen reader semantic tests validating `aria-checked` toggles correctly

- [x] Task 3: Enhance EmptyState for screen reader accessibility (AC: #5)
  - [x] 3.1 Fix contradictory SVG attributes: change `role="img" aria-hidden="true"` to just `aria-hidden="true"` (decorative icon)
  - [x] 3.2 Verify `<h2>No tasks yet</h2>` heading level is correct within page hierarchy (`<h1>Todo</h1>` → `<h2>` is correct)
  - [x] 3.3 Ensure instruction text "Type a task above and press Enter to get started" is readable by screen readers
  - [x] 3.4 Write test verifying EmptyState content is accessible

- [x] Task 4: Verify and enhance ErrorBanner ARIA (AC: #6)
  - [x] 4.1 Verify `role="alert"` is present (already exists — confirm)
  - [x] 4.2 Add `aria-atomic="true"` to ensure full error message is announced, not partial updates
  - [x] 4.3 Verify decorative SVG icon has `aria-hidden="true"` (already exists — confirm)
  - [x] 4.4 Make dismiss button label more specific: `aria-label="Dismiss error: {message}"` or keep generic if stacking
  - [x] 4.5 Write test verifying `role="alert"` and `aria-atomic` behavior

- [x] Task 5: Add form semantics to TaskInput (AC: relates to overall SR experience)
  - [x] 5.1 Wrap input in `<form>` with `onSubmit` handler and `aria-label="Add task"`
  - [x] 5.2 Verify existing `aria-label="Add a new task"` on input
  - [x] 5.3 Ensure form submission still works correctly (Enter key → submit → prevent default)
  - [x] 5.4 Write test verifying form semantics and ARIA labels

- [x] Task 6: Component test suite for screen reader support
  - [x] 6.1 TaskList tests: live region exists, announcements fire on add/delete/complete
  - [x] 6.2 TaskItem tests: aria-checked reflects state, aria-labels are correct
  - [x] 6.3 EmptyState tests: accessible content, no contradictory attributes
  - [x] 6.4 ErrorBanner tests: role="alert", aria-atomic, dismiss label
  - [x] 6.5 TaskInput tests: form wrapper with aria-label
  - [x] 6.6 Integration test (App.test.tsx): full screen reader journey — add task → announcement → complete → announcement → delete → announcement

## Dev Notes

### Architecture Compliance

- **Component structure**: Modify existing 5 components only (TaskInput, TaskItem, TaskList, ErrorBanner, EmptyState). Do NOT create new components.
- **State management**: The announcement mechanism needs state for the announcement text. This should live in `useOptimisticTodos` hook or be derived in TaskList. Prefer keeping it in TaskList as local state since it's a UI concern.
- **No external libraries**: Do not add any accessibility libraries. Use native ARIA attributes only.
- **Optimistic UI pattern**: Announcements should fire on optimistic state changes (immediate), not on API response. This means the announcement triggers when the hook applies the optimistic change.

### Technical Implementation Guidance

**Live Region Pattern for Announcements:**
The key challenge is announcing dynamic changes. The recommended pattern:
```tsx
// In TaskList or App — a visually-hidden div that acts as the announcement channel
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>
```
- The `announcement` state variable is updated when todos change
- Set text → screen reader announces → clear text after short delay (or leave, SR handles it)
- Use `useRef` to track previous todos array and diff against current to determine what changed
- **Critical**: The live region element must exist in the DOM BEFORE content is set. Do not conditionally render the container.

**Visually Hidden CSS Class:**
Add an `sr-only` utility class if not already present (Tailwind provides this):
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```
Tailwind CSS 4.2 includes `sr-only` class natively — use it directly.

**Checkbox aria-checked:**
Native `<input type="checkbox">` automatically exposes `aria-checked` based on the `checked` prop. No manual `aria-checked` attribute needed. Just verify the `checked` prop is correctly bound to `todo.completed`.

**Form Wrapping for TaskInput:**
Wrap the input in a `<form>` element. Move the Enter key submission logic to the form's `onSubmit` handler. This provides better screen reader context (announces "form: Add task") and standard form semantics.

**ErrorBanner role="alert":**
`role="alert"` implicitly sets `aria-live="assertive"`. Adding explicit `aria-atomic="true"` ensures the entire message is read when content changes, not just the diff.

### Library & Framework Requirements

| Technology | Version | Notes |
|-----------|---------|-------|
| React | 19.2 | Use native ARIA attributes as JSX props |
| Tailwind CSS | 4.2 | Use `sr-only` class for visually hidden content |
| Vitest | 4.0 | Test ARIA attributes via @testing-library queries |
| @testing-library/react | current | Use `getByRole`, `getByLabelText` for accessible queries |

### File Structure Requirements

Files to modify (no new files):
- `client/src/components/TaskList.tsx` — Add announcement live region, aria-busy on loading
- `client/src/components/TaskList.test.tsx` — Add live region and announcement tests
- `client/src/components/TaskItem.tsx` — Verify/confirm aria-checked behavior (likely no changes needed)
- `client/src/components/TaskItem.test.tsx` — Add aria-checked verification tests
- `client/src/components/TaskInput.tsx` — Wrap in `<form>` with aria-label
- `client/src/components/TaskInput.test.tsx` — Add form semantics tests
- `client/src/components/ErrorBanner.tsx` — Add `aria-atomic="true"`
- `client/src/components/ErrorBanner.test.tsx` — Add ARIA attribute tests
- `client/src/components/EmptyState.tsx` — Fix SVG attributes
- `client/src/components/EmptyState.test.tsx` — Add accessibility tests
- `client/src/App.tsx` — May need to pass announcement callbacks or manage announcement state
- `client/src/App.test.tsx` — Add integration-level screen reader journey test

### Testing Requirements

**Testing framework**: Vitest 4.0 + @testing-library/react + @testing-library/user-event
**Test co-location**: Tests next to source files as `ComponentName.test.tsx`
**Test patterns established in story 4.2**:
```tsx
const user = userEvent.setup()
// Query by accessible role
screen.getByRole('list', { name: 'Task list' })
screen.getByRole('checkbox', { name: /Mark.*as complete/ })
screen.getByRole('alert')
// Check ARIA attributes
expect(checkbox).toHaveAttribute('aria-checked', 'false')
expect(liveRegion).toHaveTextContent('Task completed: Buy milk')
```

**Key test scenarios:**
1. Live region exists in DOM with `aria-live="polite"`
2. Adding a task updates announcement text
3. Completing a task updates announcement text
4. Deleting a task updates announcement text
5. `aria-checked` reflects checkbox state (true/false)
6. ErrorBanner has `role="alert"` and `aria-atomic="true"`
7. EmptyState has no contradictory ARIA attributes
8. TaskInput is wrapped in form with `aria-label`
9. Full journey integration: add → announce → complete → announce → delete → announce

**All existing 197 tests must continue passing with zero regressions.**

### Previous Story Intelligence (Story 4.2)

**Key learnings to apply:**
- Global `:focus-visible` rule already handles focus rings — no changes needed
- ARIA labels already exist on all interactive elements — this story enhances semantics, not replaces
- Use `userEvent.setup()` pattern for all interaction tests
- Space key `e.preventDefault()` pattern already in place
- Test files are co-located: `ComponentName.test.tsx`
- `skipBlurRef` pattern in TaskItem prevents double-save — don't break this
- All 197 tests passing — maintain this baseline

**Files modified in story 4.2 (context for what exists):**
- `client/src/index.css` — Global `:focus-visible` rule
- `client/src/components/TaskInput.tsx` — Has aria-label, autoFocus
- `client/src/components/TaskItem.tsx` — Has aria-labels, role="button", tabIndex, keyboard handlers
- `client/src/components/TaskItem.test.tsx` — Accessibility and keyboard tests
- `client/src/components/TaskList.test.tsx` — Focus management tests
- `client/src/App.test.tsx` — Integration keyboard tests

**Patterns already established:**
- Checkbox: `aria-label="Mark '{text}' as complete/incomplete"`
- Task text: `role="button"`, `tabIndex={0}`, `aria-label="Edit task: {text}"`
- Delete button: `aria-label="Delete task: {text}"`
- TaskInput: `aria-label="Add a new task"`

### Git Intelligence

**Recent commits (Epic 4 context):**
- `c0e501f` Fix code review issues for story 4.2: Space key scroll, focus consistency, test quality
- `7f616cd` Implement story 4.2: Keyboard navigation & focus management
- `c6252dd` Fix code review issues for story 4.1: undefined color token, test quality
- `3cb51c5` Implement story 4.1: Responsive layout with breakpoint spacing

**Patterns from recent work:**
- Implementation commit followed by code review fix commit
- Commits are descriptive with story reference
- No new components added in Epic 4 — behavior modifications only

### Project Structure Notes

- Monorepo: `client/` and `server/` packages with npm workspaces
- Components in `client/src/components/` (flat, no nesting)
- Hooks in `client/src/hooks/` — `useOptimisticTodos.ts` is single source of truth
- Tests co-located with source files
- Tailwind CSS 4.2 with CSS-native @theme in `client/src/index.css`
- Design tokens: `--color-border-focus: #2563EB`, `--color-surface: #FFFFFF`, `--color-text-primary: #1C1917`

### Critical Warnings

1. **DO NOT add aria-checked manually** to `<input type="checkbox">` — the native element handles this. Just verify `checked` prop is correct.
2. **DO NOT use aria-live="assertive"** on the task list announcements — use `"polite"`. Only ErrorBanner uses assertive (via `role="alert"`).
3. **DO NOT create a separate announcements component** — keep the live region inside TaskList or App.
4. **DO NOT modify useOptimisticTodos hook** unless absolutely necessary for passing announcement data.
5. **DO NOT break existing keyboard navigation** from story 4.2.
6. **DO NOT change the 5-component architecture** — modify existing components only.
7. **The live region `<div>` must be in the DOM at all times** — never conditionally render it. Only change its text content.
8. **DO NOT add skip-to-content links** — that's beyond scope of this story's acceptance criteria.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.3]
- [Source: _bmad-output/planning-artifacts/architecture.md - Accessibility Requirements FR23-FR25, NFR8, NFR11]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - Accessibility Considerations, ARIA Roles, Screen Reader Behavior]
- [Source: _bmad-output/planning-artifacts/prd.md - FR24, NFR11]
- [Source: _bmad-output/implementation-artifacts/4-2-keyboard-navigation-focus-management.md - Previous story learnings]
- [Source: _bmad-output/project-context.md - Project structure, conventions, testing config]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — implementation completed without issues.

### Completion Notes List
- TaskList: Added dedicated visually-hidden `<div aria-live="polite" aria-atomic="true" className="sr-only">` for announcements. Replaced previous `aria-live` on wrapper div. Implemented announcement diffing using `useRef` to track previous todos and detect adds, deletes, and completion changes. Added `aria-busy` on live region during loading.
- TaskItem: Verified native `<input type="checkbox">` automatically exposes `aria-checked` via `checked` prop — no changes needed to component. Added verification tests.
- EmptyState: Removed contradictory `role="img"` from decorative SVG (kept `aria-hidden="true"`). Verified h2 heading level and readable instruction text.
- ErrorBanner: Added `aria-atomic="true"` to each alert div. Verified existing `role="alert"`, `aria-hidden="true"` on decorative SVG icon, and dismiss button `aria-label`.
- TaskInput: Wrapped input in `<form>` with `onSubmit` handler and `aria-label="Add task"`. Moved Enter key logic to form submission for better screen reader semantics.
- Integration test: Added full screen reader journey test (add → announce → complete → announce → delete → announce) and form/alert ARIA verification tests.
- All 215 tests pass (197 original + 18 new). Zero regressions.

### File List
- `client/src/components/TaskList.tsx` — Modified: Added announcement live region with `aria-live="polite"`, `aria-atomic`, `sr-only` class, `aria-busy` during loading; refactored todo diffing to track previous todos for announcement generation
- `client/src/components/TaskList.test.tsx` — Modified: Added 5 tests for live region (exists, aria-busy, announcements for add/delete/complete/uncomplete, no announce on initial load)
- `client/src/components/TaskItem.test.tsx` — Modified: Added 2 tests verifying checkbox checked state reflects todo completion for screen readers
- `client/src/components/TaskInput.tsx` — Modified: Wrapped input in `<form>` with `onSubmit` handler and `aria-label="Add task"`
- `client/src/components/TaskInput.test.tsx` — Modified: Added 2 tests for form wrapper with aria-label
- `client/src/components/ErrorBanner.tsx` — Modified: Added `aria-atomic="true"` to alert divs
- `client/src/components/ErrorBanner.test.tsx` — Modified: Added 2 tests for `aria-atomic` and decorative SVG `aria-hidden`
- `client/src/components/EmptyState.tsx` — Modified: Removed contradictory `role="img"` from decorative SVG
- `client/src/components/EmptyState.test.tsx` — Modified: Updated SVG test, added h2 heading level test and instruction visibility test
- `client/src/App.test.tsx` — Modified: Added 3 integration tests (full SR journey, form semantics, error banner ARIA attributes)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified: Updated story status
- `_bmad-output/implementation-artifacts/4-3-screen-reader-support-aria.md` — Modified: Updated tasks, status, dev agent record, file list, change log

## Change Log
- 2026-03-07: Code review fixes — Fixed repeated identical announcement bug (screen reader wouldn't re-announce same message), added dependency array to announcement useEffect, replaced O(n²) completion diffing with Map lookup, strengthened EmptyState screen reader test to verify no aria-hidden on ancestors. 1 new test added, 216 total passing.
- 2026-03-06: Implemented story 4.3 — Screen Reader Support & ARIA. Added live region announcements for task add/delete/complete/uncomplete, form semantics for TaskInput, aria-atomic on ErrorBanner, fixed contradictory SVG attributes on EmptyState, verified aria-checked on checkboxes. 18 new tests added, 215 total passing.

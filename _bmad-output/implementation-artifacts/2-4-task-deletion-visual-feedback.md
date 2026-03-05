# Story 2.4: Task Deletion & Visual Feedback

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want to delete a task with a single action and see clear visual feedback for all operations,
so that managing my list feels effortless.

## Acceptance Criteria

1. **Given** a task is displayed **When** I click the delete control (x) **Then** the task disappears with a brief exit animation (~150ms) **And** the list reflows smoothly **And** a DELETE request fires in the background.
2. **Given** a task is deleted **When** the deletion completes **Then** the task is permanently removed -- it does not appear on refresh.
3. **Given** a new task is created **When** it appears in the list **Then** visual feedback confirms the addition (entry animation).
4. **Given** any CRUD action occurs (create, complete, delete) **When** the action completes visually **Then** the user receives clear visual feedback that the action took effect.

## Tasks / Subtasks

- [x] Task 1: Add delete button to TaskItem (AC: #1)
  - [x] 1.1 Add `onDelete` prop to `TaskItemProps` interface
  - [x] 1.2 Render `x` delete button with correct styling: hidden on desktop, visible on hover/focus-within; always visible on mobile
  - [x] 1.3 Style: `border` color (#d6d3d1) default, `error-text` (#991B1B) on hover, 44x44px touch target
  - [x] 1.4 Add `aria-label="Delete task: ${todo.text}"` to delete button
  - [x] 1.5 Tab order: checkbox -> task text -> delete button
- [x] Task 2: Wire delete through component tree (AC: #1, #2)
  - [x] 2.1 Add `onDelete` prop to `TaskListProps` and pass through to each `TaskItem`
  - [x] 2.2 Destructure `deleteTodo` from `useOptimisticTodos()` in `App.tsx`
  - [x] 2.3 Pass `onDelete={deleteTodo}` to `TaskList`
- [x] Task 3: Exit animation on deletion (AC: #1)
  - [x] 3.1 Add ~150ms fade/slide-out CSS transition on task removal
  - [x] 3.2 Ensure smooth list reflow after animated element is removed
- [x] Task 4: Entry animation for new tasks (AC: #3)
  - [x] 4.1 Add entry animation when new task appears in list
- [x] Task 5: Visual feedback consolidation (AC: #4)
  - [x] 5.1 Ensure completion toggle has visual transition (already exists: `transition-all duration-200`)
  - [x] 5.2 Verify all CRUD operations provide clear visual feedback
- [x] Task 6: Focus management after deletion (AC: #1)
  - [x] 6.1 After delete, move focus to next task in list
  - [x] 6.2 If deleted task was last, move focus to previous task or input if list empty
- [x] Task 7: Tests (AC: #1-4)
  - [x] 7.1 TaskItem tests: delete button render, click calls onDelete, aria-label, hover visibility
  - [x] 7.2 TaskList tests: onDelete prop pass-through
  - [x] 7.3 App integration test: delete wiring
  - [x] 7.4 Animation tests (verify CSS classes applied)

## Dev Notes

### What Already Exists -- DO NOT Recreate

| Module | Location | Notes |
|--------|----------|-------|
| `DELETE /api/todos/:id` route | `server/src/routes/todo-routes.ts:54-63` | Returns 204, 404 if not found |
| `deleteTodo()` API client | `client/src/api/todos.ts:41-54` | Calls DELETE, expects 204 |
| `removeTodo()` hook method | `client/src/hooks/useOptimisticTodos.ts:80-91` | Optimistic remove with snapshot rollback |
| `validateTodoId` middleware | `server/src/middleware/validate-todo.ts:20-28` | UUID validation |
| `todosRef` stale-closure fix | `client/src/hooks/useOptimisticTodos.ts` | Use this pattern if adding new methods |

**The entire backend and hook logic for deletion is DONE. This story is purely frontend UI work.**

### Architecture Constraints

- **Stack:** React 19.2, Vite 7.3, Tailwind CSS 4.2 (CSS-native `@theme`), TypeScript 5.x, Vitest 4.0
- **Component pattern:** Props down, callbacks up. No context, no global state.
- **Single source of truth:** `useOptimisticTodos` hook -- components never call API directly
- **5 components only:** TaskInput, TaskItem, TaskList, ErrorBanner, EmptyState (ErrorBanner not yet created -- Epic 3)
- **No confirmation dialog for delete** -- explicitly banned by UX spec as anti-pattern

### Design Tokens Available (in `client/src/index.css`)

- `--color-border`: #E7E5E4 (delete button default color)
- `--color-error-text`: #991B1B (delete button hover color)
- `--duration-fast`: 150ms (exit animation duration)
- `--color-completed-text`: #A8A29E
- `--color-checkbox-fill`: #2563EB
- `--color-surface-warm`: stone-50

### TaskItem Component Anatomy (Target State)

```
┌──┬────────────────────────────────────┬──┐
│☐ │ Task description text              │ x│
└──┴────────────────────────────────────┴──┘
 ↑ checkbox    ↑ task text (clickable)   ↑ delete
```

### Current TaskItem Props (after story 2.3)

```tsx
interface TaskItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (id: string, text: string) => void;
}
```

Must add: `onDelete: (id: string) => void;`

### Delete Button Styling Requirements

- Desktop: hidden by default, visible on row `:hover` or `:focus-within`
- Mobile: always visible (no hover on touch devices)
- Default color: `border` (#d6d3d1)
- Hover color: `error-text` (#991B1B)
- Touch target: 44px x 44px minimum
- Character: `x` (or `×` symbol)

### Animation Implementation Notes

- Exit animation: ~150ms fade/slide-out. Use CSS `transition` or `@keyframes`. Consider `opacity` + `transform: translateX()` or `max-height` collapse.
- Entry animation: fade-in or slide-down for newly created tasks.
- List reflow: ensure items below deleted task animate smoothly into new positions. Consider `transition` on the list container or individual items.
- Existing: completion toggle already uses `transition-all duration-200`.

### Focus Management After Deletion

- After deleting a task, move focus to the next task in the list.
- If the deleted task was the last one, focus the previous task.
- If the list becomes empty, focus the task input field.
- Implementation: use refs or query selectors to find the next focusable element.

### Previous Story Patterns to Follow

- **skipBlurRef guard** (from 2.3 review): Use refs to prevent double-fire of handlers.
- **Layout consistency** (from 2.3 review): Match padding/sizing between interactive and display states.
- **CSS classes pattern**: Conditional classes with template literals `${condition ? 'class-a' : 'class-b'}`.
- **Accessibility**: All interactive elements need `aria-label`, `role`, `tabIndex` as appropriate.
- **Test pattern**: Co-located tests, Vitest + @testing-library/react, mock callbacks with `vi.fn()`.

### Code Review Lessons from Epic 2

- Move API side effects out of `setState` updater functions
- Use `todosRef` for stale-closure-safe operations in hook
- Ensure 44x44px touch targets on all interactive elements
- Add `toHaveBeenCalledTimes` assertions (not just `toHaveBeenCalled`)
- Test keyboard interactions (Enter, Escape, Tab)

### Project Structure Notes

- All components in `client/src/components/` (flat, no subdirectories)
- Tests co-located: `ComponentName.test.tsx` alongside `ComponentName.tsx`
- Hook tests: `client/src/hooks/useOptimisticTodos.test.ts`
- API tests: `client/src/api/todos.test.ts`
- Current test count: 137 passing -- all must remain passing

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 2, Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md - Optimistic UI Pattern, Component Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - TaskItem spec, Micro-interactions, Focus Management]
- [Source: _bmad-output/implementation-artifacts/2-3-inline-editing.md - Dev Notes, Code Review Fixes]
- [Source: _bmad-output/implementation-artifacts/2-2-task-completion-visual-distinction.md - Design Tokens, Touch Targets]
- [Source: _bmad-output/implementation-artifacts/2-1-todo-rest-api-update-delete.md - Existing Delete API]
- [Source: _bmad-output/project-context.md - AI Agent Rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered. All tests passed on first implementation attempt.

### Completion Notes List

- Added `onDelete` prop to TaskItem with `×` delete button, 44x44px touch target, hidden on desktop (visible on hover/focus-within), always visible on mobile via `max-sm:opacity-100`
- Wired delete through TaskList and App.tsx using existing `deleteTodo` from `useOptimisticTodos` hook
- Implemented exit animation: `task-exit` CSS keyframe (150ms fade + translateX slide-out), triggered via `animationend` event listener before calling `onDelete`
- Implemented entry animation: `task-enter` CSS keyframe (150ms fade + translateY slide-in) applied to all TaskItem `<li>` elements
- Verified visual feedback consolidation: all CRUD operations have transitions (checkbox toggle, edit mode, text display, delete button)
- Implemented focus management in TaskList: after deletion, focus moves to next task's checkbox; if last task deleted, focuses previous; if list empty, focuses task input
- Added 14 new tests (151 total, up from 137): delete button render, click, aria-label, animation classes, tab order, focus management, TaskList pass-through, App integration

### Change Log

- 2026-03-05: Implemented story 2.4 - Task deletion UI, entry/exit animations, focus management, 14 new tests

### File List

- `client/src/components/TaskItem.tsx` (modified) - Added onDelete prop, delete button, exit animation with animationend listener, entry animation class
- `client/src/components/TaskList.tsx` (modified) - Added onDelete prop, focus management after deletion using refs and useEffect
- `client/src/App.tsx` (modified) - Destructured deleteTodo from hook, passed to TaskList
- `client/src/index.css` (modified) - Added task-enter and task-exit CSS keyframe animations
- `client/src/components/TaskItem.test.tsx` (modified) - Added 7 delete button tests (render, click, aria-label, exit class, entry class, hover visibility, tab order)
- `client/src/components/TaskList.test.tsx` (modified) - Added 3 tests (onDelete pass-through, focus management after first/last deletion)
- `client/src/App.test.tsx` (modified) - Added 1 integration test for delete wiring

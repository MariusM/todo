# Story 4.2: Keyboard Navigation & Focus Management

Status: ready-for-dev

## Story

As a user,
I want to operate the entire app using only my keyboard,
so that I can be productive without a mouse (FR23, NFR10).

## Acceptance Criteria

1. **AC1 - Auto-focus on load:** Given the page loads, when I check focus, then TaskInput is auto-focused as the first interactive element.
2. **AC2 - Tab order:** Given I am using the keyboard, when I press Tab, then focus moves in visual order: input -> first task checkbox -> task text -> delete button -> next task (FR23).
3. **AC3 - Focus after create:** Given I have just created a task, when the task is added to the list, then focus remains on TaskInput for rapid sequential entry.
4. **AC4 - Focus after delete:** Given I have just deleted a task, when the task is removed, then focus moves to the next task in the list, or to the input if the list is empty.
5. **AC5 - Visible focus ring:** Given any interactive element is focused, when I look at the element, then a visible focus ring is displayed (2px solid border-focus with 2px offset) (NFR10).
6. **AC6 - Enter activates edit:** Given I am focused on a task's text, when I press Enter, then inline edit mode activates (same as click).

## Tasks / Subtasks

- [ ] Task 1: Audit existing keyboard/focus behavior against all ACs (AC: all)
  - [ ] 1.1 Verify TaskInput auto-focus on mount (AC1) - already implemented, confirm working
  - [ ] 1.2 Verify tab order across full page: input -> checkbox -> text -> delete -> next task (AC2)
  - [ ] 1.3 Verify focus stays on TaskInput after task creation (AC3)
  - [ ] 1.4 Verify focus moves to next task after deletion (AC4) - TaskList already has logic
  - [ ] 1.5 Verify Enter on task text activates edit (AC6) - already implemented
  - [ ] 1.6 Document gaps found during audit
- [ ] Task 2: Fix focus ring consistency across ALL interactive elements (AC: 5)
  - [ ] 2.1 Audit current focus styles on: TaskInput, checkbox, task text span, delete button, ErrorBanner dismiss button
  - [ ] 2.2 Ensure ALL interactive elements use consistent `focus-visible` ring: 2px solid border-focus, 2px offset
  - [ ] 2.3 Use `:focus-visible` (not `:focus`) to avoid showing ring on mouse clicks
  - [ ] 2.4 Verify ring uses `outline` (not `box-shadow` or `ring`) for proper offset support
- [ ] Task 3: Fix focus management gaps found in audit (AC: 1-4, 6)
  - [ ] 3.1 Fix any tab order issues (ensure DOM order matches visual order)
  - [ ] 3.2 Fix focus-after-delete edge cases (last item deleted, only item deleted)
  - [ ] 3.3 Fix focus-after-create if not retained on input
  - [ ] 3.4 Ensure no keyboard traps exist
  - [ ] 3.5 Ensure Shift+Tab works in reverse order
- [ ] Task 4: Write comprehensive keyboard navigation tests (AC: all)
  - [ ] 4.1 Add/update tests in TaskInput.test.tsx for auto-focus and focus-after-create
  - [ ] 4.2 Add/update tests in TaskItem.test.tsx for Enter-to-edit, focus ring classes
  - [ ] 4.3 Add/update tests in TaskList.test.tsx for cross-item tab order and focus-after-delete
  - [ ] 4.4 Add keyboard navigation integration tests in App.test.tsx
- [ ] Task 5: Run full test suite, verify zero regressions (AC: all)
  - [ ] 5.1 Run `npm test` - all existing tests must pass
  - [ ] 5.2 Verify new tests pass
  - [ ] 5.3 Check no visual regressions in responsive layout (story 4.1)

## Dev Notes

### What Already Exists (DO NOT recreate)

These features are already implemented. Verify they work correctly, fix if broken, but do NOT rewrite from scratch:

1. **TaskInput auto-focus** - `autoFocus` prop in TaskInput.tsx. Verify it works. (AC1)
2. **Tab order within TaskItem** - DOM order is: checkbox -> text span (role="button", tabIndex={0}) -> delete button. Verified by existing test at TaskItem.test.tsx:252-261. (AC2)
3. **Enter/Space on task text** - TaskItem.tsx handles `onKeyDown` on text span: Enter or Space triggers `handleTextClick()` which enters edit mode. (AC6)
4. **Edit mode keyboard handling** - Enter saves, Escape cancels (with `skipBlurRef` to prevent double-save). Already tested.
5. **Focus after deletion** - TaskList.tsx already has focus management logic: focuses next checkbox or falls back to input.
6. **Focus ring on TaskInput** - Already uses `focus:ring-2 focus:ring-border-focus focus:ring-offset-2` classes.
7. **ARIA labels** - All interactive elements have descriptive aria-labels: checkbox ("Mark '{text}' as complete/incomplete"), text span ("Edit task: {text}"), delete button ("Delete task: {text}"), TaskInput ("Add a new task").
8. **44x44px touch targets** - Already enforced on checkbox and delete button (story 4.1).

### What Likely Needs Fixing

1. **Focus ring consistency** - TaskInput uses Tailwind ring utilities but other elements may not have consistent focus-visible styles. Check checkbox, delete button, text span, ErrorBanner dismiss button.
2. **`:focus-visible` vs `:focus`** - Ensure ring only appears on keyboard focus, not mouse clicks. Use `:focus-visible` or Tailwind's `focus-visible:` prefix.
3. **Focus-after-create verification** - Confirm TaskInput retains focus after submitting (the input clears but must keep focus). Check if optimistic update or re-render causes focus loss.
4. **Focus-after-delete edge cases** - Test: delete last item in list (should focus previous or input), delete only item (should focus input).
5. **Cross-component tab order** - Tab from TaskInput to first TaskItem's checkbox may need verification. No explicit tabIndex management between components.
6. **Outline vs ring** - AC5 specifies "2px solid border-focus with 2px offset". This maps to `outline: 2px solid var(--color-border-focus); outline-offset: 2px;` — verify Tailwind's `ring` utility produces equivalent result or switch to `outline`.

### Implementation Approach

**Strategy: Audit-first, fix gaps, test comprehensively.**

1. Start by manually testing keyboard flow in the browser to identify real gaps
2. Fix focus ring consistency using a global `:focus-visible` rule or per-component Tailwind classes
3. Fix any focus management bugs found
4. Write tests that verify each AC

**Focus ring implementation options:**
- **Option A (preferred):** Global CSS rule in `index.css`:
  ```css
  :focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }
  ```
  Then remove per-component ring classes to avoid double-styling.
- **Option B:** Per-component Tailwind classes: `focus-visible:outline-2 focus-visible:outline-border-focus focus-visible:outline-offset-2`

**Focus management pattern:**
- Use `useRef` for programmatic focus (already used in TaskList for deletion focus)
- Use `element.focus()` for imperative focus moves
- Do NOT add `tabIndex` values > 0 (breaks natural tab order)
- Do NOT add custom arrow key navigation (not in scope per AC)

### Anti-Patterns to Avoid

- Do NOT add a custom focus management library (use native DOM focus APIs)
- Do NOT use `tabIndex` > 0 on any element
- Do NOT add `outline: none` without a replacement visible indicator
- Do NOT intercept Tab key behavior (let browser handle natural tab order)
- Do NOT add ArrowUp/ArrowDown navigation (not in scope)
- Do NOT refactor component structure - only modify keyboard/focus behavior
- Do NOT modify the `useOptimisticTodos` hook unless focus-after-create requires it
- Do NOT add new components - work within existing 5-component structure

### Project Structure Notes

- All components flat in `client/src/components/` (TaskInput, TaskItem, TaskList, ErrorBanner, EmptyState)
- Tests co-located: `ComponentName.test.tsx` next to `ComponentName.tsx`
- No `__tests__/` directories
- Hooks in `client/src/hooks/`
- Design tokens in `client/src/index.css` using Tailwind 4.2 `@theme` block
- Single state hook: `useOptimisticTodos` - do not add new state management

### Key Design Tokens

```css
--color-border-focus: #2563EB;  /* Blue focus ring color */
--color-surface: #FFFFFF;        /* Main surface background */
--color-text-primary: #1C1917;   /* Primary text */
```

Focus ring: `border-focus` (#2563EB) on `surface` (#FFFFFF) = 4.6:1 contrast ratio (passes WCAG AA).

### Testing Strategy

**Framework:** Vitest 4.0 + @testing-library/react + @testing-library/user-event

**Key testing patterns (from existing tests):**
```tsx
const user = userEvent.setup()
// Tab navigation
await user.tab()
expect(element).toHaveFocus()
// Keyboard events
await user.keyboard('{Enter}')
// Class assertions for focus ring
expect(element).toHaveClass('focus-visible:outline-2')
```

**Test cases to add/verify:**

| Test | File | AC |
|------|------|----|
| TaskInput auto-focused on render | TaskInput.test.tsx | 1 |
| Focus stays on TaskInput after Enter submit | TaskInput.test.tsx | 3 |
| Tab from input reaches first task checkbox | App.test.tsx or TaskList.test.tsx | 2 |
| Tab through full task: checkbox -> text -> delete | TaskItem.test.tsx (exists) | 2 |
| Tab from last element of task N to checkbox of task N+1 | TaskList.test.tsx | 2 |
| Enter on task text span activates edit mode | TaskItem.test.tsx (exists) | 6 |
| Focus moves to next task after deletion | TaskList.test.tsx | 4 |
| Focus moves to input when last task deleted | TaskList.test.tsx | 4 |
| Focus ring classes present on all interactive elements | Per-component tests | 5 |

**Existing test count:** ~131 tests. All must continue passing.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.2]
- [Source: _bmad-output/project-context.md - Testing Rules, Component Architecture, Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md - Accessibility requirements, Focus indicators]
- [Source: _bmad-output/planning-artifacts/ux-design.md - Keyboard interaction patterns]
- [Source: _bmad-output/implementation-artifacts/4-1-responsive-layout.md - Previous story patterns]
- [Source: client/src/components/TaskItem.tsx - Current keyboard handling (lines 55-58, 101-114)]
- [Source: client/src/components/TaskList.tsx - Current focus-after-delete logic]
- [Source: client/src/components/TaskInput.tsx - Current auto-focus and focus ring classes]
- [Source: client/src/index.css - Design tokens including border-focus color]

### Git Intelligence

**Recent commits (Epic 4):**
- `c6252dd` Fix code review issues for story 4.1: undefined color token, test quality
- `3cb51c5` Implement story 4.1: Responsive layout with breakpoint spacing

**Patterns from 4.1:**
- Modify existing component classes (don't rewrite components)
- Create co-located test files for new test categories
- Fix issues found during code review (color tokens, test DRY patterns)
- Vitest setupFiles config is now correct (was fixed in 4.1)

### Previous Story Intelligence (4.1)

**Key learnings to apply:**
1. **Vitest setup is working** - `setupFiles: ['./src/test-setup.ts']` properly configured
2. **Color token bug** - `bg-surface-warm` was undefined, replaced with `bg-surface`. Always verify tokens exist in `index.css` before using.
3. **Test DRY pattern** - Use shared render helpers, avoid duplicated setup code
4. **JSDOM limitations** - CSS media queries don't respond to container width; test by asserting classes are applied, not computed styles
5. **Responsive classes** - Mobile-first with `md:` and `lg:` prefixes in JSX

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

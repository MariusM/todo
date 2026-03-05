# Story 2.3: Inline Editing

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want to edit a task's text inline by clicking on it,
so that I can fix typos without deleting and recreating (Kai's "algorithms assignment" correction).

## Acceptance Criteria

1. **Given** a task is displayed **When** I click/tap the task text (not the checkbox) **Then** the text becomes an inline editable input with a subtle border/background change **And** the current text is available for editing (FR3)

2. **Given** I am editing a task **When** I press Enter **Then** the edit is saved, the display returns to normal, and a PATCH request fires (FR3)

3. **Given** I am editing a task **When** I press Escape **Then** the edit is cancelled and the original text is restored

4. **Given** I am editing a task **When** I click outside the input (blur) **Then** the edit is saved (same as Enter)

5. **Given** I am editing a task **When** I clear all text and press Enter or blur **Then** the edit reverts to the original text — no destructive empty saves

6. **Given** a task with a very long description **When** it renders in the list **Then** the text wraps properly without breaking the layout (FR13)

## Tasks / Subtasks

- [x] Task 1: Add edit mode state and UI to TaskItem (AC: #1, #3)
  - [x] 1.1 Add local state: `isEditing` (boolean), `editText` (string)
  - [x] 1.2 When `isEditing` is false: render text as clickable `<span>` (existing behavior)
  - [x] 1.3 Click handler on text span sets `isEditing = true` and `editText = todo.text`
  - [x] 1.4 When `isEditing` is true: render `<input type="text">` replacing the text span
  - [x] 1.5 Input pre-filled with `editText`, auto-focused, cursor at end
  - [x] 1.6 Subtle visual indicator for edit mode: light background (`bg-surface-warm`/stone-50) + border (`border-border`)

- [x] Task 2: Add save/cancel keyboard and blur handlers (AC: #2, #3, #4, #5)
  - [x] 2.1 `onKeyDown` handler: Enter calls save, Escape calls cancel
  - [x] 2.2 `onBlur` handler: calls save (same as Enter)
  - [x] 2.3 Save logic: if `editText.trim()` is empty OR equals `todo.text`, revert to original (cancel). Otherwise call `onEdit(todo.id, editText.trim())`
  - [x] 2.4 Cancel logic: reset `isEditing = false`, discard `editText`
  - [x] 2.5 After save or cancel, `isEditing` returns to false

- [x] Task 3: Wire onEdit callback through component tree (AC: #2)
  - [x] 3.1 Add `onEdit: (id: string, text: string) => void` prop to TaskItem
  - [x] 3.2 Add `onEdit` prop to TaskList, pass through to each TaskItem
  - [x] 3.3 In App.tsx: pass `(id, text) => updateTodo(id, { text })` as `onEdit` to TaskList

- [x] Task 4: Handle long text wrapping (AC: #6)
  - [x] 4.1 Ensure text span uses `break-words` or `overflow-wrap: break-word` for long unbroken strings
  - [x] 4.2 Edit input should also handle long text gracefully (full width of available space)
  - [x] 4.3 Verify no layout shift between display mode and edit mode

- [x] Task 5: Tests (AC: #1, #2, #3, #4, #5, #6)
  - [x] 5.1 Create/update `TaskItem.test.tsx`: clicking text enters edit mode, shows input with current text
  - [x] 5.2 Test Enter saves and exits edit mode, calls onEdit with trimmed text
  - [x] 5.3 Test Escape cancels and exits edit mode without calling onEdit
  - [x] 5.4 Test blur saves (same as Enter)
  - [x] 5.5 Test empty text on save reverts to original (no onEdit call)
  - [x] 5.6 Test unchanged text on save does not call onEdit (no-op optimization)
  - [x] 5.7 Update `TaskList.test.tsx`: passes onEdit to each TaskItem
  - [x] 5.8 Verify ALL existing tests still pass (127 tests, zero regressions)

## Dev Notes

### Architecture Compliance

**This is the second frontend UI story in Epic 2.** It enhances the TaskItem component to support inline text editing. The PATCH API, `updateTodo` hook method, and optimistic update logic already exist — this story only adds the edit interaction layer in TaskItem.

**What already exists (DO NOT recreate):**

| Module | Location | Already has |
|--------|----------|-------------|
| `updateTodo(id, fields)` | `client/src/hooks/useOptimisticTodos.ts` | Optimistic text update with rollback — calls PATCH API, uses `todosRef` for stale-closure-safe rollback |
| `UpdateTodoRequest` | `client/src/types/todo.ts` | `{ text?: string; completed?: boolean }` — text field already supported |
| `updateTodo` API function | `client/src/api/todos.ts` | PATCH `/api/todos/:id` with JSON body |
| PATCH route handler | `server/src/routes/todo-routes.ts` | Validates non-empty text, updates DB, returns camelCase response |
| `validate-todo.ts` | `server/src/middleware/validate-todo.ts` | Server-side empty text validation with `req.body` guard |
| TaskItem component | `client/src/components/TaskItem.tsx` | Checkbox toggle + completion styling + 44x44px touch target (must ADD edit mode) |
| TaskList component | `client/src/components/TaskList.tsx` | Renders TaskItem with `onToggle` (must ADD `onEdit` prop pass-through) |
| App.tsx | `client/src/App.tsx` | Destructures `updateTodo` from hook (must wire as `onEdit` to TaskList) |
| CSS design tokens | `client/src/index.css` | `--color-surface-warm` (stone-50), `--color-border`, `--color-border-focus`, `--color-text-primary` |

### Implementation Pattern

**TaskItem edit mode additions:**
```tsx
// Add to TaskItem.tsx
const [isEditing, setIsEditing] = useState(false);
const [editText, setEditText] = useState('');
const inputRef = useRef<HTMLInputElement>(null);

// Enter edit mode
const handleTextClick = () => {
  setIsEditing(true);
  setEditText(todo.text);
};

// Save edit
const handleSave = () => {
  const trimmed = editText.trim();
  if (trimmed && trimmed !== todo.text) {
    onEdit(todo.id, trimmed);
  }
  setIsEditing(false);
};

// Cancel edit
const handleCancel = () => {
  setIsEditing(false);
};

// Keyboard handler
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') handleSave();
  if (e.key === 'Escape') handleCancel();
};

// Auto-focus input when entering edit mode
useEffect(() => {
  if (isEditing && inputRef.current) {
    inputRef.current.focus();
    // Place cursor at end
    const len = inputRef.current.value.length;
    inputRef.current.setSelectionRange(len, len);
  }
}, [isEditing]);
```

**Edit mode rendering (replace text span conditionally):**
```tsx
{isEditing ? (
  <input
    ref={inputRef}
    type="text"
    value={editText}
    onChange={(e) => setEditText(e.target.value)}
    onKeyDown={handleKeyDown}
    onBlur={handleSave}
    className="flex-1 px-2 py-1 bg-surface-warm border border-border rounded
               text-text-primary focus:outline-none focus:border-border-focus
               transition-colors duration-150"
    aria-label={`Edit task: ${todo.text}`}
  />
) : (
  <span
    onClick={handleTextClick}
    className={`flex-1 cursor-text break-words transition-all duration-200 ${
      todo.completed
        ? 'line-through text-completed-text'
        : 'text-text-primary'
    }`}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTextClick(); }}
    aria-label={`Edit task: ${todo.text}`}
  >
    {todo.text}
  </span>
)}
```

**Props update:**
```tsx
interface TaskItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (id: string, text: string) => void;  // NEW
}
```

**App.tsx wiring:**
```tsx
// Current: <TaskList todos={todos} isLoading={isLoading} onToggle={...} />
// Add: onEdit={(id, text) => updateTodo(id, { text })}
```

### UX Design Requirements

From the UX spec (inline editing interaction):
- **Trigger:** Click/tap on task text (NOT the checkbox)
- **Visual indicator:** Subtle background change or border on the input (use `bg-surface-warm` stone-50 + `border-border`)
- **Pre-filled:** Current text, cursor at end (not selected)
- **Save:** Enter key or blur (click outside)
- **Cancel:** Escape key
- **Empty protection:** Empty or whitespace-only text reverts to original — no destructive saves
- **No layout shift:** Edit input should match the visual size/position of the display text
- **Long text:** Wraps naturally with `break-words` — no truncation, no ellipsis
- **Completed tasks:** Can also be edited (edit mode still works on completed items)
- **Focus flow:** After saving/canceling, return to display mode (text span)

### Data Flow for Edit

```
User clicks text span → handleTextClick()
  → setIsEditing(true), setEditText(todo.text)
  → Input renders, auto-focuses, cursor at end
User types new text → setEditText(newValue)
User presses Enter (or blurs) → handleSave()
  → If trimmed text empty OR unchanged → cancel (no API call)
  → If text changed → onEdit(id, trimmedText)
    → App passes to updateTodo(id, { text: trimmedText })
      → useOptimisticTodos.updateTodo():
        1. Store original via todosRef
        2. Optimistically update text + updatedAt in local state
        3. Fire PATCH /api/todos/:id { text: trimmedText }
        4. On success: no-op (UI already correct)
        5. On failure: restore original via functional rollback
  → setIsEditing(false)
```

### Testing Requirements

- **Co-locate tests** with source: `TaskItem.test.tsx` next to `TaskItem.tsx`
- **Component tests with Vitest + @testing-library/react** (already set up)
- **Key test cases for TaskItem inline editing:**
  - Clicking text enters edit mode (shows input)
  - Input is pre-filled with current todo text
  - Enter key saves and exits edit mode, calls onEdit
  - Escape key cancels edit mode, does NOT call onEdit
  - Blur saves edit (same as Enter)
  - Empty text on save reverts to original, does NOT call onEdit
  - Unchanged text on save does NOT call onEdit
  - Checkbox click does NOT trigger edit mode
  - Completed tasks can enter edit mode
- **TaskList test updates:**
  - Passes `onEdit` prop to each TaskItem
- **Regression check:** All 127 existing tests must still pass

### Previous Story Intelligence (2.2)

**Code review lessons from story 2.2 (MUST follow):**
- Fixed stale closure race condition: `updateTodo`/`removeTodo` in `useOptimisticTodos` now use `todosRef` instead of closure-captured `todos` — already fixed, no action needed
- Added 44x44px touch target via label wrapper on checkbox — maintain this pattern
- Fixed inconsistent dynamic import in `TaskList.test.tsx` — use consistent import pattern
- Added App-level integration test — consider adding one for edit flow too

**Patterns established in 2.2:**
- TaskItem uses `appearance-none` custom checkbox with CSS `::after` for checkmark
- Conditional class application pattern: `${todo.completed ? 'completed-classes' : 'active-classes'}`
- `transition-all duration-200` for smooth state changes
- All 127 tests pass — maintain this

**Files modified in 2.2 code review fixes (commit ae0704d):**
- `useOptimisticTodos.ts` — stale closure fix (todosRef)
- `TaskItem.tsx` — 44x44px touch target via label wrapper
- `TaskList.test.tsx` — fixed dynamic import inconsistency
- `App.test.tsx` — added toggle integration test

### Git Intelligence

Recent commits show consistent patterns:
- Story implementation commits: `Implement story X.Y: [title]`
- Code review fix commits: `Fix code review issues for story X.Y`
- Story specs committed before implementation
- Tests included in implementation commits, not separate

### Scope Boundaries — What This Story Does NOT Include

- **No delete button** — the x delete control comes in story 2.4
- **No ErrorBanner** — error display for failed edits comes in Epic 3
- **No keyboard navigation** — Tab order and focus management come in Epic 4
- **No animations** — entry/exit animations for edit mode are not specified; keep transitions simple (color/border only)

This story ONLY adds: click-to-edit inline text editing in TaskItem with Enter/Escape/blur save-cancel mechanics.

### Project Structure Notes

**Files to MODIFY:**

| File | Changes |
|------|---------|
| `client/src/components/TaskItem.tsx` | Add edit mode state, input rendering, keyboard/blur handlers, `onEdit` prop |
| `client/src/components/TaskItem.test.tsx` | Add inline editing tests (~7-9 new test cases) |
| `client/src/components/TaskList.tsx` | Add `onEdit` prop, pass through to TaskItem |
| `client/src/components/TaskList.test.tsx` | Update tests for onEdit prop pass-through |
| `client/src/App.tsx` | Wire `onEdit` callback to TaskList using `updateTodo` |

**No new files needed.** All changes are modifications to existing components.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Specifications — TaskItem]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 4: Edit & Delete]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Experience Mechanics — Interaction 3: Editing a Task]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/implementation-artifacts/2-2-task-completion-visual-distinction.md#Dev Notes]
- [Source: client/src/hooks/useOptimisticTodos.ts — updateTodo method with todosRef]
- [Source: client/src/components/TaskItem.tsx — current component to enhance]
- [Source: client/src/components/TaskList.tsx — needs onEdit prop]
- [Source: client/src/App.tsx — needs onEdit wiring]
- [Source: client/src/index.css — existing design tokens for edit mode styling]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered. All tests passed on first run.

### Completion Notes List

- Implemented inline editing in TaskItem with useState for `isEditing`/`editText` and useRef+useEffect for auto-focus with cursor-at-end
- Added Enter (save), Escape (cancel), and blur (save) handlers following the exact data flow specified in Dev Notes
- Empty/whitespace-only text and unchanged text both revert without calling onEdit (no destructive saves, no unnecessary API calls)
- Wired `onEdit` prop through TaskItem -> TaskList -> App.tsx, connecting to existing `updateTodo(id, { text })` from useOptimisticTodos hook
- Text span uses `break-words` class for long text wrapping; edit input uses `flex-1` for full-width and `break-words`
- Added `role="button"`, `tabIndex={0}`, and keyboard handler on text span for accessibility
- 8 new inline editing test cases in TaskItem.test.tsx + 1 new onEdit pass-through test in TaskList.test.tsx
- All 137 tests pass (127 existing + 10 new), zero regressions

### Change Log

- 2026-03-05: Implemented story 2.3 inline editing - added click-to-edit with Enter/Escape/blur save-cancel mechanics
- 2026-03-05: Code review fixes - added skipBlurRef guard to prevent double-fire on Enter/Escape, fixed layout shift with matching invisible padding on text span, removed dead break-words from input, added toHaveBeenCalledTimes assertions and 3 new tests (auto-focus, keyboard entry, Escape guard)

### File List

- client/src/components/TaskItem.tsx (modified: added edit mode state, input rendering, keyboard/blur handlers, onEdit prop; review fix: skipBlurRef guard, layout shift fix, removed dead break-words)
- client/src/components/TaskItem.test.tsx (modified: added 11 inline editing test cases including auto-focus, keyboard entry, and Escape guard tests)
- client/src/components/TaskList.tsx (modified: added onEdit prop, pass-through to TaskItem)
- client/src/components/TaskList.test.tsx (modified: added onEdit prop to all renders, added onEdit pass-through test)
- client/src/App.tsx (modified: wired onEdit callback to TaskList)

# Story 2.2: Task Completion & Visual Distinction

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want to mark tasks complete and see them visually distinct from active tasks,
so that I can track my progress at a glance (Kai's daily use).

## Acceptance Criteria

1. **Given** an active todo is displayed **When** I click/tap the checkbox **Then** the checkbox fills with accent blue (#2563EB) with a white checkmark **And** the task text gets strikethrough and muted color (#A8A29E) **And** the transition animates over ~200ms (FR4, FR7, FR19) **And** a PATCH request fires in the background

2. **Given** a completed todo is displayed **When** I click/tap the checkbox **Then** it toggles back to active state with the same animation in reverse (FR5)

3. **Given** a task is completed **When** I refresh the browser **Then** the completion status persists — the task is still shown as completed (FR9)

4. **Given** active and completed tasks exist **When** I view the task list **Then** completed tasks are visually distinct at a glance — strikethrough + muted color vs. normal text (FR7)

## Tasks / Subtasks

- [ ] Task 1: Create TaskItem component (AC: #1, #2, #4)
  - [ ] 1.1 Create `client/src/components/TaskItem.tsx` with props: `todo: Todo`, `onToggle: (id: string, completed: boolean) => void`
  - [ ] 1.2 Render checkbox (`<input type="checkbox">`) + task text `<span>`
  - [ ] 1.3 Checkbox `onChange` calls `onToggle(todo.id, !todo.completed)`
  - [ ] 1.4 When `todo.completed` is true: apply strikethrough (`line-through`) + muted text color (`text-completed-text` / #A8A29E)
  - [ ] 1.5 When `todo.completed` is false: normal text styling (`text-text-primary` / #1C1917)
  - [ ] 1.6 Checkbox when checked: accent blue fill (`bg-checkbox-fill` / #2563EB) with white checkmark
  - [ ] 1.7 Add ~200ms CSS transition on text color, text-decoration, and checkbox background (`transition-all duration-200`)
  - [ ] 1.8 Checkbox must be a custom-styled element (not browser default) — use Tailwind's `appearance-none` + custom checked styles

- [ ] Task 2: Integrate TaskItem into TaskList (AC: #1, #2, #4)
  - [ ] 2.1 Refactor `TaskList.tsx`: replace inline todo rendering with `<TaskItem>` component
  - [ ] 2.2 Pass `onToggle` prop through TaskList that calls `updateTodo(id, { completed })`
  - [ ] 2.3 Remove the `readOnly` checkbox and inline span from TaskList
  - [ ] 2.4 Preserve existing list structure (`<ul>` with `<li>` items)

- [ ] Task 3: Wire updateTodo in App.tsx (AC: #1, #2, #3)
  - [ ] 3.1 Destructure `updateTodo` from `useOptimisticTodos()` in App.tsx
  - [ ] 3.2 Pass `updateTodo` to TaskList as `onUpdateTodo` prop
  - [ ] 3.3 TaskList passes toggle handler to each TaskItem

- [ ] Task 4: Tests (AC: #1, #2, #3, #4)
  - [ ] 4.1 Create `client/src/components/TaskItem.test.tsx`: renders text, renders checkbox checked/unchecked, calls onToggle on click, applies completed styles (strikethrough + muted), applies active styles (no strikethrough + primary color)
  - [ ] 4.2 Update `client/src/components/TaskList.test.tsx`: renders TaskItem for each todo, passes onToggle to TaskItem
  - [ ] 4.3 Verify ALL existing tests still pass (no regressions)

## Dev Notes

### Architecture Compliance

**This is the FIRST frontend UI story in Epic 2.** It creates the TaskItem component and connects the `updateTodo` hook method (added in story 2.1) to the UI. The PATCH API endpoint and optimistic update logic already exist — this story only adds the visual layer.

**What already exists (DO NOT recreate):**

| Module | Location | Already has |
|--------|----------|-------------|
| `updateTodo(id, fields)` | `client/src/hooks/useOptimisticTodos.ts` | Optimistic toggle with rollback — calls PATCH API |
| `UpdateTodoRequest` | `client/src/types/todo.ts` | `{ text?: string; completed?: boolean }` |
| `updateTodo` API function | `client/src/api/todos.ts` | PATCH `/api/todos/:id` with JSON body |
| PATCH route handler | `server/src/routes/todo-routes.ts` | Validates, updates DB, returns camelCase response |
| CSS design tokens | `client/src/index.css` | `--color-completed-text: #A8A29E`, `--color-checkbox-fill: #2563EB`, `--color-text-primary: #1C1917` |
| TaskList component | `client/src/components/TaskList.tsx` | Renders todo list with **read-only** checkboxes (must refactor) |
| App.tsx | `client/src/App.tsx` | Uses hook but only destructures `todos`, `isLoading`, `addTodo` (need to add `updateTodo`) |

### Implementation Pattern

**TaskItem component structure:**
```tsx
// client/src/components/TaskItem.tsx
interface TaskItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
}

export default function TaskItem({ todo, onToggle }: TaskItemProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id, !todo.completed)}
        className="h-5 w-5 appearance-none rounded border-2 border-border
                   checked:bg-checkbox-fill checked:border-checkbox-fill
                   transition-all duration-200 cursor-pointer
                   relative shrink-0"
        aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      <span className={`transition-all duration-200 ${
        todo.completed
          ? 'line-through text-completed-text'
          : 'text-text-primary'
      }`}>
        {todo.text}
      </span>
    </li>
  );
}
```

**Custom checkbox styling with Tailwind (CSS approach for the checkmark):**
Add a CSS rule for the checked checkmark using `::after` pseudo-element or use an SVG checkmark. The recommended approach is CSS `::after` with a checkmark character or SVG background image on checked state:
```css
/* In index.css — add after existing styles */
input[type="checkbox"]:checked::after {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}
```

**Wiring in App.tsx:**
```tsx
// Current: const { todos, isLoading, addTodo } = useOptimisticTodos();
// Change to: const { todos, isLoading, addTodo, updateTodo } = useOptimisticTodos();
// Pass updateTodo to TaskList
```

**TaskList refactor:**
```tsx
// Replace inline rendering:
//   <li><input readOnly .../><span>...</span></li>
// With:
//   <TaskItem todo={todo} onToggle={onToggle} />
```

### UX Design Requirements

From the UX spec (Classic Minimal — paper checklist metaphor):
- **Checkbox unchecked:** Empty circle/square with border, `border-border` color
- **Checkbox checked:** Filled with accent blue `#2563EB`, white checkmark inside
- **Text active:** `#1C1917` (text-primary), no decoration
- **Text completed:** `#A8A29E` (completed-text), `line-through` text decoration
- **Transition:** ~200ms on all state changes (both check and uncheck)
- **Touch target:** Checkbox should be minimum 44x44px touch area on mobile (use padding or min-w/min-h)
- **Cursor:** `cursor-pointer` on checkbox

### Data Flow for Toggle

```
User clicks checkbox → TaskItem.onToggle(id, !completed)
  → TaskList passes to App's updateTodo(id, { completed: !completed })
    → useOptimisticTodos.updateTodo():
      1. Snapshot current todos
      2. Optimistically flip completed in local state
      3. Fire PATCH /api/todos/:id { completed: newValue }
      4. On success: no-op (UI already correct)
      5. On failure: restore snapshot + add error to errors array
```

### Testing Requirements

- **Co-locate tests** with source: `TaskItem.test.tsx` next to `TaskItem.tsx`
- **Component tests with Vitest + @testing-library/react** (already set up)
- **Key test cases for TaskItem:**
  - Renders todo text correctly
  - Checkbox is checked when `todo.completed` is true
  - Checkbox is unchecked when `todo.completed` is false
  - Calls `onToggle` with correct args when checkbox clicked
  - Applies `line-through` class when completed
  - Does NOT apply `line-through` class when active
  - Applies muted text color when completed
  - Has accessible label on checkbox
- **Key test cases for TaskList update:**
  - Renders TaskItem components (not inline elements)
  - Passes `onToggle` prop to each TaskItem

### Previous Story Intelligence (2.1)

**Code review lessons from story 2.1 (MUST follow):**
- Move API side effects out of `setState` updater functions
- Use item-level functional rollback with optimistic updatedAt refresh
- Handle non-JSON error responses in API client
- Trim text in hook before storing/sending to API
- Don't use non-null assertions — throw explicit errors
- Don't catch errors silently — always log or re-throw

**Patterns established in 2.1:**
- `updateTodo` hook method already uses snapshot → optimistic update → API → rollback pattern
- `extractErrorMessage` helper in hook for DRY error parsing
- All 116 existing tests pass — maintain this

**Files modified in 2.1 code review fixes (commit 3672e1a):**
- `useOptimisticTodos.ts` — refactored to use item-level functional rollback with optimistic updatedAt
- `validate-todo.ts` — added req.body guard
- `todo-routes.test.ts` — fixed updated_at timestamp assertion

### Scope Boundaries — What This Story Does NOT Include

- **No inline editing** — clicking task text to edit comes in story 2.3
- **No delete button** — the × delete control comes in story 2.4
- **No ErrorBanner** — error display comes in Epic 3
- **No animations for add/delete** — visual feedback for create/delete comes in story 2.4
- **No keyboard navigation** — Tab order and focus management come in Epic 4

This story ONLY adds: checkbox toggle + completed visual styling + TaskItem component extraction.

### Project Structure Notes

**Files to CREATE:**

| File | Purpose |
|------|---------|
| `client/src/components/TaskItem.tsx` | New TaskItem component with checkbox + completion styling |
| `client/src/components/TaskItem.test.tsx` | TaskItem component tests |

**Files to MODIFY:**

| File | Changes |
|------|---------|
| `client/src/App.tsx` | Destructure `updateTodo` from hook, pass to TaskList |
| `client/src/components/TaskList.tsx` | Replace inline rendering with TaskItem, accept + pass onToggle prop |
| `client/src/components/TaskList.test.tsx` | Update tests for TaskItem rendering |
| `client/src/index.css` | Add checkbox checked checkmark CSS (::after pseudo-element) |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Specifications]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/implementation-artifacts/2-1-todo-rest-api-update-delete.md#Dev Notes]
- [Source: client/src/hooks/useOptimisticTodos.ts — updateTodo method]
- [Source: client/src/components/TaskList.tsx — current inline rendering to refactor]
- [Source: client/src/App.tsx — current hook usage]
- [Source: client/src/index.css — existing design tokens]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

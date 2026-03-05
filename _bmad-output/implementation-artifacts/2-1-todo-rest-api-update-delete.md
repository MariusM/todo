# Story 2.1: Todo REST API — Update & Delete

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want to update and delete todos via the API,
so that I can manage my tasks fully.

## Acceptance Criteria

1. **Given** a todo exists with id "abc-123" **When** I send PATCH `/api/todos/abc-123` with `{ text: "Updated text" }` **Then** I receive 200 with the updated todo (camelCase fields, updated_at refreshed) (FR3, FR27) **And** other fields remain unchanged

2. **Given** a todo exists with id "abc-123" **When** I send PATCH `/api/todos/abc-123` with `{ completed: true }` **Then** I receive 200 with the todo showing completed: true (FR4, FR9) **And** updated_at is refreshed

3. **Given** a completed todo exists **When** I send PATCH with `{ completed: false }` **Then** the todo is toggled back to active (FR5)

4. **Given** a todo exists with id "abc-123" **When** I send DELETE `/api/todos/abc-123` **Then** I receive 204 with no body (FR6) **And** the todo is permanently removed from the database

5. **Given** no todo exists with id "nonexistent" **When** I send PATCH or DELETE to `/api/todos/nonexistent` **Then** I receive 404 with `{ error: { message: "Todo not found", code: "NOT_FOUND" } }` (FR28)

6. **Given** a PATCH request with empty text **When** the server validates the input **Then** I receive 400 with VALIDATION_ERROR (FR12)

7. **Given** any CRUD operation completes **When** I check the database state **Then** data is consistent — no partial updates, no orphaned records (FR11)

## Tasks / Subtasks

- [ ] Task 1: Add PATCH /api/todos/:id route (AC: #1, #2, #3, #5, #6, #7)
  - [ ] 1.1 Add PATCH route handler in `server/src/routes/todo-routes.ts`
  - [ ] 1.2 Validate `:id` param is valid UUID format
  - [ ] 1.3 Validate request body: at least one of `text` or `completed` must be present
  - [ ] 1.4 If `text` provided: must be non-empty after trim, sanitize against XSS (same as POST)
  - [ ] 1.5 If `completed` provided: must be boolean
  - [ ] 1.6 Call `queries.updateTodo(id, fields)` — this function already exists and handles partial updates
  - [ ] 1.7 If `updateTodo` returns undefined (not found): throw AppError with 404 NOT_FOUND
  - [ ] 1.8 Transform snake_case DB result to camelCase response
  - [ ] 1.9 Return 200 with updated todo

- [ ] Task 2: Add DELETE /api/todos/:id route (AC: #4, #5, #7)
  - [ ] 2.1 Add DELETE route handler in `server/src/routes/todo-routes.ts`
  - [ ] 2.2 Validate `:id` param is valid UUID format
  - [ ] 2.3 Call `queries.deleteTodo(id)` — this function already exists and returns boolean
  - [ ] 2.4 If `deleteTodo` returns false (not found): throw AppError with 404 NOT_FOUND
  - [ ] 2.5 Return 204 with no body

- [ ] Task 3: Add validation middleware for update (AC: #1, #5, #6)
  - [ ] 3.1 Add `validateUpdateTodo` middleware in `server/src/middleware/validate-todo.ts`
  - [ ] 3.2 Validate `:id` is valid UUID (reuse UUID regex from `validateCreateTodo`)
  - [ ] 3.3 Validate body has at least one field (`text` or `completed`)
  - [ ] 3.4 If `text` present: non-empty after trim
  - [ ] 3.5 If `completed` present: must be boolean type
  - [ ] 3.6 Throw AppError with 400 VALIDATION_ERROR on failure

- [ ] Task 4: Add validation for delete (AC: #5)
  - [ ] 4.1 Add `validateTodoId` middleware in `server/src/middleware/validate-todo.ts`
  - [ ] 4.2 Validate `:id` param is valid UUID format
  - [ ] 4.3 Reuse across PATCH and DELETE routes (DRY)

- [ ] Task 5: Add updateTodo and deleteTodo to API client (AC: all)
  - [ ] 5.1 Add `updateTodo(id, fields): Promise<Todo>` in `client/src/api/todos.ts`
  - [ ] 5.2 PATCH /api/todos/:id with JSON body `{ text?, completed? }`
  - [ ] 5.3 Add `deleteTodo(id): Promise<void>` in `client/src/api/todos.ts`
  - [ ] 5.4 DELETE /api/todos/:id, expect 204 (no body to parse)
  - [ ] 5.5 Error handling: use existing `handleResponse` pattern for PATCH; for DELETE, check `response.ok` and throw on failure

- [ ] Task 6: Add updateTodo and deleteTodo to useOptimisticTodos hook (AC: all)
  - [ ] 6.1 Add `updateTodo(id, fields)` method to `useOptimisticTodos` hook
  - [ ] 6.2 Optimistic pattern: snapshot todos → apply update locally → fire PATCH → on failure: restore snapshot + add error
  - [ ] 6.3 Add `deleteTodo(id)` method to `useOptimisticTodos` hook
  - [ ] 6.4 Optimistic pattern: snapshot todos → remove from local state → fire DELETE → on failure: restore snapshot + add error
  - [ ] 6.5 Return new methods from hook: `{ todos, isLoading, errors, addTodo, updateTodo, deleteTodo }`

- [ ] Task 7: Tests (AC: all)
  - [ ] 7.1 Add PATCH route tests in `server/src/routes/todo-routes.test.ts`: update text, update completed, toggle back, partial update (only text), partial update (only completed), empty text rejected, not found 404, invalid UUID 400
  - [ ] 7.2 Add DELETE route tests in `server/src/routes/todo-routes.test.ts`: successful delete 204, not found 404, invalid UUID 400
  - [ ] 7.3 Add validation middleware tests in `server/src/middleware/validate-todo.test.ts`: validateUpdateTodo (valid text, valid completed, both, missing fields, empty text, non-boolean completed), validateTodoId (valid UUID, invalid UUID)
  - [ ] 7.4 Add API client tests in `client/src/api/todos.test.ts`: updateTodo success, updateTodo error, deleteTodo success, deleteTodo 404 error
  - [ ] 7.5 Add hook tests in `client/src/hooks/useOptimisticTodos.test.ts`: updateTodo optimistic update, updateTodo rollback on failure, deleteTodo optimistic remove, deleteTodo rollback on failure
  - [ ] 7.6 Verify ALL existing tests still pass (no regressions)

## Dev Notes

### Architecture Compliance

**This is the first Epic 2 story.** It extends the existing REST API with PATCH and DELETE endpoints. The database layer (`queries.ts`) already has `updateTodo()` and `deleteTodo()` functions — you MUST use them, do NOT recreate query logic.

**What already exists (DO NOT recreate):**

| Module | Location | Already has |
|--------|----------|-------------|
| `queries.updateTodo(id, fields)` | `server/src/db/queries.ts` | Handles `text`, `completed`, or both; returns updated todo or undefined |
| `queries.deleteTodo(id)` | `server/src/db/queries.ts` | Returns boolean (true = deleted, false = not found) |
| `queries.getTodoById(id)` | `server/src/db/queries.ts` | Available if needed for existence checks |
| `AppError` class | `server/src/middleware/error-handler.ts` | `new AppError(message, statusCode, code)` — use for 400/404 errors |
| `validateCreateTodo` | `server/src/middleware/validate-todo.ts` | UUID regex pattern to reuse: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` |
| `sanitizeHtml()` | `server/src/routes/todo-routes.ts` | HTML entity escaping function — reuse for PATCH text updates |
| `toCamelCase()` | `server/src/routes/todo-routes.ts` | snake_case → camelCase transformer — reuse for PATCH response |
| `handleResponse<T>()` | `client/src/api/todos.ts` | Generic response handler — reuse for PATCH response parsing |
| `addTodo()` pattern | `client/src/hooks/useOptimisticTodos.ts` | Snapshot → optimistic update → API call → rollback pattern to follow |

### Server-Side Implementation Pattern

**PATCH route handler pattern (follow existing POST handler style):**
```
router.patch('/:id', validateUpdateTodo, validateTodoId, (req, res, next) => {
  try {
    // Sanitize text if provided (same sanitizeHtml as POST)
    // Call queries.updateTodo(id, fields)
    // If undefined returned → throw AppError(404, NOT_FOUND)
    // Transform result with toCamelCase()
    // Return 200 with updated todo
  } catch (error) {
    next(error);
  }
});
```

**DELETE route handler pattern:**
```
router.delete('/:id', validateTodoId, (req, res, next) => {
  try {
    // Call queries.deleteTodo(id)
    // If false returned → throw AppError(404, NOT_FOUND)
    // Return 204 with no body: res.status(204).send()
  } catch (error) {
    next(error);
  }
});
```

**IMPORTANT:** The route handlers use a factory pattern — `createTodoRoutes(queries)` receives the queries object as a dependency. Follow this pattern exactly.

### Client-Side Implementation Pattern

**API client — follow existing `createTodo` pattern:**
```typescript
// In client/src/api/todos.ts
export async function updateTodo(id: string, fields: UpdateTodoRequest): Promise<Todo> {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  return handleResponse<Todo>(response);
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    // Parse error body for non-204 responses
    const body = await response.json();
    throw { error: body.error };
  }
  // 204 = success, no body to parse
}
```

**Hook — follow existing `addTodo` snapshot-rollback pattern:**
```typescript
// In useOptimisticTodos — updateTodo method
const updateTodo = async (id: string, fields: UpdateTodoRequest) => {
  const snapshot = [...todos];
  // Apply optimistic update
  setTodos(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t));
  try {
    await apiUpdateTodo(id, fields);
  } catch (error) {
    setTodos(snapshot); // Rollback
    setErrors(prev => [...prev, { message: '...', action: 'update' }]);
  }
};
```

### Type Additions Required

**Add to `client/src/types/todo.ts`:**
```typescript
export interface UpdateTodoRequest {
  text?: string;
  completed?: boolean;
}
```

**Add to `server/src/types/todo.ts`:**
```typescript
export interface UpdateTodoRequest {
  text?: string;
  completed?: boolean;
}
```

### Data Transformation Boundary

- Server PATCH handler receives camelCase from client (`{ text, completed }`)
- `queries.updateTodo()` already handles the logic — it accepts `{ text?, completed? }` and builds the appropriate SQL
- The DB stores `completed` as INTEGER (0/1) — `queries.ts` already handles boolean → integer conversion
- Response must go through `toCamelCase()` to transform `created_at` → `createdAt`, `updated_at` → `updatedAt`
- `completed` in DB is INTEGER — the `toCamelCase` transformer already handles `completed: 0|1` → `completed: true|false`

### Testing Requirements

- **Co-locate tests** with source files
- **Server route tests:** Use real SQLite (in-memory) — follow existing test pattern in `todo-routes.test.ts`
- **Server middleware tests:** Unit test validators with mock req/res/next — follow existing `validate-todo.test.ts` pattern
- **Client API tests:** Mock `fetch` — follow existing `todos.test.ts` pattern
- **Client hook tests:** Mock API module — follow existing `useOptimisticTodos.test.ts` pattern
- **No `__tests__/` directories** — tests live beside source files

### Scope Boundaries — What This Story Does NOT Include

- **No frontend UI for update/delete** — TaskItem component with checkbox, inline edit, delete button comes in stories 2.2-2.4
- **No ErrorBanner** — that's Epic 3
- **No optimistic UI wiring to components** — the hook methods are added but not connected to UI yet
- **No visual feedback/animations** — that's story 2.4
- **No completion styling** — that's story 2.2

This story adds the API endpoints and client-side API/hook plumbing. The UI layer connects in subsequent stories.

### Project Structure Notes

**Files to MODIFY (extend existing):**

| File | Changes |
|------|---------|
| `server/src/routes/todo-routes.ts` | Add PATCH /:id and DELETE /:id route handlers |
| `server/src/routes/todo-routes.test.ts` | Add PATCH and DELETE test cases |
| `server/src/middleware/validate-todo.ts` | Add `validateUpdateTodo` and `validateTodoId` middleware |
| `server/src/middleware/validate-todo.test.ts` | Add update and ID validation tests |
| `client/src/api/todos.ts` | Add `updateTodo()` and `deleteTodo()` functions |
| `client/src/api/todos.test.ts` | Add update and delete API client tests |
| `client/src/hooks/useOptimisticTodos.ts` | Add `updateTodo()` and `deleteTodo()` methods |
| `client/src/hooks/useOptimisticTodos.test.ts` | Add update/delete optimistic + rollback tests |
| `client/src/types/todo.ts` | Add `UpdateTodoRequest` type |
| `server/src/types/todo.ts` | Add `UpdateTodoRequest` type |

**No new files needed** — all changes extend existing modules.

### Previous Story Intelligence (1.4)

**Patterns established in Epic 1 that MUST be followed:**
- Factory pattern for routes: `createTodoRoutes(queries)` — add new routes inside this factory
- `sanitizeHtml()` for XSS protection on text input — reuse for PATCH text updates
- `toCamelCase()` for DB → API response transformation — reuse for PATCH responses
- `handleResponse<T>()` in API client — reuse for PATCH response parsing
- Optimistic snapshot-rollback pattern in hook: snapshot → update → API → rollback on failure

**Code review lessons from Epic 1:**
- Move API side effects out of `setState` updater functions
- Use ID-based filtering for rollback (not full snapshot restore for add operations) — for delete rollback, full snapshot restore IS correct since the item was removed
- Handle non-JSON error responses in API client
- Trim text in hook before storing/sending to API
- Don't use non-null assertions — throw explicit errors
- Don't catch errors silently — always log or re-throw

### Git Intelligence

**Recent commits showing conventions:**
- `f2a475a` Complete Epic 1 retrospective and update sprint status
- `4e0e1d1` Fix code review issues for story 1.4
- `bb0060b` Implement story 1.4: Frontend empty state, loading state & task creation UI

**Commit message convention:** "Implement story X.Y: [description]"

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/project-context.md#API Response Format]
- [Source: _bmad-output/implementation-artifacts/1-4-frontend-empty-state-loading-state-task-creation-ui.md#Dev Notes]
- [Source: server/src/routes/todo-routes.ts — existing route factory pattern]
- [Source: server/src/db/queries.ts — existing updateTodo, deleteTodo functions]
- [Source: server/src/middleware/validate-todo.ts — existing UUID validation regex]
- [Source: client/src/api/todos.ts — existing handleResponse pattern]
- [Source: client/src/hooks/useOptimisticTodos.ts — existing optimistic pattern]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

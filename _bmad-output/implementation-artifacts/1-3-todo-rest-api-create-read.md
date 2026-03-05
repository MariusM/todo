# Story 1.3: Todo REST API — Create & Read

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want to create and view todos via the API,
so that my tasks are stored and retrievable.

## Acceptance Criteria

1. **Given** no todos exist **When** I send POST `/api/todos` with `{ id: "<uuid>", text: "Buy milk" }` **Then** I receive 201 with the created todo including id, text, completed (false), createdAt, updatedAt in camelCase (FR1, FR27) **And** the todo is persisted in the database with snake_case columns

2. **Given** todos exist in the database **When** I send GET `/api/todos` **Then** I receive 200 with an array of all todos ordered by created_at (FR2, FR27) **And** each todo has camelCase fields (id, text, completed, createdAt, updatedAt)

3. **Given** a create request **When** the text is empty or whitespace-only **Then** I receive 400 with `{ error: { message: "Todo text cannot be empty", code: "VALIDATION_ERROR" } }` (FR12, FR28)

4. **Given** a create request **When** the id is not a valid UUID format **Then** I receive 400 with a VALIDATION_ERROR response

5. **Given** a todo is created **When** I check its created_at field **Then** it contains a valid ISO 8601 timestamp (FR10)

## Tasks / Subtasks

- [ ] Task 1: Input validation middleware (AC: #3, #4)
  - [ ] 1.1 Create `server/src/middleware/validate-todo.ts` — validate POST body for `id` (valid UUID) and `text` (non-empty after trim)
  - [ ] 1.2 Validate UUID format using regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
  - [ ] 1.3 Validate text is present and non-empty after `.trim()` — reject whitespace-only strings
  - [ ] 1.4 Throw `AppError` with 400 status and `VALIDATION_ERROR` code for all validation failures
  - [ ] 1.5 Export as Express middleware function `validateCreateTodo` that can be used on individual routes

- [ ] Task 2: Todo routes — Create & Read (AC: #1, #2, #5)
  - [ ] 2.1 Create `server/src/routes/todo-routes.ts` using Express `Router()`
  - [ ] 2.2 Implement `POST /api/todos` — call `validateCreateTodo` middleware, then `createTodo(id, text)` from queries, return 201 with created todo
  - [ ] 2.3 Implement `GET /api/todos` — call `getAllTodos()` from queries, return 200 with array
  - [ ] 2.4 Route handlers use `AppError` for errors (e.g., duplicate ID → 400) — never send error responses directly
  - [ ] 2.5 All responses use camelCase fields (already handled by `toTodo()` in queries.ts)

- [ ] Task 3: Wire routes into Express app (AC: #1, #2)
  - [ ] 3.1 Update `server/src/index.ts` — import and register `todoRoutes` between healthRoutes and errorHandler
  - [ ] 3.2 Middleware order must be: `express.json()` → healthRoutes → todoRoutes → errorHandler

- [ ] Task 4: Tests (AC: #1, #2, #3, #4, #5)
  - [ ] 4.1 Create `server/src/middleware/validate-todo.test.ts` — test valid UUID accepted, invalid UUID rejected, empty text rejected, whitespace-only rejected, valid text accepted, missing fields rejected
  - [ ] 4.2 Create `server/src/routes/todo-routes.test.ts` — test POST creates todo (201), POST with empty text returns 400, POST with invalid UUID returns 400, GET returns all todos as array, GET returns empty array when none exist, GET returns todos ordered by created_at, created todo has ISO 8601 timestamp, duplicate ID returns error
  - [ ] 4.3 Verify existing tests still pass (no regressions on health route, queries, error handler)

## Dev Notes

### Architecture Compliance

**API Endpoints for this story:**

| Method | Path | Request Body | Success Response | Error Responses |
|--------|------|-------------|-----------------|-----------------|
| POST | `/api/todos` | `{ id, text }` | 201: `Todo` | 400, 500 |
| GET | `/api/todos` | — | 200: `Todo[]` | 500 |

**Error response format — MUST follow exactly:**
```json
{ "error": { "message": "Todo text cannot be empty", "code": "VALIDATION_ERROR" } }
```

**Response format rules:**
- Success single resource: direct object, NO `{ data: ... }` wrapper
- Success list: direct array `[{ id, text, completed, createdAt, updatedAt }, ...]`
- All fields camelCase in API responses (transformation already done by `toTodo()` in queries.ts)

**Express 5.2 specifics:**
- Async error handling is automatic — rejected promises pass to error middleware without try/catch
- Route handlers should throw `AppError` or call `next(error)` — never send error responses directly from routes
- Error handler middleware is registered LAST (after all routes)

### Existing Code to Reuse — DO NOT Reinvent

**Already implemented in story 1.2 — use directly:**

| Module | Location | What to use |
|--------|----------|-------------|
| `createTodo(id, text)` | `server/src/db/queries.ts` | Creates todo in DB, returns `Todo` (camelCase) |
| `getAllTodos()` | `server/src/db/queries.ts` | Returns all todos ordered by created_at |
| `AppError` | `server/src/middleware/error-handler.ts` | Custom error class: `new AppError(message, statusCode, code)` |
| `errorHandler` | `server/src/middleware/error-handler.ts` | Global error middleware — already registered in index.ts |
| `Todo` type | `server/src/types/todo.ts` | `{ id, text, completed, createdAt, updatedAt }` |
| `CreateTodoRequest` type | `server/src/types/todo.ts` | `{ id: string, text: string }` |
| `ApiError` type | `server/src/types/todo.ts` | `{ error: { message, code } }` |
| `toTodo()` | `server/src/db/queries.ts` | Internal — snake_case DB rows → camelCase API objects |

**The queries module uses a factory pattern** — call `createQueries(db)` to get an object with all query functions. The `db` instance is obtained from `init.ts`.

### Validation Middleware Pattern

Create `validate-todo.ts` as Express middleware that validates request body before the route handler runs:

```typescript
import { AppError } from './error-handler.js'
import type { Request, Response, NextFunction } from 'express'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateCreateTodo(req: Request, _res: Response, next: NextFunction): void {
  const { id, text } = req.body

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new AppError('Invalid or missing todo ID', 400, 'VALIDATION_ERROR')
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new AppError('Todo text cannot be empty', 400, 'VALIDATION_ERROR')
  }

  next()
}
```

**Key:** Throw `AppError` — Express 5.2 catches synchronous throws and passes them to error middleware automatically.

### Route Handler Pattern

```typescript
import { Router } from 'express'
import { validateCreateTodo } from '../middleware/validate-todo.js'

export function createTodoRoutes(queries: ReturnType<typeof createQueries>) {
  const router = Router()

  router.post('/api/todos', validateCreateTodo, (req, res) => {
    const { id, text } = req.body
    const todo = queries.createTodo(id, text.trim())
    res.status(201).json(todo)
  })

  router.get('/api/todos', (_req, res) => {
    const todos = queries.getAllTodos()
    res.json(todos)
  })

  return router
}
```

**Key patterns:**
- Trim text before storing (client may send untrimmed)
- Use 201 for POST success, 200 for GET
- Return direct object/array — no wrapper
- Pass `queries` dependency for testability (same pattern as existing code)

### Duplicate ID Handling

When `createTodo` is called with an existing ID, better-sqlite3 will throw a SQLite constraint error (UNIQUE violation on PRIMARY KEY). The error handler will catch this as a 500, but it should be a 400. Options:
1. Check `getTodoById(id)` before insert — if exists, throw `AppError('Todo with this ID already exists', 400, 'VALIDATION_ERROR')`
2. Let SQLite throw and catch the specific error in the route handler

Option 1 is cleaner and prevents leaking SQLite error details.

### Testing Strategy

- **validate-todo.test.ts:** Test the middleware in isolation by calling it with mock req/res/next objects. Verify `AppError` is thrown for invalid inputs and `next()` is called for valid inputs.
- **todo-routes.test.ts:** Integration tests using the full Express app. Start a test server with `:memory:` SQLite, send real HTTP requests, verify responses.
- **Do NOT install supertest** — use native fetch or the app handler directly (consistent with story 1.2 approach)
- Test server pattern from story 1.2: create app → start listening → test → close server

### Previous Story Intelligence (1.2)

**Patterns established:**
- `index.ts` exports `{ app, db }` for test usage
- DB initialized with `:memory:` when `NODE_ENV=test`
- Tests use `server.listen()` on port 0 for random available port
- Tests properly close server in `afterAll` with async close
- Query functions use factory pattern: `createQueries(db)` returns object with all methods
- Health routes use `Router()` — todo routes should follow same pattern

**Code review fixes from 1.2 to avoid repeating:**
- Ensure test DBs are properly cleaned up (close connections)
- Use `await` for server.close() in test teardown
- Don't create new prepared statements on every call (factory caches them)
- Don't use non-null assertions — throw explicit errors instead

### Files to Create

| File | Purpose |
|------|---------|
| `server/src/middleware/validate-todo.ts` | Input validation middleware for POST /api/todos |
| `server/src/middleware/validate-todo.test.ts` | Tests for validation middleware |
| `server/src/routes/todo-routes.ts` | POST and GET route handlers |
| `server/src/routes/todo-routes.test.ts` | Integration tests for todo endpoints |

### Files to Modify

| File | Changes |
|------|---------|
| `server/src/index.ts` | Import and register todoRoutes between healthRoutes and errorHandler |

### Project Structure Notes

- All new files go under existing `server/src/` subdirectories (created in story 1.1)
- No new directories needed — `middleware/` and `routes/` already exist
- Follow kebab-case for filenames: `validate-todo.ts`, `todo-routes.ts`
- Co-locate tests: `validate-todo.test.ts` next to `validate-todo.ts`
- Follow the Router() pattern from `health-routes.ts` for route module structure

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/implementation-artifacts/1-2-database-health-check-api.md#Dev Notes]
- [Source: _bmad-output/implementation-artifacts/1-2-database-health-check-api.md#Dev Agent Record]
- [Source: server/src/db/queries.ts — createTodo, getAllTodos, createQueries factory]
- [Source: server/src/middleware/error-handler.ts — AppError class]
- [Source: server/src/types/todo.ts — Todo, CreateTodoRequest, ApiError types]
- [Source: server/src/index.ts — app/db export, middleware order]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

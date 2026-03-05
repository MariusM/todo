# Story 1.2: Database & Health Check API

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want the backend to have a working database and health check,
so that the system is ready to store my tasks and I can verify it's running.

## Acceptance Criteria

1. **Given** the server starts **When** the database initializes **Then** the `todos` table is created with columns: id (TEXT PK), text (TEXT NOT NULL), completed (INTEGER DEFAULT 0), created_at (TEXT), updated_at (TEXT)

2. **Given** the server is running **When** I send GET `/api/health` **Then** I receive 200 with `{ status: "ok", timestamp: "<ISO 8601>" }` **And** FR26 is satisfied

3. **Given** the database file path is configured via `DATABASE_PATH` environment variable **When** the server starts **Then** it uses the configured path for SQLite storage (NFR25)

4. **Given** the server encounters an invalid request **When** the error handler processes it **Then** the response follows the format `{ error: { message, code } }` with no stack traces or internal paths exposed (FR28, NFR7)

## Tasks / Subtasks

- [ ] Task 1: Database initialization module (AC: #1, #3)
  - [ ] 1.1 Create `server/src/db/init.ts` — initialize better-sqlite3, create `todos` table with `CREATE TABLE IF NOT EXISTS`, read `DATABASE_PATH` from env (default: `./data/todos.db`)
  - [ ] 1.2 Ensure `data/` directory is created if it doesn't exist (use `path.dirname` + `mkdirSync`)
  - [ ] 1.3 Export the database instance for use by route handlers
  - [ ] 1.4 Enable WAL mode for better concurrent read performance: `db.pragma('journal_mode = WAL')`

- [ ] Task 2: Database query module (AC: #1)
  - [ ] 2.1 Create `server/src/db/queries.ts` with prepared statements for all CRUD operations
  - [ ] 2.2 Implement `getAllTodos()` — `SELECT * FROM todos ORDER BY created_at`
  - [ ] 2.3 Implement `getTodoById(id)` — `SELECT * FROM todos WHERE id = ?`
  - [ ] 2.4 Implement `createTodo(id, text)` — `INSERT INTO todos (id, text, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))`
  - [ ] 2.5 Implement `updateTodo(id, fields)` — dynamic PATCH with `updated_at = datetime('now')`
  - [ ] 2.6 Implement `deleteTodo(id)` — `DELETE FROM todos WHERE id = ?`
  - [ ] 2.7 All functions return camelCase objects (transform at query boundary using a `toTodo()` mapper)

- [ ] Task 3: Global error handling middleware (AC: #4)
  - [ ] 3.1 Create `server/src/middleware/error-handler.ts` — Express error middleware (4 params: err, req, res, next)
  - [ ] 3.2 Format all errors as `{ error: { message, code } }` — never expose stack traces, SQL, or internal paths
  - [ ] 3.3 Map error types: validation → 400 VALIDATION_ERROR, not found → 404 NOT_FOUND, everything else → 500 INTERNAL_ERROR
  - [ ] 3.4 Log errors server-side with `console.error` (full details) while sending safe response to client

- [ ] Task 4: Health check route refactor (AC: #2)
  - [ ] 4.1 Create `server/src/routes/health-routes.ts` — extract health endpoint from `index.ts` into dedicated route module
  - [ ] 4.2 Health response: `{ status: "ok", timestamp: "<ISO 8601>" }`
  - [ ] 4.3 Optional: include database connectivity check (query `SELECT 1`) for production readiness

- [ ] Task 5: Wire up Express app (AC: #1, #2, #3, #4)
  - [ ] 5.1 Update `server/src/index.ts` — import and call db init on startup, register health routes, register error handler middleware last
  - [ ] 5.2 Middleware order: `express.json()` → routes → error handler (Helmet + CORS come in Story 5.3)
  - [ ] 5.3 Ensure the app export is preserved for test usage

- [ ] Task 6: Tests (AC: #1, #2, #3, #4)
  - [ ] 6.1 Create `server/src/db/init.test.ts` — verify table creation, verify column structure, verify idempotency (running init twice doesn't error)
  - [ ] 6.2 Create `server/src/db/queries.test.ts` — test all CRUD operations with a real in-memory or temp SQLite database
  - [ ] 6.3 Create `server/src/middleware/error-handler.test.ts` — verify error format, verify no stack trace leakage
  - [ ] 6.4 Create `server/src/routes/health-routes.test.ts` — verify 200 response with correct shape
  - [ ] 6.5 Update `server/src/index.test.ts` — verify the health endpoint still works after refactoring

## Dev Notes

### Architecture Compliance

**Database Schema — MUST match exactly:**
```sql
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Key constraints from architecture doc:**
- UUID primary keys (client-generated via `crypto.randomUUID()`) — server validates format on write
- INTEGER for completed (0 = active, 1 = complete) — server transforms to boolean at API boundary
- TEXT timestamps in ISO 8601 format — use SQLite `datetime('now')` for defaults
- No ORM — raw SQL with prepared statements only
- better-sqlite3 has a **synchronous API** — no async/await needed for DB calls

**Error Response Format — MUST follow exactly:**
```json
{ "error": { "message": "Human-readable message", "code": "VALIDATION_ERROR" } }
```
Error codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `INTERNAL_ERROR` (500)

**Express 5.2 specifics:**
- Async error handling is automatic — rejected promises pass to error middleware without try/catch
- Route handlers should throw or call `next(error)` — never send error responses directly from routes
- The error-handler middleware must be registered LAST (after all routes)

### snake_case to camelCase Transformation

The server is the boundary where DB snake_case transforms to API camelCase. Create a simple mapper function in `queries.ts`:

```typescript
function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
```

Define a `TodoRow` interface for the raw DB shape and use the existing `Todo` interface (from `types/todo.ts`) for the API shape.

### Environment Variable Handling

- `DATABASE_PATH` — defaults to `./data/todos.db` (relative to server working directory)
- Create the directory if it doesn't exist using `fs.mkdirSync(dirname(dbPath), { recursive: true })`
- In tests, use `:memory:` or a temp file to avoid touching the real database
- The `PORT` and `NODE_ENV` handling from story 1.1 stays unchanged

### Testing Strategy

- **Use real SQLite** for all server tests — no mocking the database
- For `init.test.ts` and `queries.test.ts`: use `:memory:` SQLite database (pass path option)
- For `health-routes.test.ts`: use supertest or direct app instance calls against the Express app
- For `error-handler.test.ts`: create a mock Express app with a route that throws, verify response format
- Co-locate all tests: `init.test.ts` next to `init.ts`, `queries.test.ts` next to `queries.ts`, etc.
- **Do NOT install supertest** — use Vitest with direct app handler calls or native fetch against a test server

### Previous Story Intelligence (1.1)

**What was established:**
- Express app is exported from `index.ts` as `{ app }` for test usage
- Health endpoint already exists inline in `index.ts` — needs to be extracted to `routes/health-routes.ts`
- `server/src/index.test.ts` already tests the health endpoint — update after refactoring
- better-sqlite3 is already installed as a dependency
- Vitest configured with node environment at root level
- Directory structure already created: `db/`, `middleware/`, `routes/`, `types/` (all empty)
- Types already defined in `server/src/types/todo.ts`: `Todo`, `CreateTodoRequest`, `ApiError`

**Debug learnings from 1.1:**
- npm cache permission issue — use `--cache /tmp/npm-cache` if encountered
- Vitest 4.0 uses `test.projects` not `test.workspace`
- Express 5.2: async error handling is automatic, use named wildcards (`/*splat` not `/*`)

**Code review feedback from 1.1:**
- App was properly exported for testability
- Tests use real module imports (no mocking the module under test)
- Duplicate vitest configs were removed — single root `vitest.config.ts`

### Files to Create

| File | Purpose |
|------|---------|
| `server/src/db/init.ts` | Database initialization, table creation |
| `server/src/db/init.test.ts` | Tests for DB init |
| `server/src/db/queries.ts` | Prepared statements for all CRUD operations |
| `server/src/db/queries.test.ts` | Tests for all query functions |
| `server/src/middleware/error-handler.ts` | Global error formatting middleware |
| `server/src/middleware/error-handler.test.ts` | Tests for error handler |
| `server/src/routes/health-routes.ts` | Health check route (extracted from index.ts) |
| `server/src/routes/health-routes.test.ts` | Tests for health route |

### Files to Modify

| File | Changes |
|------|---------|
| `server/src/index.ts` | Import DB init, register health routes, register error handler, remove inline health endpoint |
| `server/src/index.test.ts` | Update to work with refactored app structure |

### Project Structure Notes

- All new files go under existing `server/src/` subdirectories created in story 1.1
- No new directories needed — `db/`, `middleware/`, `routes/` already exist
- Follow kebab-case for non-component files: `error-handler.ts`, `health-routes.ts`, `todo-routes.ts`
- Co-locate tests with source files (e.g., `init.test.ts` next to `init.ts`)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffolding-monorepo-setup.md#Dev Notes]
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffolding-monorepo-setup.md#Dev Agent Record]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

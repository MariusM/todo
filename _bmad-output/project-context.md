---
project_name: 'todo'
user_name: 'Marius'
date: '2026-03-04'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 52
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Package |
|---|---|---|
| React | 19.2 | client |
| Vite | 7.3 | client |
| Tailwind CSS | 4.2 | client (CSS-native @theme) |
| Express | 5.2 | server |
| better-sqlite3 | 11.x | server |
| TypeScript | 5.x | both (ES modules) |
| Node.js | 22 LTS | runtime |
| Vitest | 4.0 | both |
| Playwright | 1.58 | e2e |
| Helmet.js | latest | server |

**Explicit exclusions:** No ORM, no axios, no routing library, no external state library, no custom fonts.

## Critical Implementation Rules

### TypeScript & Language Rules
- Strict mode TypeScript in both packages; separate tsconfig per package with shared tsconfig.base.json
- ES modules throughout — use `import`/`export`, never `require`
- Named exports preferred; default exports only for React components
- No cross-package runtime imports — mirror types in both client/types/todo.ts and server/types/todo.ts
- Never use `any` type — use proper typing or `unknown`
- Use `crypto.randomUUID()` for client-side UUID generation (no library)
- `console.error` for errors only — never `console.log` for error reporting

### Framework-Specific Rules

**React:**
- `useOptimisticTodos` hook is the SINGLE source of truth — components never call API directly
- Optimistic pattern: snapshot state → apply change → API call → success: no-op / failure: restore snapshot + error
- No loading spinners for CRUD — only `isLoading` boolean for initial page fetch
- 5 components only: TaskInput, TaskItem, TaskList, ErrorBanner, EmptyState — flat in components/
- Props down, callbacks up — no context, no global state, no event system
- No router — single view, App.tsx renders component tree directly

**Express:**
- Middleware order: Helmet → CORS → JSON parser → routes → error handler
- Route handlers transform snake_case (DB) ↔ camelCase (API) at server boundary
- Routes throw/next(error) — never send error responses directly
- Global error middleware formats all errors as `{ error: { message, code } }`

**API Client (client/api/todos.ts):**
- Only module that makes HTTP requests — hook calls this, components never do
- Native `fetch` with typed wrapper — no axios
- Parses error responses into typed `ApiError` objects

### Testing Rules
- Co-locate tests with source: `TaskInput.test.tsx` next to `TaskInput.tsx`, `todo-routes.test.ts` next to `todo-routes.ts`
- Never create `__tests__/` directories — tests live beside their source files
- Vitest for unit + integration (both packages); Playwright for E2E (e2e/ package)
- Minimum 70% meaningful code coverage across unit and integration tests
- Minimum 5 E2E tests: first visit, task completion, edit & delete, error recovery, accessibility (axe-core)
- Zero unhandled errors in CRUD paths
- Mock `fetch` in hook tests; use real SQLite for server integration tests
- E2E tests run against full Docker Compose stack — no mocks
- All tests must be executable via CI pipeline (GitHub Actions)

### Code Quality & Style Rules

**Naming Conventions:**
- Database columns: snake_case (`created_at`, `updated_at`)
- API JSON fields: camelCase (`createdAt`, `updatedAt`) — server transforms at boundary
- Non-component files: kebab-case (`todo-routes.ts`, `error-handler.ts`)
- React component files: PascalCase (`TaskInput.tsx`)
- Hooks: camelCase with `use` prefix (`useOptimisticTodos.ts`)
- Types/interfaces: PascalCase (`Todo`, `ApiError`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_PORT`)

**Code Organization:**
- One component per file, flat structure in `components/` — no nesting
- Server organized by layer: `routes/`, `middleware/`, `db/` — not by feature
- Immutable state updates only — never mutate React state directly

**API Response Format:**
- Success: direct resource or array — NO `{ data: ... }` wrapper
- Error: always `{ error: { message: "...", code: "VALIDATION_ERROR|NOT_FOUND|INTERNAL_ERROR" } }`
- Dates: ISO 8601 strings at every layer (DB TEXT, API string, frontend formats for display only)
- Booleans: DB INTEGER 0/1, API native true/false — transform at server boundary
- Omit null fields — don't send `"field": null`

### Development Workflow Rules
- Monorepo with npm workspaces — `npm install` at root installs everything
- Dev servers: Vite on :5173 (frontend HMR), tsx watch on :3001 (backend auto-reload)
- Docker Compose: Nginx (:80) serves static build + proxies `/api/*` → server (:3001)
- SQLite persisted via named Docker volume — survives container restarts
- Multi-stage Docker builds with non-root users in both containers
- CI pipeline: lint → test → e2e → Docker build — all must pass before merge
- Environment variables: PORT, DATABASE_PATH, CORS_ORIGIN, NODE_ENV (server); VITE_API_URL (client build-time)
- `.env.example` template at root — never commit real `.env` files

### Critical Don't-Miss Rules

**Anti-Patterns — NEVER Do These:**
- Never wrap success responses in `{ data: ... }` — return resource directly
- Never create `__tests__/` directories or utility/helper files for one-time ops
- Never use `any` type, axios, lodash, or any explicitly excluded library
- Never catch errors silently — always log or re-throw
- Never add abstractions not in the architecture (event bus, service layer, DI, context providers)
- Never call `fetch` from components — only through `api/todos.ts` via the hook

**Security — ALWAYS Do These:**
- Helmet.js on all responses; CORS restricted to `CORS_ORIGIN` env var
- Prepared statements for ALL SQL queries — zero string concatenation
- Validate input server-side: non-empty text after trim, valid UUID format
- Error responses: never expose stack traces, SQL, internal paths (NFR7)
- Sanitize todo text against XSS before storage

**Edge Cases Agents Must Handle:**
- Empty/whitespace todo: client silently ignores (no API call), server returns 400 VALIDATION_ERROR
- Completed field: DB stores INTEGER 0/1, API sends boolean true/false — transform at server boundary
- Timestamps: ISO 8601 TEXT in SQLite, never native datetime — use `datetime('now')` default
- UUID: client generates via `crypto.randomUUID()`, server validates format on POST
- Null fields: omit from response, don't send `null` values

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review periodically for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-03-04

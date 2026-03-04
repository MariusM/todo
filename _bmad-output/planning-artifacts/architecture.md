---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-04'
inputDocuments:
  - product-brief-todo-2026-03-04.md
  - prd.md
  - prd-validation-report.md
  - ux-design-specification.md
  - user-provided-prd-prose (pasted)
  - bmad-implementation-guide (pasted)
workflowType: 'architecture'
project_name: 'todo'
user_name: 'Marius'
date: '2026-03-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
28 FRs across 7 domains. The core is straightforward CRUD (FR1–FR7) with persistent storage (FR8–FR11). Architectural weight comes from the interaction layer: optimistic UI with rollback (FR16), inline editing (FR3), input validation (FR12–FR13), and comprehensive error messaging (FR15, FR17–FR19). Accessibility requirements (FR23–FR25) are structural — they affect component design, not just styling.

**Non-Functional Requirements:**
25 NFRs across 7 categories. Architecture-driving NFRs:
- **Performance:** 200ms UI feedback, 1.5s FCP, 2s TTI, 200ms API (NFR1–NFR4) — demands lightweight frontend, efficient API, minimal bundle
- **Security:** Input validation/sanitization server-side (NFR5–NFR7) — requires middleware or validation layer
- **Reliability:** Zero data loss, no inconsistent state, graceful network recovery (NFR12–NFR14) — drives database transaction design and optimistic UI pattern
- **Maintainability:** Clean frontend/backend separation, extensible for auth (NFR15–NFR17) — influences project structure and API design
- **Testing:** 70% coverage, 5+ E2E tests, CI pipeline (NFR18–NFR22) — test infrastructure is part of architecture
- **Deployment:** Docker Compose, multi-stage builds, non-root, env vars (NFR23–NFR25) — containerization is a hard constraint

**Scale & Complexity:**

- Primary domain: Full-stack web application (SPA + REST API + persistent storage)
- Complexity level: Low
- Estimated architectural components: ~8 (frontend app, 5 UI components, API server, database)

### Technical Constraints & Dependencies

- **Docker Compose deployment** — application must run via single orchestration command (NFR23)
- **Multi-stage Docker builds with non-root users** — security-hardened containers (NFR24)
- **Environment variable configuration** — no hardcoded config (NFR25)
- **Playwright for E2E testing** — specified in BMAD implementation guide and NFR19
- **Tailwind CSS** — chosen in UX spec as the styling approach with custom design tokens
- **System font stack** — no custom font downloads (UX spec decision)
- **WCAG 2.1 AA compliance** — accessibility is a hard requirement, not a nice-to-have (NFR8)
- **Future auth extensibility** — architecture must not prevent adding authentication later (NFR17)

### Cross-Cutting Concerns Identified

- **Optimistic UI + Rollback** — Every CRUD operation follows the same pattern: immediate UI update → API call → success (no-op) or failure (revert + error banner). This pattern must be consistent and reusable across all operations.
- **Error handling consistency** — Client-side: warm messaging with action identification and retry guidance. Server-side: JSON errors with message field, proper HTTP status codes (400/404/500). Both sides must follow the same contract.
- **Accessibility** — Affects component structure (ARIA attributes, roles), interaction design (keyboard navigation, focus management), and testing (axe-core audits). Not a layer to add later — it's structural.
- **Input validation** — Dual-layer: client-side (empty/whitespace prevention) and server-side (sanitization against XSS/injection). Both layers must agree on validation rules.
- **State persistence** — Every state change must survive browser refresh, tab closure, and server restart. Drives database choice and transaction design.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application (SPA + REST API) based on project requirements analysis. Separate frontend and backend packages in a monorepo structure for clean separation (NFR15).

### Starter Options Considered

| Option | Stack | Verdict |
|---|---|---|
| Vite react-ts + Express manual | React 19.2, Express 5.2, Vite 7.3, Vitest 4.0 | Selected — minimal, aligned with requirements |
| Create-T3-App | Next.js, tRPC, Prisma | Rejected — over-engineered for scope |
| Vite + Hono/Fastify | Alternative backends | Rejected — user prefers Express |
| Community boilerplates | Various pre-configured starters | Rejected — too opinionated, include unwanted dependencies |

### Selected Starter: Vite react-ts + Manual Express Setup

**Rationale for Selection:**
- Vite's official react-ts template provides the lightest viable starting point for the frontend — React, TypeScript, and build tooling with no extra opinions
- Manual Express setup gives full control over a minimal backend — no ORM overhead, no unnecessary middleware
- Monorepo structure keeps frontend and backend independent while sharing TypeScript configuration
- Aligns with UX spec's Tailwind CSS decision and the project's simplicity-first philosophy

**Initialization Commands:**

```bash
# Project root setup
mkdir todo && cd todo
npm init -y

# Frontend
npm create vite@latest client -- --template react-ts

# Backend
mkdir -p server/src
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5.x across frontend and backend
- Node.js 22 LTS runtime
- ES modules throughout

**Styling Solution:**
- Tailwind CSS 4.2 with CSS-native @theme configuration
- Custom design tokens from UX specification mapped to Tailwind @theme directives

**Build Tooling:**
- Vite 7.3 for frontend bundling and dev server
- tsx or ts-node for backend development
- Multi-stage Docker builds for production

**Testing Framework:**
- Vitest 4.0 for unit and integration tests (frontend + backend)
- Playwright 1.58 for E2E browser tests
- Coverage reporting via Vitest's built-in c8/istanbul

**Code Organization:**
```
todo/
├── client/                # Frontend (Vite + React)
│   ├── src/
│   │   ├── components/    # TaskInput, TaskItem, TaskList, ErrorBanner, EmptyState
│   │   ├── hooks/         # Custom hooks (useOptimisticTodos, etc.)
│   │   ├── api/           # API client functions
│   │   ├── types/         # Shared TypeScript types
│   │   └── App.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                # Backend (Express + SQLite)
│   ├── src/
│   │   ├── routes/        # Express route handlers
│   │   ├── middleware/     # Validation, error handling
│   │   ├── db/            # SQLite setup, migrations
│   │   └── index.ts
│   └── package.json
├── e2e/                   # Playwright E2E tests
│   ├── tests/
│   └── playwright.config.ts
├── docker-compose.yml
├── Dockerfile.client
├── Dockerfile.server
└── package.json           # Root workspace config
```

**Development Experience:**
- Vite HMR for instant frontend feedback
- tsx watch mode for backend auto-reload
- Vitest watch mode for test-driven development
- Concurrent dev server startup via npm scripts

**Database:**
- better-sqlite3 — synchronous API, fastest SQLite driver for Node.js
- Raw SQL with prepared statements (no ORM — one table doesn't justify ORM overhead)
- File-based storage with Docker volume mount for persistence

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Database schema design (todo table structure with UUID primary keys)
- API endpoint design (REST CRUD + health check)
- Frontend state management approach (React hooks, optimistic UI pattern)
- Docker Compose service architecture (Nginx + Node.js + SQLite volume)

**Important Decisions (Shape Architecture):**
- Error response format (consistent JSON structure with error codes)
- Input validation strategy (dual-layer: client + server)
- Security headers and CORS configuration
- Environment variable strategy

**Deferred Decisions (Post-MVP):**
- API versioning (no breaking change concerns with single client)
- External logging/monitoring service
- Authentication method (JWT vs session — deferred but architecture supports both)
- Caching strategy (unnecessary for single-user SQLite)

### Data Architecture

**Database:** SQLite via better-sqlite3 11.x
- Synchronous API — simpler code, faster execution for single-user workload
- No ORM — raw SQL with prepared statements for one table
- File-based storage persisted via Docker volume mount

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- **UUID primary keys** (generated client-side) — enables optimistic UI by allowing the client to assign IDs before server confirmation
- **INTEGER for completed** — SQLite has no native boolean; 0 = active, 1 = complete
- **TEXT timestamps** — ISO 8601 format, SQLite datetime functions compatible
- **updated_at** — tracks last modification for future sync/conflict resolution

**Migration approach:** Simple `init.sql` script executed on server startup via `CREATE TABLE IF NOT EXISTS`. No migration library for MVP scope.

**Rationale:** One table with five columns. An ORM or migration framework would add more complexity than the domain warrants. Prepared statements provide SQL injection protection (NFR5).

### Authentication & Security

**Authentication:** None for MVP. Express middleware architecture ensures auth can be added as a single middleware function without refactoring existing routes (NFR17).

**Security middleware stack:**
1. **Helmet.js** — Standard security headers (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.)
2. **CORS** — Restricted to frontend origin, configurable via `CORS_ORIGIN` environment variable
3. **Input validation** — Server-side validation on all write endpoints:
   - Todo text: non-empty after trimming, sanitized against XSS
   - Todo ID: valid UUID format
   - Reject malformed requests with 400 status (NFR6)
4. **No sensitive data exposure** — Error responses never include stack traces, SQL queries, or internal paths (NFR7)

**Rationale:** Minimal but complete security posture for a single-user app. Helmet and CORS are low-effort, high-value. Input validation with prepared statements covers OWASP top concerns (XSS, injection).

### API & Communication Patterns

**API Style:** REST over JSON

**Endpoints:**

| Method | Path | Request Body | Success Response | Error Responses |
|--------|------|-------------|-----------------|-----------------|
| GET | `/api/todos` | — | 200: `Todo[]` | 500 |
| POST | `/api/todos` | `{ id, text }` | 201: `Todo` | 400, 500 |
| PATCH | `/api/todos/:id` | `{ text?, completed? }` | 200: `Todo` | 400, 404, 500 |
| DELETE | `/api/todos/:id` | — | 204 | 404, 500 |
| GET | `/api/health` | — | 200: `{ status, timestamp }` | 500 |

**PATCH over PUT** — Partial updates allow toggling completion or editing text independently without sending the full resource.

**Error response format (FR28):**
```json
{
  "error": {
    "message": "Todo text cannot be empty",
    "code": "VALIDATION_ERROR"
  }
}
```
- 400: `VALIDATION_ERROR` — malformed or invalid input
- 404: `NOT_FOUND` — resource doesn't exist
- 500: `INTERNAL_ERROR` — server-side failure (no details exposed)

**No API versioning** — Single client, no external consumers, no breaking change risk for MVP.

**Rationale:** Five endpoints for five operations. PATCH enables the optimistic UI pattern where the client sends only the changed field. Consistent error format gives the frontend a reliable contract for error banner messaging.

### Frontend Architecture

**State Management:** React built-in hooks — `useState` + `useReducer`
- No external state library (Redux, Zustand, etc.) — scope doesn't justify it
- Custom `useOptimisticTodos` hook encapsulates all state logic:
  - Local todo array state
  - Optimistic add/update/delete with state snapshot for rollback
  - Per-operation error state driving ErrorBanner display
  - API call orchestration with rollback on failure

**Component Architecture:** 5 custom components (from UX spec)
- `TaskInput` — always-visible input, Enter to submit
- `TaskItem` — task row with checkbox, inline edit, delete
- `TaskList` — container with empty/loading/error state management
- `ErrorBanner` — non-blocking error notification with warm messaging
- `EmptyState` — first-visit and zero-tasks prompt

**Routing:** None — single view, no router library. `App.tsx` renders the component tree directly.

**API Client:** Native `fetch` API with a typed wrapper in `api/todos.ts`
- No axios or external HTTP library
- Type-safe request/response handling
- Centralized error parsing matching the server error format

**Rationale:** The entire frontend is one screen with one list. React's built-in state tools handle this without abstraction overhead. A custom hook keeps optimistic logic testable and isolated from component rendering.

### Infrastructure & Deployment

**Docker Compose Services:**

| Service | Image Base | Purpose | Port |
|---------|-----------|---------|------|
| `client` | Nginx Alpine | Serve Vite static build | 80 |
| `server` | Node.js 22 Alpine | Express API + SQLite | 3001 |

- **Frontend:** Multi-stage build — Stage 1: Vite build, Stage 2: Nginx serving static files
- **Backend:** Multi-stage build — Stage 1: TypeScript compile, Stage 2: Node.js runtime with production dependencies
- **Both containers:** Non-root users (NFR24), health check endpoints
- **SQLite persistence:** Named Docker volume mounting the database file
- **Nginx proxies** `/api/*` requests to the server container — single entry point for the user

**Environment Configuration:**

| Variable | Service | Default | Purpose |
|----------|---------|---------|---------|
| `PORT` | server | `3001` | API server port |
| `DATABASE_PATH` | server | `./data/todos.db` | SQLite file location |
| `CORS_ORIGIN` | server | `http://localhost` | Allowed frontend origin |
| `VITE_API_URL` | client (build-time) | `/api` | API base URL for fetch calls |
| `NODE_ENV` | server | `development` | Runtime environment |

**CI/CD Pipeline (GitHub Actions):**
1. Lint (ESLint + TypeScript check)
2. Unit + integration tests (Vitest)
3. E2E tests (Playwright against Docker Compose)
4. Docker image build verification
5. Quality gates: all steps must pass before merge

**Logging:** Console-based, JSON format in production. No external logging service for MVP.

**Rationale:** Nginx is the standard for serving static SPAs — tiny footprint, fast, handles compression and caching headers. Proxy config keeps the frontend and API on the same origin, eliminating CORS complexity in production. Docker volumes ensure SQLite data survives container restarts (NFR12).

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffolding (monorepo, packages, TypeScript config)
2. Database setup (schema, better-sqlite3 initialization)
3. API server (Express routes, validation middleware, error handling)
4. Frontend components (TaskInput → TaskItem → TaskList → EmptyState → ErrorBanner)
5. Optimistic UI hook (useOptimisticTodos connecting components to API)
6. Docker configuration (Dockerfiles, docker-compose.yml, Nginx config)
7. Test infrastructure (Vitest setup, Playwright config, CI pipeline)

**Cross-Component Dependencies:**
- UUID generation is shared between client (creates IDs) and server (validates format)
- Error response format must be consistent between server responses and client error parsing
- Environment variables bridge Docker Compose → container → application config
- Nginx proxy config must match API route prefix (`/api`)
- TypeScript types for Todo entity should be shared or mirrored between client and server

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 5 categories where AI agents could make different choices — naming, structure, format, communication, and process patterns.

### Naming Patterns

**Database Naming Conventions:**
- Table names: plural, snake_case → `todos`
- Column names: snake_case → `created_at`, `updated_at`
- No column prefixes (no `todo_text`, just `text`)

**API Naming Conventions:**
- Endpoints: plural, lowercase → `/api/todos`, `/api/todos/:id`
- Route parameters: colon format → `:id` (Express standard)
- JSON fields: camelCase → `{ createdAt, updatedAt }`
- Server transforms between snake_case (DB) ↔ camelCase (API)

**Code Naming Conventions:**
- Variables/functions: camelCase → `getTodos`, `isCompleted`
- Types/interfaces: PascalCase → `Todo`, `ApiError`, `CreateTodoRequest`
- Files (non-component): kebab-case → `todo-routes.ts`, `error-handler.ts`
- React components: PascalCase files → `TaskInput.tsx`, `TaskItem.tsx`
- Hooks: camelCase with "use" prefix → `useOptimisticTodos.ts`
- Test files: co-located with `.test.ts` suffix → `TaskItem.test.tsx`, `todo-routes.test.ts`
- Constants: UPPER_SNAKE_CASE → `DEFAULT_PORT`, `MAX_TEXT_LENGTH`

### Structure Patterns

**Project Organization:**
- Tests: co-located with source files, not in a separate `__tests__` directory
- Components: one component per file, flat structure (no nesting for 5 components)
- Server: organized by layer (routes, middleware, db), not by feature
- Config files: root level for project-wide, package-level for package-specific

**File Structure Example:**
```
components/
  TaskInput.tsx
  TaskInput.test.tsx
  TaskItem.tsx
  TaskItem.test.tsx
  TaskList.tsx
  TaskList.test.tsx
  ErrorBanner.tsx
  ErrorBanner.test.tsx
  EmptyState.tsx
  EmptyState.test.tsx
```

### Format Patterns

**API Response Formats:**

Success (single resource): Direct resource, no wrapper
```json
{ "id": "uuid", "text": "Buy milk", "completed": false, "createdAt": "2026-03-04T10:00:00Z", "updatedAt": "2026-03-04T10:00:00Z" }
```

Success (list): Direct array, no wrapper
```json
[{ "id": "uuid", "text": "Buy milk", "completed": false, "createdAt": "...", "updatedAt": "..." }]
```

Error: Wrapped in `error` object
```json
{ "error": { "message": "Human-readable message", "code": "VALIDATION_ERROR" } }
```

**Data Exchange Formats:**
- Dates: ISO 8601 strings everywhere → `2026-03-04T10:00:00.000Z`
  - DB stores as TEXT in ISO format
  - API sends/receives ISO strings
  - Frontend formats for display only
- Booleans: DB stores as INTEGER (0/1), API uses native `true`/`false`, server transforms at boundary
- Null handling: omit null fields from API responses rather than sending `"field": null`

### Communication Patterns

**State Management Patterns:**
- Immutable state updates only — never mutate state directly
- State shape: `{ todos: Todo[], errors: ErrorInfo[], isLoading: boolean }`
- Optimistic updates follow snapshot-apply-rollback pattern:
  1. Snapshot current state
  2. Apply optimistic change
  3. Fire API call
  4. On success: no-op (state already correct)
  5. On failure: restore snapshot + add error to errors array

**No event system** — direct function calls between hooks and API client. No pub/sub, no custom events. Scope doesn't justify the abstraction.

### Process Patterns

**Error Handling Patterns:**
- Server: Express error middleware catches all errors, formats as `{ error: { message, code } }`, never exposes stack traces
- Client: API client catches HTTP errors, parses error body, returns typed `ApiError` objects
- Components: never handle API errors directly — `useOptimisticTodos` hook manages error state, components render based on it
- Logging: `console.error` in development, structured JSON logs in production. Never `console.log` for errors.

**Loading State Patterns:**
- Single `isLoading` boolean for initial fetch only
- No loading indicators for CRUD operations (optimistic UI handles it)
- Loading skeleton or spinner only on initial page load

**Validation Patterns:**
- Client: validate before optimistic update (empty text → silent ignore, no API call)
- Server: validate independently (never trust client). Same rules: non-empty after trim, valid UUID format
- Both layers validate the same rules — client for UX, server for security

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow the naming conventions — no exceptions for personal style preferences
2. Co-locate tests with source files using `.test.ts`/`.test.tsx` suffix
3. Transform between snake_case (DB) and camelCase (API/frontend) at the server boundary
4. Use the exact error response format `{ error: { message, code } }` for all error responses
5. Never expose implementation details (stack traces, SQL, file paths) in API responses
6. Use ISO 8601 for all date/time values at every layer
7. Use immutable state updates — no direct mutation of React state

### Anti-Patterns to Reject

- Wrapping success responses in `{ data: ... }` — use direct responses
- Creating utility/helper files for one-time operations
- Adding a separate `__tests__` directory instead of co-locating
- Using `any` type in TypeScript — use proper typing or `unknown`
- Catching errors silently (swallowing without logging or re-throwing)

## Project Structure & Boundaries

### Complete Project Directory Structure

```
todo/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions: lint → test → e2e → build
├── client/                           # Frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── api/
│   │   │   └── todos.ts             # Typed fetch wrapper for all API calls
│   │   ├── components/
│   │   │   ├── TaskInput.tsx         # Always-visible input, Enter to submit
│   │   │   ├── TaskInput.test.tsx
│   │   │   ├── TaskItem.tsx          # Task row: checkbox, text, edit, delete
│   │   │   ├── TaskItem.test.tsx
│   │   │   ├── TaskList.tsx          # Container: renders items + empty/loading states
│   │   │   ├── TaskList.test.tsx
│   │   │   ├── ErrorBanner.tsx       # Non-blocking error notification
│   │   │   ├── ErrorBanner.test.tsx
│   │   │   ├── EmptyState.tsx        # Zero-tasks prompt
│   │   │   └── EmptyState.test.tsx
│   │   ├── hooks/
│   │   │   ├── useOptimisticTodos.ts # Core state: CRUD, optimistic updates, rollback
│   │   │   └── useOptimisticTodos.test.ts
│   │   ├── types/
│   │   │   └── todo.ts              # Todo, CreateTodoRequest, ApiError types
│   │   ├── App.tsx                   # Root component: composes all components
│   │   ├── App.test.tsx
│   │   ├── main.tsx                  # React entry point
│   │   └── index.css                 # Tailwind @theme directives + base styles
│   ├── index.html                    # Vite HTML entry
│   ├── vite.config.ts                # Vite config + Vitest config
│   ├── tsconfig.json                 # Frontend TypeScript config
│   └── package.json                  # Frontend dependencies
├── server/                           # Backend (Express + TypeScript + SQLite)
│   ├── src/
│   │   ├── db/
│   │   │   ├── init.ts              # Database initialization (CREATE TABLE IF NOT EXISTS)
│   │   │   ├── init.test.ts
│   │   │   └── queries.ts           # Prepared statements for all CRUD operations
│   │   ├── middleware/
│   │   │   ├── error-handler.ts     # Global error middleware → { error: { message, code } }
│   │   │   ├── error-handler.test.ts
│   │   │   ├── validate-todo.ts     # Input validation: non-empty text, valid UUID
│   │   │   └── validate-todo.test.ts
│   │   ├── routes/
│   │   │   ├── todo-routes.ts       # GET/POST/PATCH/DELETE /api/todos
│   │   │   ├── todo-routes.test.ts
│   │   │   ├── health-routes.ts     # GET /api/health
│   │   │   └── health-routes.test.ts
│   │   ├── types/
│   │   │   └── todo.ts              # Server-side Todo types (mirrors client types)
│   │   └── index.ts                 # Express app setup: middleware, routes, listen
│   ├── tsconfig.json                 # Backend TypeScript config
│   └── package.json                  # Backend dependencies
├── e2e/                              # End-to-end tests (Playwright)
│   ├── tests/
│   │   ├── create-todo.spec.ts      # Journey 1: first visit → first task
│   │   ├── complete-todo.spec.ts    # Journey 3: task completion loop
│   │   ├── edit-todo.spec.ts        # Journey 4: inline editing
│   │   ├── delete-todo.spec.ts      # Journey 4: task deletion
│   │   └── error-handling.spec.ts   # Journey 5: error recovery
│   ├── playwright.config.ts          # Playwright config: base URL, browsers, timeouts
│   └── package.json                  # E2E dependencies
├── docker/
│   └── nginx.conf                    # Nginx config: static serving + /api proxy
├── Dockerfile.client                 # Multi-stage: Vite build → Nginx Alpine
├── Dockerfile.server                 # Multi-stage: TS compile → Node.js Alpine
├── docker-compose.yml                # Service orchestration: client + server + volume
├── .env.example                      # Template for environment variables
├── .gitignore
├── package.json                      # Root workspace config + shared scripts
├── tsconfig.base.json                # Shared TypeScript base config
└── README.md                         # Setup instructions, architecture overview
```

### Architectural Boundaries

**API Boundary:**
The `/api` prefix is the single boundary between frontend and backend. All communication crosses this line via HTTP/JSON.

```
┌─────────────────────┐         ┌─────────────────────┐
│      CLIENT         │  HTTP   │      SERVER          │
│                     │ /api/*  │                      │
│  React Components   │────────→│  Express Routes      │
│  ↕                  │         │  ↕                   │
│  useOptimisticTodos │         │  Validation MW       │
│  ↕                  │         │  ↕                   │
│  api/todos.ts       │←────────│  db/queries.ts       │
│  (fetch wrapper)    │  JSON   │  ↕                   │
│                     │         │  SQLite (better-sqlite3)
└─────────────────────┘         └─────────────────────┘
```

**Component Boundaries:**
- Components receive data via props and emit events via callbacks — no direct API calls from components
- `useOptimisticTodos` is the single source of truth — components read state, hook manages mutations
- `api/todos.ts` is the only module that makes HTTP requests — hook calls API functions, never `fetch` directly

**Data Boundaries:**
- Frontend operates on camelCase TypeScript objects (`Todo` type)
- Server transforms at the route handler level: snake_case from DB → camelCase for response
- Database operates on snake_case columns via prepared statements
- No shared runtime code between client and server — types are mirrored, not imported

### Requirements to Structure Mapping

**FR Category Mapping:**

| FR Category | Primary Files | Test Files |
|---|---|---|
| Task Management (FR1–FR7) | `todo-routes.ts`, `queries.ts`, `TaskItem.tsx`, `TaskInput.tsx` | Co-located `.test.ts` files |
| Data Persistence (FR8–FR11) | `init.ts`, `queries.ts`, `docker-compose.yml` (volume) | `init.test.ts`, `queries.test.ts` |
| Input Handling (FR12–FR14) | `validate-todo.ts`, `TaskInput.tsx` | `validate-todo.test.ts`, `TaskInput.test.tsx` |
| Error Handling (FR15–FR19) | `error-handler.ts`, `ErrorBanner.tsx`, `useOptimisticTodos.ts` | Co-located test files |
| Responsive (FR20–FR22) | `index.css` (Tailwind), all component `.tsx` files | E2E visual tests |
| Accessibility (FR23–FR25) | All component `.tsx` files (ARIA, keyboard handlers) | E2E axe-core scan |
| System Operations (FR26–FR28) | `health-routes.ts`, `todo-routes.ts` | `health-routes.test.ts` |

**Cross-Cutting Concerns Mapping:**

| Concern | Files Affected |
|---|---|
| Optimistic UI + Rollback | `useOptimisticTodos.ts`, `api/todos.ts`, all components |
| Error format consistency | `error-handler.ts`, `api/todos.ts`, `ErrorBanner.tsx` |
| snake_case ↔ camelCase | `todo-routes.ts` (transform layer) |
| Input validation | `validate-todo.ts` (server), `TaskInput.tsx` (client) |
| Docker deployment | `Dockerfile.client`, `Dockerfile.server`, `docker-compose.yml`, `nginx.conf` |

### Data Flow

**Create Todo (optimistic flow):**
```
TaskInput (Enter) → useOptimisticTodos.addTodo()
  → Generate UUID client-side
  → Add todo to local state (optimistic)
  → api/todos.ts POST /api/todos { id, text }
    → validate-todo.ts (server validates)
    → queries.ts INSERT INTO todos
    → 201 + Todo JSON response
  → On success: no-op (already in state)
  → On failure: remove from state + add ErrorInfo
```

**Initial Load:**
```
App mounts → useOptimisticTodos initializes
  → setIsLoading(true)
  → api/todos.ts GET /api/todos
    → queries.ts SELECT * FROM todos ORDER BY created_at
    → 200 + Todo[] JSON response
  → setTodos(response)
  → setIsLoading(false)
```

### Development Workflow Integration

**Development (local):**
```bash
# Terminal 1: Frontend dev server (Vite HMR on :5173)
cd client && npm run dev

# Terminal 2: Backend dev server (tsx watch on :3001)
cd server && npm run dev

# Terminal 3: Tests in watch mode
npm run test -- --watch
```

**Build Process:**
```bash
# Frontend: Vite builds to client/dist/
cd client && npm run build

# Backend: TypeScript compiles to server/dist/
cd server && npm run build
```

**Docker Deployment:**
```bash
# Full stack: builds + runs everything
docker-compose up --build

# Client container: Nginx serves client/dist/ on :80, proxies /api to server:3001
# Server container: Node.js runs server/dist/index.js on :3001
# SQLite volume: persists todos.db across container restarts
```

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible. Vite 7.3 + React 19.2 + Tailwind 4.2 + Vitest 4.0 share the same ecosystem. Express 5.2 + better-sqlite3 are a natural pairing for single-user APIs. Docker multi-stage builds with Nginx and Node.js Alpine are production-proven patterns. No version conflicts or contradictory decisions found.

**Pattern Consistency:** All implementation patterns align with technology choices. The snake_case ↔ camelCase transformation boundary is cleanly defined at the route handler layer. Error format contract is consistent across server middleware and client API wrapper. Co-located test convention aligns with Vitest's file discovery.

**Structure Alignment:** Project structure directly supports all architectural decisions. Monorepo packages map to architectural layers. Every UX component has a dedicated file. Middleware folder structure supports the security middleware stack. Docker configuration files are positioned for docker-compose discovery.

### Requirements Coverage Validation

**Functional Requirements:** 28/28 FRs architecturally supported. All CRUD operations mapped to specific endpoints, components, and database queries. Error handling, accessibility, and responsive requirements have dedicated architectural components.

**Non-Functional Requirements:** 25/25 NFRs architecturally supported. Performance targets addressed by optimistic UI + lightweight stack. Security covered by validation middleware + Helmet + prepared statements. Testing infrastructure defined with Vitest + Playwright + GitHub Actions CI. Deployment fully specified with Docker Compose + multi-stage builds.

### Implementation Readiness Validation

**Decision Completeness:** All critical and important decisions documented with specific technology versions. No implementation-blocking ambiguities remain.

**Structure Completeness:** Complete project tree with every file mapped to a requirement or architectural decision. No placeholder directories or undefined integration points.

**Pattern Completeness:** All five conflict categories addressed with explicit rules and examples. Enforcement guidelines and anti-patterns documented.

### Gap Analysis Results

**Critical Gaps:** None found.

**Minor Gaps Addressed:**
- **UUID generation:** Use native `crypto.randomUUID()` for client-side ID generation — zero dependencies, supported in all target browsers (Chrome 92+, Firefox 95+, Safari 15.4+, Edge 92+)

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Low)
- [x] Technical constraints identified (Docker, Playwright, Tailwind, WCAG AA)
- [x] Cross-cutting concerns mapped (5 concerns)

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (8 technologies with versions)
- [x] Integration patterns defined (API boundary, component boundaries, data boundaries)
- [x] Performance considerations addressed (optimistic UI, lightweight stack)

**Implementation Patterns**
- [x] Naming conventions established (DB, API, code)
- [x] Structure patterns defined (co-located tests, flat components)
- [x] Communication patterns specified (props/callbacks, hook as state owner)
- [x] Process patterns documented (error handling, loading, validation)

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — low-complexity project with well-understood patterns, verified technology compatibility, and complete requirements coverage.

**Key Strengths:**
- Every decision has clear rationale tied to specific requirements
- Optimistic UI pattern is fully specified with snapshot-apply-rollback lifecycle
- Clean architectural boundaries prevent implementation confusion
- Testing strategy is integrated into the architecture, not bolted on
- Docker deployment is concrete, not aspirational

**Areas for Future Enhancement:**
- API versioning (when external consumers are introduced)
- Authentication middleware (when multi-user is added in Phase 2)
- Real-time sync (if collaborative features are added in Phase 3)
- Caching layer (if performance requires it at scale)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- Use `crypto.randomUUID()` for client-side UUID generation

**First Implementation Priority:**
Project scaffolding — initialize the monorepo structure, install dependencies, and configure TypeScript, Vite, Tailwind, Vitest, and Playwright.

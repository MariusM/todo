# Story 5.1: Unit & Integration Tests

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want comprehensive unit and integration tests covering core functionality,
so that I can refactor and extend with confidence (NFR18, NFR20).

## Acceptance Criteria

1. **Given** the test framework is configured, **When** I run Vitest, **Then** tests execute for both client and server packages
2. **Given** the server routes are implemented, **When** I run integration tests, **Then** all CRUD endpoints are tested (create, read, update, delete) including success and error cases, **And** health check endpoint is tested (NFR22)
3. **Given** the frontend components are implemented, **When** I run component tests, **Then** TaskInput, TaskItem, TaskList, EmptyState, and ErrorBanner have tests covering their key behaviors
4. **Given** the `useOptimisticTodos` hook is implemented, **When** I run hook tests, **Then** optimistic add, update, delete, and rollback scenarios are tested
5. **Given** all tests pass, **When** I check coverage, **Then** meaningful code coverage is at least 70% across unit and integration tests (NFR18)
6. **Given** core CRUD operations are tested, **When** I review error handling, **Then** zero unhandled errors exist in CRUD paths (NFR20)

## Tasks / Subtasks

- [ ] Task 1: Install and configure coverage reporting (AC: #5)
  - [ ] 1.1 Install `@vitest/coverage-v8` as dev dependency in root package.json
  - [ ] 1.2 Add coverage configuration to `vitest.config.ts`: set thresholds (lines: 70, functions: 70, branches: 70, statements: 70), include/exclude patterns
  - [ ] 1.3 Add `test:coverage` script to root package.json: `vitest run --coverage`
  - [ ] 1.4 Configure coverage to exclude test files, type files, config files, and `main.tsx` from coverage calculation
  - [ ] 1.5 Run initial coverage report to establish baseline and identify gaps

- [ ] Task 2: Fill server-side test coverage gaps (AC: #2, #6)
  - [ ] 2.1 Review coverage report for `server/src/index.ts` — add tests for middleware ordering (Helmet, CORS, JSON parser applied before routes) and server startup/shutdown
  - [ ] 2.2 Review coverage for `server/src/routes/todo-routes.ts` — add tests for uncovered branches: sanitization edge cases (nested HTML tags, entity encoding), concurrent request handling, malformed JSON body
  - [ ] 2.3 Review coverage for `server/src/middleware/error-handler.ts` — add tests for non-AppError errors (e.g., thrown strings, Error without statusCode), verify stack traces are never exposed in responses
  - [ ] 2.4 Review coverage for `server/src/db/queries.ts` — add tests for edge cases: very long text (boundary), special characters in text (emojis, unicode), boolean conversion (0/1 to true/false verification)
  - [ ] 2.5 Verify `server/src/middleware/validate-todo.ts` covers all branches: partial UUID formats, text with only whitespace variations (tabs, newlines), completed field with non-boolean types

- [ ] Task 3: Fill client-side test coverage gaps (AC: #3, #4)
  - [ ] 3.1 Review coverage report for `client/src/hooks/useOptimisticTodos.ts` — add tests for uncovered branches: rapid successive operations, state consistency after multiple rollbacks, empty todo list edge cases
  - [ ] 3.2 Review coverage for `client/src/api/todos.ts` — add tests for: timeout scenarios, response with unexpected JSON structure, 204 response handling edge cases
  - [ ] 3.3 Review coverage for `client/src/components/TaskInput.tsx` — verify coverage for all keyboard interactions and edge cases
  - [ ] 3.4 Review coverage for `client/src/components/TaskItem.tsx` — verify coverage for all inline editing paths, animation classes, and accessibility attributes
  - [ ] 3.5 Review coverage for `client/src/App.tsx` — verify the component composition and prop wiring are covered

- [ ] Task 4: Verify zero unhandled errors in CRUD paths (AC: #6)
  - [ ] 4.1 Audit all server CRUD route handlers: verify every code path has a try/catch or passes errors to next() middleware
  - [ ] 4.2 Audit client API module: verify every fetch call has proper error handling and typed error responses
  - [ ] 4.3 Audit useOptimisticTodos hook: verify every async operation has catch handler that triggers rollback + error state
  - [ ] 4.4 Add test cases for any uncovered error paths discovered in the audit
  - [ ] 4.5 Verify no `console.log` used for errors (should be `console.error` only)

- [ ] Task 5: Achieve and verify 70% coverage threshold (AC: #5)
  - [ ] 5.1 Run `npm run test:coverage` and review detailed report
  - [ ] 5.2 If any module is below 70%, add targeted tests for uncovered lines/branches
  - [ ] 5.3 Verify coverage thresholds pass (Vitest will exit non-zero if below threshold)
  - [ ] 5.4 Ensure all 232+ existing tests still pass with zero regressions

## Dev Notes

### Architecture Compliance

- **Test co-location**: ALL tests live beside their source files with `.test.ts`/`.test.tsx` suffix. NEVER create `__tests__/` directories.
- **Test configuration**: Single `vitest.config.ts` at project root with two projects: `client` (jsdom env) and `server` (node env).
- **Test setup**: Client uses `client/src/test-setup.ts` for cleanup and jest-dom matchers.
- **Coverage tool**: Use `@vitest/coverage-v8` (V8 native coverage) — not istanbul. This is the Vitest-recommended coverage provider.
- **No new source files**: This story only adds dev dependencies and test code. No production code changes.

### Technical Implementation Guidance

**Coverage Configuration (vitest.config.ts):**
Add coverage settings to the existing vitest.config.ts:
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'text-summary', 'lcov'],
  reportsDirectory: './coverage',
  include: ['client/src/**/*.{ts,tsx}', 'server/src/**/*.ts'],
  exclude: [
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/types/**',
    'client/src/main.tsx',
    'client/src/test-setup.ts',
    'client/src/vite-env.d.ts',
  ],
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
}
```

**Current Test Baseline (232 tests passing):**
| Area | Files | Tests | Coverage Status |
|------|-------|-------|-----------------|
| Client components | 5 test files | ~80 tests | Good — all 5 components tested |
| Client App integration | 2 test files | ~60 tests | Good — comprehensive |
| useOptimisticTodos hook | 1 test file | 18 tests | Good — rollback, errors, concurrent |
| API client (todos.ts) | 1 test file | 15 tests | Good — all endpoints + errors |
| Server routes | 2 test files | ~26 tests | Good — CRUD + health |
| Server middleware | 2 test files | ~16 tests | Good — validation + error handler |
| Server DB | 2 test files | ~15 tests | Good — init + queries |
| Server index | 1 test file | 2 tests | Minimal — may need additions |

**Likely Coverage Gaps (based on code analysis):**
1. **`server/src/index.ts`** — Only 2 tests (health check + db export). Missing: middleware stack verification, server listen/close, graceful shutdown, error scenarios during startup.
2. **`client/src/main.tsx`** — Entry point that calls `ReactDOM.createRoot`. Exclude from coverage (bootstrap code).
3. **Branch coverage** in validation middleware — some edge case branches (e.g., `typeof completed !== 'boolean'` when completed is a string) may not be hit.
4. **Error handler** — Only 3 tests. May need: non-Error thrown values, errors without message property, JSON stringify failures.

**Server Integration Test Pattern (already established):**
```typescript
// Tests use real Express + in-memory SQLite
let server: ReturnType<typeof app.listen>
let port: number

beforeAll(async () => {
  server = app.listen(0)  // random port
  const address = server.address()
  port = typeof address === 'object' && address ? address.port : 0
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})
```

**Client Hook Test Pattern (already established):**
```typescript
vi.mock('../api/todos')

const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>

// renderHook + act + waitFor pattern
const { result } = renderHook(() => useOptimisticTodos(), { wrapper })
await waitFor(() => expect(result.current.isLoading).toBe(false))
```

### Library & Framework Requirements

| Technology | Version | Notes |
|-----------|---------|-------|
| Vitest | 4.0.0 | Already installed in both packages |
| @vitest/coverage-v8 | ^4.0.0 | **NEW** — install as root dev dependency |
| @testing-library/react | 16.0.0 | Already installed |
| @testing-library/user-event | 14.6.1 | Already installed |
| @testing-library/jest-dom | 6.9.1 | Already installed |
| jsdom | 26.0.0 | Already installed |
| axe-core | 4.11.1 | Already installed |

**Only new dependency: `@vitest/coverage-v8`** — must match Vitest major version (4.x).

### File Structure Requirements

Files to modify:
- `vitest.config.ts` — Add coverage configuration (thresholds, include/exclude)
- `package.json` (root) — Add `test:coverage` script

Files to potentially add tests to (based on coverage gaps):
- `server/src/index.test.ts` — Expand from 2 tests to cover middleware stack
- `server/src/middleware/error-handler.test.ts` — Add edge case error types
- `server/src/middleware/validate-todo.test.ts` — Add branch coverage tests
- `server/src/db/queries.test.ts` — Add edge case data tests
- `client/src/hooks/useOptimisticTodos.test.ts` — Add rapid operation tests
- `client/src/api/todos.test.ts` — Add timeout/malformed response tests

No new files should be created. All new tests go into existing test files.

### Testing Requirements

**Testing framework**: Vitest 4.0.0 with @vitest/coverage-v8
**Test co-location**: Tests next to source files as `*.test.ts` / `*.test.tsx`
**Coverage target**: 70% minimum for lines, functions, branches, and statements

**Key test scenarios to add:**
1. Server middleware ordering verification (Helmet headers present, CORS headers present)
2. Error handler with non-standard error objects (plain strings, objects without message)
3. Validation middleware branch coverage for edge cases (partial UUIDs, tab/newline whitespace)
4. Database query edge cases (unicode text, very long strings, boolean conversion)
5. Hook rapid-fire operations (add then immediately delete before API resolves)
6. API client timeout/network error distinction

**All existing 232 tests must continue passing with zero regressions.**

### Previous Story Intelligence (Story 4.4)

**Key learnings from Epic 4:**
- Implementation commit followed by code review fix commit is the established pattern
- axe-core was added as dev dependency (already available for accessibility tests)
- 232 tests is the current baseline — maintain and extend
- Test patterns are well-established — follow existing mock/render/assert patterns
- Coverage tooling (`@vitest/coverage-v8`) was NOT installed in previous stories — this is the first story requiring it
- npm cache permission issues (EACCES) were encountered when installing packages in story 4.4 — if this occurs, try `npm install` without sudo first, or use `--legacy-peer-deps` if peer conflicts arise

**Patterns from Epic 4 code review fixes:**
- Story 4.3 fix: useEffect dependency arrays needed correction — watch for similar issues in test setup/teardown
- Story 4.1 fix: undefined color token — verify any config changes don't break existing behavior
- Tests added incrementally with running total maintained in commit messages

### Git Intelligence

**Recent commits (last 10):**
- `c94ec09` Complete Epic 4 retrospective
- `806f316` Fix code review issues for story 4.4
- `c2d424f` Implement story 4.4: Color contrast & visual accessibility
- `9e0b0ed` Add story 4.4 spec and update sprint status
- `b6cd1f0` Fix code review issues for story 4.3
- `d87d5b9` Implement story 4.3: Screen reader support & ARIA
- `8e99230` Add story 4.3 spec
- `c0e501f` Fix code review issues for story 4.2
- `7f616cd` Implement story 4.2: Keyboard navigation & focus management
- `883870a` Mark epics 1, 2, and 3 as done

**Patterns:**
- Commit message format: "Implement story X.Y: Description" for implementation, "Fix code review issues for story X.Y: Details" for review fixes
- Story spec commits always update sprint-status.yaml
- No Helmet.js or CORS middleware has been added yet — these are deferred to story 5.3 (Security Hardening)

### Project Structure Notes

- Monorepo: `client/` and `server/` packages with npm workspaces
- Single `vitest.config.ts` at root configures both projects
- Components in `client/src/components/` (flat, no nesting)
- Hooks in `client/src/hooks/`
- API client in `client/src/api/todos.ts`
- Server organized by layer: `routes/`, `middleware/`, `db/`
- Tests co-located with source files in all packages
- Root `package.json` scripts: `test` (vitest run), `test:watch` (vitest)

### Critical Warnings

1. **DO NOT modify any production source code** — this story is testing-only. No changes to components, hooks, API client, routes, middleware, or database code.
2. **DO NOT create `__tests__/` directories** — all tests are co-located with source files.
3. **DO NOT install istanbul/nyc** — use `@vitest/coverage-v8` which is the Vitest-native coverage provider.
4. **DO NOT change test patterns** — follow the established mock/render/assert patterns in existing test files.
5. **DO NOT add Helmet.js or CORS** — that is story 5.3 (Security Hardening), not this story.
6. **DO NOT run coverage on `main.tsx`** — it's a bootstrap entry point, exclude it.
7. **Version match**: `@vitest/coverage-v8` MUST be version 4.x to match Vitest 4.0.0. Do not install a mismatched version.
8. **Existing 232 tests are the baseline** — every single one must continue passing.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 5, Story 5.1]
- [Source: _bmad-output/planning-artifacts/architecture.md - Testing Standards, NFR18, NFR20, NFR22]
- [Source: _bmad-output/project-context.md - Testing Rules, Co-location, Vitest config]
- [Source: _bmad-output/planning-artifacts/prd.md - NFR18, NFR19, NFR20, NFR21]
- [Source: _bmad-output/implementation-artifacts/4-4-color-contrast-visual-accessibility.md - Latest test patterns, baseline count]
- [Source: vitest.config.ts - Current test configuration with client/server projects]
- [Source: client/package.json - Current test dependencies]
- [Source: server/package.json - Current server dependencies]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

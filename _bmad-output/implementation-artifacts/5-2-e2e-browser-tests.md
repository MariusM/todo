# Story 5.2: E2E Browser Tests

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want end-to-end browser tests covering core user journeys,
so that I can verify the full stack works together (NFR19).

## Acceptance Criteria

1. **Playwright configured and running** — `npx playwright test` executes from the `e2e/` workspace against the running dev servers (client :5173, server :3001)
2. **Journey 1: First Visit** — Empty state displayed → task created via input → task appears in list → persists after page refresh
3. **Journey 2: Task Completion** — Task completed (checkbox/click) → visual distinction (line-through, opacity) → persists on refresh → toggle back to active
4. **Journey 3: Edit & Delete** — Inline edit activated → text changed and saved → delete removes task → list updates correctly
5. **Journey 4: Error Recovery** — Simulated API failure (route intercept) → optimistic rollback occurs → error banner displayed → retry/recovery works
6. **Journey 5: Accessibility** — Full keyboard navigation (Tab, Enter, Escape) → axe-core audit passes with zero critical violations
7. **Minimum 5 E2E tests pass** covering all journeys above (NFR19)

## Tasks / Subtasks

- [ ] Task 1: Install Playwright and configure test infrastructure (AC: #1)
  - [ ] 1.1 Run `npx playwright install chromium` in e2e workspace to install browser binary
  - [ ] 1.2 Add `@axe-core/playwright` dev dependency to e2e/package.json for accessibility auditing
  - [ ] 1.3 Add `test:e2e` script to root package.json: `npm run test -w e2e`
  - [ ] 1.4 Add `test` script to e2e/package.json: `npx playwright test`
  - [ ] 1.5 Verify playwright.config.ts baseURL matches dev server (localhost:5173)
  - [ ] 1.6 Create `e2e/tests/` directory for test files
- [ ] Task 2: Journey 1 — First Visit (AC: #2)
  - [ ] 2.1 Create `e2e/tests/create-todo.spec.ts`
  - [ ] 2.2 Test: navigate to app, verify empty state message displayed
  - [ ] 2.3 Test: type task text in input, press Enter, verify task appears in list
  - [ ] 2.4 Test: reload page, verify task persists in list
- [ ] Task 3: Journey 2 — Task Completion (AC: #3)
  - [ ] 3.1 Create `e2e/tests/complete-todo.spec.ts`
  - [ ] 3.2 Test: create a task, mark it complete, verify visual distinction (line-through/opacity classes)
  - [ ] 3.3 Test: reload page, verify completed state persists
  - [ ] 3.4 Test: toggle task back to active, verify visual change reverts
- [ ] Task 4: Journey 3 — Edit & Delete (AC: #4)
  - [ ] 4.1 Create `e2e/tests/edit-delete-todo.spec.ts`
  - [ ] 4.2 Test: create a task, activate inline edit (double-click), change text, save (Enter), verify updated text
  - [ ] 4.3 Test: delete a task, verify it is removed from the list
  - [ ] 4.4 Test: verify list count updates correctly after operations
- [ ] Task 5: Journey 4 — Error Recovery (AC: #5)
  - [ ] 5.1 Create `e2e/tests/error-handling.spec.ts`
  - [ ] 5.2 Test: use `page.route()` to intercept API calls and simulate 500 failure
  - [ ] 5.3 Test: verify optimistic UI rollback (task reverts to previous state)
  - [ ] 5.4 Test: verify error banner appears with descriptive message
  - [ ] 5.5 Test: verify recovery after API is restored (banner dismisses, operations succeed)
- [ ] Task 6: Journey 5 — Accessibility (AC: #6)
  - [ ] 6.1 Create `e2e/tests/accessibility.spec.ts`
  - [ ] 6.2 Test: Tab through all interactive elements (input, checkboxes, edit, delete buttons)
  - [ ] 6.3 Test: Enter to submit new task from input
  - [ ] 6.4 Test: Escape to cancel inline edit
  - [ ] 6.5 Test: run axe-core audit via `@axe-core/playwright` — assert zero critical violations
- [ ] Task 7: Verify all tests pass together (AC: #7)
  - [ ] 7.1 Run full suite: `npx playwright test` — all 5+ specs pass
  - [ ] 7.2 Verify no test pollution (each test cleans up or uses fresh state)
  - [ ] 7.3 Verify existing 261 unit/integration tests still pass with zero regressions

## Dev Notes

### Architecture & Stack Constraints

- **Playwright 1.58** — already configured in `e2e/package.json` with `@playwright/test: ^1.58.0`
- **Existing config** — `e2e/playwright.config.ts` already set up with:
  - `testDir: './tests'`, `baseURL: 'http://localhost:5173'`, chromium project only
  - `fullyParallel: true`, retries=2 in CI, workers=1 in CI
  - HTML reporter, trace on first retry
- **E2E workspace** is part of npm workspaces (root package.json includes `"e2e"`)
- Tests run against dev servers: Vite on :5173 (frontend), Express on :3001 (backend)
- Tests must NOT mock the backend — full stack integration
- Use `page.route()` ONLY for Journey 4 (error simulation) — never for other journeys

### API Endpoints (for assertions and route interception)

| Method | Path | Request Body | Success | Error |
|--------|------|-------------|---------|-------|
| GET | `/api/todos` | — | 200: `Todo[]` | 500 |
| POST | `/api/todos` | `{ id, text }` | 201: `Todo` | 400, 500 |
| PATCH | `/api/todos/:id` | `{ text?, completed? }` | 200: `Todo` | 400, 404, 500 |
| DELETE | `/api/todos/:id` | — | 204 | 404, 500 |

### UI Selectors & Interaction Patterns

- **Task input**: text input field — type text and press Enter to create
- **Task list**: renders `TaskItem` components for each todo
- **Empty state**: `EmptyState` component shown when no tasks exist
- **Task completion**: checkbox or click toggles `completed` — applies visual distinction (line-through, reduced opacity via Tailwind classes)
- **Inline edit**: double-click on task text activates edit mode — Enter saves, Escape cancels
- **Delete**: delete button on each task item
- **Error banner**: `ErrorBanner` component appears on API failure with descriptive message, auto-dismisses or can be manually dismissed
- **Optimistic UI**: `useOptimisticTodos` hook — changes appear instantly, rollback on API failure
- Client generates UUIDs via `crypto.randomUUID()` and sends them with POST

### Test Isolation Strategy

- Each test file should handle its own setup/teardown
- Use `beforeEach` to navigate to the app and ensure clean state
- For database cleanup between tests, either:
  - Use API calls to delete all todos before each test (`GET /api/todos` then `DELETE` each)
  - Or rely on a fresh database per test run
- Avoid inter-test dependencies — each journey should be self-contained

### Accessibility Testing with axe-core

- Install `@axe-core/playwright` (NOT `axe-core` directly — the Playwright integration)
- Usage pattern:
  ```typescript
  import AxeBuilder from '@axe-core/playwright'
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0)
  ```
- axe-core 4.11.1 is already a dev dependency in the main project (used in unit tests) — the Playwright wrapper provides its own bundled version

### Error Simulation Pattern (Journey 4)

- Use Playwright's `page.route()` to intercept API calls:
  ```typescript
  await page.route('**/api/todos', route => route.fulfill({ status: 500, body: JSON.stringify({ error: { message: 'Server error', code: 'INTERNAL_ERROR' } }) }))
  ```
- After verifying rollback and error banner, unroute to restore normal API:
  ```typescript
  await page.unroute('**/api/todos')
  ```
- Then verify recovery by performing a successful operation

### File Naming Convention

- E2E test files use `.spec.ts` suffix (NOT `.test.ts` — that's for Vitest unit/integration tests)
- File names: kebab-case matching journey names
- Architecture specifies these exact files:
  - `e2e/tests/create-todo.spec.ts` — Journey 1
  - `e2e/tests/complete-todo.spec.ts` — Journey 2
  - `e2e/tests/edit-delete-todo.spec.ts` — Journey 3 (combining edit + delete)
  - `e2e/tests/error-handling.spec.ts` — Journey 4
  - `e2e/tests/accessibility.spec.ts` — Journey 5

### Previous Story Intelligence (5.1)

- **261 tests** is the current baseline — all must continue passing
- **Coverage: 97.88% statements, 94.47% branches, 99% functions, 98.50% lines** — well above 70% threshold
- Test co-location pattern: unit/integration tests use `.test.ts`/`.test.tsx` beside source files — E2E tests are separate in `e2e/tests/`
- npm cache EACCES errors were encountered — if this occurs, use `--cache /tmp/npm-cache-fix`
- `@vitest/coverage-v8` must be 4.x to match Vitest 4.0.0
- Vitest config has two projects: `client` (jsdom) and `server` (node) — E2E tests are NOT run by Vitest

### Git Commit Pattern

- Implementation commit followed by code review fix commit is the established pattern
- Commit messages: descriptive, prefixed with action (Implement, Fix, Add)

### Critical Warnings

1. DO NOT create unit tests — this story is E2E only via Playwright
2. DO NOT mock the backend in Journeys 1-3 and 5 — full stack integration
3. DO NOT modify production source code — testing-only changes
4. DO NOT add test files to client/src/ or server/src/ — E2E tests go in `e2e/tests/`
5. DO NOT use `.test.ts` suffix for E2E files — use `.spec.ts`
6. DO NOT install Cypress or any other E2E framework — Playwright only
7. DO NOT change the existing playwright.config.ts unless strictly necessary
8. Existing 261 unit/integration tests must pass with zero regressions after this story

### Project Structure Notes

- E2E tests live in `e2e/tests/` — separate from co-located unit tests
- `e2e/` is an npm workspace with its own `package.json` and `@playwright/test` dependency
- `e2e/playwright.config.ts` already exists and is properly configured
- No conflicts with existing test infrastructure (Vitest handles unit/integration, Playwright handles E2E)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 Story 5.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing Framework]
- [Source: _bmad-output/planning-artifacts/architecture.md#E2E Test Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#CI/CD Pipeline]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Endpoints]
- [Source: _bmad-output/implementation-artifacts/5-1-unit-integration-tests.md#Dev Notes]
- [Source: _bmad-output/project-context.md#Testing Configuration]

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List

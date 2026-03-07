# Story 5.4: Docker Deployment & CI Pipeline

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want to deploy the entire application with a single command and have CI enforce quality gates,
so that the app is production-ready and maintainable (NFR21, NFR23-NFR25).

## Acceptance Criteria

1. **Client Docker image uses multi-stage build** — Stage 1: Vite build (npm install + npm run build). Stage 2: Nginx Alpine serving `dist/` static files. Container runs as non-root user (NFR24).
2. **Server Docker image uses multi-stage build** — Stage 1: TypeScript compile (npm install + npm run build). Stage 2: Node.js 22 Alpine with production dependencies only. Container runs as non-root user (NFR24).
3. **`docker-compose up` starts full application** — Nginx serves frontend on port 80, proxies `/api/*` to server container on port 3001. SQLite data persists via a named Docker volume (NFR23, NFR12).
4. **Environment variables configurable via Docker** — PORT, DATABASE_PATH, CORS_ORIGIN, and NODE_ENV are passed to the server container. Defaults: PORT=3001, DATABASE_PATH=/data/todos.db, CORS_ORIGIN=http://localhost, NODE_ENV=production (NFR25).
5. **GitHub Actions CI pipeline runs on push** — Pipeline stages: lint → unit/integration tests → E2E tests → Docker build verification. All steps must pass before merge (NFR21).
6. **README provides setup documentation** — Clear instructions for local development (npm scripts) and Docker deployment (docker-compose up).

## Tasks / Subtasks

- [ ] Task 1: Create Dockerfile.client (AC: #1)
  - [ ] 1.1 Create `Dockerfile.client` at project root
  - [ ] 1.2 Stage 1 (`build`): FROM node:22-alpine, WORKDIR /app, copy root package.json + package-lock.json + client/package.json, run `npm ci --workspace=client`, copy client/ source, run `npm run build -w client`
  - [ ] 1.3 Stage 2 (`production`): FROM nginx:alpine, copy custom `docker/nginx.conf` to `/etc/nginx/nginx.conf`, copy `--from=build /app/client/dist /usr/share/nginx/html`
  - [ ] 1.4 Add non-root user: create `nginx` user (or use built-in), ensure Nginx runs as non-root by configuring `user` directive or pid/temp paths
  - [ ] 1.5 Expose port 80, set CMD to run nginx in foreground: `nginx -g 'daemon off;'`
- [ ] Task 2: Create docker/nginx.conf (AC: #3)
  - [ ] 2.1 Create `docker/` directory and `nginx.conf` file
  - [ ] 2.2 Configure server block: listen 80, root /usr/share/nginx/html, index index.html
  - [ ] 2.3 Configure `/api` proxy: `proxy_pass http://server:3001;` with proxy headers (Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)
  - [ ] 2.4 Configure SPA fallback: `try_files $uri $uri/ /index.html;` for client-side routing support
  - [ ] 2.5 Add gzip compression for text/html, text/css, application/javascript, application/json
- [ ] Task 3: Create Dockerfile.server (AC: #2)
  - [ ] 3.1 Create `Dockerfile.server` at project root
  - [ ] 3.2 Stage 1 (`build`): FROM node:22-alpine, WORKDIR /app, copy root package.json + package-lock.json + server/package.json, run `npm ci --workspace=server`, copy server/ source + tsconfig.base.json, run `npm run build -w server`
  - [ ] 3.3 Stage 2 (`production`): FROM node:22-alpine, WORKDIR /app, copy server/package.json + root package.json + package-lock.json, run `npm ci --workspace=server --omit=dev`, copy `--from=build /app/server/dist ./dist`
  - [ ] 3.4 Add non-root user: `RUN addgroup -S appgroup && adduser -S appuser -G appgroup`, `USER appuser`
  - [ ] 3.5 Create /data directory owned by appuser for SQLite volume mount
  - [ ] 3.6 Set ENV defaults: NODE_ENV=production, PORT=3001, DATABASE_PATH=/data/todos.db
  - [ ] 3.7 Expose port 3001, CMD `["node", "dist/index.js"]`
- [ ] Task 4: Create docker-compose.yml (AC: #3, #4)
  - [ ] 4.1 Create `docker-compose.yml` at project root
  - [ ] 4.2 Define `client` service: build context `.` with Dockerfile `Dockerfile.client`, ports `80:80`, depends_on server
  - [ ] 4.3 Define `server` service: build context `.` with Dockerfile `Dockerfile.server`, ports `3001:3001` (optional, for direct access), environment vars (PORT, DATABASE_PATH, CORS_ORIGIN, NODE_ENV), volume mount for SQLite
  - [ ] 4.4 Define named volume `todo-data` for SQLite persistence, mount to `/data` in server container
  - [ ] 4.5 Set CORS_ORIGIN default to `http://localhost` (Nginx frontend origin)
  - [ ] 4.6 Add `CORS_ORIGIN` environment variable to server service in docker-compose.yml (was N/A in Story 5.3, now in scope)
- [ ] Task 5: Create .dockerignore (AC: #1, #2)
  - [ ] 5.1 Create `.dockerignore` at project root with: node_modules, dist, data/, *.db, .env, .env.*, coverage, playwright-report, test-results, .git, .github, _bmad*, .claude, .cursor, .windsurf, e2e (for client build), README.md
- [ ] Task 6: Create GitHub Actions CI pipeline (AC: #5)
  - [ ] 6.1 Create `.github/workflows/ci.yml`
  - [ ] 6.2 Trigger on: push to main, pull_request to main
  - [ ] 6.3 Job 1 - Lint: checkout, setup node 22, npm ci, run `npx tsc -b` in client and server (TypeScript check serves as lint)
  - [ ] 6.4 Job 2 - Test: checkout, setup node 22, npm ci, run `npm run test:coverage` (includes 70% threshold enforcement)
  - [ ] 6.5 Job 3 - E2E: checkout, setup node 22, npm ci, install Playwright browsers, start dev servers (client :5173 + server :3001), run `npm run test:e2e`, upload playwright-report as artifact on failure
  - [ ] 6.6 Job 4 - Docker Build: checkout, run `docker-compose build` to verify images build successfully (no push)
  - [ ] 6.7 Ensure jobs run sequentially or with appropriate dependencies: lint → test → e2e → docker-build
- [ ] Task 7: Update README.md (AC: #6)
  - [ ] 7.1 Create/update README.md with project overview, tech stack summary
  - [ ] 7.2 Add "Local Development" section: prerequisites (Node.js 22, npm), install (`npm install`), run dev (`npm run dev:client` + `npm run dev:server`), run tests (`npm test`, `npm run test:e2e`)
  - [ ] 7.3 Add "Docker Deployment" section: prerequisites (Docker, Docker Compose), run (`docker-compose up --build`), stop (`docker-compose down`), data persistence note (named volume)
  - [ ] 7.4 Add "Environment Variables" section referencing .env.example
  - [ ] 7.5 Add "CI/CD" section describing GitHub Actions pipeline
- [ ] Task 8: Verify full integration (AC: #1-#6)
  - [ ] 8.1 Run `docker-compose up --build` and verify: frontend loads on localhost:80, can create/read/update/delete todos via UI, data persists across `docker-compose down && docker-compose up`
  - [ ] 8.2 Verify all 277 unit/integration tests + 16 E2E tests pass with zero regressions
  - [ ] 8.3 Verify health check: `curl http://localhost/api/health` returns 200 with `{ status: "ok" }`

## Dev Notes

### What Already Exists (DO NOT Recreate)

- **Express server** fully configured with Helmet.js, CORS, JSON parsing, routes, error handler — `server/src/index.ts`
- **Vite build** configured in `client/vite.config.ts` — outputs to `client/dist/`
- **TypeScript build** configured in `server/tsconfig.json` — outputs to `server/dist/`
- **npm workspace** monorepo with scripts: `npm run build` builds both packages, `npm test` runs Vitest, `npm run test:e2e` runs Playwright
- **.env.example** at root with PORT, DATABASE_PATH, CORS_ORIGIN, NODE_ENV
- **Environment variables already consumed in code**: PORT in `server/src/index.ts`, DATABASE_PATH in `server/src/db/init.ts`, CORS_ORIGIN in `server/src/index.ts`
- **277 unit/integration tests + 16 E2E tests** — all must continue passing

### Architecture & Stack Constraints

**Docker Image Requirements (from architecture.md):**
- Client image: Nginx Alpine serving Vite static build
- Server image: Node.js 22 Alpine with production deps
- Both containers: multi-stage builds, non-root users
- Named Docker volume for SQLite persistence at `/data/todos.db`
- Nginx proxies `/api/*` to `server:3001` (Docker internal networking)

**CI Pipeline Requirements (from architecture.md):**
- GitHub Actions workflow
- Stages: lint → test → e2e → Docker build verification
- All steps must pass before merge
- Playwright configured with `forbidOnly: !!process.env.CI` and `retries: process.env.CI ? 2 : 0`

**Server Startup Details:**
- `server/src/index.ts` listens on `process.env.PORT || 3001`
- `server/src/db/init.ts` reads `process.env.DATABASE_PATH || './data/todos.db'` — creates parent directory automatically via `fs.mkdirSync(path.dirname(resolvedPath), { recursive: true })`
- Uses WAL journal mode for SQLite
- Only starts listening when `NODE_ENV !== 'test'`

**Client Build Details:**
- `client/package.json` build script: `tsc -b && vite build` — outputs to `client/dist/`
- Vite dev server proxy: `/api` → `http://localhost:3001` (dev only, not relevant for Docker)
- No explicit output directory in vite.config.ts — uses Vite default `dist/`

### Workspace npm ci Considerations

The monorepo uses npm workspaces. For Docker builds:
- Root `package.json` + `package-lock.json` must be copied to resolve dependencies
- Use `npm ci --workspace=client` or `npm ci --workspace=server` to install only the needed workspace deps
- For production server: `npm ci --workspace=server --omit=dev` excludes devDependencies (tsx, vitest, types)
- `tsconfig.base.json` is required during server build (server/tsconfig.json extends it)

### Nginx Configuration Notes

- Nginx Alpine image already includes a default user configuration
- For non-root: configure Nginx to write pid file and temp directories to locations writable by non-root user, OR use `nginx:alpine-slim` and adjust config
- SPA fallback (`try_files $uri $uri/ /index.html`) ensures client-side React routing works (even though there's no router currently, this is a best practice)
- Proxy `/api` to `http://server:3001` using Docker Compose service name resolution
- Add proxy headers for proper IP forwarding

### E2E Tests in CI

- Playwright expects frontend at `http://localhost:5173` (Vite dev server)
- In CI, run dev servers (not Docker) for E2E since E2E is a separate pipeline step
- E2E step needs both `npm run dev:client` and `npm run dev:server` running before test execution
- Use `npx wait-on` or similar to wait for servers to be ready
- Set `CI=true` environment variable so Playwright enables `forbidOnly` and retries
- Playwright browsers need installation: `npx playwright install --with-deps chromium`

### Docker Build Verification in CI

- The Docker build step only verifies images build successfully — no container startup test
- `docker compose build` (or `docker-compose build`) confirms Dockerfiles are valid
- This catches build errors early without needing to run the full stack in CI

### Previous Story Intelligence (5.3)

- **277 tests (276 pass, 1 pre-existing flaky)** — the flaky test is `queries.test.ts > sets updated_at to a valid timestamp on update` which fails near UTC midnight. CI should handle this with retries or by accepting this known flake.
- **Middleware order confirmed**: helmet() → cors() → express.json() → routes → error handler
- `CORS_ORIGIN` env var is consumed in `server/src/index.ts` — Docker must pass this
- `npm cache EACCES` errors possible — use `--cache /tmp/npm-cache-fix` if needed in Docker
- Task 7.2 from Story 5.3 was N/A (no docker-compose.yml) — this story fulfills it by adding CORS_ORIGIN to docker-compose.yml

### Git Intelligence (Recent Commits)

```
27bc511 Fix code review issues for story 5.3: CORS test coverage, env var docs
9c6d3a4 Implement story 5.3: Security hardening with Helmet.js and CORS
0474b51 Add story 5.3 security hardening spec and update sprint status
2c7f974 Fix code review issues for story 5.2: race condition, error coverage, shared fixtures
ba3c635 Implement story 5.2: E2E browser tests with Playwright
```

Pattern: descriptive commit messages prefixed with action verb. Two-commit pattern per story (implement + code review fixes).

### Critical Warnings

1. DO NOT modify any existing source files in `server/src/` or `client/src/` — this story only creates new infrastructure files (Dockerfiles, nginx.conf, docker-compose.yml, ci.yml, README.md).
2. DO NOT install new npm packages — all dependencies are already in place.
3. DO NOT change Playwright config or E2E tests — they must work as-is in CI.
4. The `server/dist/` directory includes `.js` files with `.js` import extensions (ES modules with NodeNext resolution) — the Docker CMD must run `node dist/index.js` exactly.
5. better-sqlite3 is a native addon — the Docker build stage and production stage MUST use the same platform (both node:22-alpine). Do NOT build on one platform and copy to another.
6. Root `package-lock.json` is required for `npm ci` — must be copied into Docker build context.
7. Nginx must handle the `/api` prefix correctly — `proxy_pass http://server:3001;` (with trailing semicolon, NO trailing slash to avoid path rewriting).
8. SQLite volume mount: the `server/src/db/init.ts` auto-creates the parent directory, but the Docker volume mount must target `/data` and DATABASE_PATH must be `/data/todos.db` so the volume persists the database file.
9. All 277 tests must pass after changes — run `npm test` and `npm run test:e2e` to verify zero regressions.

### Project Structure Notes

Files to CREATE (all new):
- `Dockerfile.client` — Multi-stage Nginx Alpine build
- `Dockerfile.server` — Multi-stage Node.js 22 Alpine build
- `docker/nginx.conf` — Nginx configuration with API proxy
- `docker-compose.yml` — Service orchestration
- `.dockerignore` — Build context exclusions
- `.github/workflows/ci.yml` — GitHub Actions CI pipeline
- `README.md` — Project documentation (create or update if exists)

Files to NOT modify:
- `server/src/*` — All server source code
- `client/src/*` — All client source code
- `e2e/*` — All E2E test files
- `package.json` (root, client, server) — No script or dependency changes needed
- `.env.example` — Already has all needed variables

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 Story 5.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Development Workflow Integration]
- [Source: _bmad-output/project-context.md#Development Workflow Rules]
- [Source: _bmad-output/implementation-artifacts/5-3-security-hardening.md#Dev Notes]
- [Source: server/src/index.ts — Server startup and middleware]
- [Source: server/src/db/init.ts — Database path and initialization]
- [Source: client/vite.config.ts — Build and proxy configuration]
- [Source: e2e/playwright.config.ts — E2E test configuration]
- [Source: .env.example — Environment variable template]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

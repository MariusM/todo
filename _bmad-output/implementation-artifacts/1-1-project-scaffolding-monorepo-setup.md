# Story 1.1: Project Scaffolding & Monorepo Setup

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want a fully configured monorepo with frontend (Vite + React + TypeScript) and backend (Express + TypeScript) packages,
so that I have a working development environment to build features on.

## Acceptance Criteria

1. **Given** a fresh checkout of the repository **When** I run `npm install` at the root **Then** all dependencies for client and server packages are installed **And** the project structure matches the architecture spec (client/, server/, e2e/ directories)

2. **Given** the monorepo is set up **When** I run the frontend dev server **Then** Vite serves a React app on localhost with HMR working

3. **Given** the monorepo is set up **When** I run the backend dev server **Then** Express starts on port 3001 and responds to requests

4. **Given** the project is configured **When** I check TypeScript compilation **Then** both client and server compile with zero errors using their respective tsconfig files

5. **Given** the project is configured **When** I inspect the Tailwind CSS setup **Then** Tailwind 4.2 is configured with the custom design tokens from the UX spec (color palette, typography, spacing scale)

## Tasks / Subtasks

- [x] Task 1: Initialize root monorepo (AC: #1)
  - [x] 1.1 Create root `package.json` with `"private": true` and `"workspaces": ["client", "server", "e2e"]`
  - [x] 1.2 Create `tsconfig.base.json` with shared TypeScript strict-mode settings (ES modules, strict: true)
  - [x] 1.3 Create `.gitignore` (node_modules, dist, *.db, .env, coverage)
  - [x] 1.4 Create `.env.example` with PORT=3001, DATABASE_PATH=./data/todos.db, CORS_ORIGIN=http://localhost, NODE_ENV=development
- [x] Task 2: Scaffold frontend client package (AC: #1, #2, #5)
  - [x] 2.1 Scaffold with `npm create vite@latest client -- --template react-ts` (Vite 7.3 + React 19.2)
  - [x] 2.2 Install Tailwind CSS 4.2 via Vite plugin: `npm i tailwindcss @tailwindcss/vite`
  - [x] 2.3 Configure `vite.config.ts` with `@tailwindcss/vite` plugin and API proxy (`/api` -> `http://localhost:3001`)
  - [x] 2.4 Set up `client/src/index.css` with `@import "tailwindcss"` and `@theme` directives for UX design tokens
  - [x] 2.5 Create `client/tsconfig.json` extending `../tsconfig.base.json`
  - [x] 2.6 Create empty directory structure: `src/components/`, `src/hooks/`, `src/api/`, `src/types/`
  - [x] 2.7 Create placeholder `client/src/types/todo.ts` with Todo, CreateTodoRequest, ApiError types
  - [x] 2.8 Clean up Vite boilerplate (remove App.css, default counter code) — set up minimal App.tsx
- [x] Task 3: Scaffold backend server package (AC: #1, #3)
  - [x] 3.1 Create `server/package.json` with Express 5.2, better-sqlite3, TypeScript, tsx (dev runner) dependencies
  - [x] 3.2 Create `server/tsconfig.json` extending `../tsconfig.base.json` (target ES2022, module NodeNext)
  - [x] 3.3 Create `server/src/index.ts` — minimal Express app that listens on PORT env var (default 3001)
  - [x] 3.4 Create empty directory structure: `src/routes/`, `src/middleware/`, `src/db/`, `src/types/`
  - [x] 3.5 Create placeholder `server/src/types/todo.ts` mirroring client types (no cross-package imports)
  - [x] 3.6 Add `"dev": "tsx watch src/index.ts"` script for auto-reload
- [x] Task 4: Scaffold E2E test package (AC: #1)
  - [x] 4.1 Create `e2e/package.json` with Playwright 1.58 dependency
  - [x] 4.2 Create `e2e/playwright.config.ts` with baseURL pointing to localhost:5173, Chromium browser config
  - [x] 4.3 Create empty `e2e/tests/` directory
- [x] Task 5: Configure Vitest for both packages (AC: #4)
  - [x] 5.1 Add Vitest 4.0 as devDependency to root or both packages
  - [x] 5.2 Configure `client/vite.config.ts` with Vitest test config (environment: jsdom, globals: true)
  - [x] 5.3 Configure server Vitest config (environment: node)
  - [x] 5.4 Add root-level `"test"` script that runs tests across all workspaces
- [x] Task 6: Add root npm scripts (AC: #1, #2, #3)
  - [x] 6.1 Add `"dev:client"` and `"dev:server"` scripts
  - [x] 6.2 Add `"build"` script building both packages
  - [x] 6.3 Add `"test"` script running Vitest across workspaces
  - [x] 6.4 Verify `npm install` at root installs all workspace dependencies
- [x] Task 7: Verify all acceptance criteria (AC: #1-#5)
  - [x] 7.1 Run `npm install` from fresh state — zero errors
  - [x] 7.2 Run `npm run dev:client` — Vite serves on :5173 with HMR
  - [x] 7.3 Run `npm run dev:server` — Express responds on :3001
  - [x] 7.4 Run TypeScript compilation on both packages — zero errors
  - [x] 7.5 Verify Tailwind classes render correctly in client

## Dev Notes

### Architecture Compliance

**Project Structure — MUST match exactly:**
```
todo/
├── client/                    # Frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── api/               # API client functions (empty for now)
│   │   ├── components/        # React components (empty for now)
│   │   ├── hooks/             # Custom hooks (empty for now)
│   │   ├── types/
│   │   │   └── todo.ts        # Todo, CreateTodoRequest, ApiError types
│   │   ├── App.tsx            # Minimal root component
│   │   ├── main.tsx           # React entry point
│   │   └── index.css          # Tailwind @import + @theme design tokens
│   ├── index.html
│   ├── vite.config.ts         # Vite + Tailwind plugin + Vitest config + API proxy
│   ├── tsconfig.json
│   └── package.json
├── server/                    # Backend (Express + TypeScript + SQLite)
│   ├── src/
│   │   ├── db/                # Empty for now
│   │   ├── middleware/        # Empty for now
│   │   ├── routes/            # Empty for now
│   │   ├── types/
│   │   │   └── todo.ts        # Server-side types (mirrors client)
│   │   └── index.ts           # Minimal Express app
│   ├── tsconfig.json
│   └── package.json
├── e2e/                       # Playwright E2E tests
│   ├── tests/                 # Empty for now
│   ├── playwright.config.ts
│   └── package.json
├── .env.example
├── .gitignore
├── package.json               # Root workspace config
└── tsconfig.base.json         # Shared TypeScript config
```

### Technology Stack — Exact Versions

| Package | Version | Where | Install |
|---------|---------|-------|---------|
| react | 19.2.x | client | `npm i react react-dom` |
| vite | 7.3.x | client devDep | via `npm create vite@latest` |
| @vitejs/plugin-react | latest | client devDep | via `npm create vite@latest` |
| tailwindcss | 4.2.x | client devDep | `npm i -D tailwindcss @tailwindcss/vite` |
| @tailwindcss/vite | latest | client devDep | installed with tailwindcss |
| typescript | 5.x | root or both devDep | `npm i -D typescript` |
| express | 5.2.x | server | `npm i express` |
| @types/express | latest | server devDep | `npm i -D @types/express` |
| better-sqlite3 | 11.x+ | server | `npm i better-sqlite3` |
| @types/better-sqlite3 | latest | server devDep | `npm i -D @types/better-sqlite3` |
| tsx | latest | server devDep | `npm i -D tsx` |
| vitest | 4.0.x | both devDep | `npm i -D vitest` |
| @testing-library/react | latest | client devDep | `npm i -D @testing-library/react` |
| jsdom | latest | client devDep | `npm i -D jsdom` |
| @playwright/test | 1.58.x | e2e | `npm i @playwright/test` |

### Tailwind CSS 4.2 Setup — CSS-Native @theme (NO tailwind.config.js)

Tailwind 4.2 uses CSS-first configuration. There is **no tailwind.config.js file**.

**client/src/index.css:**
```css
@import "tailwindcss";

@theme {
  /* Color system from UX spec — warm neutrals (stone palette) */
  --color-surface: #FFFFFF;
  --color-surface-secondary: #FAFAF9;
  --color-border: #E7E5E4;
  --color-border-focus: #2563EB;
  --color-text-primary: #1C1917;
  --color-text-secondary: #78716C;
  --color-text-muted: #A8A29E;
  --color-accent: #2563EB;
  --color-accent-hover: #1D4ED8;
  --color-error-bg: #FEF2F2;
  --color-error-text: #991B1B;
  --color-error-border: #FECACA;
  --color-completed-text: #A8A29E;
  --color-checkbox-fill: #2563EB;

  /* Typography — system font stack, no custom fonts */
  --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  --font-size-base: 1rem;        /* 16px */
  --font-size-sm: 0.875rem;      /* 14px */
  --font-size-lg: 1.125rem;      /* 18px */
  --font-size-xl: 1.25rem;       /* 20px */

  /* Spacing — 8px unit system */
  --spacing-unit: 0.5rem;        /* 8px */

  /* Layout constraints */
  --max-content-width: 40rem;    /* 640px */

  /* Transitions */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
}
```

**client/vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
  }
})
```

### Express 5.2 — Key Differences from Express 4

- **Async error handling is automatic** — rejected promises in route handlers pass to error middleware without try/catch
- **Route wildcards must be named:** use `/*splat` not `/*`
- `req.query` is read-only
- Use `app.delete()` not `app.del()`
- Use `res.status(code).send(body)` pattern

**Minimal server/src/index.ts:**
```typescript
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

### TypeScript Configuration

**tsconfig.base.json (shared):**
```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force"
  }
}
```

**client/tsconfig.json** extends base with: `"target": "ES2020"`, `"module": "ESNext"`, `"jsx": "react-jsx"`, Vite client types.

**server/tsconfig.json** extends base with: `"target": "ES2022"`, `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"outDir": "./dist"`.

### Shared Types (Mirrored, NOT Cross-Imported)

```typescript
// Both client/src/types/todo.ts AND server/src/types/todo.ts
export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string  // ISO 8601
  updatedAt: string  // ISO 8601
}

export interface CreateTodoRequest {
  id: string   // UUID generated client-side
  text: string
}

export interface ApiError {
  error: {
    message: string
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR'
  }
}
```

### npm Workspaces Configuration

**Root package.json:**
```json
{
  "name": "todo",
  "private": true,
  "workspaces": ["client", "server", "e2e"],
  "scripts": {
    "dev:client": "npm run dev -w client",
    "dev:server": "npm run dev -w server",
    "build": "npm run build -w client && npm run build -w server",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Naming Convention Enforcement

| Context | Convention | Example |
|---------|-----------|---------|
| React component files | PascalCase | `TaskInput.tsx` |
| Non-component files | kebab-case | `todo-routes.ts`, `error-handler.ts` |
| Hooks | camelCase with use prefix | `useOptimisticTodos.ts` |
| Test files | Co-located, `.test.ts(x)` suffix | `TaskInput.test.tsx` |
| Types/interfaces | PascalCase | `Todo`, `ApiError` |
| Variables/functions | camelCase | `getTodos`, `isCompleted` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PORT` |
| DB columns | snake_case | `created_at` |
| API JSON fields | camelCase | `createdAt` |

### Anti-Patterns — DO NOT

- Do NOT create a `tailwind.config.js` — Tailwind 4.2 uses CSS-native @theme
- Do NOT install axios, lodash, or any explicitly excluded library
- Do NOT create `__tests__/` directories — tests are co-located
- Do NOT use `require()` — ES modules only (`import`/`export`)
- Do NOT use `any` type — use proper typing or `unknown`
- Do NOT create utility/helper files for one-time operations
- Do NOT add React Router or any routing library — single view app
- Do NOT add Context providers, Redux, Zustand, or any state library
- Do NOT cross-import between client and server packages at runtime

### Project Structure Notes

- Alignment with unified project structure: client/, server/, e2e/ are top-level workspace directories (NOT nested under packages/)
- Vite proxy config handles `/api` routing during development so client and server can run on different ports
- The `e2e/` package is separate because it tests the full stack and has its own dependency (Playwright)
- Docker and CI files are NOT part of this story — they come in Story 5.4

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Tokens]
- [Source: _bmad-output/project-context.md#Technology Stack & Versions]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- npm cache permission issue (root-owned files in ~/.npm/_cacache) — worked around with `--cache /tmp/npm-cache`
- Vitest 4.0 removed `test.workspace` in favor of `test.projects` — updated root vitest.config.ts accordingly
- Client scaffolded manually instead of `npm create vite@latest` due to npm cache permission issue

### Completion Notes List

- All 7 tasks and 30 subtasks completed successfully
- Monorepo with npm workspaces: client/, server/, e2e/ packages
- Root package.json with dev:client, dev:server, build, test, test:watch scripts
- Client: Vite 7.3 + React 19.2 + Tailwind CSS 4.2 (CSS-native @theme) + TypeScript
- Server: Express 5.2 + better-sqlite3 + TypeScript + tsx watch
- E2E: Playwright 1.58 configured with Chromium
- Vitest 4.0 configured with projects (client: jsdom, server: node)
- TypeScript strict mode with zero compilation errors in both packages
- Co-located test files: App.test.tsx (client), index.test.ts (server) — both passing
- Design tokens from UX spec implemented in index.css @theme block

### Change Log

- 2026-03-04: Initial scaffolding — full monorepo setup with all packages, configs, types, and test infrastructure

### File List

- package.json (new)
- package-lock.json (new)
- tsconfig.base.json (new)
- vitest.config.ts (new)
- .gitignore (modified)
- .env.example (new)
- client/package.json (new)
- client/index.html (new)
- client/vite.config.ts (new)
- client/tsconfig.json (new)
- client/src/main.tsx (new)
- client/src/App.tsx (new)
- client/src/App.test.tsx (new)
- client/src/index.css (new)
- client/src/vite-env.d.ts (new)
- client/src/types/todo.ts (new)
- server/package.json (new)
- server/tsconfig.json (new)
- server/vitest.config.ts (new)
- server/src/index.ts (new)
- server/src/index.test.ts (new)
- server/src/types/todo.ts (new)
- e2e/package.json (new)
- e2e/playwright.config.ts (new)

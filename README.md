# Todo App

A full-stack todo application built with React, Express, and SQLite.

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS 4, TypeScript
- **Backend:** Express 5, better-sqlite3, TypeScript
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Infrastructure:** Docker, Nginx, GitHub Actions CI

## Local Development

### Prerequisites

- Node.js 22 LTS
- npm

### Setup

```bash
npm install
```

### Run Development Servers

```bash
# Start backend (port 3001)
npm run dev:server

# Start frontend (port 5173)
npm run dev:client
```

### Run Tests

```bash
# Unit and integration tests
npm test

# With coverage report
npm run test:coverage

# E2E tests (requires dev servers running)
npm run test:e2e
```

## Docker Deployment

### Prerequisites

- Docker
- Docker Compose

### Run

```bash
docker compose up --build
```

The app will be available at `http://localhost`. Nginx serves the frontend and proxies `/api/*` requests to the backend.

### Stop

```bash
docker compose down
```

### Data Persistence

SQLite data is stored in a named Docker volume (`todo-data`). Data persists across `docker compose down` and `docker compose up` cycles. To remove the volume and reset data:

```bash
docker compose down -v
```

## Environment Variables

See `.env.example` for all available environment variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `DATABASE_PATH` | `./data/todos.db` | SQLite database file path |
| `CORS_ORIGIN` | `http://localhost` | Allowed CORS origin |
| `NODE_ENV` | `development` | Node environment |

## CI/CD

GitHub Actions runs on push and pull requests to `main`:

1. **Lint** - TypeScript type checking for client and server
2. **Test** - Unit and integration tests with coverage (70% threshold)
3. **E2E** - Playwright browser tests
4. **Docker Build** - Verifies Docker images build successfully

All steps must pass before merge.

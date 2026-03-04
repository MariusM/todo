---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
---

# todo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for todo, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: User can create a new todo by entering a text description
- FR2: User can view all todos in a single list
- FR3: User can edit the text description of an existing todo
- FR4: User can mark a todo as complete
- FR5: User can mark a completed todo as incomplete (toggle)
- FR6: User can delete a todo permanently
- FR7: User can distinguish completed todos from active todos visually
- FR8: System persists all todos across browser sessions
- FR9: System persists todo completion status across sessions
- FR10: System records creation timestamp for each todo
- FR11: System maintains data consistency after any CRUD operation
- FR12: System prevents creation of empty or whitespace-only todos
- FR13: System handles long text descriptions without breaking layout
- FR14: User can submit a new todo by pressing Enter
- FR15: System displays error messages that identify the failed action and provide retry guidance when API operations fail
- FR16: System reverts UI to previous state when an operation fails (optimistic rollback)
- FR17: System displays an empty state with instructional text and a visible input prompt when no todos exist
- FR18: System displays a loading state while fetching data
- FR19: System provides visual feedback when a todo is created, completed, or deleted
- FR20: User can access and use all features on mobile devices
- FR21: User can access and use all features on desktop devices
- FR22: System renders single-column layout on mobile (< 768px) and centered content layout on desktop (> 1024px)
- FR23: User can navigate and operate all features using only a keyboard
- FR24: Screen reader users can perceive todo status and perform all actions
- FR25: System provides sufficient color contrast for all text and interactive elements
- FR26: System exposes a health check endpoint reporting operational status
- FR27: System provides a REST API supporting all CRUD operations on todos
- FR28: API returns JSON error responses with an error message field, using 400 for validation errors, 404 for missing resources, and 500 for server errors

### NonFunctional Requirements

- NFR1: All CRUD operations complete with UI feedback in under 200ms (optimistic updates)
- NFR2: Initial page load (First Contentful Paint) under 1.5 seconds
- NFR3: Time to Interactive under 2 seconds
- NFR4: API response times under 200ms for all endpoints
- NFR5: API validates and sanitizes all user input to prevent injection attacks (XSS, SQL injection)
- NFR6: API rejects malformed requests with appropriate error codes
- NFR7: No sensitive data exposed in client-side code or API error responses
- NFR8: WCAG AA compliance — zero critical violations
- NFR9: Minimum 4.5:1 color contrast ratio for all text
- NFR10: All interactive elements reachable and operable via keyboard
- NFR11: Dynamic content changes announced to screen readers
- NFR12: Zero data loss during normal operations — all persisted todos survive server restarts and browser refreshes
- NFR13: Failed API operations never leave the system in an inconsistent state
- NFR14: Application recovers gracefully from network interruptions without data corruption
- NFR15: Codebase structured for clear separation between frontend and backend
- NFR16: Code is readable and well-organized enough for a new developer to understand without guidance
- NFR17: Architecture supports future addition of authentication and multi-user features without major refactoring
- NFR18: Minimum 70% meaningful code coverage across unit and integration tests
- NFR19: Minimum 5 passing E2E browser tests covering core user journeys
- NFR20: Zero unhandled errors in core CRUD operations
- NFR21: All tests executable via CI pipeline
- NFR22: Health check endpoints report accurate system status
- NFR23: Application runs successfully via a single container orchestration command
- NFR24: Container images use multi-stage builds with non-root users
- NFR25: Environment configuration supported through environment variables

### Additional Requirements

**From Architecture:**
- Starter template: Vite react-ts + manual Express setup in monorepo structure (impacts Epic 1 Story 1)
- Tech stack: React 19.2, Express 5.2, TypeScript 5.x, Vite 7.3, Tailwind CSS 4.2, better-sqlite3, Vitest 4.0, Playwright 1.58
- Database: SQLite with UUID primary keys (client-generated), single `todos` table, raw SQL with prepared statements
- API: REST with PATCH for partial updates, consistent error format `{ error: { message, code } }`
- Frontend state: Custom `useOptimisticTodos` hook with snapshot-apply-rollback pattern
- 5 React components: TaskInput, TaskItem, TaskList, ErrorBanner, EmptyState
- API client: Native `fetch` with typed wrapper in `api/todos.ts`
- Naming: snake_case (DB) ↔ camelCase (API/frontend) transformation at server boundary
- Co-located tests with `.test.ts`/`.test.tsx` suffix
- Docker: Nginx Alpine (client) + Node.js 22 Alpine (server), named volume for SQLite persistence
- Nginx proxies `/api/*` to server container
- CI/CD: GitHub Actions pipeline (lint → test → e2e → build)
- Security: Helmet.js, CORS restricted to frontend origin, input validation/sanitization
- No ORM, no routing library, no external state library, no axios

**From UX Design:**
- Design direction: Classic Minimal (paper checklist metaphor)
- Color system: Warm neutrals (stone palette), single blue accent (#2563EB), warm error tones
- Typography: System font stack, 16px base, 8px spacing unit
- Component specs: TaskInput (always-visible, Enter to submit, placeholder "What needs to be done?"), TaskItem (checkbox + text + delete ×, inline edit on click), TaskList (list container), ErrorBanner (non-blocking, warm messaging, positioned above task list), EmptyState (muted checkbox icon + "No tasks yet" + instruction text)
- Micro-interactions: ~200ms completion animation, ~150ms delete exit animation
- Focus management: Auto-focus input on load, retain focus after submit, move focus to next task after delete
- Touch targets: minimum 44x44px on mobile
- Responsive: Max 640px container centered on desktop, full width with 16px padding on mobile
- Inline editing: click text to edit, Enter/blur to save, Escape to cancel, empty edit reverts
- Error banner: warm language ("That didn't go through — your task is safe. Try again?"), dismissible, non-blocking

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Create todo by entering text |
| FR2 | Epic 1 | View all todos in list |
| FR3 | Epic 2 | Edit todo text |
| FR4 | Epic 2 | Mark todo complete |
| FR5 | Epic 2 | Toggle completed → incomplete |
| FR6 | Epic 2 | Delete todo permanently |
| FR7 | Epic 2 | Visual distinction for completed |
| FR8 | Epic 1 | Persist todos across sessions |
| FR9 | Epic 2 | Persist completion status |
| FR10 | Epic 1 | Record creation timestamp |
| FR11 | Epic 2 | Data consistency after CRUD |
| FR12 | Epic 1 | Prevent empty/whitespace todos |
| FR13 | Epic 2 | Handle long text without breaking layout |
| FR14 | Epic 1 | Submit via Enter key |
| FR15 | Epic 3 | Error messages identifying failed action |
| FR16 | Epic 3 | Optimistic rollback on failure |
| FR17 | Epic 1 | Empty state with instructional text |
| FR18 | Epic 1 | Loading state while fetching |
| FR19 | Epic 2 | Visual feedback on create/complete/delete |
| FR20 | Epic 4 | Mobile device access |
| FR21 | Epic 4 | Desktop device access |
| FR22 | Epic 4 | Responsive layout (mobile/desktop) |
| FR23 | Epic 4 | Keyboard navigation |
| FR24 | Epic 4 | Screen reader support |
| FR25 | Epic 4 | Color contrast compliance |
| FR26 | Epic 1 | Health check endpoint |
| FR27 | Epic 1 | REST API for CRUD |
| FR28 | Epic 1 | JSON error response format |

## Epic List

### Epic 1: Project Foundation & Core Task Creation
A user can open the app in a browser, see a welcoming empty state, and create their first todo — the complete "first encounter" experience (Clara's journey). Includes project scaffolding, database, REST API, health check, and the TaskInput, TaskList, and EmptyState components.
**FRs covered:** FR1, FR2, FR8, FR10, FR12, FR14, FR17, FR18, FR26, FR27, FR28

### Epic 2: Complete Task Management
A user can edit, complete, toggle, and delete tasks with visual feedback — full daily-use capability. Includes the TaskItem component with checkbox, inline editing, delete, visual distinction for completed tasks, completion persistence, data consistency, and long text handling.
**FRs covered:** FR3, FR4, FR5, FR6, FR7, FR9, FR11, FR13, FR19

### Epic 3: Error Handling & Resilience
When things go wrong, the user's data is safe and the app communicates clearly what happened. Implements the optimistic UI rollback pattern via the `useOptimisticTodos` hook and the ErrorBanner component with warm, reassuring messaging.
**FRs covered:** FR15, FR16

### Epic 4: Responsive Design & Accessibility
Any user can use the app on any device, with any input method, including screen readers and keyboard-only navigation. Covers responsive breakpoints, mobile-first layout, keyboard navigation, ARIA attributes, screen reader announcements, and color contrast compliance.
**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25

### Epic 5: Quality, Testing & Deployment
The app runs reliably via `docker-compose up`, with confidence backed by automated tests and CI. Primarily NFR-driven: unit/integration tests (NFR18), E2E Playwright tests (NFR19), GitHub Actions CI pipeline (NFR21), Docker Compose deployment (NFR23–NFR25), and security hardening (NFR5–NFR7).

## Epic 1: Project Foundation & Core Task Creation

A user can open the app in a browser, see a welcoming empty state, and create their first todo — the complete "first encounter" experience (Clara's journey).

### Story 1.1: Project Scaffolding & Monorepo Setup

As a **developer**,
I want a fully configured monorepo with frontend (Vite + React + TypeScript) and backend (Express + TypeScript) packages,
So that I have a working development environment to build features on.

**Acceptance Criteria:**

**Given** a fresh checkout of the repository
**When** I run `npm install` at the root
**Then** all dependencies for client and server packages are installed
**And** the project structure matches the architecture spec (client/, server/, e2e/ directories)

**Given** the monorepo is set up
**When** I run the frontend dev server
**Then** Vite serves a React app on localhost with HMR working

**Given** the monorepo is set up
**When** I run the backend dev server
**Then** Express starts on port 3001 and responds to requests

**Given** the project is configured
**When** I check TypeScript compilation
**Then** both client and server compile with zero errors using their respective tsconfig files

**Given** the project is configured
**When** I inspect the Tailwind CSS setup
**Then** Tailwind 4.2 is configured with the custom design tokens from the UX spec (color palette, typography, spacing scale)

### Story 1.2: Database & Health Check API

As a **user**,
I want the backend to have a working database and health check,
So that the system is ready to store my tasks and I can verify it's running.

**Acceptance Criteria:**

**Given** the server starts
**When** the database initializes
**Then** the `todos` table is created with columns: id (TEXT PK), text (TEXT NOT NULL), completed (INTEGER DEFAULT 0), created_at (TEXT), updated_at (TEXT)

**Given** the server is running
**When** I send GET `/api/health`
**Then** I receive 200 with `{ status: "ok", timestamp: "<ISO 8601>" }`
**And** FR26 is satisfied

**Given** the database file path is configured via `DATABASE_PATH` environment variable
**When** the server starts
**Then** it uses the configured path for SQLite storage (NFR25)

**Given** the server encounters an invalid request
**When** the error handler processes it
**Then** the response follows the format `{ error: { message, code } }` with no stack traces or internal paths exposed (FR28, NFR7)

### Story 1.3: Todo REST API — Create & Read

As a **user**,
I want to create and view todos via the API,
So that my tasks are stored and retrievable.

**Acceptance Criteria:**

**Given** no todos exist
**When** I send POST `/api/todos` with `{ id: "<uuid>", text: "Buy milk" }`
**Then** I receive 201 with the created todo including id, text, completed (false), createdAt, updatedAt in camelCase (FR1, FR27)
**And** the todo is persisted in the database with snake_case columns

**Given** todos exist in the database
**When** I send GET `/api/todos`
**Then** I receive 200 with an array of all todos ordered by created_at (FR2, FR27)
**And** each todo has camelCase fields (id, text, completed, createdAt, updatedAt)

**Given** a create request
**When** the text is empty or whitespace-only
**Then** I receive 400 with `{ error: { message: "Todo text cannot be empty", code: "VALIDATION_ERROR" } }` (FR12, FR28)

**Given** a create request
**When** the id is not a valid UUID format
**Then** I receive 400 with a VALIDATION_ERROR response

**Given** a todo is created
**When** I check its created_at field
**Then** it contains a valid ISO 8601 timestamp (FR10)

### Story 1.4: Frontend — Empty State, Loading State & Task Creation UI

As a **user**,
I want to open the app, see a welcoming empty state, type a task, and see it appear instantly,
So that I can capture my first thought in under 5 seconds (Clara's "aha" moment).

**Acceptance Criteria:**

**Given** the app loads and the API is being called
**When** the page renders initially
**Then** a loading state is displayed without layout shift (FR18)

**Given** no todos exist
**When** the loading completes
**Then** the EmptyState component displays with a muted checkbox icon, "No tasks yet" heading, and "Type a task above and press Enter to get started." instruction text (FR17)
**And** the TaskInput field is visible with placeholder "What needs to be done?"
**And** the input is auto-focused

**Given** the TaskInput is focused
**When** I type "Buy milk" and press Enter
**Then** the task appears instantly in the list below (FR1, FR14)
**And** the input clears and retains focus for rapid sequential entry
**And** the EmptyState disappears
**And** an API POST call fires in the background

**Given** the TaskInput is focused
**When** I press Enter with empty or whitespace-only input
**Then** nothing happens — no error, no API call (FR12)

**Given** I have created todos
**When** I refresh the browser
**Then** all todos appear in the list, persisted from the database (FR8)

## Epic 2: Complete Task Management

A user can edit, complete, toggle, and delete tasks with visual feedback — full daily-use capability.

### Story 2.1: Todo REST API — Update & Delete

As a **user**,
I want to update and delete todos via the API,
So that I can manage my tasks fully.

**Acceptance Criteria:**

**Given** a todo exists with id "abc-123"
**When** I send PATCH `/api/todos/abc-123` with `{ text: "Updated text" }`
**Then** I receive 200 with the updated todo (camelCase fields, updated_at refreshed) (FR3, FR27)
**And** other fields remain unchanged

**Given** a todo exists with id "abc-123"
**When** I send PATCH `/api/todos/abc-123` with `{ completed: true }`
**Then** I receive 200 with the todo showing completed: true (FR4, FR9)
**And** updated_at is refreshed

**Given** a completed todo exists
**When** I send PATCH with `{ completed: false }`
**Then** the todo is toggled back to active (FR5)

**Given** a todo exists with id "abc-123"
**When** I send DELETE `/api/todos/abc-123`
**Then** I receive 204 with no body (FR6)
**And** the todo is permanently removed from the database

**Given** no todo exists with id "nonexistent"
**When** I send PATCH or DELETE to `/api/todos/nonexistent`
**Then** I receive 404 with `{ error: { message: "Todo not found", code: "NOT_FOUND" } }` (FR28)

**Given** a PATCH request with empty text
**When** the server validates the input
**Then** I receive 400 with VALIDATION_ERROR (FR12)

**Given** any CRUD operation completes
**When** I check the database state
**Then** data is consistent — no partial updates, no orphaned records (FR11)

### Story 2.2: Task Completion & Visual Distinction

As a **user**,
I want to mark tasks complete and see them visually distinct from active tasks,
So that I can track my progress at a glance (Kai's daily use).

**Acceptance Criteria:**

**Given** an active todo is displayed
**When** I click/tap the checkbox
**Then** the checkbox fills with accent blue (#2563EB) with a white checkmark
**And** the task text gets strikethrough and muted color (#A8A29E)
**And** the transition animates over ~200ms (FR4, FR7, FR19)
**And** a PATCH request fires in the background

**Given** a completed todo is displayed
**When** I click/tap the checkbox
**Then** it toggles back to active state with the same animation in reverse (FR5)

**Given** a task is completed
**When** I refresh the browser
**Then** the completion status persists — the task is still shown as completed (FR9)

**Given** active and completed tasks exist
**When** I view the task list
**Then** completed tasks are visually distinct at a glance — strikethrough + muted color vs. normal text (FR7)

### Story 2.3: Inline Editing

As a **user**,
I want to edit a task's text inline by clicking on it,
So that I can fix typos without deleting and recreating (Kai's "algorithms assignment" correction).

**Acceptance Criteria:**

**Given** a task is displayed
**When** I click/tap the task text (not the checkbox)
**Then** the text becomes an inline editable input with a subtle border/background change
**And** the current text is available for editing (FR3)

**Given** I am editing a task
**When** I press Enter
**Then** the edit is saved, the display returns to normal, and a PATCH request fires (FR3)

**Given** I am editing a task
**When** I press Escape
**Then** the edit is cancelled and the original text is restored

**Given** I am editing a task
**When** I click outside the input (blur)
**Then** the edit is saved (same as Enter)

**Given** I am editing a task
**When** I clear all text and press Enter or blur
**Then** the edit reverts to the original text — no destructive empty saves

**Given** a task with a very long description
**When** it renders in the list
**Then** the text wraps properly without breaking the layout (FR13)

### Story 2.4: Task Deletion & Visual Feedback

As a **user**,
I want to delete a task with a single action and see clear visual feedback for all operations,
So that managing my list feels effortless (Priya's quality expectation).

**Acceptance Criteria:**

**Given** a task is displayed
**When** I click the delete control (×)
**Then** the task disappears with a brief exit animation (~150ms) (FR6, FR19)
**And** the list reflows smoothly
**And** a DELETE request fires in the background

**Given** a task is deleted
**When** the deletion completes
**Then** the task is permanently removed — it does not appear on refresh (FR6)

**Given** a new task is created
**When** it appears in the list
**Then** visual feedback confirms the addition (FR19)

**Given** any CRUD action occurs (create, complete, delete)
**When** the action completes visually
**Then** the user receives clear visual feedback that the action took effect (FR19)

## Epic 3: Error Handling & Resilience

When things go wrong, the user's data is safe and the app communicates clearly what happened.

### Story 3.1: Optimistic UI with Rollback

As a **user**,
I want the app to respond instantly to my actions and safely revert if something fails behind the scenes,
So that the app feels fast but never loses or corrupts my data (Kai's Wi-Fi drop).

**Acceptance Criteria:**

**Given** I create a new todo
**When** the API call fails (network error or server error)
**Then** the optimistically added todo is removed from the list
**And** the UI returns to the exact state before the action (FR16)
**And** no data is lost or corrupted (NFR13)

**Given** I toggle a task's completion status
**When** the PATCH API call fails
**Then** the checkbox and text styling revert to the previous state (FR16)

**Given** I edit a task's text
**When** the PATCH API call fails
**Then** the text reverts to the original value before the edit (FR16)

**Given** I delete a task
**When** the DELETE API call fails
**Then** the task reappears in the list at its original position (FR16)

**Given** multiple API calls are in flight
**When** one fails and others succeed
**Then** only the failed operation rolls back — successful operations are unaffected

### Story 3.2: Error Banner & User Communication

As a **user**,
I want clear, reassuring error messages when something goes wrong,
So that I know what happened and what to do next without feeling alarmed.

**Acceptance Criteria:**

**Given** an API operation fails
**When** the error banner appears
**Then** it displays above the task list with warm messaging that identifies the failed action and suggests retry (FR15)
**And** uses the warm error color scheme (soft pink background #FEF2F2, muted red text #991B1B)
**And** includes a dismiss button

**Given** a create operation fails
**When** the error banner appears
**Then** the message identifies the action, e.g. "That didn't go through — your task is safe. Try again?"

**Given** an error banner is displayed
**When** I perform other actions on my task list
**Then** the banner does not block my interactions — it is non-blocking (FR15)

**Given** an error banner is displayed
**When** I click the dismiss button
**Then** the banner is removed

**Given** multiple operations fail
**When** error banners are generated
**Then** each failed action gets its own clear message

**Given** an error banner is displayed
**When** it appears
**Then** it uses `role="alert"` for screen reader announcement

## Epic 4: Responsive Design & Accessibility

Any user can use the app on any device, with any input method, including screen readers and keyboard-only navigation.

### Story 4.1: Responsive Layout

As a **user**,
I want the app to work beautifully on my phone, tablet, and desktop,
So that I can manage tasks on any device (Clara's morning mobile check, Priya's ultrawide monitor).

**Acceptance Criteria:**

**Given** the app is viewed on mobile (< 768px)
**When** the page renders
**Then** the layout is single-column, full width with 16px horizontal padding (FR20, FR22)
**And** all touch targets are minimum 44x44px (checkbox, delete button, input)

**Given** the app is viewed on tablet (768px–1024px)
**When** the page renders
**Then** the content container is max 640px and centered (FR22)

**Given** the app is viewed on desktop (> 1024px)
**When** the page renders
**Then** the content container is max 640px and centered with generous surrounding whitespace (FR21, FR22)

**Given** the app is viewed at any breakpoint
**When** I use all features (create, edit, complete, delete)
**Then** all features work correctly — no functionality is lost or hidden on any device (FR20, FR21)

**Given** the browser window is resized
**When** it crosses breakpoint boundaries
**Then** the layout transitions smoothly without content loss or layout breakage

### Story 4.2: Keyboard Navigation & Focus Management

As a **user**,
I want to operate the entire app using only my keyboard,
So that I can be productive without a mouse (FR23, NFR10).

**Acceptance Criteria:**

**Given** the page loads
**When** I check focus
**Then** the TaskInput is auto-focused as the first interactive element

**Given** I am using the keyboard
**When** I press Tab
**Then** focus moves through elements in visual order: input → first task checkbox → task text → delete button → next task (FR23)

**Given** I have just created a task
**When** the task is added to the list
**Then** focus remains on the TaskInput for rapid sequential entry

**Given** I have just deleted a task
**When** the task is removed
**Then** focus moves to the next task in the list, or to the input if the list is empty

**Given** any interactive element is focused
**When** I look at the element
**Then** a visible focus ring is displayed (2px solid border-focus with 2px offset) (NFR10)

**Given** I am focused on a task's text
**When** I press Enter
**Then** inline edit mode activates (same as click)

### Story 4.3: Screen Reader Support & ARIA

As a **screen reader user**,
I want to perceive all task statuses and perform all actions,
So that the app is fully usable without visual information (FR24, NFR11).

**Acceptance Criteria:**

**Given** the task list is rendered
**When** a screen reader reads the page
**Then** the list has `role="list"` with an `aria-label` (FR24)

**Given** a task exists
**When** a screen reader reads the task
**Then** the checkbox has `aria-checked` reflecting completion status (FR24)

**Given** I complete or uncomplete a task
**When** the status changes
**Then** the change is announced via an `aria-live="polite"` region (NFR11)

**Given** a task is added or deleted
**When** the list updates dynamically
**Then** the change is announced to screen readers (NFR11)

**Given** the empty state is displayed
**When** a screen reader reads the page
**Then** the empty state text is accessible and descriptive

**Given** an error banner appears
**When** it is rendered
**Then** it uses `role="alert"` for immediate announcement (NFR11)

### Story 4.4: Color Contrast & Visual Accessibility

As a **user with visual impairments**,
I want sufficient color contrast and non-color-dependent indicators,
So that I can read and interact with everything clearly (FR25, NFR8, NFR9).

**Acceptance Criteria:**

**Given** any text element on the page
**When** I measure its contrast against its background
**Then** the ratio meets WCAG AA minimum of 4.5:1 for normal text (FR25, NFR9)

**Given** a task is completed
**When** it displays in muted color
**Then** the completed text combined with strikethrough provides dual visual indicators — not relying on color alone

**Given** an error banner is displayed
**When** it renders
**Then** it uses color + icon + text to convey error state — not color alone

**Given** the accent blue (#2563EB) is used on interactive elements
**When** displayed on white surface (#FFFFFF)
**Then** the contrast ratio is at least 4.5:1

**Given** zero WCAG AA critical violations is the target (NFR8)
**When** an accessibility audit is run (axe-core or equivalent)
**Then** zero critical violations are found

## Epic 5: Quality, Testing & Deployment

The app runs reliably via `docker-compose up`, with confidence backed by automated tests and CI.

### Story 5.1: Unit & Integration Tests

As a **developer**,
I want comprehensive unit and integration tests covering core functionality,
So that I can refactor and extend with confidence (NFR18, NFR20).

**Acceptance Criteria:**

**Given** the test framework is configured
**When** I run Vitest
**Then** tests execute for both client and server packages

**Given** the server routes are implemented
**When** I run integration tests
**Then** all CRUD endpoints are tested (create, read, update, delete) including success and error cases
**And** health check endpoint is tested (NFR22)

**Given** the frontend components are implemented
**When** I run component tests
**Then** TaskInput, TaskItem, TaskList, EmptyState, and ErrorBanner have tests covering their key behaviors

**Given** the `useOptimisticTodos` hook is implemented
**When** I run hook tests
**Then** optimistic add, update, delete, and rollback scenarios are tested

**Given** all tests pass
**When** I check coverage
**Then** meaningful code coverage is at least 70% across unit and integration tests (NFR18)

**Given** core CRUD operations are tested
**When** I review error handling
**Then** zero unhandled errors exist in CRUD paths (NFR20)

### Story 5.2: E2E Browser Tests

As a **developer**,
I want end-to-end browser tests covering core user journeys,
So that I can verify the full stack works together (NFR19).

**Acceptance Criteria:**

**Given** Playwright is configured
**When** I run E2E tests against the running application
**Then** at least 5 E2E tests pass covering core user journeys (NFR19)

**Given** Journey 1 (First Visit)
**When** the E2E test runs
**Then** it verifies: empty state displayed → task created → task appears in list → persists on refresh

**Given** Journey 2 (Task Completion)
**When** the E2E test runs
**Then** it verifies: task completed → visual distinction → persists on refresh → toggle back to active

**Given** Journey 3 (Edit & Delete)
**When** the E2E test runs
**Then** it verifies: inline edit saves → delete removes task → list updates correctly

**Given** Journey 4 (Error Recovery)
**When** the E2E test runs
**Then** it verifies: simulated API failure → rollback occurs → error banner displayed → retry works

**Given** Journey 5 (Accessibility)
**When** the E2E test runs
**Then** it verifies: keyboard navigation works → axe-core audit passes with zero critical violations

### Story 5.3: Security Hardening

As a **developer**,
I want the API to be secure against common attack vectors,
So that user data is protected (NFR5–NFR7).

**Acceptance Criteria:**

**Given** the Express server is configured
**When** a request arrives
**Then** Helmet.js security headers are applied (X-Content-Type-Options, X-Frame-Options, etc.) (NFR5)

**Given** the CORS configuration is set
**When** a request arrives from an unauthorized origin
**Then** it is rejected
**And** the allowed origin is configurable via `CORS_ORIGIN` environment variable

**Given** a user submits todo text containing XSS payloads (e.g., `<script>alert('xss')</script>`)
**When** the server processes the input
**Then** it is sanitized before storage and the payload does not execute on retrieval (NFR5)

**Given** a user submits SQL injection attempts
**When** the server processes the input
**Then** prepared statements prevent injection — no SQL is executed (NFR5)

**Given** an API error occurs
**When** the error response is sent
**Then** no stack traces, SQL queries, internal file paths, or sensitive data are exposed (NFR7)

### Story 5.4: Docker Deployment & CI Pipeline

As a **developer**,
I want to deploy the entire application with a single command and have CI enforce quality gates,
So that the app is production-ready and maintainable (NFR21, NFR23–NFR25).

**Acceptance Criteria:**

**Given** Dockerfiles are configured
**When** I build the client image
**Then** it uses multi-stage build: Stage 1 (Vite build), Stage 2 (Nginx Alpine serving static files)
**And** runs as a non-root user (NFR24)

**Given** Dockerfiles are configured
**When** I build the server image
**Then** it uses multi-stage build: Stage 1 (TypeScript compile), Stage 2 (Node.js 22 Alpine with production deps)
**And** runs as a non-root user (NFR24)

**Given** docker-compose.yml is configured
**When** I run `docker-compose up`
**Then** the full application starts: Nginx serves frontend on port 80, proxies `/api/*` to server on port 3001 (NFR23)
**And** SQLite data persists via a named Docker volume (NFR12)

**Given** environment variables are defined
**When** Docker containers start
**Then** PORT, DATABASE_PATH, CORS_ORIGIN, and NODE_ENV are configurable via environment (NFR25)

**Given** GitHub Actions CI is configured
**When** code is pushed
**Then** the pipeline runs: lint → unit/integration tests → E2E tests → Docker build verification (NFR21)
**And** all steps must pass before merge

**Given** a README exists
**When** a new developer reads it
**Then** it provides clear setup instructions for local development and Docker deployment

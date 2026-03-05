# Story 4.1: Responsive Layout

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want the app to work beautifully on my phone, tablet, and desktop,
so that I can manage tasks on any device (Clara's morning mobile check, Priya's ultrawide monitor).

## Acceptance Criteria

1. **Given** the app is viewed on mobile (< 768px) **When** the page renders **Then** the layout is single-column, full width with 16px horizontal padding (FR20, FR22) **And** all touch targets are minimum 44x44px (checkbox, delete button, input).
2. **Given** the app is viewed on tablet (768px-1024px) **When** the page renders **Then** the content container is max 640px and centered (FR22).
3. **Given** the app is viewed on desktop (> 1024px) **When** the page renders **Then** the content container is max 640px and centered with generous surrounding whitespace (FR21, FR22).
4. **Given** the app is viewed at any breakpoint **When** I use all features (create, edit, complete, delete) **Then** all features work correctly -- no functionality is lost or hidden on any device (FR20, FR21).
5. **Given** the browser window is resized **When** it crosses breakpoint boundaries **Then** the layout transitions smoothly without content loss or layout breakage.

## Tasks / Subtasks

- [ ] Task 1: Update App.tsx container with responsive spacing (AC: #1, #2, #3, #5)
  - [ ] 1.1 Change outer container padding from fixed `p-4` to responsive: `px-4 pt-8 md:px-6 md:pt-12 lg:px-8 lg:pt-12`
  - [ ] 1.2 Keep `max-w-[var(--max-content-width)]` and `mx-auto` (already centered at 640px)
  - [ ] 1.3 On mobile (default), container is full width with 16px horizontal padding
  - [ ] 1.4 On tablet (md:), container gets 24px horizontal padding
  - [ ] 1.5 On desktop (lg:), container gets 32px horizontal padding
- [ ] Task 2: Update TaskItem responsive behavior (AC: #1, #4, #5)
  - [ ] 2.1 Verify delete button already uses `max-sm:opacity-100` for mobile visibility (already exists)
  - [ ] 2.2 Update task row vertical padding from fixed to responsive: `py-3 md:py-3.5`
  - [ ] 2.3 Verify 44x44px touch targets on checkbox, delete button, and task text tap area on mobile
  - [ ] 2.4 Verify text wrapping with `break-words` handles narrow mobile widths
- [ ] Task 3: Verify TaskInput responsive behavior (AC: #1, #4)
  - [ ] 3.1 Confirm input is `w-full` (full width at all breakpoints)
  - [ ] 3.2 Confirm font size is 16px (prevents iOS zoom on focus) -- already set via `text-base`
  - [ ] 3.3 Verify input padding and touch target meet 44px minimum height on mobile
- [ ] Task 4: Verify ErrorBanner, EmptyState, and TaskList responsiveness (AC: #4, #5)
  - [ ] 4.1 Confirm ErrorBanner renders correctly at all widths (already uses flex layout with gap)
  - [ ] 4.2 Confirm EmptyState centers and wraps text at narrow widths
  - [ ] 4.3 Confirm TaskList container has no fixed-width constraints that break mobile
- [ ] Task 5: Responsive layout tests (AC: #1-5)
  - [ ] 5.1 Create `client/src/App.responsive.test.tsx` -- co-located responsive test file
  - [ ] 5.2 Test: at mobile viewport (375px), container has no max-width constraint (full width)
  - [ ] 5.3 Test: at tablet viewport (768px), container has max-width 640px and is centered
  - [ ] 5.4 Test: at desktop viewport (1024px), container has max-width 640px and is centered
  - [ ] 5.5 Test: all interactive elements (input, checkbox, delete) are present and functional at mobile width
  - [ ] 5.6 Test: task text wraps correctly for long text at narrow viewport
  - [ ] 5.7 Test: delete button is visible (not hidden) on mobile viewport

## Dev Notes

### What Already Exists -- DO NOT Recreate

| Module | Location | Notes |
|--------|----------|-------|
| Container layout | `client/src/App.tsx` | `mx-auto max-w-[var(--max-content-width)] p-4` -- UPDATE padding to be responsive |
| Max content width | `client/src/index.css` | `--max-content-width: 40rem` (640px) -- DO NOT change this value |
| Delete button mobile | `client/src/components/TaskItem.tsx` line 121 | `max-sm:opacity-100` already makes delete visible on mobile |
| Touch targets | `TaskItem.tsx` | `min-w-[44px] min-h-[44px]` already on checkbox and delete button |
| Text wrapping | `TaskItem.tsx` | `break-words` already on task text |
| Input full width | `TaskInput.tsx` | `w-full` already set |
| Input font size | `TaskInput.tsx` | `text-base` (16px) already prevents iOS zoom |
| Design tokens | `client/src/index.css` | Full color palette, spacing, max-width already defined |
| Viewport meta | `client/index.html` | `width=device-width, initial-scale=1.0` already configured |
| Test setup | `client/src/test-setup.ts` | Centralized cleanup + jest-dom matchers -- already configured |

**The app is already functional at all viewports. This story primarily adjusts spacing to match the UX spec's responsive breakpoint table and adds verification tests.**

### Architecture Constraints

- **Stack:** React 19.2, Vite 7.3, Tailwind CSS 4.2 (CSS-native @theme), TypeScript 5.x, Vitest 4.0
- **Tailwind breakpoints:** Mobile-first. Default = mobile, `md:` = 768px+, `lg:` = 1024px+
- **No new components** -- this story modifies existing components only
- **No new hooks, no new types, no new API calls**
- **Co-located tests:** Place responsive tests in `client/src/` alongside App.tsx

### Responsive Breakpoint Spec (from UX Design)

| Property | Mobile (default) | Tablet (md:) | Desktop (lg:) |
|----------|-----------------|--------------|---------------|
| Container width | 100% | max-w-[640px] mx-auto | max-w-[640px] mx-auto |
| Horizontal padding | px-4 (16px) | px-6 (24px) | px-8 (32px) |
| Top margin | pt-8 (32px) | pt-12 (48px) | pt-12 (48px) |
| Delete button | Always visible | Always visible | Hidden, visible on hover/focus |
| Input font size | 16px (prevents iOS zoom) | 16px | 16px |
| Task row padding | py-3 (12px) | py-3.5 (14px) | py-3.5 (14px) |

**What stays the same across all breakpoints:**
- Single column layout (no restructuring)
- Component order: title -> input -> error banner -> task list / empty state
- Typography scale (16px body, 20px heading)
- Color palette
- Animation timing
- max-width 640px constraint (already applied via CSS variable)

### Current App.tsx Layout (what to change)

**Before:**
```tsx
<div className="min-h-screen bg-surface-secondary">
  <main className="mx-auto max-w-[var(--max-content-width)] p-4">
```

**After:**
```tsx
<div className="min-h-screen bg-surface-secondary">
  <main className="mx-auto max-w-[var(--max-content-width)] px-4 pt-8 md:px-6 md:pt-12 lg:px-8">
```

### Current TaskItem Row Padding (what to change)

Find the outer `<li>` or row container div in TaskItem.tsx and update vertical padding:
- **Before:** `py-3` (or whatever fixed value exists)
- **After:** `py-3 md:py-3.5`

### Testing Approach

- **Unit/component tests:** Use `@testing-library/react` to render at different viewport widths
- **Viewport simulation:** Use `window.innerWidth` or container width assertions via computed styles
- **Note:** Tailwind responsive classes are CSS media queries -- they won't respond to container width in JSDOM. Tests should verify:
  - Correct CSS classes are applied (class-based assertions)
  - Components render without errors at any width
  - All interactive elements remain in the DOM at all widths
  - Long text wraps (no horizontal overflow)
- **For true responsive testing:** E2E tests (Playwright) in Epic 5 will validate actual viewport behavior
- **Existing test count:** 111 passing -- ALL must remain passing after changes

### Code Review Lessons from Previous Stories (Apply Here)

- Verify 44x44px touch targets on ALL interactive elements (checkbox, delete, input)
- Ensure `prefers-reduced-motion` is respected for any transitions
- Do NOT add unused imports or variables
- Do NOT create separate utility files -- keep changes inline in existing components
- Add `toHaveBeenCalledTimes` assertions in tests (not just `toHaveBeenCalled`)
- Use stable keys in any list rendering (already using `todo.id`)

### Scope Boundaries -- Do NOT

- Do NOT add new breakpoints beyond md: and lg:
- Do NOT change the max-content-width variable (640px is correct)
- Do NOT add responsive font size changes (typography stays the same)
- Do NOT add responsive color changes (no dark mode for MVP)
- Do NOT restructure component hierarchy or layout order
- Do NOT add CSS Grid or complex layout systems -- flexbox with Tailwind utilities is sufficient
- Do NOT add media query CSS in index.css -- use Tailwind responsive prefixes in JSX

### Project Structure Notes

- Alignment with unified project structure: All changes in `client/src/` directory
- No new files except test file (`App.responsive.test.tsx`)
- After this story: responsive spacing matches UX spec, ready for keyboard navigation (Story 4.2)

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md - Frontend Architecture, Responsive layout section]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - Responsive Strategy, Breakpoint Strategy, Spacing & Layout Foundation]
- [Source: _bmad-output/implementation-artifacts/3-2-error-banner-user-communication.md - Code review lessons, existing test count]
- [Source: _bmad-output/project-context.md - Framework Rules, Testing Rules, Anti-Patterns]
- [Source: client/src/App.tsx - Current container layout with p-4]
- [Source: client/src/components/TaskItem.tsx - Existing max-sm:opacity-100, 44px touch targets, break-words]
- [Source: client/src/index.css - Design tokens, --max-content-width: 40rem]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

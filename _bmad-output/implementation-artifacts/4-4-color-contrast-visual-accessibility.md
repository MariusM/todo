# Story 4.4: Color Contrast & Visual Accessibility

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user with visual impairments**,
I want sufficient color contrast and non-color-dependent indicators,
so that I can read and interact with everything clearly (FR25, NFR8, NFR9).

## Acceptance Criteria

1. **Given** any text element on the page, **When** I measure its contrast against its background, **Then** the ratio meets WCAG AA minimum of 4.5:1 for normal text (FR25, NFR9)
2. **Given** a task is completed, **When** it displays in muted color, **Then** the completed text combined with strikethrough provides dual visual indicators — not relying on color alone
3. **Given** an error banner is displayed, **When** it renders, **Then** it uses color + icon + text to convey error state — not color alone
4. **Given** the accent blue (#2563EB) is used on interactive elements, **When** displayed on white surface (#FFFFFF), **Then** the contrast ratio is at least 4.5:1
5. **Given** zero WCAG AA critical violations is the target (NFR8), **When** an accessibility audit is run (axe-core or equivalent), **Then** zero critical violations are found

## Tasks / Subtasks

- [ ] Task 1: Audit and fix completed task text contrast (AC: #1, #2)
  - [ ] 1.1 Update `--color-completed-text` from `#A8A29E` (~2.7:1 on white) to a darker stone gray that meets 4.5:1 (e.g., `#78716C` at ~4.7:1 or darker)
  - [ ] 1.2 Verify completed text still has visual distinction from active text (`#1C1917`) — must look "muted" while meeting contrast
  - [ ] 1.3 Confirm `line-through` text-decoration is preserved alongside color change (dual indicator per AC #2)
  - [ ] 1.4 Write test verifying completed task text color meets minimum contrast threshold

- [ ] Task 2: Audit and fix loading/muted text contrast (AC: #1)
  - [ ] 2.1 Update `--color-text-muted` from `#A8A29E` (~2.7:1 on white) to meet 4.5:1 minimum. Consider same value as `--color-completed-text` or a suitable alternative
  - [ ] 2.2 Verify "Loading tasks..." text in TaskList uses updated muted color
  - [ ] 2.3 Verify EmptyState heading/description text uses `--color-text-secondary` (`#78716C`, ~4.7:1) — already passes, confirm
  - [ ] 2.4 Write test verifying muted text elements have sufficient contrast

- [ ] Task 3: Verify and strengthen accent blue contrast (AC: #4)
  - [ ] 3.1 Verify `--color-accent` (#2563EB) on `--color-surface` (#FFFFFF) meets 4.5:1 (~4.6:1 — borderline pass)
  - [ ] 3.2 If borderline or failing after precise calculation, darken accent to `#1D4ED8` (existing hover color, higher contrast) or adjust to meet threshold
  - [ ] 3.3 If accent color changes, update `--color-checkbox-fill` to match (same token currently)
  - [ ] 3.4 Verify focus ring color (`--color-border-focus`, currently same as accent) provides sufficient contrast
  - [ ] 3.5 Write test verifying accent-colored interactive elements meet contrast requirements

- [ ] Task 4: Verify error banner uses non-color indicators (AC: #3)
  - [ ] 4.1 Confirm ErrorBanner already renders an SVG warning icon alongside text — verify icon is visible and meaningful (not just decorative)
  - [ ] 4.2 Verify error text `#991B1B` on error background `#FEF2F2` meets 4.5:1 (estimated ~7.8:1 — should pass)
  - [ ] 4.3 Ensure error state is communicated via color + icon + text (triple indicator) — not color alone
  - [ ] 4.4 Write test verifying error banner has icon element visible (not aria-hidden) or at minimum text clearly conveys error

- [ ] Task 5: Verify delete button contrast states (AC: #1)
  - [ ] 5.1 Check default delete button color `--color-border` (#E7E5E4 on white, ~1.3:1). This is intentionally low contrast as the button appears only on hover/focus — verify it meets WCAG requirements for "inactive" UI
  - [ ] 5.2 Verify hover/focus state `--color-error-text` (#991B1B on white, ~8.2:1) meets requirements
  - [ ] 5.3 On mobile (`max-sm:opacity-100`), delete button is always visible at #E7E5E4 — this may need a higher contrast default color on mobile for always-visible state
  - [ ] 5.4 If mobile default contrast fails, add a mobile-specific color override for the delete button (e.g., `max-sm:text-text-secondary`)

- [ ] Task 6: Add axe-core accessibility audit test (AC: #5)
  - [ ] 6.1 Install `@axe-core/react` or `axe-core` + `vitest-axe` (check which is available/compatible with Vitest 4.0)
  - [ ] 6.2 Write integration test in `App.test.tsx` that renders full app and runs axe-core audit
  - [ ] 6.3 Assert zero critical and serious violations
  - [ ] 6.4 If axe-core vitest integration is problematic, write manual contrast verification tests using computed style checks

- [ ] Task 7: Final contrast verification pass (AC: #1, #2, #3, #4, #5)
  - [ ] 7.1 Create a summary test file or test block that documents all color combinations and their contrast ratios
  - [ ] 7.2 Verify all existing tests still pass (216 tests from story 4.3)
  - [ ] 7.3 Run full test suite to confirm zero regressions

## Dev Notes

### Architecture Compliance

- **Component structure**: Modify existing 5 components only. Do NOT create new components.
- **CSS tokens**: All color changes happen in `client/src/index.css` `@theme` block. Components reference tokens via Tailwind classes — no hardcoded hex values in components.
- **No external libraries** except axe-core for testing. Do NOT add any accessibility CSS libraries or color manipulation libraries at runtime.
- **State management**: No state changes needed. This story is purely visual/CSS + testing.

### Technical Implementation Guidance

**Color Contrast Calculations (WCAG 2.1):**
The WCAG AA standard requires:
- **4.5:1** for normal text (< 18pt regular or < 14pt bold)
- **3:1** for large text (>= 18pt regular or >= 14pt bold)
- **3:1** for UI components and graphical objects

Current contrast audit (approximate ratios against #FFFFFF):
| Color Token | Hex | Ratio vs White | Status |
|---|---|---|---|
| `--color-text-primary` | #1C1917 | ~16.5:1 | PASS |
| `--color-text-secondary` | #78716C | ~4.7:1 | PASS (borderline) |
| `--color-text-muted` | #A8A29E | ~2.7:1 | **FAIL** |
| `--color-completed-text` | #A8A29E | ~2.7:1 | **FAIL** |
| `--color-accent` | #2563EB | ~4.6:1 | PASS (borderline) |
| `--color-border-focus` | #2563EB | ~4.6:1 | PASS (3:1 for UI) |
| `--color-error-text` on error-bg | #991B1B on #FEF2F2 | ~7.8:1 | PASS |
| `--color-border` (delete btn) | #E7E5E4 | ~1.3:1 | Intentional (hover-only on desktop) |

**Recommended Color Fixes:**
1. **`--color-completed-text`**: Change from `#A8A29E` to `#78716C` (stone-500, ~4.7:1). This is the same as `--color-text-secondary` and provides sufficient contrast while still appearing "muted" compared to primary text (#1C1917, ~16.5:1). The strikethrough provides the additional visual indicator.
2. **`--color-text-muted`**: Change from `#A8A29E` to `#78716C` to match. Used for loading text only. If you want muted to remain lighter than secondary, use `#8A8580` (~3.9:1) — but this still fails AA for normal text. Safest: use `#78716C`.
3. **Accent blue**: #2563EB at ~4.6:1 passes AA. Verify with precise calculation. If it fails by a tiny margin, use `#2455D1` or darker.
4. **Delete button on mobile**: Add `max-sm:text-text-secondary` to ensure always-visible delete button has sufficient contrast.

**CRITICAL: Maintain warm stone palette aesthetic.** Do not switch to cold grays or introduce new color families. All adjustments should stay within the stone/warm neutral spectrum established in the UX spec.

**Tailwind CSS 4.2 @theme token updates:**
All color changes go in `client/src/index.css` inside the `@theme` block. Example:
```css
@theme {
  --color-completed-text: #78716C; /* was #A8A29E, updated for WCAG AA */
  --color-text-muted: #78716C;     /* was #A8A29E, updated for WCAG AA */
}
```
Components using `text-completed-text`, `text-text-muted` classes will automatically pick up the new values.

### Library & Framework Requirements

| Technology | Version | Notes |
|-----------|---------|-------|
| React | 19.2 | No runtime changes expected |
| Tailwind CSS | 4.2 | @theme token updates in index.css |
| Vitest | 4.0 | Test color contrast assertions |
| vitest-axe or axe-core | latest | NEW dev dependency for axe audit test |
| @testing-library/react | current | Component test queries |

**axe-core integration options (research needed):**
- `vitest-axe` — Vitest matcher for axe-core (`toHaveNoViolations()`)
- `@axe-core/react` — Runtime dev-mode audit (not for production)
- `axe-core` directly — Use `axe.run()` in test with JSDOM (may need configuration for JSDOM compatibility)

**Preference**: Use `vitest-axe` if available and compatible. It provides the cleanest test integration. If JSDOM limitations prevent axe-core from working (axe-core traditionally needs a real DOM), write manual contrast tests instead.

### File Structure Requirements

Files to modify (primarily CSS tokens + tests):
- `client/src/index.css` — Update `--color-completed-text` and `--color-text-muted` token values in @theme block
- `client/src/components/TaskItem.tsx` — Possibly add mobile-specific delete button contrast class
- `client/src/components/TaskItem.test.tsx` — Add contrast-related tests for completed state
- `client/src/components/TaskList.test.tsx` — Add test for loading text contrast
- `client/src/components/ErrorBanner.test.tsx` — Add test verifying icon + text + color triple indicator
- `client/src/components/EmptyState.test.tsx` — Add test verifying text contrast
- `client/src/App.test.tsx` — Add axe-core audit integration test

New dev dependency (if axe-core integration works):
- `vitest-axe` or `axe-core` — installed in client package.json devDependencies

### Testing Requirements

**Testing framework**: Vitest 4.0 + @testing-library/react + vitest-axe (if compatible)
**Test co-location**: Tests next to source files as `ComponentName.test.tsx`

**Key test scenarios:**
1. Completed task text has `line-through` AND sufficient color contrast (dual indicator)
2. Loading text color meets contrast requirements
3. Error banner renders icon element alongside error text (non-color indicator)
4. Accent-colored interactive elements (checked checkbox) meet contrast requirements
5. Delete button hover/focus state meets contrast requirements
6. Full-app axe-core audit returns zero critical violations
7. EmptyState secondary text meets contrast requirements

**Test pattern for contrast verification:**
```tsx
// Since JSDOM doesn't compute real colors, test the CSS class is applied correctly
// and verify token values are correct in the theme
it('completed task uses contrast-compliant color class', () => {
  render(<TaskItem todo={completedTodo} ... />);
  const text = screen.getByText('Buy milk');
  expect(text).toHaveClass('text-completed-text');
  expect(text).toHaveClass('line-through'); // dual indicator
});
```

**axe-core integration test pattern:**
```tsx
import { axe, toHaveNoViolations } from 'vitest-axe';
expect.extend(toHaveNoViolations);

it('has no WCAG AA critical violations', async () => {
  const { container } = render(<App />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**All existing 216 tests must continue passing with zero regressions.**

### Previous Story Intelligence (Story 4.3)

**Key learnings to apply:**
- Screen reader live region with `aria-live="polite"` already in place — do not modify
- `aria-atomic="true"` on ErrorBanner already set — do not modify
- Form wrapper on TaskInput with `aria-label="Add task"` — do not modify
- EmptyState decorative SVG has `aria-hidden="true"` (no `role="img"`) — correct state
- All 216 tests passing — maintain this baseline
- Code review pattern: implementation commit → code review fix commit

**Files modified in story 4.3 (context for what exists):**
- `client/src/components/TaskList.tsx` — Announcement live region, aria-busy
- `client/src/components/TaskInput.tsx` — Form wrapper with aria-label
- `client/src/components/ErrorBanner.tsx` — aria-atomic="true" on alert divs
- `client/src/components/EmptyState.tsx` — Cleaned SVG attributes
- `client/src/App.test.tsx` — SR journey integration tests

**Patterns established in Epic 4:**
- Checkbox: `aria-label="Mark '{text}' as complete/incomplete"`
- Task text: `role="button"`, `tabIndex={0}`, `aria-label="Edit task: {text}"`
- Delete button: `aria-label="Delete task: {text}"`
- Focus ring: global `:focus-visible` with `--color-border-focus`
- `skipBlurRef` pattern in TaskItem prevents double-save — DO NOT break

### Git Intelligence

**Recent commits (Epic 4 context):**
- `b6cd1f0` Fix code review issues for story 4.3: Repeated announcement bug, useEffect deps, O(n^2) diff
- `d87d5b9` Implement story 4.3: Screen reader support & ARIA
- `c0e501f` Fix code review issues for story 4.2: Space key scroll, focus consistency, test quality
- `7f616cd` Implement story 4.2: Keyboard navigation & focus management
- `c6252dd` Fix code review issues for story 4.1: undefined color token, test quality
- `3cb51c5` Implement story 4.1: Responsive layout with breakpoint spacing

**Patterns from recent work:**
- Implementation commit followed by code review fix commit
- Story 4.1 had an "undefined color token" fix — pay attention to token naming consistency
- No new components added in Epic 4 — behavior and styling modifications only
- Tests added incrementally, maintaining running total count

### Project Structure Notes

- Monorepo: `client/` and `server/` packages with npm workspaces
- Components in `client/src/components/` (flat, no nesting)
- Hooks in `client/src/hooks/` — `useOptimisticTodos.ts` is single source of truth
- Tests co-located with source files
- Tailwind CSS 4.2 with CSS-native @theme in `client/src/index.css`
- Design tokens defined in @theme block: `--color-surface`, `--color-text-primary`, etc.

### Critical Warnings

1. **DO NOT change `--color-text-primary` (#1C1917)** — it has excellent contrast and is the primary reading color.
2. **DO NOT introduce new color families** (no cool grays, no new hues). Stay within warm stone palette.
3. **DO NOT remove `line-through` from completed tasks** — it's the non-color indicator per AC #2.
4. **DO NOT modify ARIA attributes** added in stories 4.2 and 4.3 — this story is about visual contrast, not semantics.
5. **DO NOT change the ErrorBanner SVG icon to be non-decorative** unless needed — it currently has `aria-hidden="true"` because `role="alert"` announces the text. The icon is a visual indicator that satisfies "not color alone" per AC #3 even when decorative.
6. **DO NOT break the opacity-based delete button show/hide pattern** — the low-contrast default is intentional for desktop (appears on hover). Focus on mobile always-visible case.
7. **DO NOT add axe-core as a runtime production dependency** — it's a dev/test dependency only.
8. **Token `--color-completed-text` and `--color-text-muted` are currently identical** (#A8A29E). They can be updated independently if different contrast levels are desired, but keeping them the same simplifies the change.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.4]
- [Source: _bmad-output/planning-artifacts/architecture.md - Accessibility Requirements FR25, NFR8, NFR9]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - Color System, Design Tokens, Accessibility Considerations]
- [Source: _bmad-output/planning-artifacts/prd.md - FR25, NFR8, NFR9]
- [Source: _bmad-output/implementation-artifacts/4-3-screen-reader-support-aria.md - Previous story learnings]
- [Source: _bmad-output/project-context.md - Project structure, conventions, testing config]
- [Source: client/src/index.css - Current @theme color tokens]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

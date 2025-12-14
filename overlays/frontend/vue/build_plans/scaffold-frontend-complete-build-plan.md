# Build Plan: scaffold-frontend — Complete (state, components, tests)

> **Scope:** Implement Pinia store, Greeting components, routing, and tests. Ensure builds and tests run locally and that the Home view fetches the greeting from the backend (when available).
> **Source:** Derived from original scaffold-frontend build plan
> **Created:** 2025-12-14
> **Status:** In Progress

---

## 0. Pre-Implementation Checklist

- [ ] Read `.github/instructions/frontend.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Confirm dev backend or proxy is available for integration testing (optional for unit tests)

### New Dependencies (for this phase)

| Package | Purpose |
|---|---|
| `pinia` | State management |
| `vuetify` | UI library (if chosen) |
| `@mdi/font` | Icons for Vuetify |
| `vue-router` | SPA routing |
| `jest`, `@vue/test-utils`, `jest-environment-jsdom`, `@types/jest` | Testing stack |
| `ts-jest`, `@vue/compiler-sfc` | TS + SFC testing support |

---

## 1. Implementation Overview

**Approach:** Add a `useGreetingStore` Pinia store, `GreetingCard` component, `HomeView` that uses the store to fetch the greeting from `/api/greetings`, update the router, and add Jest + Vue Test Utils unit tests for the store and components.

**Goal:** App compiles, unit tests pass (`npm --prefix src/frontend run test`), and when the backend is available (local dev or proxy), the Home view displays the greeting + fact fetched from `/api/greetings`.

**Acceptance Criteria (Complete):**
- `npm --prefix src/frontend run build` succeeds ✅
- `npm --prefix src/frontend run test` passes ✅
- `Home` view fetches and displays `/api/greetings` when backend is available ✅

---

## 2. Tasks

### Task 1: Create Pinia store
- `src/frontend/src/stores/useGreetingStore.ts` — `defineStore` with state: `greeting`, `fact`, `loading`, `error`; action `fetchGreeting()` fetching `/api/greetings` and setting state.

### Task 2: Add GreetingCard component
- `src/frontend/src/components/GreetingCard.vue` — presentational component that receives `greeting` and `fact` props and displays them with `data-test-id` attributes.

### Task 3: HomeView & Router
- `src/frontend/src/views/HomeView.vue` — uses the store and calls `fetchGreeting()` on mount; provides a refresh button.
- `src/frontend/src/router/index.ts` — add `/` route to HomeView.

### Task 4: Tests
- Add store tests (`tests/frontend/stores/useGreetingStore.spec.ts`), component tests (`tests/frontend/components/GreetingCard.spec.ts`), and view tests (`tests/frontend/views/HomeView.spec.ts`) using Jest and `@vue/test-utils`. Mock `fetch` for unit tests; do not require backend.

### Task 5: Integration check (optional)
- If backend is available at `/api`, confirm that starting the frontend dev server (and using a proxy or same-origin backend) results in `HomeView` displaying fetched data. Document the recommended `VITE_API_BASE_URL` pattern and proxy config for Vite.

---

## 3. File List (Complete)

| File Path | Action |
|---|---|
| `src/frontend/src/stores/useGreetingStore.ts` | create |
| `src/frontend/src/components/GreetingCard.vue` | create |
| `src/frontend/src/views/HomeView.vue` | create/modify |
| `src/frontend/src/router/index.ts` | create/modify |
| `tests/frontend/stores/useGreetingStore.spec.ts` | create |
| `tests/frontend/components/GreetingCard.spec.ts` | create |
| `tests/frontend/views/HomeView.spec.ts` | create |

---

## 4. Test Strategy

- Unit tests for store behaviors (success + error) with fetch mocked.
- Component tests for presentational rendering and `data-test-id` attributes.
- View tests to assert store interactions (e.g., `fetchGreeting` called on mount) using `createTestingPinia`.

---

## 5. Run Instructions

Start dev server (from repo root):

```bash
npm --prefix src/frontend run dev
```

Run tests:

```bash
npm --prefix src/frontend run test
```

Build:

```bash
npm --prefix src/frontend run build
```

---

## 6. Definition of Done (Complete)

- All files implemented; unit tests pass locally ✅
- Build succeeds and Home view displays fetched greeting when backend is available ✅

---

## 7. Notes

- Prefer the CLI for installs and scaffolding; use `npm` to add additional deps as needed instead of hand-editing `package.json`.
- Ensure `data-test-id` attributes are present on interactive elements for testing.


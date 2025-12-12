# Build Plan: scaffold-frontend

> **Source:** Internal scaffold requirements  
> **Created:** 2025-12-12  
> **Status:** Draft | In Progress | Complete

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [x] Read `.github/instructions/frontend.instructions.md`
- [x] Read `.github/instructions/testing.instructions.md`
- [x] Identify golden reference components/stores:
  - Frontend components: `src/frontend/components/example/`
  - Frontend store: `src/frontend/stores/exampleStore.ts`
- [x] Confirm no new dependencies needed (or justify additions below)
- [x] List integration points with existing modules (see Section 1)
- [x] Review tech spec for any open questions

### New Dependencies (if any)

| Package | Purpose | Justification |
|---------|---------|---------------|
| _None_ | — | — |

---

## 1. Implementation Overview

**Approach:** Bootstrap a Vue 3 + Pinia + Vuetify frontend with a Home view that fetches a greeting from the backend and displays it via a store-driven component.

**Key Decisions:**
- Use Pinia store actions for all API calls; no inline fetches in components.
- Use Vuetify components for layout and UI (no raw HTML for interactive elements).
- Provide `data-test-id` on all interactive elements for E2E/component testing.

**Integration Points:**
| Existing Module | Integration Type | Notes |
|-----------------|------------------|-------|
| Backend `/api/greetings` | HTTP fetch via store | Returns greeting + fact |

---

## 2. Task Breakdown

### Phase 1: App Shell

#### Task 1: Initialize main.ts

- [x] **Create frontend bootstrap file**
- **File(s):** `src/frontend/main.ts`
- **Action:** create
- **Dependencies:** None
- **Details:**
  - Create Vue app, install Pinia, Vuetify, and Router.
  - Mount to `#app`.
- **Acceptance Criteria:**
  - App boots without console errors.
- **Effort:** small

#### Task 2: Create App.vue

- [x] **Root layout**
- **File(s):** `src/frontend/App.vue`
- **Action:** create
- **Dependencies:** Task 1
- **Details:**
  - Use `<script setup lang="ts">`.
  - Wrap content with Vuetify `v-app` / `v-main`.
  - Include `<RouterView />`.
- **Acceptance Criteria:**
  - Uses Vuetify structure; no inline fetch.
- **Effort:** small

### Phase 2: State & API

#### Task 3: Create Greeting Store

- [x] **Pinia store for greetings**
- **File(s):** `src/frontend/stores/useGreetingStore.ts`
- **Action:** create
- **Dependencies:** Task 1
- **Golden Reference:** `src/frontend/stores/exampleStore.ts`
- **Details:**
  - `defineStore` with setup syntax.
  - State: `greeting` (string | null), `fact` (object | null), `loading` (boolean), `error` (string | null).
  - Action: `async fetchGreeting()` → GET `/api/greetings`, set `greeting` and `fact`, manage loading/error.
  - Use global `fetch`; no new deps; handle non-200 with thrown error.
- **Acceptance Criteria:**
  - Store compiles; no `any` types.
  - All async logic in actions; components use store getters/state only.
- **Effort:** medium

### Phase 3: UI Components & View

#### Task 4: Create GreetingCard component

- [x] **Present greeting + fact**
- **File(s):** `src/frontend/components/GreetingCard.vue`
- **Action:** create
- **Dependencies:** Task 3
- **Golden Reference:** `src/frontend/components/example/`
- **Details:**
  - `<script setup lang="ts">` with props: `greeting: string`, `fact: { text: string; language: string; source: string; permalink: string } | null`, `loading: boolean`, `error: string | null`.
  - Use Vuetify (`v-card`, `v-card-title`, `v-card-text`, `v-alert`, `v-progress-linear`).
  - Show loading state, error state, greeting text, fact text/permalink when present.
  - Add `data-test-id` on card (`greeting-card`), loading (`greeting-loading`), error (`greeting-error`), greeting text (`greeting-text`), fact text (`greeting-fact-text`), fact link (`greeting-fact-link`).
- **Acceptance Criteria:**
  - Component is presentational; no data fetching.
  - All interactive elements have `data-test-id`.
- **Effort:** medium

#### Task 5: Create HomeView

- [x] **Route-level view**
- **File(s):** `src/frontend/views/HomeView.vue`
- **Action:** create
- **Dependencies:** Task 3, Task 4
- **Details:**
  - `<script setup lang="ts">`, import `useGreetingStore`, `GreetingCard`.
  - On `onMounted`, call `store.fetchGreeting()` once.
  - Add a refresh button (`v-btn`) to re-fetch; `data-test-id="refresh-greeting-btn"`.
  - Layout with Vuetify container (`v-container`, `v-row`, `v-col`).
- **Acceptance Criteria:**
  - Uses store for data; no inline fetch.
  - All interactive elements include `data-test-id` (container `home-view`, refresh button, links passed through component props).
- **Effort:** medium

#### Task 6: Update Router

- [x] **Register home route**
- **File(s):** `src/frontend/router/index.ts`
- **Action:** create/modify
- **Dependencies:** Task 5
- **Details:**
  - Add route `/` → `HomeView` (lazy-load if pattern exists).
- **Acceptance Criteria:**
  - Route resolves to HomeView; router compiles.
- **Effort:** small

### Phase 4: Tests

#### Task 7: Store Tests

- [x] **Pinia store unit tests**
- **File(s):** `tests/frontend/stores/useGreetingStore.spec.ts`
- **Action:** create
- **Dependencies:** Task 3
- **Details:**
  - Use testing instructions: Jest + `createTestingPinia` patterns.
  - Mock `fetch` response for `/api/greetings` success and failure.
  - Assert loading/error/greeting/fact state transitions.
- **Acceptance Criteria:**
  - Covers success and error paths; no real network calls.
- **Effort:** medium

#### Task 8: Component Tests

- [x] **GreetingCard component tests**
- **File(s):** `tests/frontend/components/GreetingCard.spec.ts`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Mount with `@vue/test-utils` + Vuetify plugin.
  - Assert rendering for loading, error, and populated states; check `data-test-id` selectors.
- **Acceptance Criteria:**
  - Tests verify conditional rendering.
- **Effort:** small

#### Task 9: View Tests

- [x] **HomeView tests**
- **File(s):** `tests/frontend/views/HomeView.spec.ts`
- **Action:** create
- **Dependencies:** Task 5
- **Details:**
  - Use `createTestingPinia` to mock store actions.
  - Assert that `fetchGreeting` called on mount and when refresh button clicked.
  - Verify `GreetingCard` receives store-provided props.
- **Acceptance Criteria:**
  - Interaction paths covered; no real network calls.
- **Effort:** medium

---

## 3. File/Module-level Changes

| File Path | Action | Rationale | Golden Reference |
|-----------|--------|-----------|------------------|
| `src/frontend/main.ts` | create | App bootstrap | — |
| `src/frontend/App.vue` | create | Root layout | — |
| `src/frontend/stores/useGreetingStore.ts` | create | Store for greetings | `stores/exampleStore.ts` |
| `src/frontend/components/GreetingCard.vue` | create | Present greeting + fact | `components/example/` |
| `src/frontend/views/HomeView.vue` | create | Home route view | `components/example/` patterns |
| `src/frontend/router/index.ts` | create/modify | Register home route | — |
| `tests/frontend/stores/useGreetingStore.spec.ts` | create | Store tests | Existing frontend tests |
| `tests/frontend/components/GreetingCard.spec.ts` | create | Component tests | Existing frontend tests |
| `tests/frontend/views/HomeView.spec.ts` | create | View tests | Existing frontend tests |

---

## 4. API Contract (Frontend ↔ Backend)

- Endpoint: `GET /api/greetings`
- Expected response:
  ```json
  {
    "greeting": "Hello from R3ND",
    "fact": {
      "text": "...",
      "language": "en",
      "source": "...",
      "permalink": "https://..."
    }
  }
  ```

---

## 5. Test Strategy

| Test File | What to Test | Mocks Needed | Coverage Target |
|-----------|--------------|--------------|-----------------|
| `useGreetingStore.spec.ts` | fetch success/error state transitions | `fetch` mock | Success + error |
| `GreetingCard.spec.ts` | Render states (loading/error/data) | None (props-driven) | Render branches |
| `HomeView.spec.ts` | Calls `fetchGreeting` on mount and refresh | Pinia action mock | Interaction |

---

## 6. Deployment & Rollout

### Feature Flags

None.

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `VITE_API_BASE_URL` | No | `/api` | Base URL for API calls (prefix fetches) |

### Migration Plan

None (frontend only).

---

## 7. AI-Agent Guardrails

- Follow `.github/instructions/frontend.instructions.md` (Vue 3, Composition API, Pinia, Vuetify, data-test-id on interactive elements).
- Follow `.github/instructions/testing.instructions.md` (Jest, `@vue/test-utils`, `createTestingPinia`).
- No new dependencies unless justified above.
- No `any` types, no commented-out code, files < 400 LOC.

---

## 8. Definition of Done

- [x] All tasks in Section 2 marked complete
- [x] App boots and renders Home view
- [x] Home view fetches greeting via store and displays greeting + fact
- [x] All tests pass; no lint/type errors
- [x] No `any` types or unused code

---

## Notes

This scaffold build plan guides the developer agent to bootstrap the frontend. Ensure all interactive elements include `data-test-id` attributes for testing.

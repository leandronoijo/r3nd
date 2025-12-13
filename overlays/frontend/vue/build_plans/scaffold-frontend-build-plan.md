# Build Plan: scaffold-frontend

> **Source:** Internal scaffold requirements  
> **Created:** 2025-12-12  
> **Status:** Draft | In Progress | Complete

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [ ] Read `.github/instructions/frontend.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Identify golden reference components/stores:
  - Frontend components: `src/frontend/components/example/`
  - Frontend store: `src/frontend/stores/exampleStore.ts`
- [ ] Confirm no new dependencies needed (or justify additions below)
- [ ] List integration points with existing modules (see Section 1)
- [ ] Review tech spec for any open questions

### New Dependencies (if any)

| Package | Purpose | Justification |
|---------|---------|---------------|
| vue | Framework | Core Vue 3 framework |
| pinia | State management | For global state as per instructions |
| vuetify | UI library | Only allowed UI library per instructions |
| @mdi/font | Icons | Required by Vuetify for Material Design Icons |
| vue-router | Routing | For SPA navigation |
| typescript | Language | For type safety |
| @vue/tsconfig | TS config | Standard Vue TS config |
| vite | Build tool | Fast dev server and build |
| @vitejs/plugin-vue | Vite plugin | For Vue SFC support |
| @types/node | Node types | For dev tooling |
| jest | Test runner | Per testing instructions |
| @vue/test-utils | Vue testing | Per testing instructions |
| jest-environment-jsdom | Test env | For DOM testing |
| @types/jest | Jest types | For TS support |
| ts-node | Dev tooling | Allows Jest to load the TypeScript `jest.config.ts` |
| @vue/compiler-dom | Compiler | Required by the Vue test-utils bundle used in Jest |
| @vue/server-renderer | SSR runtime | Required by the Vue test-utils bundle used in Jest |

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

#### Task 0: Set up package.json and dependencies

- [ ] **Create package.json and install deps**
- **File(s):** `src/frontend/package.json`
- **Action:** create
- **Dependencies:** None
- **Details:**
  - **Prefer CLI**: Use `npm init -y` or `npm create vite@latest` to scaffold initial project, then use `npm install <package>` for each dependency instead of manually editing the file.
  - Required packages (install via CLI):
    - `npm install vue pinia vuetify @mdi/font vue-router`
    - `npm install -D typescript @vue/tsconfig vite @vitejs/plugin-vue @types/node jest @vue/test-utils jest-environment-jsdom @types/jest`
  - Update scripts in `package.json`:
    - `dev`: `vite`
    - `build`: `vite build`
    - `test`: `jest`
  - **Why CLI**: Ensures lockfile sync, correct version resolution, and follows framework best practices.
- **Acceptance Criteria:**
  - package.json exists with all required deps; node_modules installed.
  - Scripts are correctly defined.
  - `package-lock.json` is generated and in sync.
- **Effort:** small

#### Task 0.5: Create .gitignore

- [ ] **Add .gitignore for frontend**
- **File(s):** `src/frontend/.gitignore`
- **Action:** create
- **Dependencies:** None
- **Details:**
  - Ignore `node_modules/`, `dist/`, `*.log`, `.env*`, `coverage/`, `npm-debug.log*`, `.DS_Store`, etc.
- **Acceptance Criteria:**
  - .gitignore exists and ignores common Node.js and build artifacts.
- **Effort:** small

#### Task 1: Initialize main.ts

- [ ] **Create frontend bootstrap file**
- **File(s):** `src/frontend/main.ts`
- **Action:** create
- **Dependencies:** Task 0
- **Details:**
  - Create Vue app, install Pinia, Vuetify, and Router.
  - Mount to `#app`.
- **Acceptance Criteria:**
  - App boots without console errors.
- **Effort:** small

#### Task 2: Create App.vue

- [ ] **Root layout**
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

#### Task 2.5: Validate build and scripts

- [ ] **Ensure npm scripts work**
- **File(s):** N/A
- **Action:** run commands
- **Dependencies:** Task 0, Task 1, Task 2
- **Details:**
  - Run `npm run build` to ensure Vite build succeeds.
  - Run `npm run test` to ensure all tests pass.
  - Run `npm run dev` briefly (e.g., timeout after 5 seconds) to ensure the dev server starts without errors.
- **Acceptance Criteria:**
  - `npm run build` completes without errors.
  - `npm run test` passes all tests.
  - `npm run dev` starts the dev server without errors.
- **Effort:** small

### Phase 2: State & API

#### Task 3: Create Greeting Store

- [ ] **Pinia store for greetings**
- **File(s):** `src/frontend/stores/useGreetingStore.ts`
- **Action:** create
- **Dependencies:** Task 2
- **Golden Reference:** `src/frontend/stores/exampleStore.ts`
- **Details:**
  - `defineStore` with setup syntax.
  - State: `greeting` (string | null), `fact` (object | null), `loading` (boolean), `error` (string | null).
  - Action: `async fetchGreeting()` → GET `/api/greetings`, set `greeting` and `fact`, manage loading/error.
  - **API base URL resolution** (runtime-configurable pattern):
    - Read runtime-injected global: `(globalThis as any).__VITE_API_BASE_URL__`
    - Fallback to build-time env: `import.meta.env.VITE_API_BASE_URL` (if using Vite)
    - Default fallback: `'/api'` (relative path for proxy/same-origin)
    - Treat empty strings as undefined: use `|| undefined` to ensure fallback chain works
    - Example: `const apiBase = ((globalThis as any).__VITE_API_BASE_URL__) || import.meta.env.VITE_API_BASE_URL || '/api';`
  - Use global `fetch`; no new deps; handle non-200 with thrown error.
  - Validate response content-type is JSON before parsing to avoid silent HTML responses.
- **Acceptance Criteria:**
  - Store compiles; no `any` types.
  - All async logic in actions; components use store getters/state only.
  - API base URL supports runtime configuration without rebuild.
- **Effort:** medium

### Phase 3: UI Components & View

#### Task 5: Create GreetingCard component

- [ ] **Present greeting + fact**
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

#### Task 6: Create HomeView

- [ ] **Route-level view**
- **File(s):** `src/frontend/views/HomeView.vue`
- **Action:** create
- **Dependencies:** Task 4, Task 5
- **Details:**
  - `<script setup lang="ts">`, import `useGreetingStore`, `GreetingCard`.
  - On `onMounted`, call `store.fetchGreeting()` once.
  - Add a refresh button (`v-btn`) to re-fetch; `data-test-id="refresh-greeting-btn"`.
  - Layout with Vuetify container (`v-container`, `v-row`, `v-col`).
- **Acceptance Criteria:**
  - Uses store for data; no inline fetch.
  - All interactive elements include `data-test-id` (container `home-view`, refresh button, links passed through component props).
- **Effort:** medium

#### Task 7: Update Router

- [ ] **Register home route**
- **File(s):** `src/frontend/router/index.ts`
- **Action:** create/modify
- **Dependencies:** Task 6
- **Details:**
  - Add route `/` → `HomeView` (lazy-load if pattern exists).
- **Acceptance Criteria:**
  - Route resolves to HomeView; router compiles.
- **Effort:** small

### Phase 4: Tests

#### Task 8: Store Tests

- [ ] **Pinia store unit tests**
- **File(s):** `tests/frontend/stores/useGreetingStore.spec.ts`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Use testing instructions: Jest + `createTestingPinia` patterns.
  - Mock `fetch` response for `/api/greetings` success and failure.
  - Assert loading/error/greeting/fact state transitions.
- **Acceptance Criteria:**
  - Covers success and error paths; no real network calls.
- **Effort:** medium

#### Task 9: Component Tests

- [ ] **GreetingCard component tests**
- **File(s):** `tests/frontend/components/GreetingCard.spec.ts`
- **Action:** create
- **Dependencies:** Task 5
- **Details:**
  - Mount with `@vue/test-utils` + Vuetify plugin.
  - Assert rendering for loading, error, and populated states; check `data-test-id` selectors.
- **Acceptance Criteria:**
  - Tests verify conditional rendering.
- **Effort:** small

#### Task 10: View Tests

- [ ] **HomeView tests**
- **File(s):** `tests/frontend/views/HomeView.spec.ts`
- **Action:** create
- **Dependencies:** Task 6
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
| `src/frontend/package.json` | create | Project config and deps | — |
| `src/frontend/.gitignore` | create | Ignore build artifacts | — |
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

- [ ] All tasks in Section 2 marked complete
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts dev server without errors
- [ ] `npm run test` passes all tests
- [ ] App boots and renders Home view
- [ ] Home view fetches greeting via store and displays greeting + fact
- [ ] No `any` types or unused code

---

## Notes

This scaffold build plan guides the developer agent to bootstrap the frontend. Ensure all interactive elements include `data-test-id` attributes for testing.

---

## Implementation Notes (Added by Developer)

### Pre-Implementation Clarification
The golden reference paths `src/frontend/components/example/` and `src/frontend/stores/exampleStore.ts` referenced in Section 0 and Section 3 do not exist in the current repository; frontend patterns will follow the instructions in `.github/instructions/*` instead.

### Tech Spec Clarification
The `rnd/tech_specs/` directory does not contain a spec for this feature, so there was nothing to review before implementation.


### Testing Dependency Clarification
`ts-jest`, `@vue/vue3-jest`, `identity-obj-proxy`, `@pinia/testing`, and `@vue/compiler-sfc` were added to the frontend package to enable Jest-powered TS + Vue SFC testing, mock-based Vuetify usage, and the Vite compiler support that the build plan’s base stack requires.

### Jest/Test Setup Notes
Jest now loads the `tests/` folder via `<rootDir>/../../tests`, points `moduleDirectories` at `./node_modules`, and overrides `tsconfig.jest.json` to search both `node_modules` and `../src/frontend/node_modules` so tests can resolve runtime deps without a root-level install. Vuetify imports are mapped to lightweight mocks in `tests/__mocks__`, and `shims-vue.d.ts` declares the stubbed `vuetify` modules so TypeScript stays happy while the real frontend still uses the actual components.

### Dependency & Runtime Notes
- Added `ts-node` so Jest can load the TypeScript `jest.config.ts`.
- Added `@vue/compiler-dom` and `@vue/server-renderer` because the mocked `@vue/test-utils` build exposes `Vue` via those globals inside `tests/setupTests.ts`.
- `tests/setupTests.ts` now wires the `Vue`, compiler, and the `__VITE_API_BASE_URL__` / `__VITE_BASE_URL__` tokens that `vite.config.ts` exposes through `define`, which lets the store/router avoid direct `import.meta` usage while still honoring the Vite env variables.

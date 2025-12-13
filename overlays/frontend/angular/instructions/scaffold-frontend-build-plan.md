# Build Plan: scaffold-frontend

> **Source:** Internal scaffold requirements  
> **Created:** 2025-12-13  
> **Status:** Draft | In Progress | Complete

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [x] Read `.github/instructions/frontend.instructions.md`
- [x] Read `.github/instructions/testing.instructions.md`
- [x] Identify golden reference components/services:
  - Frontend components: `src/frontend/app/components/example/`
  - Frontend service: `src/frontend/app/services/example-state.service.ts`
- [x] Confirm no new dependencies needed (or justify additions below)
- [x] List integration points with existing modules (see Section 1)
- [x] Review tech spec for any open questions

### New Dependencies (if any)

| Package | Purpose | Justification |
|---------|---------|---------------|
| @angular/core | Framework | Core Angular framework |
| @angular/common | Common directives | For CommonModule (*ngIf, *ngFor, etc.) |
| @angular/platform-browser | Browser platform | For browser rendering |
| @angular/platform-browser-dynamic | Dynamic bootstrap | For JIT compilation |
| @angular/router | Routing | For SPA navigation |
| @angular/cli | CLI tooling | For scaffolding and builds |
| primeng | UI library | Only allowed UI library per instructions |
| primeicons | Icons | Required by PrimeNG for icons |
| rxjs | Reactive programming | For state management and async operations |
| typescript | Language | For type safety |
| @angular-devkit/build-angular | Build tools | Angular build system |
| jasmine-core | Test framework | Per testing instructions (default Angular testing) |
| karma | Test runner | Per testing instructions (default Angular testing) |
| karma-jasmine | Test adapter | Jasmine adapter for Karma |
| karma-chrome-launcher | Test browser | Chrome launcher for Karma |
| karma-coverage | Test coverage | Coverage reporting |
| @types/jasmine | Jasmine types | For TS support in tests |

---

## 1. Implementation Overview

**Approach:** Bootstrap an Angular 20 standalone application with RxJS state management and PrimeNG UI that fetches a greeting from the backend and displays it via a service-driven component.

**Key Decisions:**
- Use standalone components (no NgModules).
- Use RxJS BehaviorSubjects for state management; no third-party state libraries.
- Use PrimeNG components for layout and UI (no raw HTML for interactive elements).
- Provide `data-test-id` on all interactive elements for E2E/component testing.

**Integration Points:**
| Existing Module | Integration Type | Notes |
|-----------------|------------------|-------|
| Backend `/api/greetings` | HTTP fetch via service | Returns greeting + fact |

---

## 2. Task Breakdown

### Phase 1: App Shell

#### Task 0: Set up Angular project and dependencies

- [x] **Create Angular project and install deps**
- **File(s):** `src/frontend/`
- **Action:** create
- **Dependencies:** None
- **Details:**
  - **Prefer CLI**: Use `ng new frontend --routing --style=scss --standalone` to scaffold initial project, then use `npm install <package>` for each additional dependency.
  - Required packages (install via CLI):
    - `npm install primeng primeicons`
  - Dev server convenience:
    - Add a `proxy.conf.json` that proxies `/api` to `http://localhost:3000` and update the `start` script to use `ng serve --proxy-config proxy.conf.json` so local dev calls to `/api` reach the backend without needing runtime injection.
  - Update `angular.json`:
    - Add PrimeNG styles to `styles` array: `"node_modules/primeng/resources/themes/lara-light-blue/theme.css"`, `"node_modules/primeng/resources/primeng.min.css"`, `"node_modules/primeicons/primeicons.css"`
  - **Why CLI**: Ensures correct Angular workspace structure, lockfile sync, and follows framework best practices.
- **Acceptance Criteria:**
  - Angular project structure exists with all required deps; node_modules installed.
  - `angular.json` configured with PrimeNG styles.
  - `package-lock.json` is generated and in sync.
- **Effort:** small

#### Task 0.5: Create .gitignore

- [x] **Verify .gitignore for frontend**
- **File(s):** `src/frontend/.gitignore`
- **Action:** verify/create
- **Dependencies:** Task 0
- **Details:**
  - Angular CLI should create this automatically. Verify it ignores `node_modules/`, `dist/`, `*.log`, `.angular/`, `coverage/`, etc.
- **Acceptance Criteria:**
  - .gitignore exists and ignores common Node.js and Angular build artifacts.
- **Effort:** small

#### Task 1: Initialize main.ts

- [x] **Verify frontend bootstrap file**
- **File(s):** `src/frontend/src/main.ts`
- **Action:** verify/modify
- **Dependencies:** Task 0
- **Details:**
  - Angular CLI creates this automatically with `bootstrapApplication(AppComponent, appConfig)`.
  - Verify it uses standalone bootstrap pattern.
- **Acceptance Criteria:**
  - App boots without console errors.
- **Effort:** small

#### Task 2: Create AppComponent

- [x] **Root layout**
- **File(s):** `src/frontend/src/app/app.component.ts`
- **Action:** verify/modify
- **Dependencies:** Task 1
- **Details:**
  - Angular CLI creates this automatically as standalone component.
  - Modify template to use PrimeNG layout components (if needed).
  - Include `<router-outlet></router-outlet>`.
- **Acceptance Criteria:**
  - Uses PrimeNG structure; no inline HTTP.
  - Component is standalone with proper imports.
- **Effort:** small

#### Task 2.5: Validate build and scripts

- [x] **Ensure npm scripts work**
- **File(s):** N/A
- **Action:** run commands
- **Dependencies:** Task 0, Task 1, Task 2
- **Details:**
  - Run `npm run build` to ensure Angular build succeeds.
  - Run `npm run test` to ensure all tests pass.
  - Run `npm start` briefly (e.g., timeout after 5 seconds) to ensure the dev server starts without errors.
- **Acceptance Criteria:**
  - `npm run build` completes without errors.
  - `npm run test` passes all tests.
  - `npm start` starts the dev server without errors.
- **Effort:** small

### Phase 2: State & API

#### Task 3: Create Greeting Service

- [x] **Injectable service for greetings**
- **File(s):** `src/frontend/src/app/services/greeting.service.ts`
- **Action:** create
- **Dependencies:** Task 2
- **Golden Reference:** `src/frontend/app/services/example-state.service.ts`
- **Details:**
  - Generate with CLI: `ng generate service app/services/greeting`
  - `@Injectable({ providedIn: 'root' })`.
  - State (private BehaviorSubjects):
    - `greetingSubject: BehaviorSubject<string | null>`
    - `factSubject: BehaviorSubject<Fact | null>`
    - `loadingSubject: BehaviorSubject<boolean>`
    - `errorSubject: BehaviorSubject<string | null>`
  - Public observables (read-only):
    - `greeting$: Observable<string | null>`
    - `fact$: Observable<Fact | null>`
    - `loading$: Observable<boolean>`
    - `error$: Observable<string | null>`
  - Method: `fetchGreeting(): void` → GET `/api/greetings`, update subjects, manage loading/error.
  - **API base URL resolution** (runtime-configurable pattern):
    - Read runtime-injected globals (support both common names): `(globalThis as any).__API_BASE_URL__` and `(globalThis as any).__VITE_API_BASE_URL__`.
    - Default fallback: `'/api'` (relative path for proxy/same-origin).
    - Treat empty strings as undefined: use `|| undefined` to ensure fallback chain works.
    - Example: `const apiBase = ((globalThis as any).__API_BASE_URL__ || (globalThis as any).__VITE_API_BASE_URL__) || '/api';`
    - Note: the runner/server should inject at least one of the globals (preferably both) so browser clients pick the correct backend host/port.
  - Use Angular `HttpClient`; inject in constructor.
  - Use RxJS operators: `map`, `catchError`, `tap`, `finalize`.
  - Validate response content-type is JSON before parsing to avoid silent HTML responses.
- **Acceptance Criteria:**
  - Service compiles; no `any` types.
  - All HTTP logic in service; components use observables only.
  - API base URL supports runtime configuration without rebuild.
  - Runtime injection: the service respects injected runtime variables (supports both `__API_BASE_URL__` and `__VITE_API_BASE_URL__`) and falls back to `/api`.
  - BehaviorSubjects are private; only observables exposed publicly.
- **Effort:** medium

#### Task 4: Configure HTTP Client

- [x] **Provide HttpClient**
- **File(s):** `src/frontend/src/app/app.config.ts`
- **Action:** create/modify
- **Dependencies:** Task 3
- **Details:**
  - Angular CLI should create `app.config.ts` with providers.
  - Add `provideHttpClient()` to providers array.
  - Import from `@angular/common/http`.
- **Acceptance Criteria:**
  - HttpClient is available for injection in services.
- **Effort:** small

### Phase 3: UI Components & View

#### Task 5: Create GreetingCard component

- [x] **Present greeting + fact**
- **File(s):** `src/frontend/src/app/components/greeting-card/greeting-card.component.ts`
- **Action:** create
- **Dependencies:** Task 3
- **Golden Reference:** `src/frontend/app/components/example/`
- **Details:**
  - Generate with CLI: `ng generate component app/components/greeting-card --standalone`
  - Inputs:
    - `@Input() greeting: string | null = null;`
    - `@Input() fact: Fact | null = null;`
    - `@Input() loading: boolean = false;`
    - `@Input() error: string | null = null;`
  - Use PrimeNG (`p-card`, `p-message`, `p-progressBar`).
  - Show loading state, error state, greeting text, fact text/permalink when present.
  - Add `data-test-id` on card (`greeting-card`), loading (`greeting-loading`), error (`greeting-error`), greeting text (`greeting-text`), fact text (`greeting-fact-text`), fact link (`greeting-fact-link`).
  - Import required PrimeNG modules in `imports: []` array.
- **Acceptance Criteria:**
  - Component is presentational; no data fetching.
  - All interactive elements have `data-test-id`.
  - Component is standalone with all dependencies imported.
- **Effort:** medium

#### Task 6: Create HomePage component

- [x] **Route-level page component**
- **File(s):** `src/frontend/src/app/pages/home/home.component.ts`
- **Action:** create
- **Dependencies:** Task 4, Task 5
- **Details:**
  - Generate with CLI: `ng generate component app/pages/home --standalone`
  - Inject `GreetingService` in constructor.
  - In `ngOnInit`, call `greetingService.fetchGreeting()` once.
  - Use `async` pipe to subscribe to service observables in template.
  - Add a refresh button (`p-button`) to re-fetch; `data-test-id="refresh-greeting-btn"`.
  - Pass observable values to `<app-greeting-card>` component.
  - Use PrimeNG layout components for container structure.
  - Import GreetingCardComponent and PrimeNG modules in `imports: []`.
- **Acceptance Criteria:**
  - Uses service for data; no inline HTTP.
  - All interactive elements include `data-test-id` (container `data-test-id="home-page"`, refresh button).
  - Uses `async` pipe for subscriptions (no manual subscribe/unsubscribe).
- **Effort:** medium

#### Task 7: Update Router

- [x] **Register home route**
- **File(s):** `src/frontend/src/app/app.routes.ts`
- **Action:** create/modify
- **Dependencies:** Task 6
- **Details:**
  - Angular CLI creates `app.routes.ts` for standalone routing.
  - Add route `{ path: '', component: HomeComponent }` (lazy-load if pattern exists).
  - Import HomeComponent.
- **Acceptance Criteria:**
  - Route resolves to HomeComponent; router compiles.
- **Effort:** small

### Phase 4: Tests

#### Task 8: Service Tests

- [x] **Greeting service unit tests**
- **File(s):** `src/frontend/src/app/services/greeting.service.spec.ts`
- **Action:** modify
- **Dependencies:** Task 4
- **Details:**
  - Angular CLI creates `.spec.ts` file automatically with component/service generation.
  - Use testing instructions: Jasmine + Angular TestBed patterns.
  - Mock `HttpClient` with `HttpClientTestingModule`.
  - Assert loading/error/greeting/fact state transitions via observables.
  - Test success and error HTTP responses.
- **Acceptance Criteria:**
  - Covers success and error paths; no real network calls.
  - Uses RxJS testing patterns (subscribe to observables, assert emissions).
- **Effort:** medium

#### Task 9: Component Tests

- [x] **GreetingCard component tests**
- **File(s):** `src/frontend/src/app/components/greeting-card/greeting-card.component.spec.ts`
- **Action:** modify
- **Dependencies:** Task 5
- **Details:**
  - Angular CLI creates this automatically.
  - Use TestBed to configure testing module with PrimeNG imports.
  - Create component fixture with different input combinations.
  - Assert rendering for loading, error, and populated states; check `data-test-id` selectors.
- **Acceptance Criteria:**
  - Tests verify conditional rendering.
  - Uses Angular testing utilities (ComponentFixture, DebugElement).
- **Effort:** small

#### Task 10: Page Tests

- [x] **HomePage tests**
- **File(s):** `src/frontend/src/app/pages/home/home.component.spec.ts`
- **Action:** modify
- **Dependencies:** Task 6
- **Details:**
  - Angular CLI creates this automatically.
  - Use TestBed to provide mock GreetingService.
  - Assert that `fetchGreeting` called on init and when refresh button clicked.
  - Verify `GreetingCardComponent` receives service-provided values via async pipe.
- **Acceptance Criteria:**
  - Interaction paths covered; no real network calls.
  - Uses Jasmine spies to verify service method calls.
- **Effort:** medium

---

## 3. File/Module-level Changes

| File Path | Action | Rationale | Golden Reference |
|-----------|--------|-----------|------------------|
| `src/frontend/package.json` | create | Project config and deps | — |
| `src/frontend/.gitignore` | verify | Ignore build artifacts | — |
| `src/frontend/src/main.ts` | verify | App bootstrap | — |
| `src/frontend/src/app/app.component.ts` | verify/modify | Root layout | — |
| `src/frontend/src/app/app.config.ts` | create/modify | Provide HttpClient | — |
| `src/frontend/src/app/services/greeting.service.ts` | create | Service for greetings | `services/example-state.service.ts` |
| `src/frontend/src/app/components/greeting-card/` | create | Present greeting + fact | `components/example/` |
| `src/frontend/src/app/pages/home/` | create | Home route page | `components/example/` patterns |
| `src/frontend/src/app/app.routes.ts` | create/modify | Register home route | — |
| `src/frontend/src/app/services/greeting.service.spec.ts` | modify | Service tests | Existing tests |
| `src/frontend/src/app/components/greeting-card/*.spec.ts` | modify | Component tests | Existing tests |
| `src/frontend/src/app/pages/home/*.spec.ts` | modify | Page tests | Existing tests |

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
| `greeting.service.spec.ts` | fetch success/error state transitions | HttpClientTestingModule | Success + error |
| `greeting-card.component.spec.ts` | Render states (loading/error/data) | None (inputs-driven) | Render branches |
| `home.component.spec.ts` | Calls `fetchGreeting` on init and refresh | Mock GreetingService | Interaction |

---

## 6. Deployment & Rollout

### Feature Flags

None.

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `API_BASE_URL` | No | `/api` | Base URL for API calls (prefix fetches); recommended runtime env name to inject for browser access (e.g., `http://localhost:3000/api`). |
| `VITE_API_BASE_URL` | No | (alias) | Historical/alternate env name used by some runners; server should inject either or both names to ensure clients pick it up. |

### Migration Plan

None (frontend only).

---

## 7. AI-Agent Guardrails

- Follow `.github/instructions/frontend.instructions.md` (Angular 20, standalone components, RxJS, PrimeNG, data-test-id on interactive elements).
- Follow `.github/instructions/testing.instructions.md` (Jasmine, Karma, TestBed, HttpClientTestingModule).
- No new dependencies unless justified above.
- No `any` types, no commented-out code, files < 400 LOC.

---

## 8. Definition of Done

- [x] All tasks in Section 2 marked complete
- [x] `npm run build` completes without errors
- [x] `npm start` starts dev server without errors
- [x] `npm run test` passes all tests
- [x] App boots and renders Home page
- [x] Home page fetches greeting via service and displays greeting + fact
- [x] No `any` types or unused code

---

## Notes

This scaffold build plan guides the developer agent to bootstrap the frontend. Ensure all interactive elements include `data-test-id` attributes for testing.

### Troubleshooting

- Symptom: Browser network tab shows requests to `http://<frontend-host>:<frontend-port>/api/...` returning HTML instead of JSON.
  - Cause: Runtime env not injected for browser use or env points to an internal container hostname (e.g., `http://backend:3000/api`).
  - Fix: For local/browser access set `API_BASE_URL` or `VITE_API_BASE_URL` to `http://localhost:3000/api` and ensure the runner/server injects it into HTML (preferably inject both `__API_BASE_URL__` and `__VITE_API_BASE_URL__`). For local dev, prefer using the dev proxy (`proxy.conf.json`) so `/api` requests are forwarded to port 3000.

---

## Implementation Notes (Added by Developer)

### Pre-Implementation Clarification
The golden reference paths `src/frontend/app/components/example/` and `src/frontend/app/services/example-state.service.ts` referenced in Section 0 and Section 3 do not exist in the current repository; frontend patterns will follow the instructions in `.github/instructions/*` instead.

### Tech Spec Clarification
The `rnd/tech_specs/` directory does not contain a spec for this feature, so there was nothing to review before implementation.

### Testing Dependency Clarification
All testing dependencies (Jasmine, Karma, etc.) are included by default with Angular CLI project generation.

### Angular CLI Notes
Angular CLI handles most of the initial setup automatically. The build plan assumes you'll use `ng new` to create the project structure and `ng generate` for components/services, which automatically creates `.spec.ts` files and configures the standalone pattern.

### Dependency & Runtime Notes
- PrimeNG styles must be added to `angular.json` in the `styles` array for global theme/component styles.
- HttpClient is provided via `app.config.ts` using `provideHttpClient()` for standalone applications.
- The `__API_BASE_URL__` runtime global can be injected by a custom server similar to the Vue pattern, allowing environment configuration without rebuilds.
 - The runtime global can be injected by a custom server similar to the Vue pattern, allowing environment configuration without rebuilds. **Inject both** `__API_BASE_URL__` and `__VITE_API_BASE_URL__` (or at least one) to be robust to different client expectations; prefer `http://localhost:3000/api` for browser-level access in local/dev setups.

### PrimeNG Asset Clarification
PrimeNG 21 no longer exposes the legacy `resources` directory via its `exports` map, so the theme, PrimeIcons CSS, and associated fonts/images were downloaded from the CDN (v17.1 assets) into `src/styles/` and referenced locally to keep the build deterministic. This avoids relying on unreachable paths when `angular.json` injects the styles.

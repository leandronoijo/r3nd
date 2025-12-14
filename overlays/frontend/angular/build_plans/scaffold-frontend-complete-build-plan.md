# Build Plan: scaffold-frontend — Complete (state, components, tests)

> **Scope:** Implement RxJS state service, Greeting components, routing, and tests. Ensure builds and tests run locally and that the Home page fetches the greeting from the backend (when available).
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
| PrimeNG modules (already installed) | UI components |
| `@angular/common/http` (built-in) | HTTP client |
| Jasmine/Karma (already installed) | Testing |

---

## 1. Implementation Overview

**Approach:** Add a `GreetingService` (RxJS BehaviorSubjects), `GreetingCardComponent`, `HomeComponent` that uses the service to fetch the greeting from `/api/greetings`, update the router, and add Jasmine/Karma tests for the service and components.

**Goal:** App compiles, unit tests pass (`npm --prefix src/frontend test`), and when the backend is available (local dev or proxy), the Home page displays the greeting + fact fetched from `/api/greetings`.

**Acceptance Criteria (Complete):**
- `npm --prefix src/frontend run build` succeeds ✅
- `npm --prefix src/frontend test` passes ✅
- `Home` page fetches and displays `/api/greetings` when backend is available ✅

---

## 2. Tasks

### Task 1: Create GreetingService
- `ng generate service app/services/greeting`
- `@Injectable({ providedIn: 'root' })`
- State (private BehaviorSubjects):
  - `greetingSubject: BehaviorSubject<string | null>`
  - `factSubject: BehaviorSubject<Fact | null>`
  - `loadingSubject: BehaviorSubject<boolean>`
  - `errorSubject: BehaviorSubject<string | null>`
- Public observables (read-only):
  - `greeting$`, `fact$`, `loading$`, `error$`
- Method: `fetchGreeting(): void` → GET `/api/greetings`, update subjects
- **API base URL resolution** (runtime-configurable):
  - Read `(globalThis as any).__API_BASE_URL__` or `(globalThis as any).__VITE_API_BASE_URL__`
  - Default fallback: `'/api'`
  - Example: `const apiBase = ((globalThis as any).__API_BASE_URL__ || (globalThis as any).__VITE_API_BASE_URL__) || '/api';`

### Task 2: Configure HttpClient
- Update `src/app/app.config.ts` to add `provideHttpClient()` to providers.

### Task 3: Create GreetingCardComponent
- `ng generate component app/components/greeting-card --standalone`
- Inputs: `greeting`, `fact`, `loading`, `error`
- Use PrimeNG (`p-card`, `p-message`, `p-progressBar`)
- Add `data-test-id` attributes on all interactive elements

### Task 4: Create HomeComponent
- `ng generate component app/pages/home --standalone`
- Inject `GreetingService`
- In `ngOnInit`, call `greetingService.fetchGreeting()`
- Use `async` pipe to subscribe to observables
- Add refresh button with `data-test-id="refresh-greeting-btn"`
- Pass observables to `<app-greeting-card>`

### Task 5: Update Router
- Update `src/app/app.routes.ts` to add route `{ path: '', component: HomeComponent }`

### Task 6: Add proxy config (optional)
- Create `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

- Update `package.json` start script: `"start": "ng serve --proxy-config proxy.conf.json"`

### Task 7: Tests
- Service tests (`src/app/services/greeting.service.spec.ts`):
  - Use `HttpClientTestingModule`
  - Test success and error paths
  - Assert state transitions via observables

- Component tests (`src/app/components/greeting-card/*.spec.ts`):
  - Test rendering for loading, error, and populated states
  - Verify `data-test-id` selectors

- Page tests (`src/app/pages/home/*.spec.ts`):
  - Mock `GreetingService`
  - Assert `fetchGreeting` called on init
  - Test refresh button click

---

## 3. File List (Complete)

| File Path | Action |
|---|---|
| `src/frontend/src/app/services/greeting.service.ts` | create |
| `src/frontend/src/app/services/greeting.service.spec.ts` | create |
| `src/frontend/src/app/components/greeting-card/` | create |
| `src/frontend/src/app/components/greeting-card/*.spec.ts` | create |
| `src/frontend/src/app/pages/home/` | create |
| `src/frontend/src/app/pages/home/*.spec.ts` | create |
| `src/frontend/src/app/app.routes.ts` | modify |
| `src/frontend/src/app/app.config.ts` | modify |
| `src/frontend/proxy.conf.json` | create (optional) |

---

## 4. Test Strategy

- Service tests: mock HttpClient with `HttpClientTestingModule`
- Component tests: test inputs-driven rendering with TestBed
- Page tests: mock service with Jasmine spies

---

## 5. Run Instructions

Start dev server (from repo root):

```bash
npm --prefix src/frontend start
```

Run tests:

```bash
npm --prefix src/frontend test
```

Build:

```bash
npm --prefix src/frontend run build
```

---

## 6. Definition of Done (Complete)

- [ ] Service created with RxJS state management ✅
- [ ] Components created with PrimeNG and `data-test-id` ✅
- [ ] Router configured with home route ✅
- [ ] HttpClient provided in app config ✅
- [ ] All tests pass (`npm test`) ✅
- [ ] App fetches and displays greeting when backend available ✅
- [ ] Runtime API base URL configuration works ✅

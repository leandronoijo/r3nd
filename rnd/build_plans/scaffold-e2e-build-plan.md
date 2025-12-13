# Build Plan: scaffold-e2e

> **Source:** Internal scaffold requirements  
> **Created:** 2025-12-12  
> **Status:** Draft | In Progress | Complete

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [x] Read `.github/instructions/testing.instructions.md`
- [x] Read `.github/instructions/frontend.instructions.md`
- [x] Read `.github/instructions/backend.instructions.md`
- [ ] Ensure backend (`/api/greetings`) and frontend (Home view) are available/running
- [x] Confirm `data-test-id` selectors implemented per frontend plan
- [x] No new dependencies (Playwright already configured; otherwise justify below)

### New Dependencies (if any)

| Package | Purpose | Justification |
|---------|---------|---------------|
| `@playwright/test` | E2E runner | Provides the Playwright test harness used by `tests/e2e/*` and the `test:e2e` script; required because the plan assumes Playwright is available. |

---

## 1. Implementation Overview

**Approach:** Add Playwright E2E tests that verify the end-to-end greeting flow using stable `data-test-id` selectors defined in the frontend scaffold. Tests run against the composed stack (frontend + backend + Mongo) and mock nothing.

**Key Decisions:**
- Use Playwright test runner per testing instructions.
- Target the frontend URL (default `http://localhost:4173`) with backend reachable at `/api/greetings`.
- Use `data-test-id` selectors exclusively; no CSS/XPath.

**Integration Points:**
| Component | Integration Type | Notes |
|-----------|------------------|-------|
| Frontend HomeView | UI under test | Uses store to call `/api/greetings` |
| Backend `/api/greetings` | API dependency | Must return greeting + fact |
| Mongo | Data source | Backend pre-seeded via cron or manual ingest |

---

## 2. Task Breakdown

### Phase 1: Test Harness

#### Task 1: Ensure Playwright config

- [x] **Verify/adjust Playwright config**
- **File(s):** `playwright.config.ts` (or repo equivalent)
- **Action:** create/modify
- **Details:**
  - Base URL: `http://localhost:4173` (align with docker-compose frontend port) or env `E2E_BASE_URL`.
  - Use headed/CI browsers per repo defaults.
  - Global timeout reasonable (e.g., 30s).
- **Acceptance Criteria:**
  - Config resolves base URL and runs locally and in CI.
- **Effort:** small

### Phase 2: Test Suites

#### Task 2: Home flow E2E

- [x] **Create main E2E spec**
- **File(s):** `tests/e2e/greeting.e2e.spec.ts`
- **Action:** create
- **Dependencies:** Frontend/Backend running
- **Details:**
  - Navigate to `/` (Home).
  - Wait for greeting card to render.
  - Assert loading indicator hides; greeting text appears (`data-test-id="greeting-text"`).
  - Assert fact text/link present (`greeting-fact-text`, `greeting-fact-link`).
  - Click refresh (`refresh-greeting-btn`) and wait for new greeting/fact (assert text changes or request completes).
- **Acceptance Criteria:**
  - Uses only `data-test-id` selectors.
  - Covers load and refresh paths.
- **Effort:** medium

#### Task 3: Error surfacing (optional if API can fail)

- [ ] **Add error-path E2E (if backend can simulate failure)**
- **File(s):** `tests/e2e/greeting-error.e2e.spec.ts`
- **Action:** create (optional based on backend feature flag)
- **Details:**
  - If backend exposes a toggle to force error, verify error message surfaces in UI (`greeting-error`).
- **Acceptance Criteria:**
  - Only include if error toggling is feasible without code changes.
- **Effort:** small

### Phase 3: Test Data & Fixtures

#### Task 4: Seed/warm-up step

- [x] **Ensure data available**
- **File(s):** `tests/e2e/fixtures/README.md` (doc) or `scripts/seed` (if needed)
- **Action:** doc/create (optional)
- **Details:**
  - Note that backend hourly ingest should populate facts; optionally add a pre-test call to `/api/greetings` to warm cache.
- **Acceptance Criteria:**
  - E2E tests not flaky due to empty DB; warm-up strategy documented.
- **Effort:** small

### Phase 4: CI/Run Instructions

#### Task 5: Add package script (if missing)

- [x] **Wire NPM script for E2E**
- **File(s):** `package.json`
- **Action:** modify (only if absent)
- **Details:**
  - Add `"test:e2e": "playwright test"` or align with existing scripts.
- **Acceptance Criteria:**
  - Single command runs E2E locally and in CI.
- **Effort:** small

#### Task 6: README blurb

- [x] **Document how to run E2E**
- **File(s):** `README.md`
- **Action:** modify (append)
- **Details:**
  - Add instructions: start stack (`docker-compose -f src/docker-compose.yml up --build`), then `npm run test:e2e` (or repo script).
  - Note base URL and required env vars.
- **Acceptance Criteria:**
  - Developers can follow steps to execute E2E.
- **Effort:** small

---

## 3. File/Module-level Changes

| File Path | Action | Rationale |
|-----------|--------|-----------|
| `playwright.config.ts` | create/modify | Configure base URL/timeout |
| `tests/e2e/greeting.e2e.spec.ts` | create | Happy path greeting flow |
| `tests/e2e/greeting-error.e2e.spec.ts` | create (optional) | Error path coverage |
| `tests/e2e/fixtures/README.md` (optional) | create | Document warm-up/seed |
| `package.json` | modify (if needed) | Add `test:e2e` script |
| `README.md` | modify | How to run E2E |

---

## 4. Test Flow & Selectors

**Flows:**
1) Load Home → see greeting + fact.
2) Refresh greeting → loading shows, new fact shown.
3) (Optional) Error toggle → error surfaced.

**Selectors (must already exist in UI per frontend plan):**
- `home-view`
- `greeting-card`
- `greeting-loading`
- `greeting-error`
- `greeting-text`
- `greeting-fact-text`
- `greeting-fact-link`
- `refresh-greeting-btn`

---

## 5. Environment & Config

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_BASE_URL` | `http://localhost:4173` | Frontend base for Playwright |
| `API_BASE_URL` | `http://localhost:3000/api` | If needed for direct API calls |

- Services should be started via `docker-compose -f src/docker-compose.yml up --build` before running tests.

---

## 6. Definition of Done

- [x] Playwright config set with correct base URL.
- [x] E2E specs created using only `data-test-id` selectors.
- [x] Tests cover load and refresh paths (and error if feasible).
- [x] README/docs updated with run instructions.
- [x] No new dependencies unless justified.

---

## Notes

- Keep tests deterministic: avoid relying on random fact text changing; instead assert presence and structure, or wait for network idle after refresh.
- Do not mock network in E2E; rely on running backend + Mongo as per compose.

---

## Implementation Notes (Added by Developer)

### Playwright Dependency
`@playwright/test` (plus the browsers it downloads) was installed via the new root `package.json`; the plan required Playwright to be runnable locally, so the dependency is justified as documented in Section 0. Running `npx playwright install` emits a host validation warning when `libicu74`, `libjpeg-turbo8`, and `gstreamer1.0-libav` are missing—install those system packages if CI fails.

### Services & Error Path
The E2E suite was authored against `http://localhost:4173`, but this environment does not have the backend/frontend stack running, so the Playwright tests were not executed after authoring; please start `docker-compose -f src/docker-compose.yml up --build` before running `npm run test:e2e`. Task 3 remains unimplemented because the backend does not expose a configurable error path without further code changes.

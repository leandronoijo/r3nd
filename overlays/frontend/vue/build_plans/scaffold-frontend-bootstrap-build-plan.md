# Build Plan: scaffold-frontend — Bootstrap

> **Scope:** Bootstrap a Vue 3 frontend using CLI tooling so it compiles and runs locally (no backend required).
> **Source:** Derived from original scaffold-frontend build plan
> **Created:** 2025-12-14
> **Status:** In Progress

---

## 0. Pre-Implementation Checklist

- [ ] Read `.github/instructions/frontend.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Identify golden reference components (if present)
- [ ] Ensure local tooling: Node >= 18 and `npm` or `npx` available

### Minimal Dependencies & Tooling

This plan **prefers** using CLI tooling rather than hand-editing manifests:

- Use Vite/Create-Vue CLI: `npm create vite@latest` or `npm init vue@latest` to scaffold `src/frontend` (preferred).
- Use `npm` CLI to install additional dependencies (`npm install ...` and `npm install -D ...`).
- Basic stack: `vue`, `vite`, `pinia` (optional for later), `typescript` (or JS) — the CLI will scaffold most of this.

No backend integration or test harness required for the bootstrap plan; the goal is a buildable, runnable app.

---

## 1. Implementation Overview

**Approach:** Use the official CLI to create the project in `src/frontend`, keep it minimal, and confirm `npm run dev` (Vite) and `npm run build` work.

**Goal:** Developer can run `npm --prefix src/frontend run dev` and `npm --prefix src/frontend run build` successfully and see the home page load in the browser (or a successful dev server start).

**Acceptance Criteria (Bootstrap):**
- `package.json` exists with scripts: `dev`, `build`, `test` (test can be a placeholder)
- TypeScript config (if TS chosen) or JS config present and `npm run build` completes without errors
- Dev server starts via `npm run dev` and renders the Home view without console errors

---

## 2. Tasks

### Task A: Scaffold using CLI
- Preferred: From repo root run:

```bash
# interactive create-vue (choose Vue 3, TypeScript or JS, Vite)
npx create-vue@latest src/frontend

# or (older style)
npm create vite@latest src/frontend -- --template vue
```

- Let the CLI create `package.json`, `vite.config`, `index.html`, `src/main.*` etc.
- After scaffold, run `npm --prefix src/frontend install` to install deps.

### Task B: Minimal app & scripts
- Ensure scripts in `package.json` (Vite CLI usually adds them):
  - `dev`: `vite`
  - `build`: `vite build`
  - `preview`: `vite preview`
  - `test`: placeholder (`echo "no tests yet"`)

### Task C: Minimal Home View
- Add a simple `src/frontend/src/views/HomeView.vue` or `src/App.vue` that renders a static greeting text (no API calls) to validate rendering.

### Task D: Validate build and run
- Run `npm --prefix src/frontend run build` to ensure build succeeds.
- Run `npm --prefix src/frontend run dev` and confirm dev server starts; open `http://localhost:4173/` (Vite default) and verify the Home view renders.

---

## 3. File List (Bootstrap)

| File Path | Action |
|---|---|
| `src/frontend/package.json` | created by CLI |
| `src/frontend/vite.config.*` | created by CLI |
| `src/frontend/index.html` | created by CLI |
| `src/frontend/src/main.*` | created by CLI |
| `src/frontend/src/App.vue` | create/verify |
| `src/frontend/src/views/HomeView.vue` | create/verify |

---

## 4. Notes

- Prefer the CLI-generated project layout and dependencies rather than hand-adding packages to speed dev and keep locking consistent.
- Keep the Home view static in this plan; networking to `/api/greetings` is part of the complete plan.

---

## 5. Definition of Done (Bootstrap)

- CLI scaffolded project in `src/frontend` and `npm --prefix src/frontend run dev` starts the dev server ✅
- `npm --prefix src/frontend run build` completes without errors ✅
- Home view renders without console errors ✅


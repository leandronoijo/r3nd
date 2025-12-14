# Build Plan: scaffold-frontend — Bootstrap

> **Scope:** Bootstrap an Angular 20 frontend using CLI tooling so it compiles and runs locally (no backend required).
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

- Use Angular CLI: `npx @angular/cli new` to scaffold `src/frontend` (preferred).
- Use `npm` CLI to install additional dependencies (`npm install ...`).
- Basic stack: `@angular/core`, `@angular/router`, `primeng`, `primeicons`, `rxjs`, `typescript` — the CLI will scaffold most of this.

No backend integration or test harness required for the bootstrap plan; the goal is a buildable, runnable app.

---

## 1. Implementation Overview

**Approach:** Use the official Angular CLI to create the project in `src/frontend`, keep it minimal, and confirm `ng serve` and `ng build` work.

**Goal:** Developer can run `npm --prefix src/frontend run start` and `npm --prefix src/frontend run build` successfully and see the home page load in the browser (or a successful dev server start).

**Acceptance Criteria (Bootstrap):**
- `package.json` exists with scripts: `start`, `build`, `test` (test can be a placeholder)
- TypeScript config present and `npm run build` completes without errors
- Dev server starts via `npm start` and renders the App component without console errors

---

## 2. Tasks

### Task A: Scaffold using CLI
- Preferred: From repo root run:

```bash
# interactive Angular CLI (choose routing: yes, style: scss, standalone: yes)
npx @angular/cli new src/frontend --routing --style=scss --standalone

# or specify directory:
cd src && npx @angular/cli new frontend --routing --style=scss --standalone
```

- Let the CLI create `package.json`, `angular.json`, `tsconfig.json`, `src/main.ts`, `src/app/` etc.
- After scaffold, run `npm --prefix src/frontend install` to install deps.

### Task B: Add PrimeNG
- Install PrimeNG:

```bash
npm --prefix src/frontend install primeng primeicons
```

- Update `angular.json` to add PrimeNG styles to `styles` array:

```json
"styles": [
  "src/styles.scss",
  "node_modules/primeng/resources/themes/lara-light-blue/theme.css",
  "node_modules/primeng/resources/primeng.min.css",
  "node_modules/primeicons/primeicons.css"
]
```

**Note:** If PrimeNG 21+ doesn't expose the `resources` directory, download theme assets from CDN and place in `src/styles/`.

### Task C: Minimal App Component
- Verify `src/app/app.component.ts` is a standalone component.
- Ensure template includes `<router-outlet></router-outlet>`.

### Task D: Validate build and run
- Run `npm --prefix src/frontend run build` to ensure build succeeds.
- Run `npm --prefix src/frontend start` and confirm dev server starts; open `http://localhost:4200/` and verify the App component renders.

---

## 3. File List (Bootstrap)

| File Path | Action |
|---|---|
| `src/frontend/package.json` | created by CLI |
| `src/frontend/angular.json` | created by CLI, modify for PrimeNG styles |
| `src/frontend/tsconfig.json` | created by CLI |
| `src/frontend/src/main.ts` | created by CLI |
| `src/frontend/src/app/app.component.ts` | created by CLI, verify |
| `src/frontend/src/app/app.routes.ts` | created by CLI |

---

## 4. Notes

- Prefer the CLI-generated project layout and dependencies rather than hand-adding packages to speed dev and keep locking consistent.
- Keep the App component minimal in this plan; networking to `/api/greetings` is part of the complete plan.

---

## 5. Definition of Done (Bootstrap)

- [ ] Angular CLI scaffolded project in `src/frontend` and `npm --prefix src/frontend start` starts the dev server ✅
- [ ] `npm --prefix src/frontend run build` completes without errors ✅
- [ ] App component renders without console errors ✅
- [ ] PrimeNG styles are loaded ✅

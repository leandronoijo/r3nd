# Build Plan: scaffold-backend — Bootstrap

> **Scope:** Bootstrap NestJS app so it compiles and runs locally (no DB required)
> **Source:** Derived from original scaffold-backend build plan
> **Created:** 2025-12-14
> **Status:** In Progress

---

## 0. Pre-Implementation Checklist

- [ ] Read `.github/instructions/backend.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Identify golden reference modules (if present)
- [ ] Confirm minimal dependencies needed for a working bootstrap
- [ ] Ensure local tooling: Node >= 18 and `npm`/`npx` available

### Minimal Dependencies & Tooling

This plan **prefers** using CLI tooling rather than hand-editing project manifests:

- Use the Nest CLI via `npx @nestjs/cli` to scaffold the project in `src/backend` (preferred).
- Use the `npm` CLI to install additional dependencies (`npm install ...` and `npm install -D ...`).
- Typical runtime deps: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `reflect-metadata`, `rxjs` (these are usually added by the Nest CLI).
- Typical dev deps: `typescript`, `ts-node`, `@types/node` (again, often added by the Nest CLI).

No database packages are required for this bootstrap plan.

---

## 1. Implementation Overview

**Approach:** Create a minimal NestJS application that compiles with `tsc` and runs with `ts-node`/`node`.

**Goal:** Developer can run `npm run build` and `npm run start:dev` and see the app start, respond on a health endpoint, and exit cleanly.

**Acceptance Criteria (Bootstrap):**
- `package.json` exists with scripts: `build`, `start`, `start:dev`, `test` (tests can be placeholders for now)
- TypeScript config files exist and `npm run build` completes without TypeScript errors
- App boots without requiring a DB connection
- `GET /api/health` returns 200

---

## 2. Tasks

### Task A: Project skeleton & deps
- Prefer using the Nest CLI to create the project and install base dependencies. Example (preferred):

```bash
# From repo root (preferred) — Nest will create `src/backend`
npx @nestjs/cli new src/backend --package-manager npm

# OR create the directory and run the CLI inside it:
mkdir -p src/backend && cd src/backend && npx @nestjs/cli new . --package-manager npm
```

If for any reason you cannot use the Nest CLI, use the `npm` CLI to init and install packages (manual fallback):

```bash
mkdir -p src/backend && cd src/backend
npm init -y
npm install @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs
npm install -D typescript ts-node @types/node
```

After using the Nest CLI (or manual setup), **use `npm` to add further packages** instead of hand-editing `package.json`:

```bash
# add a runtime dependency
npm install @nestjs/config

# add a dev dependency
npm install -D jest ts-jest @types/jest
```

Add scripts (if not already added by the CLI):
- `build`: `tsc -p tsconfig.build.json`
- `start`: `npm run build && node dist/main.js`
- `start:dev`: `ts-node --project tsconfig.json main.ts`
- `test`: placeholder (e.g., `jest` once tests are added)

### Task B: TypeScript and basic config
- Add `tsconfig.json`, `tsconfig.build.json` (minimal), and `.gitignore` ignoring `node_modules` and `dist/`.

### Task C: App bootstrap files
- `src/backend/main.ts`: Bootstrap with `NestFactory.create(AppModule)`, enable CORS, global prefix `/api`, and `ValidationPipe` (optional).
- `src/backend/app.module.ts`: Minimal root module; no DB modules imported in this plan.
- Add `src/backend/modules/health/health.controller.ts` with `GET /health`.

### Task D: Validate build and run
-- Run `npm run build` to ensure compilation succeeds. From repo root you can run:

```bash
npm --prefix src/backend run build
```

-- Run dev server and confirm `GET /api/health` returns 200. Example (from repo root):

```bash
npm --prefix src/backend run start:dev
# then: curl http://localhost:3000/api/health
```

If you used the Nest CLI and it installed dependencies, allow it to finish; otherwise run `npm --prefix src/backend install` before building.

---

## 3. File List (Bootstrap)

| File Path | Action |
|---|---|
| `src/backend/package.json` | create |
| `src/backend/tsconfig.json` | create |
| `src/backend/tsconfig.build.json` | create |
| `src/backend/.gitignore` | create |
| `src/backend/main.ts` | create |
| `src/backend/app.module.ts` | create |
| `src/backend/modules/health/health.controller.ts` | create |

---

## 4. Notes

- Keep this plan minimal and focused: the goal is to get a Nest app that builds and runs, without introducing DB or feature-level complexity.
- Any additional packages required for runtime validation (e.g., `class-validator`) should be deferred to the completion plan unless strictly necessary for app boot.

---

## 5. Definition of Done (Bootstrap)

- All files from Section 3 are created and compile under `npm run build` ✅
- `npm run start:dev` boots the app and `GET /api/health` returns 200 ✅
- No database connection required to start the app ✅


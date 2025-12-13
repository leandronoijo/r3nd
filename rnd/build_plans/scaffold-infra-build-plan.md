# Build Plan: scaffold-infra

> **Source:** Internal scaffold requirements  
> **Created:** 2025-12-12  
> **Status:** Draft | In Progress | Complete

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [x] Read `.github/instructions/backend.instructions.md`
- [x] Read `.github/instructions/frontend.instructions.md`
- [x] Read `.github/instructions/testing.instructions.md`
- [x] Confirm service names/ports do not conflict with local defaults
- [x] Confirm no new dependencies needed (or justify additions below)

### New Dependencies (if any)

| Package | Purpose | Justification |
|---------|---------|---------------|
| _None_ | — | — |

---

## 1. Implementation Overview

**Approach:** Provide Dockerfiles for backend (NestJS) and frontend (Vue/Vite) and a root-level `docker-compose.yml` to run backend, frontend, and MongoDB together with sensible defaults and shared network.

**Key Decisions:**
- Use multi-stage builds for both services (build → runtime) to keep images small.
- Use environment variables for ports and Mongo URI; defaults for local dev.
- Map backend to `/api` and frontend to `/` with CORS enabled server-side.

**Integration Points:**
| Service | Integration Type | Notes |
|---------|------------------|-------|
| backend → mongo | `MONGODB_URI` env | `mongodb://mongo:27017/r3nd` |
| frontend → backend | `VITE_API_BASE_URL` env | `http://localhost:3000/api` (browser access from host) |

**Critical Runtime Environment Pattern:**
- Frontend build-time env vars (e.g., `VITE_API_BASE_URL`) are embedded in the build output and cannot change at runtime.
- For Docker deployments where the frontend is accessed from the host browser, the API URL must be `http://localhost:<backend-port>/api` (browser resolves this from the host machine).
- If you need runtime configuration (URL changes without rebuilds), inject env vars into served HTML via a custom server script that reads `process.env` and injects `<script>window.__VAR__=value;</script>` into the HTML head.
- Docker Compose must set both build args (for build-time injection) and runtime env vars (for server-side injection) to cover both patterns.

---

## 2. Task Breakdown

### Phase 1: Dockerfiles

-#### Task 1: Backend Dockerfile

- [x] **Create backend Dockerfile**
- **File(s):** `src/backend/Dockerfile`
- **Action:** create
- **Details:**
  - Multi-stage: base (node:18-alpine), deps install with `package-lock.json`, build stage (if needed), final runtime.
  - Set `WORKDIR /app`.
  - Copy `package*.json` (backend scope) and `tsconfig` needed; install prod deps.
  - Copy backend source; run `npm run build` (or repo script) targeting backend.
  - Expose `3000`; `CMD ["node", "dist/main.js"]` (align with Nest build output).
  - Env: `PORT=3000`, `MONGODB_URI` injected by compose.
- **Acceptance Criteria:**
  - Image builds without dev tooling in runtime layer.
  - Runs `node dist/main.js` successfully with provided envs.

-#### Task 2: Frontend Dockerfile

- [x] **Create frontend Dockerfile**
- **File(s):** `src/frontend/Dockerfile`
- **Action:** create
- **Details:**
  - Multi-stage: build (node:18-alpine) runs `npm ci && npm run build` for frontend.
  - Serve via lightweight custom server (e.g., `server.js`) that injects runtime env vars into HTML, or use `npm run preview`. Prefer custom `server.js` for runtime env injection.
  - If using custom server: create `server.js` that reads env vars (e.g., `process.env.VITE_API_BASE_URL`) and injects `<script>window.__VITE_API_BASE_URL__=value;</script>` into served HTML before `</head>`.
  - Runtime stage: copy built assets, server script, and expose build arg as runtime ENV so server can read it.
  - Expose `4173` (or configured preview port).
  - Env: `VITE_API_BASE_URL` passed as both ARG (build-time) and ENV (runtime) to support both patterns.
- **Acceptance Criteria:**
  - Image builds and serves built assets on container start.
  - Runtime env vars are injected into served HTML for client-side access.
  - No dev deps in runtime layer.

### Phase 2: Docker Compose

-#### Task 3: Root docker-compose.yml

- [x] **Create compose file**
- **File(s):** `src/docker-compose.yml`
- **Action:** create
- **Details:**
  - Services:
    - `mongo`: image `mongo:6`, ports `27017:27017`, volume `mongo-data:/data/db`.
    - `backend`: build `./backend` context `src/backend`, depends_on `mongo`, env `MONGODB_URI=mongodb://mongo:27017/r3nd`, `PORT=3000`, ports `3000:3000`.
    - `frontend`: build `./frontend` context `src/frontend`, **args** `VITE_API_BASE_URL=http://localhost:3000/api` (build-time), **environment** `VITE_API_BASE_URL=http://localhost:3000/api` (runtime for server injection), ports `4173:4173`, depends_on `backend`.
  - **Critical**: Frontend env must use `http://localhost:<backend-port>/api` for browser access from host, NOT `http://backend:3000/api` (which only works container-to-container). Add comment explaining browser vs container networking.
  - Networks: default bridge (implicit) or named `app-net` shared by all services.
  - Volumes: `mongo-data` for persistence.
- **Acceptance Criteria:**
  - `docker-compose up --build` brings up all services; frontend reachable at `http://localhost:4173`, backend at `http://localhost:3000/api`, mongo internal at `mongo:27017`.
  - Browser accessing frontend at `http://localhost:4173` can successfully call backend API.

### Phase 3: Supporting Files

-#### Task 4: .dockerignore (backend)

- [x] **Add backend .dockerignore**
- **File(s):** `src/backend/.dockerignore`
- **Action:** create
- **Details:**
  - Ignore `node_modules`, `dist`, `npm-debug.log`, `.env*`, `.git`, `coverage`.
- **Acceptance Criteria:**
  - Keeps image small; no local artifacts copied.

-#### Task 5: .dockerignore (frontend)

- [x] **Add frontend .dockerignore**
- **File(s):** `src/frontend/.dockerignore`
- **Action:** create
- **Details:**
  - Ignore `node_modules`, `dist`, `npm-debug.log`, `.env*`, `.git`, `coverage`.
- **Acceptance Criteria:**
  - Keeps image small; no local artifacts copied.

### Phase 4: Verification

-#### Task 6: Smoke scripts/docs

- [x] **Add README snippet**
- **File(s):** `README.md` (append minimal section)
- **Action:** modify
- **Details:**
  - Add quickstart commands:
    ```bash
    docker-compose -f src/docker-compose.yml up --build
    ```
  - Document ports and envs: backend 3000, frontend 4173, Mongo 27017.
- **Acceptance Criteria:**
  - Developer can follow steps to run stack via Docker.
  - `docker compose -f src/docker-compose.yml build --no-cache` completes with no errors.
  - `docker compose -f src/docker-compose.yml up --build -d` runs all services; containers remain healthy for at least 10 seconds.
  - Smoke test endpoints return expected responses:
    - Backend `GET http://localhost:3000/api/greetings` — HTTP 200 + JSON content-type + well-formed JSON.
    - Frontend `GET http://localhost:4173` — HTTP 200 and `index.html` served; a request to `/api/greetings` from the running frontend resolves to backend and returns JSON.
  - Docker runtime logs for frontend/backend do not show fatal errors, missing packages, or uncaught exceptions.
  - CI must include an automated `docker compose -f src/docker-compose.yml build --no-cache` followed by a scripted smoke test that asserts the above endpoints respond as expected.

### Phase 5: Pre-Flight Checklist (Important)

- Verify `package-lock.json` (or `npm-shrinkwrap.json`) is in sync with `package.json` for both services. If adding dependencies, update the lockfile using `npm install` before pushing/committing to ensure `npm ci` works inside Docker.
- Ensure `VITE_API_BASE_URL` is configured during build and runtime for the frontend so in-container fetches target the correct backend URL; prefer Docker Compose service hostname (e.g., `http://backend:3000/api`) instead of `localhost`.
- Ensure `server.js` (or creation of `server.mjs`) and `package.json` are included in the frontend runner image if using ESM imports in `server.js`.
- Confirm all `COPY` paths in Dockerfiles match the builder's `WORKDIR` and build output paths (e.g., Vite `outDir` mapping to `/dist/frontend`).

### Troubleshooting Steps (when smoke tests fail)

1. Re-run build with no cache:
```bash
docker compose -f src/docker-compose.yml build --no-cache
```
2. Recreate services and follow logs:
```bash
docker compose -f src/docker-compose.yml up -d --force-recreate
docker compose -f src/docker-compose.yml logs -f frontend backend
```
3. Check for common issues:
  - `npm ci` failing inside the runner stage (out-of-sync lockfile) — run `npm install` locally and update lockfile before re-building.
  - Backend `ValidationPipe` fails because `class-validator`/`class-transformer` missing — add as runtime dependency.
  - Frontend returns HTML on `/api/greetings` due to wrong `VITE_API_BASE_URL`:
    - **Symptom**: Browser network tab shows request to `http://localhost:4173/api/greetings` (frontend origin) instead of `http://localhost:3000/api/greetings` (backend).
    - **Cause**: Frontend env var points to wrong host (e.g., `http://backend:3000/api` which only works container-to-container, not from browser).
    - **Fix**: Set runtime env `VITE_API_BASE_URL=http://localhost:3000/api` in docker-compose and ensure custom server injects it into HTML.
  - `server.js` not found in runner image — ensure file exists in builder `WORKDIR` and Dockerfile `COPY` uses matching path.
  - Runtime env vars not injected into served HTML — verify custom server reads `process.env` and injects `<script>window.__VAR__=...</script>` into HTML before serving.

---

## 3. File/Module-level Changes

| File Path | Action | Rationale |
|-----------|--------|-----------|
| `src/backend/Dockerfile` | create | Containerize backend |
| `src/backend/.dockerignore` | create | Reduce image size |
| `src/frontend/Dockerfile` | create | Containerize frontend |
| `src/frontend/.dockerignore` | create | Reduce image size |
| `src/docker-compose.yml` | create | Orchestrate services |
| `README.md` | modify | Document Docker usage |

---

## 4. Configuration

### Environment Variables

| Service | Variable | Default | Purpose |
|---------|----------|---------|---------|
| backend | `PORT` | `3000` | HTTP port |
| backend | `MONGODB_URI` | `mongodb://mongo:27017/r3nd` | DB connection |
| frontend | `VITE_API_BASE_URL` | `http://localhost:3000/api` | Backend base URL |
| mongo | `MONGO_INITDB_DATABASE` | `r3nd` (optional) | Initial DB |

---

## 5. Definition of Done

- [ ] Dockerfiles build successfully.
- [ ] `docker-compose up --build` starts all services without errors.
- [ ] Backend connects to Mongo at `mongo:27017` and serves `/api`.
- [ ] Frontend serves at `http://localhost:4173` and calls backend via configured base URL.
- [ ] No new dependencies added unless justified.

---

## Implementation Notes (Added by Developer)

- Added `src/frontend/server.js` as a zero-dependency static server so the runtime Docker stage can run `node server.js` without installing Vite or other dev-only packages.
- The frontend Docker build now exposes `VITE_API_BASE_URL` as a build arg/default `http://localhost:3000/api`, matching the README documentation and Docker Compose wiring; backend env defaults follow the compose file as well.

## Notes

- Align Dockerfile commands with existing `package.json` scripts (adjust build/start commands to actual script names in repo).
- If backend build output differs (e.g., `dist/src/main.js`), update CMD accordingly.
- If frontend uses a different preview port, update compose and Dockerfile to match.

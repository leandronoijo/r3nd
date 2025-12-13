# Build Plan: scaffold-infra

> **Source:** Internal scaffold requirements  
> **Created:** 2025-12-12  
> **Status:** Draft | In Progress | Complete

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [ ] Read `.github/instructions/backend.instructions.md`
- [ ] Read `.github/instructions/frontend.instructions.md`
- [ ] Read `.github/instructions/infrastructure.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Confirm service names/ports do not conflict with local defaults
- [ ] Confirm no new dependencies needed (or justify additions below)

### New Dependencies (if any)

| Package | Purpose | Justification |
|---------|---------|---------------|
| _None_ | — | — |

---

## 1. Implementation Overview

**Approach:** Provide Dockerfiles for backend and frontend and a root-level `docker-compose.yml` to run backend, frontend, and database together with sensible defaults and shared network.

**Key Decisions:**
- Use multi-stage builds for both services (build → runtime) to keep images small.
- Use environment variables for ports and database connection; defaults for local dev.
- Map backend to `/api` and frontend to `/` with CORS enabled server-side.
- Framework-specific build commands, database configuration, and runtime commands are defined in `.github/instructions/infrastructure.instructions.md`).

**Integration Points:**
| Service | Integration Type | Notes |
|---------|------------------|-------|
| backend → database | Framework-specific env var | See backend instructions for connection string format |
| frontend → backend | `VITE_API_BASE_URL` or `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` (browser access from host) |

**Critical Runtime Environment Pattern:**
- Frontend build-time env vars (e.g., `VITE_API_BASE_URL`) are embedded in the build output and cannot change at runtime.
- For Docker deployments where the frontend is accessed from the host browser, the API URL must be `http://localhost:<backend-port>/api` (browser resolves this from the host machine).
- If you need runtime configuration (URL changes without rebuilds), inject env vars into served HTML via a custom server script that reads `process.env` and injects `<script>window.__VAR__=value;</script>` into the HTML head.
- Docker Compose must set both build args (for build-time injection) and runtime env vars (for server-side injection) to cover both patterns.

---

## 2. Task Breakdown

### Phase 1: Dockerfiles

-#### Task 1: Backend Dockerfile

- [ ] **Create backend Dockerfile**
- **File(s):** `src/backend/Dockerfile`
- **Action:** create
- **Details:**
  - **Follow framework-specific Dockerfile instructions** in`instructions/infrastructure.instructions.md`.
  - Multi-stage build pattern (build stage → runtime stage) to minimize image size.
  - Set `WORKDIR /app`.
  - Install dependencies using framework's package manager.
  - Build application using framework's build command.
  - always Expose backend port `3000`.
  - Set runtime command to start the built application.
  - Environment variables for port and database connection injected by compose.
- **Acceptance Criteria:**
  - Image builds without dev tooling in runtime layer.
  - Application starts successfully with provided environment variables.
  - Framework-specific requirements met

-#### Task 2: Frontend Dockerfile

- [ ] **Create frontend Dockerfile**
- **File(s):** `src/frontend/Dockerfile`
- **Action:** create
- **Details:**
  - **Follow framework-specific Dockerfile instructions** in the frontend `instructions/frontend.instructions.md`.
  - Multi-stage build pattern: build stage runs dependency install and build command.
  - Serve via lightweight custom server that injects runtime env vars into HTML, or use framework's preview/serve command.
  - If using custom server: create server script that reads env vars and injects them into served HTML for client-side access.
  - Runtime stage: copy built assets, server script, and minimal runtime dependencies.
  - Expose frontend port (typically `4173` for Vite, `3000` for Next.js, `4200` for Angular).
  - API base URL passed as both ARG (build-time) and ENV (runtime) to support both static and runtime configuration.
- **Acceptance Criteria:**
  - Image builds and serves built assets on container start.
  - Runtime env vars are injected appropriately for client-side access.
  - No dev deps in runtime layer.
  - Framework-specific requirements met 

-#### Task 3: Root docker-compose.yml

- [ ] **Create compose file**
- **File(s):** `src/docker-compose.yml`
- **Action:** create
- **Details:**
  - **Follow framework-specific database and service configuration** from `instructions/infrastructure.instructions.md`.
  - Services:
    - `database`: Framework-specific database image (MongoDB, PostgreSQL, MySQL, etc.), appropriate ports, volume for persistence.
    - `backend`: build `./backend` context `src/backend`, depends_on `database`, framework-specific environment variables for database connection and port, ports `3000:3000`.
    - `frontend`: build `./frontend` context `src/frontend`, framework-specific build args and environment for API URL, ports mapped appropriately, depends_on `backend`.
  - **Critical**: Frontend API URL must use `http://localhost:<backend-port>/api` for browser access from host, NOT `http://backend:3000/api` (which only works container-to-container). Add comment explaining browser vs container networking.
  - Networks: default bridge (implicit) or named `app-net` shared by all services.
  - Volumes: named volume for database persistence.
- **Acceptance Criteria:**
  - `docker-compose up --build` brings up all services.
  - Frontend reachable at appropriate port, backend at `http://localhost:3000/api`, database internal connection works.
  - Browser accessing frontend can successfully call backend API.
  - Framework-specific database configuration works correctly.
  - `docker-compose up --build` brings up all services; frontend reachable at `http://localhost:4173`, backend at `http://localhost:3000/api`, mongo internal at `mongo:27017`.
  - Browser accessing frontend at `http://localhost:4173` can successfully call backend API.

### Phase 3: Supporting Files

-#### Task 4: .dockerignore (backend)

- [ ] **Add backend .dockerignore**
- **File(s):** `src/backend/.dockerignore`
- **Action:** create
- **Details:**
  - Ignore `node_modules`, `dist`, `npm-debug.log`, `.env*`, `.git`, `coverage`.
- **Acceptance Criteria:**
  - Keeps image small; no local artifacts copied.

-#### Task 5: .dockerignore (frontend)

- [ ] **Add frontend .dockerignore**
- **File(s):** `src/frontend/.dockerignore`
- **Action:** create
- **Details:**
  - Ignore `node_modules`, `dist`, `npm-debug.log`, `.env*`, `.git`, `coverage`.
- **Acceptance Criteria:**
  - Keeps image small; no local artifacts copied.

-#### Task 6: .gitignore (backend)

- [ ] **Add backend .gitignore**
- **File(s):** `src/backend/.gitignore`
- **Action:** create
- **Details:**
  - Ignore `node_modules/`, `dist/`, `*.log`, `.env*`, `coverage/`, `npm-debug.log*`, `.DS_Store`, etc.
- **Acceptance Criteria:**
  - .gitignore exists and ignores common Node.js and build artifacts.

-#### Task 7: .gitignore (frontend)

- [ ] **Add frontend .gitignore**
- **File(s):** `src/frontend/.gitignore`
- **Action:** create
- **Details:**
  - Ignore `node_modules/`, `dist/`, `*.log`, `.env*`, `coverage/`, `npm-debug.log*`, `.DS_Store`, etc.
- **Acceptance Criteria:**
  - .gitignore exists and ignores common Node.js and build artifacts.

### Phase 4: Verification

-#### Task 6: Smoke scripts/docs

- [ ] **Add README snippet**
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

## Implementation Notes (Added by Developer)

- Bundler is configured to install gems into `/usr/local/bundle` (`bundle config set --local path /usr/local/bundle`) and the runtime entrypoint now uses `bundle exec bin/rails` to load the preinstalled gems before starting the server.
- `docker compose -f src/docker-compose.yml build --no-cache` plus `docker compose -f src/docker-compose.yml up -d` were used to validate the new images, followed by `curl http://localhost:3000/api/v1/greetings` and `curl http://localhost:4173` to confirm backend and frontend responses, then `docker compose -f src/docker-compose.yml down` to clean up.

## 3. File/Module-level Changes

| File Path | Action | Rationale |
|-----------|--------|-----------|
| `src/backend/Dockerfile` | create | Containerize backend |
| `src/backend/.dockerignore` | create | Reduce image size |
| `src/backend/.gitignore` | create | Ignore build artifacts |
| `src/frontend/Dockerfile` | create | Containerize frontend |
| `src/frontend/.dockerignore` | create | Reduce image size |
| `src/frontend/.gitignore` | create | Ignore build artifacts |
| `src/docker-compose.yml` | create | Orchestrate services |
| `README.md` | modify | Document Docker usage |

---
### Environment Variables

**Note:** Specific variable names and connection strings are framework-dependent. See `instructions/infrastructure.instructions.md` for exact configuration.

| Service | Variable Pattern | Typical Default | Purpose |
|---------|------------------|-----------------|---------|
| backend | `PORT` | `3000` | HTTP port |
| backend | Database connection variable | Framework-specific | DB connection string |
| frontend | API URL variable | `http://localhost:3000/api` | Backend base URL (framework-specific var name) |
| database | Database init variables | Framework-specific | Initial database configuration |
| backend | `MONGODB_URI` | `mongodb://mongo:27017/r3nd` | DB connection |
| frontend | `VITE_API_BASE_URL` | `http://localhost:3000/api` | Backend base URL |
| mongo | `MONGO_INITDB_DATABASE` | `r3nd` (optional) | Initial DB |

---

- [ ] Dockerfiles build successfully.
- [ ] `docker-compose up --build` starts all services without errors.
- [ ] Backend connects to database using framework-specific connection and serves `/api`.
- [ ] Frontend serves at appropriate port and calls backend via configured base URL.
- [ ] No new dependencies added unless justified.
- [ ] Framework-specific smoke tests pass.and serves `/api`.
- [ ] Frontend serves at `http://localhost:4173` and calls backend via configured base URL.
- [ ] No new dependencies added unless justified.


## Notes

- **Framework-specific configuration is defined in instruction files not in this plan.**
- Align Dockerfile commands with framework conventions.
- Adjust ports and environment variable names based on framework requirements.
- For specific examples, refer to: `.github/instructions/infrastructure.instructions.md`
  - frontend: `.github/instructions/frontend.instructions.md`
- Align Dockerfile commands with existing `package.json` scripts (adjust build/start commands to actual script names in repo).
- If backend build output differs (e.g., `dist/src/main.js`), update CMD accordingly.
- If frontend uses a different preview port, update compose and Dockerfile to match.

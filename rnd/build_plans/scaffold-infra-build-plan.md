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
| frontend → backend | `VITE_API_BASE_URL` env | `http://localhost:3000/api` (dev host) |

---

## 2. Task Breakdown

### Phase 1: Dockerfiles

#### Task 1: Backend Dockerfile

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

#### Task 2: Frontend Dockerfile

- [x] **Create frontend Dockerfile**
- **File(s):** `src/frontend/Dockerfile`
- **Action:** create
- **Details:**
  - Multi-stage: build (node:18-alpine) runs `npm ci && npm run build` for frontend.
  - Serve via lightweight server (e.g., `node` + `serve` if already in deps) or `npm run preview`. Prefer static `dist` with `node:18-alpine` using `npm run preview -- --host 0.0.0.0 --port 4173` if Vite.
  - Expose `4173` (or configured preview port).
  - Env: `VITE_API_BASE_URL` passed at build or runtime (use `.env.production` or build arg as needed).
- **Acceptance Criteria:**
  - Image builds and serves built assets on container start.
  - No dev deps in runtime layer.

### Phase 2: Docker Compose

#### Task 3: Root docker-compose.yml

- [x] **Create compose file**
- **File(s):** `src/docker-compose.yml`
- **Action:** create
- **Details:**
  - Services:
    - `mongo`: image `mongo:6`, ports `27017:27017`, volume `mongo-data:/data/db`.
    - `backend`: build `./backend` context `src/backend`, depends_on `mongo`, env `MONGODB_URI=mongodb://mongo:27017/r3nd`, `PORT=3000`, ports `3000:3000`.
    - `frontend`: build `./frontend` context `src/frontend`, env `VITE_API_BASE_URL=http://localhost:3000/api`, ports `4173:4173`, depends_on `backend`.
  - Networks: default bridge (implicit) or named `app-net` shared by all services.
  - Volumes: `mongo-data` for persistence.
- **Acceptance Criteria:**
  - `docker-compose up --build` brings up all services; frontend reachable at `http://localhost:4173`, backend at `http://localhost:3000/api`, mongo internal at `mongo:27017`.

### Phase 3: Supporting Files

#### Task 4: .dockerignore (backend)

- [x] **Add backend .dockerignore**
- **File(s):** `src/backend/.dockerignore`
- **Action:** create
- **Details:**
  - Ignore `node_modules`, `dist`, `npm-debug.log`, `.env*`, `.git`, `coverage`.
- **Acceptance Criteria:**
  - Keeps image small; no local artifacts copied.

#### Task 5: .dockerignore (frontend)

- [x] **Add frontend .dockerignore**
- **File(s):** `src/frontend/.dockerignore`
- **Action:** create
- **Details:**
  - Ignore `node_modules`, `dist`, `npm-debug.log`, `.env*`, `.git`, `coverage`.
- **Acceptance Criteria:**
  - Keeps image small; no local artifacts copied.

### Phase 4: Verification

#### Task 6: Smoke scripts/docs

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

- [x] Dockerfiles build successfully.
- [x] `docker-compose up --build` starts all services without errors.
- [x] Backend connects to Mongo at `mongo:27017` and serves `/api`.
- [x] Frontend serves at `http://localhost:4173` and calls backend via configured base URL.
- [x] No new dependencies added unless justified.

---

## Notes

- Align Dockerfile commands with existing `package.json` scripts (adjust build/start commands to actual script names in repo).
- If backend build output differs (e.g., `dist/src/main.js`), update CMD accordingly.
- If frontend uses a different preview port, update compose and Dockerfile to match.

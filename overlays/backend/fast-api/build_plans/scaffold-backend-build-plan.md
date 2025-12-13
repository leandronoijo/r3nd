# Build Plan: scaffold-backend

> **Source:** Internal scaffold requirements  
> **Created:** 2025-12-13  
> **Status:** Not Started

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [ ] Read `.github/instructions/backend.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Identify golden reference modules:
  - Backend: `src/backend/app/models/example.py`, `src/backend/app/services/example_service.py`
- [ ] Confirm no new dependencies needed (or justify additions below)
- [ ] List integration points with existing modules (see Section 1)
- [ ] Review tech spec for any open questions

### New Dependencies (if any)

| Package | Purpose | Justification |
|---------|---------|---------------|
| fastapi | Web framework | Required for FastAPI app |
| uvicorn[standard] | ASGI server | Required for running FastAPI |
| pydantic | Data validation | Required for schemas (included with FastAPI) |
| pydantic-settings | Configuration management | Required for environment-based config |
| motor | Async MongoDB driver | Required for async database operations |
| beanie | Async ODM for MongoDB | Required for document modeling |
| apscheduler | Background job scheduler | Required for hourly ingestion |
| httpx | Async HTTP client | Required for external API calls |
| python-dotenv | Environment file loading | Required for local development |

**Dev Dependencies:**

| Package | Purpose | Justification |
|---------|---------|---------------|
| pytest | Test framework | Per testing instructions |
| pytest-asyncio | Async test support | Required for testing async code |
| pytest-cov | Test coverage | Per testing instructions |
| httpx | HTTP testing | Includes test client for FastAPI |
| mongomock-motor | MongoDB mocking | Required for testing without real DB |
| mypy | Type checking | Per quality standards |
| black | Code formatting | Per quality standards |
| isort | Import sorting | Per quality standards |
| ruff | Linting | Per quality standards |

---

## 1. Implementation Overview

**Approach:** Bootstrap a minimal FastAPI backend with MongoDB (Beanie ODM), a Facts model for hourly ingestion of random facts via APScheduler, and a greetings endpoint returning a greeting with a random fact.

**Key Decisions:**
- Use layered architecture: Routers → Services → Repositories → Models.
- Use Beanie ODM for async MongoDB operations with schema validation.
- Use APScheduler for in-process background job scheduling.
- Use dependency injection throughout for testability.
- Facts stored in MongoDB with de-duplication by external ID.
- Use httpx for async HTTP calls to external APIs.

**Integration Points:**
| Existing Module | Integration Type | Notes |
|-----------------|------------------|-------|
| None | — | Fresh scaffold |

---

## 2. Task Breakdown

### Phase 1: Project Setup

#### Task 0: Initialize Python project structure

- [ ] **Create project structure and configuration files**
- **File(s):** `src/backend/pyproject.toml`, `src/backend/requirements.txt`, `src/backend/requirements-dev.txt`
- **Action:** create
- **Dependencies:** None
- **Details:**
  - Create `pyproject.toml` with project metadata and tool configurations (black, isort, mypy, pytest).
  - Create `requirements.txt` with production dependencies:
    ```
    fastapi>=0.109.0
    uvicorn[standard]>=0.27.0
    pydantic>=2.5.0
    pydantic-settings>=2.1.0
    motor>=3.3.0
    beanie>=1.24.0
    apscheduler>=3.10.0
    httpx>=0.26.0
    python-dotenv>=1.0.0
    ```
  - Create `requirements-dev.txt` with development dependencies:
    ```
    -r requirements.txt
    pytest>=7.4.0
    pytest-asyncio>=0.23.0
    pytest-cov>=4.1.0
    mongomock-motor>=0.0.29
    mypy>=1.8.0
    black>=24.1.0
    isort>=5.13.0
    ruff>=0.1.0
    types-python-dateutil>=2.8.0
    ```
- **Acceptance Criteria:**
  - Project files created with correct structure.
  - `pip install -r requirements-dev.txt` succeeds.
- **Effort:** small

#### Task 0.5: Create configuration and database modules

- [ ] **Set up Pydantic Settings and database connection**
- **File(s):** `src/backend/app/__init__.py`, `src/backend/app/config.py`, `src/backend/app/database.py`
- **Action:** create
- **Dependencies:** Task 0
- **Details:**
  - Create `app/__init__.py` (empty, marks as package).
  - Create `app/config.py` with Pydantic Settings:
    ```python
    from pydantic_settings import BaseSettings, SettingsConfigDict
    
    class Settings(BaseSettings):
        model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
        
        app_name: str = "R3ND API"
        debug: bool = False
        api_prefix: str = "/api"
        mongodb_uri: str = "mongodb://localhost:27017"
        mongodb_database: str = "r3nd"
        host: str = "0.0.0.0"
        port: int = 3000
    
    settings = Settings()
    ```
  - Create `app/database.py` with singleton connection manager using Motor and Beanie.
- **Acceptance Criteria:**
  - Config loads from environment variables.
  - Database class has connect/disconnect methods.
- **Effort:** small

#### Task 0.6: Create environment and ignore files

- [ ] **Add .env.example and .gitignore**
- **File(s):** `src/backend/.env.example`, `src/backend/.gitignore`
- **Action:** create
- **Dependencies:** None
- **Details:**
  - Create `.env.example` documenting all environment variables:
    ```
    # Application
    DEBUG=false
    API_PREFIX=/api
    
    # MongoDB
    MONGODB_URI=mongodb://localhost:27017
    MONGODB_DATABASE=r3nd
    
    # Server
    HOST=0.0.0.0
    PORT=3000
    ```
  - Create `.gitignore` ignoring:
    - `__pycache__/`, `*.pyc`, `*.pyo`
    - `.venv/`, `venv/`, `env/`
    - `.env`, `.env.local`
    - `*.egg-info/`, `dist/`, `build/`
    - `.pytest_cache/`, `.coverage`, `htmlcov/`
    - `.mypy_cache/`, `.ruff_cache/`
    - `*.log`
- **Acceptance Criteria:**
  - Files exist and contain appropriate entries.
- **Effort:** small

#### Task 1: Create main application entry point

- [ ] **Create FastAPI app with lifespan management**
- **File(s):** `src/backend/app/main.py`
- **Action:** create
- **Dependencies:** Task 0.5
- **Details:**
  - Create FastAPI app factory with lifespan context manager.
  - Connect to database on startup, disconnect on shutdown.
  - Configure CORS middleware (allow all origins for development).
  - Set global API prefix from settings.
  - Include all routers.
  - Add health check endpoint at `/health`.
  - Setup APScheduler on startup, shutdown on cleanup.
- **Acceptance Criteria:**
  - App starts without errors.
  - CORS enabled.
  - Database connects/disconnects properly.
  - Health check returns 200.
- **Effort:** medium

### Phase 2: Facts Module (Model → Repository → Service)

#### Task 2: Create Fact document model

- [ ] **Define Beanie document for facts**
- **File(s):** `src/backend/app/models/__init__.py`, `src/backend/app/models/fact.py`
- **Action:** create
- **Dependencies:** Task 0.5
- **Golden Reference:** Backend instructions model rules
- **Details:**
  - Create `models/__init__.py` exporting all models.
  - Create `models/fact.py` with Beanie Document. IMPORTANT: do not create a plain unique index on a field that may be missing or null across documents. Instead, prefer one of the following safe approaches to avoid index-build failures when existing data contains duplicates or nulls:

    - Make `external_id` optional and use a sparse unique index so documents without an `external_id` are excluded from the unique constraint.
    - Or create a partial unique index (partialFilterExpression) that only indexes documents where `external_id` exists / is not null.
    - Alternatively, enforce `external_id` to be required/not-nullable at ingestion time so uniqueness can be guaranteed.

    Example (Beanie / Pydantic style):
    ```python
    from datetime import datetime
    from typing import Optional
    from beanie import Document, Indexed
    from pydantic import Field

    class Fact(Document):
        # Use sparse unique index so missing/null external_id values don't
        # participate in the unique constraint and won't block index builds.
        external_id: Optional[str] = Indexed(unique=True, sparse=True)
        text: str
        source: str
        source_url: str
        language: str = Indexed()
        permalink: str
        created_at: datetime = Field(default_factory=datetime.utcnow)

        class Settings:
            name = "facts"
    ```

  - Register model in `database.py` init_beanie call.
- **Acceptance Criteria:**
-  - Model compiles without errors.
-  - All fields have explicit types.
-  - Indexes defined on `external_id` (unique) and `language`, but using a sparse or partial index when `external_id` can be missing.
- **Effort:** small

#### Task 3: Create Fact schemas

- [ ] **Define Pydantic schemas for API contract**
- **File(s):** `src/backend/app/schemas/__init__.py`, `src/backend/app/schemas/fact.py`
- **Action:** create
- **Dependencies:** Task 2
- **Details:**
  - Create `schemas/__init__.py` exporting all schemas.
  - Create `schemas/fact.py` with:
    - `FactBase` — common fields (text, source, language, permalink).
    - `FactCreate` — extends base, adds external_id, source_url.
    - `FactResponse` — full response with id and created_at.
    - `FactBrief` — abbreviated for embedding in other responses.
- **Acceptance Criteria:**
  - Schemas defined with proper inheritance.
  - ConfigDict set for ORM compatibility.
- **Effort:** small

#### Task 4: Create Fact repository

- [ ] **Implement data access layer for facts**
- **File(s):** `src/backend/app/repositories/__init__.py`, `src/backend/app/repositories/base.py`, `src/backend/app/repositories/fact_repository.py`
- **Action:** create
- **Dependencies:** Task 2
- **Golden Reference:** Backend instructions repository rules
- **Details:**
  - Create `repositories/__init__.py` exporting all repositories.
  - Create `repositories/base.py` with generic `BaseRepository[T]`:
    - `get_by_id(id)` — get document by ID.
    - `get_all(skip, limit)` — paginated list.
    - `create(document)` — insert new document.
    - `update(document)` — save changes.
    - `delete(document)` — remove document.
  - Create `repositories/fact_repository.py` extending base:
    - `get_by_external_id(external_id)` — find by API ID.
    - `get_random()` — use `$sample` aggregation.
    - `upsert_by_external_id(fact_data)` — insert or update, return (fact, is_new).
    - `count()` — total fact count.
- **Acceptance Criteria:**
  - Repository implements all required methods.
  - Uses Beanie query interface, no raw MongoDB.
  - Returns proper types (model or None).
- **Effort:** medium

#### Task 5: Create Fact service

- [ ] **Implement business logic for facts**
- **File(s):** `src/backend/app/services/__init__.py`, `src/backend/app/services/fact_service.py`
- **Action:** create
- **Dependencies:** Task 4
- **Golden Reference:** Backend instructions service rules
- **Details:**
  - Create `services/__init__.py` exporting all services.
  - Create `services/fact_service.py`:
    - Constructor takes `FactRepository` as dependency.
    - `async ingest_batch(size=5)` — fetch from `https://uselessfacts.jsph.pl/api/v2/facts/random`, upsert each, return new insert count.
    - `async get_random()` — get random fact; if none, call `ingest_batch(5)` once and retry; raise `ValueError` if still none.
  - Use `httpx.AsyncClient` for HTTP calls.
  - Map API response fields to Fact model fields.
- **Acceptance Criteria:**
  - Service handles ingestion and retrieval.
  - De-duplicates via repository upsert.
  - Raises appropriate exceptions.
- **Effort:** medium

#### Task 6: Create dependency injection providers

- [ ] **Set up FastAPI Depends for DI**
- **File(s):** `src/backend/app/dependencies.py`
- **Action:** create
- **Dependencies:** Task 5
- **Golden Reference:** Backend instructions DI section
- **Details:**
  - Create `dependencies.py` with:
    - `get_fact_repository()` — returns singleton FactRepository (use `@lru_cache`).
    - `get_fact_service(repository=Depends(get_fact_repository))` — returns FactService with injected repo.
- **Acceptance Criteria:**
  - Dependencies can be resolved by FastAPI.
  - Repository is singleton.
  - Service receives repository via DI.
- **Effort:** small

### Phase 3: Greetings Endpoint

#### Task 7: Create Greeting schemas

- [ ] **Define Pydantic schemas for greeting response**
- **File(s):** `src/backend/app/schemas/greeting.py`
- **Action:** create
- **Dependencies:** Task 3
- **Details:**
  - Create `schemas/greeting.py` with:
    ```python
    from pydantic import BaseModel
    from app.schemas.fact import FactBrief
    
    class GreetingResponse(BaseModel):
        greeting: str
        fact: FactBrief
    ```
  - Update `schemas/__init__.py` to export.
- **Acceptance Criteria:**
  - Schema defined and exported.
- **Effort:** small

#### Task 8: Create Greetings router

- [ ] **Implement greetings endpoint**
- **File(s):** `src/backend/app/routers/__init__.py`, `src/backend/app/routers/greetings.py`
- **Action:** create
- **Dependencies:** Task 6, Task 7
- **Golden Reference:** Backend instructions router rules
- **Details:**
  - Create `routers/__init__.py` with router registration.
  - Create `routers/greetings.py`:
    - `router = APIRouter(prefix="/greetings", tags=["greetings"])`
    - `@router.get("/", response_model=GreetingResponse)`
    - Inject `FactService` via `Depends(get_fact_service)`.
    - Call `fact_service.get_random()`, construct response.
    - Handle `ValueError` → 503 Service Unavailable.
  - Register router in `main.py`.
- **Acceptance Criteria:**
  - Endpoint at `/api/greetings` returns greeting and fact.
  - Returns 503 if no facts available.
- **Effort:** small

### Phase 4: Background Jobs

#### Task 9: Create fact ingestor job

- [ ] **Implement hourly ingestion with APScheduler**
- **File(s):** `src/backend/app/jobs/__init__.py`, `src/backend/app/jobs/fact_ingestor.py`
- **Action:** create
- **Dependencies:** Task 5
- **Golden Reference:** Backend instructions job rules
- **Details:**
  - Create `jobs/__init__.py` with scheduler setup functions.
  - Create `jobs/fact_ingestor.py`:
    - Import `AsyncIOScheduler` from apscheduler.
    - Create `scheduler = AsyncIOScheduler()`.
    - Define `async def ingest_facts_job()`:
      - Get repository via `get_fact_repository()`.
      - Create service with repository.
      - Call `service.ingest_batch(5)`.
      - Log result count.
      - Handle exceptions, log errors.
    - `setup_scheduler()` — add job with `IntervalTrigger(hours=1)`, start scheduler.
    - `shutdown_scheduler()` — stop scheduler.
  - Call setup/shutdown in `main.py` lifespan.
- **Acceptance Criteria:**
  - Scheduler starts with app.
  - Job runs every hour.
  - Logs insertion count.
  - Errors handled gracefully.
- **Effort:** medium

### Phase 5: Testing

#### Task 10: Create test configuration

- [ ] **Set up pytest fixtures and configuration**
- **File(s):** `src/backend/tests/__init__.py`, `src/backend/tests/conftest.py`, `src/backend/pytest.ini`
- **Action:** create
- **Dependencies:** Task 0
- **Details:**
  - Create `tests/__init__.py` (empty).
  - Create `pytest.ini` with asyncio mode configuration.
  - Create `tests/conftest.py` with fixtures:
    - `@pytest.fixture` for mock repository.
    - `@pytest.fixture` for test client.
    - `@pytest.fixture` for mock HTTP responses.
    - Configure mongomock-motor for database tests if needed.
- **Acceptance Criteria:**
  - Pytest runs successfully.
  - Fixtures available for all tests.
- **Effort:** small

#### Task 11: Create repository tests

- [ ] **Unit tests for fact repository**
- **File(s):** `src/backend/tests/unit/__init__.py`, `src/backend/tests/unit/repositories/__init__.py`, `src/backend/tests/unit/repositories/test_fact_repository.py`
- **Action:** create
- **Dependencies:** Task 4, Task 10
- **Details:**
  - Test `get_by_external_id` returns fact or None.
  - Test `get_random` returns fact from collection.
  - Test `upsert_by_external_id` creates new fact.
  - Test `upsert_by_external_id` updates existing fact.
  - Test `count` returns correct count.
  - Use mongomock-motor or mock Beanie operations.
- **Acceptance Criteria:**
  - All repository methods tested.
  - No real database calls.
- **Effort:** medium

#### Task 12: Create service tests

- [ ] **Unit tests for fact service**
- **File(s):** `src/backend/tests/unit/services/__init__.py`, `src/backend/tests/unit/services/test_fact_service.py`
- **Action:** create
- **Dependencies:** Task 5, Task 10
- **Details:**
  - Mock `FactRepository` and `httpx` calls.
  - Test `ingest_batch` fetches and upserts facts.
  - Test `ingest_batch` counts new insertions correctly.
  - Test `get_random` returns fact when exists.
  - Test `get_random` warms up when empty.
  - Test `get_random` raises ValueError if still empty after warmup.
- **Acceptance Criteria:**
  - All service methods tested for success/error paths.
  - No real network or database calls.
- **Effort:** medium

#### Task 13: Create router tests

- [ ] **Integration tests for greetings endpoint**
- **File(s):** `src/backend/tests/integration/__init__.py`, `src/backend/tests/integration/routers/__init__.py`, `src/backend/tests/integration/routers/test_greetings.py`
- **Action:** create
- **Dependencies:** Task 8, Task 10
- **Details:**
  - Use FastAPI TestClient.
  - Mock `FactService` dependency.
  - Test `GET /api/greetings` returns 200 with greeting and fact.
  - Test returns 503 when service raises ValueError.
- **Acceptance Criteria:**
  - Endpoint behavior tested.
  - Proper status codes verified.
- **Effort:** small

### Phase 6: Infrastructure

#### Task 14: Create Dockerfile

- [ ] **Create multi-stage Dockerfile**
- **File(s):** `src/backend/Dockerfile`
- **Action:** create
- **Dependencies:** Task 1
- **Golden Reference:** Infrastructure instructions
- **Details:**
  - Builder stage: Python 3.12-slim, install dependencies in venv.
  - Runner stage: Copy venv, copy app code, create non-root user.
  - Expose port 3000.
  - Health check endpoint.
  - CMD: `uvicorn app.main:app --host 0.0.0.0 --port 3000`.
- **Acceptance Criteria:**
  - Docker build succeeds.
  - Container runs and health check passes.
- **Effort:** small

#### Task 15: Validate application

- [ ] **Ensure all components work together**
- **File(s):** N/A
- **Action:** run commands
- **Dependencies:** All previous tasks
- **Details:**
  - Run `pip install -r requirements-dev.txt` to install all dependencies.
  - Run `pytest` to ensure all tests pass.
  - Run `mypy app` to ensure type checking passes.
  - Run `black --check app tests` to verify formatting.
  - Run `ruff check app tests` to verify linting.
  - Start server with `uvicorn app.main:app --port 3000`.
  - Verify `/health` endpoint returns 200.
  - Verify `/api/greetings` endpoint returns greeting with fact.
- **Acceptance Criteria:**
  - All tests pass.
  - Type checking passes.
  - Linting passes.
  - Server starts without errors.
  - Endpoints respond correctly.
- **Effort:** small

---

## 3. File/Module-level Changes

| File Path | Action | Rationale | Golden Reference |
|-----------|--------|-----------|------------------|
| `src/backend/pyproject.toml` | create | Project metadata and tool config | — |
| `src/backend/requirements.txt` | create | Production dependencies | — |
| `src/backend/requirements-dev.txt` | create | Development dependencies | — |
| `src/backend/.env.example` | create | Environment documentation | — |
| `src/backend/.gitignore` | create | Ignore build artifacts | — |
| `src/backend/pytest.ini` | create | Pytest configuration | — |
| `src/backend/Dockerfile` | create | Container build | Infrastructure instructions |
| `src/backend/app/__init__.py` | create | Package marker | — |
| `src/backend/app/config.py` | create | Pydantic Settings | Backend instructions |
| `src/backend/app/database.py` | create | MongoDB connection | Backend instructions |
| `src/backend/app/dependencies.py` | create | DI providers | Backend instructions |
| `src/backend/app/main.py` | create | FastAPI app factory | — |
| `src/backend/app/models/__init__.py` | create | Models package | — |
| `src/backend/app/models/fact.py` | create | Fact document | Backend instructions |
| `src/backend/app/schemas/__init__.py` | create | Schemas package | — |
| `src/backend/app/schemas/fact.py` | create | Fact schemas | Backend instructions |
| `src/backend/app/schemas/greeting.py` | create | Greeting schemas | — |
| `src/backend/app/repositories/__init__.py` | create | Repositories package | — |
| `src/backend/app/repositories/base.py` | create | Base repository | Backend instructions |
| `src/backend/app/repositories/fact_repository.py` | create | Fact repository | Backend instructions |
| `src/backend/app/services/__init__.py` | create | Services package | — |
| `src/backend/app/services/fact_service.py` | create | Fact service | Backend instructions |
| `src/backend/app/routers/__init__.py` | create | Routers package | — |
| `src/backend/app/routers/greetings.py` | create | Greetings endpoint | Backend instructions |
| `src/backend/app/jobs/__init__.py` | create | Jobs package | — |
| `src/backend/app/jobs/fact_ingestor.py` | create | Ingestion job | Backend instructions |
| `src/backend/tests/__init__.py` | create | Tests package | — |
| `src/backend/tests/conftest.py` | create | Pytest fixtures | — |
| `src/backend/tests/unit/` | create | Unit tests | — |
| `src/backend/tests/integration/` | create | Integration tests | — |

---

## 4. Schema & DTO Changes

### Database Schema (MongoDB Collection: `facts`)

| Field | Type | Required | Indexed | Notes |
|-------|------|----------|---------|-------|
| `_id` | `ObjectId` | Yes (auto) | Primary | MongoDB default |
| `external_id` | `string` | Yes | Unique | API `id` |
| `text` | `string` | Yes | No | Fact text |
| `source` | `string` | Yes | No | Fact source |
| `source_url` | `string` | Yes | No | Source URL |
| `language` | `string` | Yes | Index | Language code |
| `permalink` | `string` | Yes | No | Fact permalink |
| `created_at` | `datetime` | Yes (default) | No | Creation timestamp |

### Pydantic Schemas

| Schema | Purpose | Fields |
|--------|---------|--------|
| `FactBase` | Common fields | text, source, language, permalink |
| `FactCreate` | Internal creation | FactBase + external_id, source_url |
| `FactResponse` | API response | FactBase + id, created_at |
| `FactBrief` | Embedded in other responses | text, language, source, permalink |
| `GreetingResponse` | Greeting endpoint | greeting, fact (FactBrief) |

---

## 5. Test Strategy

### Unit Tests

| Test File | What to Test | Mocks Needed | Coverage Target |
|-----------|--------------|--------------|-----------------|
| `test_fact_repository.py` | CRUD operations, upsert | Beanie/Motor | All methods |
| `test_fact_service.py` | `ingest_batch` fetches and upserts | Repository, httpx | Success/error |
| `test_fact_service.py` | `get_random` returns or warms up | Repository | Success/error |

### Integration Tests

| Test File | What to Test | Mocks Needed | Coverage Target |
|-----------|--------------|--------------|-----------------|
| `test_greetings.py` | `GET /api/greetings` returns greeting + fact | FactService | Success (200) |
| `test_greetings.py` | Returns 503 when no facts | FactService | Error (503) |

---

## 6. Deployment & Rollout

### Feature Flags

None.

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGODB_URI` | No | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DATABASE` | No | `r3nd` | MongoDB database name |
| `DEBUG` | No | `false` | Enable debug mode |
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `0.0.0.0` | Server host binding |
| `API_PREFIX` | No | `/api` | API route prefix |

### Migration Plan

Careful: Beanie will attempt to create indexes on startup. If the database already contains documents that violate a unique index (for example multiple documents with `external_id: null`), the index build will fail and application startup will abort. To avoid this, include a small migration/checklist in the scaffold that operators/developers should run before first startup against an existing DB.

- Check for documents with missing/null `external_id`:

  ```sh
  mongosh --eval 'db.getSiblingDB("r3nd").facts.countDocuments({ external_id: null })'
  ```

- If any exist, decide one of the following remediation options before starting the app:
  - Remove the `null`/missing documents if they are junk:
    ```sh
    mongosh --eval 'db.getSiblingDB("r3nd").facts.deleteMany({ external_id: null })'
    ```
  - Or keep one document per duplicate group and remove others (scripted dedupe).
  - Or migrate documents to provide a valid `external_id` value.

- If a previous (non-sparse) unique index already exists and is failing, drop it before startup so Beanie can create the intended sparse/partial index:

  ```sh
  mongosh --eval 'db.getSiblingDB("r3nd").facts.dropIndex("external_id_1")'
  ```

- After cleaning data or dropping the conflicting index, start the backend so Beanie can recreate indexes according to the model (sparse/partial).

- For production: include a one-off migration job (script or Kubernetes job) that performs the checks and deduplication automatically and logs actions. The scaffold should provide example scripts or commands and document the safe path.

---

## 7. AI-Agent Guardrails

Follow `.github/instructions/backend.instructions.md` and `.github/instructions/testing.instructions.md`.

**FastAPI-specific rules:**
- Use async/await throughout — never block the event loop.
- Use Pydantic models for all request/response validation.
- Use dependency injection for services and repositories.
- Follow layered architecture: Router → Service → Repository → Model.
- Use httpx for async HTTP calls, never requests.
- Use Beanie for MongoDB operations, never raw pymongo/motor.
- Always type hint functions and methods.
- Configure CORS for frontend integration.
- Add health check endpoint for container orchestration.

---

## 8. Definition of Done

- [ ] All tasks in Section 2 marked complete
- [ ] `pip install -r requirements-dev.txt` succeeds
- [ ] `pytest` passes all tests
- [ ] `mypy app` passes type checking
- [ ] `black --check app tests` passes
- [ ] `ruff check app tests` passes
- [ ] `uvicorn app.main:app` starts without errors
- [ ] App connects to MongoDB
- [ ] APScheduler job ingests facts hourly
- [ ] `GET /api/greetings` returns greeting + fact
- [ ] `GET /health` returns 200
- [ ] Docker build succeeds
- [ ] No `Any` types, no unused imports
- [ ] All code follows layered architecture

---

## Implementation Notes (Added by Developer)

_Space for notes during implementation._

---

## Notes

This is a scaffold build plan for the developer agent to bootstrap the FastAPI backend with MongoDB (Beanie ODM) and APScheduler for background jobs. The architecture follows a clean layered pattern that is easy to maintain and scale into microservices when needed.

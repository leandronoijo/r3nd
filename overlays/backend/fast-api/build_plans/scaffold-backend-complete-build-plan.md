# Build Plan: scaffold-backend — Complete (features, tests & Docker DB)

> **Scope:** Implement facts ingestion and greetings endpoints, add tests, and run with a Dockerized MongoDB for integration and CI parity.
> **Source:** Derived from original scaffold-backend build plan
> **Created:** 2025-12-14
> **Status:** In Progress

---

## 0. Pre-Implementation Checklist

- [ ] Read `.github/instructions/backend.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Confirm DB will be provided via Docker (MongoDB)
- [ ] List integration points with bootstrap plan: `app/main.py` will be extended with routers and lifespan

### New Dependencies (for this phase)

| Package | Purpose |
|---|---|
| `motor` | Async MongoDB driver |
| `beanie` | Async ODM for MongoDB |
| `apscheduler` | Background job scheduler |
| `httpx` | Async HTTP client |
| Dev: `pytest`, `pytest-asyncio`, `pytest-cov`, `mongomock-motor`, `mypy`, `black`, `isort`, `ruff` | Testing and quality tools |

---

## 1. Implementation Overview

**Approach:** Add a `Fact` model (Beanie Document), `FactRepository`, `FactService`, and `GreetingsRouter`. Add pytest tests for repositories, services, and routers. Use Docker to run MongoDB during local runs and CI.

**Goal:** App compiles, tests pass (`pytest`), and the app can run against a real MongoDB started with Docker (instructions included). `GET /api/greetings` returns a greeting with a fact pulled from DB.

**Acceptance Criteria (Complete):**
- All pytest tests pass (`pytest`) ✅
- App can connect to Dockerized MongoDB and executes ingestion job ✅
- `GET /api/greetings` returns a greeting containing a Fact object ✅

---

## 2. Tasks

### Task 1: Add dependencies
- Update `requirements.txt`:

```
# ... existing bootstrap deps ...
motor>=3.3.0
beanie>=1.24.0
apscheduler>=3.10.0
httpx>=0.26.0
```

- Create `requirements-dev.txt`:

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
```

- Install: `pip install -r requirements-dev.txt`

### Task 2: Database connection
- Create `app/database.py` with Motor/Beanie connection manager.
- Update `app/config.py` to add `mongodb_uri` and `mongodb_database` settings.

### Task 3: Fact model
- Create `app/models/fact.py` with Beanie Document.
- **IMPORTANT**: Use sparse unique index on `external_id` to handle potential nulls:

```python
from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field

class Fact(Document):
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

### Task 4: Schemas
- Create `app/schemas/fact.py` with Pydantic schemas (`FactBase`, `FactCreate`, `FactResponse`, `FactBrief`).
- Create `app/schemas/greeting.py` with `GreetingResponse`.

### Task 5: Repository layer
- Create `app/repositories/base.py` with generic `BaseRepository[T]`.
- Create `app/repositories/fact_repository.py` with:
  - `get_by_external_id(external_id)`
  - `get_random()` using `$sample` aggregation
  - `upsert_by_external_id(fact_data)` 
  - `count()`

### Task 6: Service layer
- Create `app/services/fact_service.py` with:
  - `async ingest_batch(size=5)` — fetch from API, upsert, return new count
  - `async get_random()` — get random fact; if none, warm up once and retry

### Task 7: Dependency injection
- Create `app/dependencies.py` with:
  - `get_fact_repository()` — singleton
  - `get_fact_service(repository=Depends(get_fact_repository))` — service with DI

### Task 8: Greetings router
- Create `app/routers/greetings.py`:
  - `GET /greetings` endpoint
  - Inject `FactService` via `Depends(get_fact_service)`
  - Return `GreetingResponse` with greeting + fact
  - Handle `ValueError` → 503

### Task 9: Background jobs
- Create `app/jobs/fact_ingestor.py` with APScheduler:
  - `AsyncIOScheduler` with hourly job
  - `setup_scheduler()` and `shutdown_scheduler()` functions
- Update `app/main.py` lifespan to start/stop scheduler

### Task 10: Tests
- Create `tests/conftest.py` with pytest fixtures (mock repository, test client, etc.)
- Create `tests/unit/repositories/test_fact_repository.py` — test all repository methods
- Create `tests/unit/services/test_fact_service.py` — mock repository and httpx
- Create `tests/integration/routers/test_greetings.py` — use TestClient, mock service

### Task 11: Docker DB & integration
- Provide `docker run` command for MongoDB:

```bash
docker run -d --name r3nd-mongo -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=r3nd \
  mongo:6.0
```

### Task 12: Validate CI & local runs
- `pytest` should pass all tests
- `mypy app` should pass type checking
- `black --check app tests` should pass
- `ruff check app tests` should pass
- Start server with MongoDB running and confirm `/api/greetings` works

---

## 3. Files to Add (Complete)

| File Path | Action |
|---|---|
| `src/backend/app/database.py` | create |
| `src/backend/app/models/fact.py` | create |
| `src/backend/app/schemas/fact.py` | create |
| `src/backend/app/schemas/greeting.py` | create |
| `src/backend/app/repositories/base.py` | create |
| `src/backend/app/repositories/fact_repository.py` | create |
| `src/backend/app/services/fact_service.py` | create |
| `src/backend/app/dependencies.py` | create |
| `src/backend/app/routers/greetings.py` | create |
| `src/backend/app/jobs/fact_ingestor.py` | create |
| `src/backend/tests/conftest.py` | create |
| `src/backend/tests/unit/repositories/test_fact_repository.py` | create |
| `src/backend/tests/unit/services/test_fact_service.py` | create |
| `src/backend/tests/integration/routers/test_greetings.py` | create |

---

## 4. Test Strategy

- Unit tests for repositories using mongomock-motor
- Unit tests for services with mocked repositories and httpx
- Integration tests for routers using FastAPI TestClient with mocked services
- Type checking with mypy
- Code quality with black, isort, ruff

---

## 5. Migration Checklist

Before first startup against an existing MongoDB with data:

1. Check for documents with missing/null `external_id`:
```bash
mongosh --eval 'db.getSiblingDB("r3nd").facts.countDocuments({ external_id: null })'
```

2. If any exist, remove or fix them before starting the app.

3. If a previous non-sparse unique index exists, drop it:
```bash
mongosh --eval 'db.getSiblingDB("r3nd").facts.dropIndex("external_id_1")'
```

---

## 6. Definition of Done (Complete)

- [ ] All dependencies installed via `pip install -r requirements-dev.txt` ✅
- [ ] MongoDB accessible via Docker ✅
- [ ] `pytest` passes all tests ✅
- [ ] `mypy app` passes type checking ✅
- [ ] `black --check app tests` passes ✅
- [ ] `ruff check app tests` passes ✅
- [ ] `uvicorn app.main:app --port 3000` starts without errors ✅
- [ ] `GET /api/greetings` returns greeting + fact ✅
- [ ] APScheduler job runs hourly ✅

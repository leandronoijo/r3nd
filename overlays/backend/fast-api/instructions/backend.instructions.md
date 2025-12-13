---
title: Backend Instructions
applyTo: src/backend/**
---

# Backend Development Instructions

These rules apply to all code under `src/backend/`. AI agents and humans must follow them strictly.

---

## Stack & Constraints

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | FastAPI | Async-first, DI-based architecture |
| Validation | Pydantic v2 | All DTOs/schemas validated |
| Database | MongoDB via Motor (async) | Async driver for MongoDB |
| ODM | Beanie | Async ODM built on Motor |
| Background Jobs | APScheduler | In-process job scheduler |
| DI Container | FastAPI Depends | Constructor injection pattern |

**Testing & quality gates:** Follow `.github/instructions/testing.instructions.md`.

### CLI Tooling & Package Management

**Always prefer CLI tools over manual file editing:**
- **Installing packages**: Use `pip install <package>` or `poetry add <package>` instead of manually editing `requirements.txt` or `pyproject.toml`.
- **Virtual environments**: Use `python -m venv .venv` and activate with `source .venv/bin/activate` (Linux/Mac) or `.venv\Scripts\activate` (Windows).
- **Running the app**: Use `uvicorn app.main:app --reload` for development.
- **Type checking**: Use `mypy src/backend` for static type analysis.
- **Formatting**: Use `black .` and `isort .` for code formatting.
- **Linting**: Use `ruff check .` for linting.

**Why**: CLI tools ensure reproducible environments, correct dependency resolution, and follow Python best practices.

### Forbidden

- Synchronous database operations (always use async).
- Direct MongoDB driver calls outside repositories (use Beanie models).
- Business logic in routers (use services).
- Circular imports (structure modules to avoid).
- Any ORM other than Beanie.
- Unvalidated request bodies (always use Pydantic schemas).
- Global mutable state (use DI for shared resources).
- Raw `dict` for API responses (use Pydantic models).
- `from typing import Optional` for new code (use `X | None`).
- Synchronous `time.sleep()` (use `asyncio.sleep()`).

---

## Architecture Overview

This project follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        ROUTERS                              │
│  (HTTP layer: request/response handling, validation)        │
└─────────────────────────┬───────────────────────────────────┘
                          │ calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        SERVICES                             │
│  (Business logic: orchestration, transformations, rules)    │
└─────────────────────────┬───────────────────────────────────┘
                          │ calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      REPOSITORIES                           │
│  (Data access: CRUD operations, queries, persistence)       │
└─────────────────────────┬───────────────────────────────────┘
                          │ uses
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        MODELS                               │
│  (Beanie documents: schema definitions, indexes)            │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles:**
1. **Routers** only handle HTTP concerns (validation, serialization, status codes).
2. **Services** contain all business logic and orchestrate repository calls.
3. **Repositories** are the only layer that touches the database.
4. **Models** define the data structure and database schema.
5. **Dependencies flow downward only** — routers depend on services, services depend on repositories.

---

## File & Folder Conventions

```
src/backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app factory, lifespan events
│   ├── config.py                  # Pydantic Settings for configuration
│   ├── database.py                # MongoDB connection singleton
│   ├── dependencies.py            # Shared DI providers
│   │
│   ├── models/                    # Beanie document models
│   │   ├── __init__.py
│   │   └── <entity>.py            # e.g., fact.py
│   │
│   ├── schemas/                   # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   └── <entity>.py            # e.g., fact.py, greeting.py
│   │
│   ├── repositories/              # Data access layer
│   │   ├── __init__.py
│   │   ├── base.py                # Abstract base repository
│   │   └── <entity>_repository.py # e.g., fact_repository.py
│   │
│   ├── services/                  # Business logic layer
│   │   ├── __init__.py
│   │   └── <entity>_service.py    # e.g., fact_service.py
│   │
│   ├── routers/                   # API endpoints
│   │   ├── __init__.py
│   │   └── <entity>.py            # e.g., greetings.py
│   │
│   └── jobs/                      # Background jobs (APScheduler)
│       ├── __init__.py
│       └── <job_name>.py          # e.g., fact_ingestor.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                # Pytest fixtures
│   ├── unit/
│   │   ├── services/
│   │   └── repositories/
│   └── integration/
│       └── routers/
│
├── pyproject.toml                 # Poetry project config
├── requirements.txt               # Pip requirements (generated from poetry)
├── Dockerfile
└── .env.example
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | snake_case | `fact_service.py`, `greeting_router.py` |
| Classes | PascalCase | `FactService`, `FactRepository` |
| Functions/Methods | snake_case | `get_random_fact()`, `ingest_batch()` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_BATCH_SIZE`, `API_PREFIX` |
| Pydantic Models | PascalCase with suffix | `FactCreate`, `FactResponse`, `FactInDB` |
| Beanie Documents | PascalCase | `Fact`, `User` |

---

## Configuration (Pydantic Settings)

All configuration must use Pydantic Settings with environment variables:

```python
# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # Application
    app_name: str = "R3ND API"
    debug: bool = False
    api_prefix: str = "/api"
    
    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "r3nd"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 3000


# Singleton instance
settings = Settings()
```

**Rules:**
1. Never hardcode configuration values.
2. All settings must have sensible defaults for development.
3. Use `.env` file for local development (never commit to git).
4. Document all environment variables in `.env.example`.

---

## Database Connection (Singleton Pattern)

```python
# app/database.py
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models import Fact  # Import all document models


class Database:
    """Singleton database connection manager."""
    
    client: AsyncIOMotorClient | None = None
    
    @classmethod
    async def connect(cls) -> None:
        """Initialize MongoDB connection and Beanie ODM."""
        cls.client = AsyncIOMotorClient(settings.mongodb_uri)
        
        await init_beanie(
            database=cls.client[settings.mongodb_database],
            document_models=[Fact],  # Register all document models
        )
    
    @classmethod
    async def disconnect(cls) -> None:
        """Close MongoDB connection."""
        if cls.client:
            cls.client.close()
            cls.client = None


# Lifespan context manager for FastAPI
from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    await Database.connect()
    yield
    await Database.disconnect()
```

---

## Model Rules (Beanie Documents)

```python
# app/models/fact.py
from datetime import datetime

from beanie import Document, Indexed
from pydantic import Field


class Fact(Document):
    """Fact document stored in MongoDB."""
    
    external_id: Indexed(str, unique=True)  # Unique index
    text: str
    source: str
    source_url: str
    language: Indexed(str)  # Regular index for queries
    permalink: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "facts"  # Collection name
        
    class Config:
        json_schema_extra = {
            "example": {
                "external_id": "abc123",
                "text": "A fact about something interesting.",
                "source": "uselessfacts",
                "source_url": "https://uselessfacts.jsph.pl",
                "language": "en",
                "permalink": "https://uselessfacts.jsph.pl/abc123",
            }
        }
```

**Rules:**
1. Every document must inherit from `beanie.Document`.
2. Use `Indexed()` for fields that need database indexes.
3. Define `Settings.name` for explicit collection naming.
4. Add type hints to all fields.
5. Use `Field(default_factory=...)` for mutable defaults.
6. Never use `dict` or `Any` types — always explicit.
7. Avoid creating unique indexes on fields that can be `null` or missing across documents. If a field may be absent, prefer one of these safe options:
    - Make the field optional and use a sparse unique index so documents without the field aren't included in the index.
    - Create a partial unique index (using `partialFilterExpression`) that only indexes documents where the field exists / is not null.
    - Enforce the field to be present and non-null at ingestion time so a plain unique index is safe.
    Also include migration/data-cleaning steps before applying a new unique index to an existing database (see Migration Plan section).

---

## Schema Rules (Pydantic Models)

Schemas define the API contract — separate from database models:

```python
# app/schemas/fact.py
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FactBase(BaseModel):
    """Base schema with common fields."""
    
    text: str
    source: str
    language: str
    permalink: str


class FactCreate(FactBase):
    """Schema for creating a fact (internal use)."""
    
    external_id: str
    source_url: str


class FactResponse(FactBase):
    """Schema for API responses."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(alias="_id")
    created_at: datetime


class FactBrief(BaseModel):
    """Abbreviated fact for embedding in other responses."""
    
    model_config = ConfigDict(from_attributes=True)
    
    text: str
    language: str
    source: str
    permalink: str
```

**Rules:**
1. Use inheritance to avoid duplication (`FactBase` → `FactCreate`, `FactResponse`).
2. Request schemas: suffix with `Create`, `Update`, `Filter`.
3. Response schemas: suffix with `Response`, `Brief`, `List`.
4. Set `model_config = ConfigDict(from_attributes=True)` for ORM compatibility.
5. Use `Field(alias="...")` when API field names differ from model names.

---

## Repository Rules (Data Access Layer)

Repositories encapsulate all database operations:

```python
# app/repositories/base.py
from typing import Generic, TypeVar
from beanie import Document

T = TypeVar("T", bound=Document)


class BaseRepository(Generic[T]):
    """Base repository with common CRUD operations."""
    
    def __init__(self, model: type[T]):
        self.model = model
    
    async def get_by_id(self, id: str) -> T | None:
        """Get document by ID."""
        return await self.model.get(id)
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> list[T]:
        """Get all documents with pagination."""
        return await self.model.find_all().skip(skip).limit(limit).to_list()
    
    async def create(self, document: T) -> T:
        """Create a new document."""
        await document.insert()
        return document
    
    async def update(self, document: T) -> T:
        """Update an existing document."""
        await document.save()
        return document
    
    async def delete(self, document: T) -> None:
        """Delete a document."""
        await document.delete()
```

```python
# app/repositories/fact_repository.py
from app.models.fact import Fact
from app.repositories.base import BaseRepository


class FactRepository(BaseRepository[Fact]):
    """Repository for Fact documents."""
    
    def __init__(self):
        super().__init__(Fact)
    
    async def get_by_external_id(self, external_id: str) -> Fact | None:
        """Get fact by external API ID."""
        return await Fact.find_one(Fact.external_id == external_id)
    
    async def get_random(self) -> Fact | None:
        """Get a random fact using MongoDB aggregation."""
        pipeline = [{"$sample": {"size": 1}}]
        results = await Fact.aggregate(pipeline).to_list()
        return results[0] if results else None
    
    async def upsert_by_external_id(self, fact_data: dict) -> tuple[Fact, bool]:
        """
        Insert or update fact by external_id.
        Returns (fact, is_new) tuple.
        """
        existing = await self.get_by_external_id(fact_data["external_id"])
        if existing:
            for key, value in fact_data.items():
                setattr(existing, key, value)
            await existing.save()
            return existing, False
        
        fact = Fact(**fact_data)
        await fact.insert()
        return fact, True
    
    async def count(self) -> int:
        """Get total count of facts."""
        return await Fact.count()
```

**Rules:**
1. One repository per document/entity.
2. Inherit from `BaseRepository` for common CRUD.
3. Add entity-specific methods (e.g., `get_by_external_id`).
4. Never expose raw MongoDB queries outside repositories.
5. Return domain models, not raw dicts.
6. Handle `None` cases explicitly.

---

## Service Rules (Business Logic Layer)

Services contain all business logic and orchestrate repository calls:

```python
# app/services/fact_service.py
import httpx

from app.config import settings
from app.models.fact import Fact
from app.repositories.fact_repository import FactRepository
from app.schemas.fact import FactCreate


class FactService:
    """Service for fact-related business logic."""
    
    FACTS_API_URL = "https://uselessfacts.jsph.pl/api/v2/facts/random"
    
    def __init__(self, repository: FactRepository):
        self.repository = repository
    
    async def ingest_batch(self, size: int = 5) -> int:
        """
        Fetch facts from external API and store them.
        Returns count of newly inserted facts.
        """
        new_count = 0
        
        async with httpx.AsyncClient() as client:
            for _ in range(size):
                response = await client.get(self.FACTS_API_URL)
                response.raise_for_status()
                data = response.json()
                
                fact_data = {
                    "external_id": data["id"],
                    "text": data["text"],
                    "source": data["source"],
                    "source_url": data["source_url"],
                    "language": data["language"],
                    "permalink": data["permalink"],
                }
                
                _, is_new = await self.repository.upsert_by_external_id(fact_data)
                if is_new:
                    new_count += 1
        
        return new_count
    
    async def get_random(self) -> Fact:
        """
        Get a random fact.
        If no facts exist, ingest a batch first.
        """
        fact = await self.repository.get_random()
        
        if fact is None:
            # Warm up the database
            await self.ingest_batch(5)
            fact = await self.repository.get_random()
        
        if fact is None:
            raise ValueError("No facts available after warmup")
        
        return fact
```

**Rules:**
1. Services are instantiated with their dependencies (repository injection).
2. All business logic lives here — not in routers or repositories.
3. Orchestrate multiple repository calls when needed.
4. Handle errors and edge cases (e.g., empty database).
5. External API calls happen in services, not repositories.
6. Keep methods focused on single responsibilities.
7. Services should be stateless (no instance state beyond dependencies).

---

## Router Rules (HTTP Layer)

Routers handle HTTP concerns only — validation, serialization, status codes:

```python
# app/routers/greetings.py
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_fact_service
from app.schemas.greeting import GreetingResponse
from app.services.fact_service import FactService


router = APIRouter(prefix="/greetings", tags=["greetings"])


@router.get("/", response_model=GreetingResponse)
async def get_greeting(
    fact_service: FactService = Depends(get_fact_service),
) -> GreetingResponse:
    """Get a greeting with a random fact."""
    try:
        fact = await fact_service.get_random()
        return GreetingResponse(
            greeting="Hello from FastAPI!",
            fact={
                "text": fact.text,
                "language": fact.language,
                "source": fact.source,
                "permalink": fact.permalink,
            },
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
```

**Rules:**
1. Use `APIRouter` with `prefix` and `tags`.
2. Always specify `response_model` for documentation.
3. Use `Depends()` for dependency injection.
4. Routers call services — never repositories directly.
5. Convert service exceptions to HTTP exceptions.
6. Keep route handlers thin (<15 lines).
7. Use appropriate HTTP status codes.

---

## Dependency Injection

```python
# app/dependencies.py
from functools import lru_cache

from app.repositories.fact_repository import FactRepository
from app.services.fact_service import FactService


@lru_cache
def get_fact_repository() -> FactRepository:
    """Get singleton FactRepository instance."""
    return FactRepository()


def get_fact_service(
    repository: FactRepository = Depends(get_fact_repository),
) -> FactService:
    """Get FactService with injected dependencies."""
    return FactService(repository=repository)
```

**Rules:**
1. Use `@lru_cache` for singleton dependencies (repositories).
2. Use `Depends()` for request-scoped or composed dependencies.
3. Dependencies should be testable (easy to mock).
4. Follow the dependency graph: Router → Service → Repository.

---

## Background Jobs (APScheduler)

```python
# app/jobs/fact_ingestor.py
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.dependencies import get_fact_repository
from app.services.fact_service import FactService


logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def ingest_facts_job():
    """Hourly job to ingest new facts."""
    repository = get_fact_repository()
    service = FactService(repository=repository)
    
    try:
        count = await service.ingest_batch(5)
        logger.info(f"Ingested {count} new facts")
    except Exception as e:
        logger.error(f"Failed to ingest facts: {e}")


def setup_scheduler():
    """Configure and start the scheduler."""
    scheduler.add_job(
        ingest_facts_job,
        trigger=IntervalTrigger(hours=1),
        id="ingest_facts",
        name="Ingest random facts hourly",
        replace_existing=True,
    )
    scheduler.start()


def shutdown_scheduler():
    """Stop the scheduler."""
    scheduler.shutdown(wait=False)
```

**Rules:**
1. Use `AsyncIOScheduler` for async jobs.
2. Jobs should call services, not repositories directly.
3. Handle exceptions within jobs — don't let them crash the scheduler.
4. Log job execution for debugging.
5. Setup scheduler in app lifespan (startup), shutdown in lifespan (cleanup).

---

## Error Handling

```python
# app/main.py (excerpt)
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
```

**HTTP Status Code Guide:**
| Code | Usage |
|------|-------|
| `200` | Successful GET, PUT, PATCH |
| `201` | Successful POST (created) |
| `204` | Successful DELETE (no content) |
| `400` | Bad request (validation error) |
| `404` | Resource not found |
| `422` | Unprocessable entity (semantic error) |
| `500` | Internal server error |
| `503` | Service unavailable (dependency failure) |

---

## Common AI-Agent Mistakes to Avoid

| Mistake | Mitigation |
|---------|------------|
| Business logic in routers | Move to services; routers only handle HTTP. |
| Direct MongoDB calls in services | Use repositories; services call repositories. |
| Skipping Pydantic validation | Always use schemas for request/response. |
| Synchronous database calls | Use `async`/`await` with Motor/Beanie. |
| Circular imports | Structure: routers → services → repositories → models. |
| Hardcoded config | Use Pydantic Settings with environment variables. |
| Missing type hints | All functions must have full type annotations. |
| Using `dict` for responses | Use Pydantic models for type safety. |
| Large services (>200 lines) | Split into focused services by domain. |
| Not handling None | Check `is None` explicitly, don't rely on truthiness. |
| Mutable default arguments | Use `Field(default_factory=...)` or `None`. |
| Global mutable state | Use DI for shared resources. |
| Missing tests | Every service/repository must have tests. |
| Not mocking HTTP calls | Use `httpx.MockTransport` or `respx` in tests. |

---

## Golden Reference

Follow the example module structure for new features:

```
app/
├── models/example.py           # Beanie document
├── schemas/example.py          # Pydantic schemas
├── repositories/example_repository.py
├── services/example_service.py
├── routers/example.py
└── jobs/example_job.py         # If needed
```

Copy this structure for each new domain concept.

---

## Code Quality Checklist

Before committing:
- [ ] All tests pass (`pytest`)
- [ ] Type check passes (`mypy src/backend`)
- [ ] Code formatted (`black .` and `isort .`)
- [ ] Linting passes (`ruff check .`)
- [ ] All functions have type hints
- [ ] All Pydantic models validated
- [ ] No hardcoded configuration
- [ ] Business logic in services only
- [ ] Database calls in repositories only
- [ ] HTTP calls mocked in tests
- [ ] No synchronous blocking calls
- [ ] Dependencies flow downward only
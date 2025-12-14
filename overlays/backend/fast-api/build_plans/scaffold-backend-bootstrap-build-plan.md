# Build Plan: scaffold-backend — Bootstrap

> **Scope:** Bootstrap FastAPI app so it compiles and runs locally (no DB required)
> **Source:** Derived from original scaffold-backend build plan
> **Created:** 2025-12-14
> **Status:** In Progress

---

## 0. Pre-Implementation Checklist

- [ ] Read `.github/instructions/backend.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Identify golden reference modules (if present)
- [ ] Confirm minimal dependencies needed for a working bootstrap
- [ ] Ensure local tooling: Python >= 3.12 and `pip` available

### Minimal Dependencies & Tooling

This plan **prefers** using pip/venv rather than hand-editing manifests:

- Create a virtual environment: `python -m venv venv` (preferred).
- Use `pip install` to add dependencies to `requirements.txt`.
- Basic stack: `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`.

No database is required for this bootstrap plan.

---

## 1. Implementation Overview

**Approach:** Create a minimal FastAPI application that runs with `uvicorn`.

**Goal:** Developer can run `uvicorn app.main:app --port 3000` and see the app start, respond on a health endpoint, and exit cleanly.

**Acceptance Criteria (Bootstrap):**
- `requirements.txt` exists with basic dependencies
- App boots without requiring a DB connection
- `GET /health` returns 200

---

## 2. Tasks

### Task A: Project skeleton & deps
- Create project structure:

```bash
mkdir -p src/backend/app
cd src/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

- Create `requirements.txt`:

```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
python-dotenv>=1.0.0
```

- Install dependencies:

```bash
pip install -r requirements.txt
```

### Task B: Configuration
- Create `app/config.py` with Pydantic Settings:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
    
    app_name: str = "R3ND API"
    debug: bool = False
    api_prefix: str = "/api"
    host: str = "0.0.0.0"
    port: int = 3000

settings = Settings()
```

### Task C: Main application
- Create `app/__init__.py` (empty, marks as package).
- Create `app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title=settings.app_name)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### Task D: Validate build and run
- Run the app:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 3000
```

- Confirm `GET /health` returns 200:

```bash
curl http://localhost:3000/health
```

---

## 3. Files to Add (Bootstrap)

| File Path | Action |
|---|---|
| `src/backend/requirements.txt` | create |
| `src/backend/.env.example` | create |
| `src/backend/app/__init__.py` | create |
| `src/backend/app/config.py` | create |
| `src/backend/app/main.py` | create |

---

## 4. Notes

- Keep the app minimal in this plan; database integration, business logic, and testing is part of the complete plan.
- Virtual environment pattern is standard for Python projects.

---

## 5. Definition of Done (Bootstrap)

- [ ] Virtual environment created and dependencies installed ✅
- [ ] `uvicorn app.main:app --port 3000` starts successfully ✅
- [ ] `GET /health` returns 200 ✅
- [ ] App starts without database connection errors ✅

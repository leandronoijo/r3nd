---
title: Infrastructure Instructions - FastAPI Backend
applyTo: src/backend/Dockerfile, docker-compose.yml
---

# FastAPI Backend Infrastructure Instructions

These instructions provide framework-specific configuration for containerizing and deploying the FastAPI backend with MongoDB.

---

## Stack Requirements

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Python | 3.12+ |
| Database | MongoDB | 7+ |
| Package Manager | pip / Poetry | Latest stable |
| Base Image | python:3.12-slim | Debian-based slim image |
| ASGI Server | Uvicorn | Latest stable |

---

## Dockerfile Configuration

### Base Image

```dockerfile
FROM python:3.12-slim AS builder
```

**Why Python 3.12**: Latest stable Python with performance improvements, better error messages, and full typing support including `X | None` syntax.

**Why Slim**: Good balance between image size (~150MB) and compatibility. Alpine can cause issues with some Python packages that need compilation.

### Build Stage

```dockerfile
# Builder stage
FROM python:3.12-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt
```

### Runtime Stage

```dockerfile
# Runtime stage
FROM python:3.12-slim AS runner

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3000"]
```

### Complete Dockerfile

```dockerfile
# Builder stage
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.12-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY . .

RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3000"]
```

**Important Notes:**
- Uvicorn binds to `0.0.0.0` to accept external connections in Docker.
- Use virtual environment to isolate Python dependencies.
- Health check ensures container is ready before accepting traffic.
- Non-root user for security.
- For production, consider using `gunicorn` with `uvicorn` workers: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`.

---

## Docker Compose Configuration

### Database Service (MongoDB)

```yaml
services:
  mongo:
    image: mongo:7
    container_name: r3nd-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: r3nd
    networks:
      - app-net
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  mongo-data:
```

### Backend Service

```yaml
  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    container_name: r3nd-backend
    depends_on:
      mongo:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: mongodb://mongo:27017
      MONGODB_DATABASE: r3nd
      DEBUG: "false"
      PORT: 3000
    networks:
      - app-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### Complete docker-compose.yml

```yaml
version: "3.8"

services:
  mongo:
    image: mongo:7
    container_name: r3nd-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: r3nd
    networks:
      - app-net
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    container_name: r3nd-backend
    depends_on:
      mongo:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: mongodb://mongo:27017
      MONGODB_DATABASE: r3nd
      DEBUG: "false"
      PORT: 3000
    networks:
      - app-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  app-net:
    driver: bridge

volumes:
  mongo-data:
```

**Environment Variables:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | `mongodb://localhost:27017` | MongoDB connection string (use service name `mongo` for container networking) |
| `MONGODB_DATABASE` | Yes | `r3nd` | MongoDB database name |
| `DEBUG` | No | `false` | Enable debug mode (more verbose logging) |
| `PORT` | No | `3000` | HTTP server port |
| `LOG_LEVEL` | No | `info` | Logging level (debug, info, warning, error) |

**Connection String Format:**
```
mongodb://[username:password@]host[:port][/database][?options]
```

Examples:
- **Container-to-container**: `mongodb://mongo:27017` (use service name)
- **Host-to-container**: `mongodb://localhost:27017` (use localhost)
- **With authentication**: `mongodb://user:password@mongo:27017`

---

## Build Commands

```bash
# Build Docker image
docker build -t r3nd-backend ./src/backend

# Build with Docker Compose
docker-compose build backend

# Build without cache (clean build)
docker-compose build --no-cache backend
```

---

## Run Commands

```bash
# Start backend service only
docker-compose up backend

# Start backend with database
docker-compose up mongo backend

# Start all services
docker-compose up

# Run in background (detached)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Execute command in running container
docker-compose exec backend python -c "print('Hello')"

# Run tests in container
docker-compose exec backend pytest

# Access Python shell
docker-compose exec backend python
```

---

## Database Connection

### In Application Code

FastAPI uses Beanie with Motor for async MongoDB operations:

```python
# app/database.py
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models.fact import Fact


class Database:
    """Singleton database connection manager."""
    
    client: AsyncIOMotorClient | None = None
    
    @classmethod
    async def connect(cls) -> None:
        """Initialize MongoDB connection and Beanie ODM."""
        cls.client = AsyncIOMotorClient(settings.mongodb_uri)
        
        await init_beanie(
            database=cls.client[settings.mongodb_database],
            document_models=[Fact],
        )
    
    @classmethod
    async def disconnect(cls) -> None:
        """Close MongoDB connection."""
        if cls.client:
            cls.client.close()
            cls.client = None
```

### Connection String Components

```
mongodb://[username:password@]host[:port][/database][?options]
```

Common options:
- `?retryWrites=true` — Enable retryable writes.
- `?w=majority` — Write concern for durability.
- `?readPreference=secondaryPreferred` — Read from secondaries when possible.
- `?maxPoolSize=100` — Maximum connection pool size.

For local development (Docker Compose):
```
mongodb://mongo:27017
```

---

## Development Commands

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Install dev dependencies
pip install -r requirements-dev.txt

# Run development server
uvicorn app.main:app --reload --port 3000

# Run with specific host binding
uvicorn app.main:app --reload --host 0.0.0.0 --port 3000

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Type checking
mypy app

# Format code
black app tests
isort app tests

# Lint code
ruff check app tests

# Fix linting issues automatically
ruff check --fix app tests
```

---

## Production Considerations

### Using Gunicorn with Uvicorn Workers

For production, use Gunicorn as a process manager with Uvicorn workers:

```dockerfile
# Production CMD
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:3000"]
```

Gunicorn configuration (`gunicorn.conf.py`):
```python
# gunicorn.conf.py
import multiprocessing

# Bind to all interfaces
bind = "0.0.0.0:3000"

# Number of workers (2-4 x CPU cores)
workers = multiprocessing.cpu_count() * 2 + 1

# Worker class for async support
worker_class = "uvicorn.workers.UvicornWorker"

# Timeout for requests (seconds)
timeout = 120

# Keep alive connections
keepalive = 5

# Access log format
accesslog = "-"  # stdout
errorlog = "-"   # stderr
loglevel = "info"

# Graceful timeout
graceful_timeout = 30

# Max requests per worker before restart (memory leak protection)
max_requests = 1000
max_requests_jitter = 100
```

### Environment-Specific Settings

```python
# app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    app_name: str = "R3ND API"
    debug: bool = False
    environment: str = "development"
    
    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "r3nd"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 3000
    
    # Workers (for production)
    workers: int = 1
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
```

---

## Health Check Endpoint

Implement a health check endpoint for container orchestration:

```python
# app/routers/health.py
from fastapi import APIRouter, status
from pydantic import BaseModel

from app.database import Database


router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    database: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint for container orchestration."""
    db_status = "connected" if Database.client else "disconnected"
    
    # Optionally ping the database
    if Database.client:
        try:
            await Database.client.admin.command("ping")
            db_status = "healthy"
        except Exception:
            db_status = "unhealthy"
    
    return HealthResponse(status="ok", database=db_status)
```

---

## Logging Configuration

```python
# app/logging_config.py
import logging
import sys

from app.config import settings


def configure_logging() -> None:
    """Configure application logging."""
    log_level = logging.DEBUG if settings.debug else logging.INFO
    
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    
    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
```

---

## Security Considerations

1. **Non-root user**: Always run as non-root in containers.
2. **Read-only filesystem**: Consider `--read-only` flag for containers.
3. **No secrets in images**: Use environment variables or secrets management.
4. **Network isolation**: Use Docker networks to isolate services.
5. **Resource limits**: Set CPU and memory limits in production.

```yaml
# docker-compose.yml (with resource limits)
backend:
  deploy:
    resources:
      limits:
        cpus: "1"
        memory: 512M
      reservations:
        cpus: "0.25"
        memory: 256M
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused to MongoDB | Check if mongo service is healthy, verify connection string uses service name |
| Import errors | Ensure `PYTHONPATH` includes app directory, check virtual environment |
| Slow startup | Check if database is ready, use health checks with `depends_on` |
| Out of memory | Increase container memory limits, check for memory leaks |
| Permission denied | Ensure correct user permissions in Dockerfile |

### Debugging Commands

```bash
# Check container logs
docker-compose logs backend

# Interactive shell in container
docker-compose exec backend /bin/bash

# Check MongoDB connection
docker-compose exec backend python -c "
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test():
    client = AsyncIOMotorClient('mongodb://mongo:27017')
    await client.admin.command('ping')
    print('Connected!')

asyncio.run(test())
"

# List all containers and status
docker-compose ps

# Check container resource usage
docker stats
```

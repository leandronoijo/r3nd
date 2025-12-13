```instructions
---
title: Infrastructure Instructions - Ruby on Rails Backend
applyTo: src/backend/Dockerfile, docker-compose.yml
---

# Ruby on Rails Backend Infrastructure Instructions

These instructions provide framework-specific configuration for containerizing and deploying the Rails API backend.

---

## Stack Requirements

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Ruby | 3.3+ (required for Rails 8.1) |
| Database | PostgreSQL | 15+ |
| Package Manager | Bundler | 2.5+ |
| Base Image | ruby:3.3-alpine | Lightweight Alpine Linux |

---

## Dockerfile Configuration

### Base Image

```dockerfile
FROM ruby:3.3-alpine AS builder
```

**Why Ruby 3.3**: Rails 8.1 requires Ruby 3.3+ for latest language features and performance improvements.

**Why Alpine**: Minimal image size (~50MB base vs ~300MB for Debian-based images).

### Build Stage

```dockerfile
# Builder stage
FROM ruby:3.3-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    tzdata \
    nodejs \
    yarn

WORKDIR /app

# Copy dependency files
COPY Gemfile Gemfile.lock ./

# Install gems
RUN bundle config set --local deployment 'true' && \
    bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3

# Copy application code
COPY . .

# Precompile assets (if any, Rails API mode typically has none)
# RUN RAILS_ENV=production SECRET_KEY_BASE=dummy bundle exec rails assets:precompile

# Clean up
RUN rm -rf tmp/cache vendor/bundle/ruby/*/cache
```

### Runtime Stage

```dockerfile
# Runtime stage
FROM ruby:3.3-alpine AS runner

# Install runtime dependencies only
RUN apk add --no-cache \
    postgresql-client \
    tzdata \
    nodejs

WORKDIR /app

# Copy installed gems from builder
COPY --from=builder /usr/local/bundle /usr/local/bundle

# Copy application code
COPY --from=builder /app /app

# Create non-root user
RUN addgroup -g 1000 rails && \
    adduser -D -u 1000 -G rails rails && \
    chown -R rails:rails /app

USER rails

# Expose port
EXPOSE 3000

# Start application
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
```

**Important Notes:**
- Rails server binds to `0.0.0.0` to accept external connections in Docker.
- Use `bundle exec` to ensure correct gem versions.
- Run migrations separately (in entrypoint script or docker-compose command).
- Alpine requires `build-base` and `postgresql-dev` for native gem compilation.

---

## Docker Compose Configuration

### Database Service (PostgreSQL)

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: r3nd-postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: r3nd
      POSTGRES_PASSWORD: r3nd_password
      POSTGRES_DB: r3nd_development
    networks:
      - app-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U r3nd"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

### Backend Service

```yaml
  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    container_name: r3nd-backend
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      RAILS_ENV: production
      DATABASE_URL: postgresql://r3nd:r3nd_password@postgres:5432/r3nd_production
      RAILS_MASTER_KEY: ${RAILS_MASTER_KEY}
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      PORT: 3000
    networks:
      - app-net
    command: >
      sh -c "bundle exec rails db:create db:migrate &&
             bundle exec rails server -b 0.0.0.0"
```

**Environment Variables:**

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (use service name `postgres` for container networking) |
| `RAILS_ENV` | Yes | Rails environment (`development`, `test`, `production`) |
| `RAILS_MASTER_KEY` | Yes (production) | Encryption key for credentials (from `config/master.key`) |
| `SECRET_KEY_BASE` | Yes (production) | Secret for session encryption (generate with `rails secret`) |
| `PORT` | No | HTTP server port (default: `3000`) |

**Connection String Format:**
```
postgresql://[username[:password]@]host[:port]/database
```

Examples:
- **Container-to-container**: `postgresql://r3nd:r3nd_password@postgres:5432/r3nd_production`
- **Host-to-container**: `postgresql://r3nd:r3nd_password@localhost:5432/r3nd_production`

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
docker-compose up postgres backend

# Start all services
docker-compose up

# Run in background (detached)
docker-compose up -d

# Run database migrations
docker-compose exec backend bundle exec rails db:migrate

# Seed database
docker-compose exec backend bundle exec rails db:seed

# Access Rails console
docker-compose exec backend bundle exec rails console
```

---

## Database Configuration

### In Application Code

Rails uses `config/database.yml` for database configuration:

```yaml
# config/database.yml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  url: <%= ENV['DATABASE_URL'] %>

development:
  <<: *default
  database: r3nd_development

test:
  <<: *default
  database: r3nd_test

production:
  <<: *default
  database: r3nd_production
```

**Best Practice**: Use `DATABASE_URL` environment variable instead of individual host/port/username/password fields.

### Database Setup

```bash
# Create databases
docker-compose exec backend bundle exec rails db:create

# Run migrations
docker-compose exec backend bundle exec rails db:migrate

# Rollback migration
docker-compose exec backend bundle exec rails db:rollback

# Reset database (drop, create, migrate, seed)
docker-compose exec backend bundle exec rails db:reset
```

---

## Entrypoint Script (Recommended)

Create `docker-entrypoint.sh` for initialization tasks:

```bash
#!/bin/sh
set -e

# Wait for database to be ready
until pg_isready -h postgres -U r3nd; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Create database if it doesn't exist
bundle exec rails db:create 2>/dev/null || true

# Run migrations
bundle exec rails db:migrate

# Start application
exec bundle exec rails server -b 0.0.0.0
```

Update Dockerfile:
```dockerfile
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
```

---

## Solid Queue Configuration

Rails 8.1 uses Solid Queue for background jobs. To run in Docker:

### Option 1: Separate Service (Recommended for Production)

```yaml
  solid_queue:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    container_name: r3nd-solid-queue
    depends_on:
      - postgres
      - backend
    environment:
      RAILS_ENV: production
      DATABASE_URL: postgresql://r3nd:r3nd_password@postgres:5432/r3nd_production
      RAILS_MASTER_KEY: ${RAILS_MASTER_KEY}
    networks:
      - app-net
    command: bundle exec rake solid_queue:start
```

### Option 2: Same Process (Development)

Solid Queue runs in the same process as the Rails server (configured in `config/application.rb`).

---

## Smoke Tests

### Backend Health Check

```bash
# Test backend is running
curl http://localhost:3000/api/v1/greetings

# Expected response: HTTP 200 with JSON
{
  "greeting": "Hello from Rails API!",
  "fact": { ... }
}
```

### Database Connection Test

```bash
# Access PostgreSQL from container
docker exec -it r3nd-postgres psql -U r3nd -d r3nd_production

# In psql
\dt                    # List tables
SELECT * FROM facts LIMIT 1;
```

### Rails Console Test

```bash
# Access Rails console
docker-compose exec backend bundle exec rails console

# In console
Fact.count            # Count facts
FactsService.random   # Get random fact
```

---

## Common Issues & Solutions

### Issue: Bundle install fails in Docker

**Cause**: Native gem compilation requires build tools.

**Solution**: Ensure build dependencies are installed:
```dockerfile
RUN apk add --no-cache build-base postgresql-dev
```

### Issue: Backend can't connect to PostgreSQL

**Symptom**: `PG::ConnectionBad: could not connect to server`

**Causes & Solutions**:
1. **Wrong connection string**: Use `postgres` (service name), not `localhost`
2. **PostgreSQL not ready**: Use `depends_on` with health check
3. **Wrong credentials**: Verify `POSTGRES_USER`, `POSTGRES_PASSWORD` match `DATABASE_URL`

### Issue: Migrations fail

**Symptom**: `ActiveRecord::NoDatabaseError: database "r3nd_production" does not exist`

**Solution**: Run `db:create` before `db:migrate`:
```bash
docker-compose exec backend bundle exec rails db:create
docker-compose exec backend bundle exec rails db:migrate
```

### Issue: Missing SECRET_KEY_BASE

**Symptom**: `ArgumentError: Missing 'secret_key_base' for 'production' environment`

**Solution**: Generate and set secret:
```bash
# Generate secret
docker-compose exec backend bundle exec rails secret

# Add to docker-compose.yml or .env
SECRET_KEY_BASE=<generated_secret>
```

### Issue: CORS errors from frontend

**Cause**: CORS not configured or wrong origin.

**Solution**: Configure in `config/initializers/cors.rb`:
```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'  # Or specific frontend URL
    resource '*', headers: :any, methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

---

## .dockerignore

```
.git
.gitignore
log/*
tmp/*
vendor/bundle
public/assets
public/packs
node_modules
coverage
.byebug_history
.env*
*.log
.DS_Store
.vscode
.idea
spec/examples.txt
```

**Purpose**: Reduce build context size, prevent copying unnecessary files.

---

## Security Best Practices

1. **Don't run as root**: Create and use non-root user (see Dockerfile example)
2. **Use .dockerignore**: Prevent secrets from being copied
3. **Multi-stage builds**: Minimize attack surface in runtime image
4. **Pin versions**: Use specific image tags, not `latest`
5. **Secrets management**: Use Rails credentials or environment variables
6. **Database passwords**: Use strong passwords, never commit them

---

## Performance Optimization

1. **Layer caching**: Copy `Gemfile` before source code
2. **Bundle deployment mode**: Use `bundle config set --local deployment 'true'`
3. **Parallel bundle install**: Use `--jobs 4` flag
4. **Alpine Linux**: Smaller image size (~100MB vs ~500MB)
5. **Remove cache**: Delete `vendor/bundle/ruby/*/cache` after install
6. **Precompile assets**: For API mode, usually not needed

---

## Example Complete Dockerfile

```dockerfile
# Builder stage
FROM ruby:3.3-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    tzdata

WORKDIR /app

# Install gems
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local deployment 'true' && \
    bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3

# Copy application
COPY . .

# Clean up
RUN rm -rf tmp/cache vendor/bundle/ruby/*/cache

# Runtime stage
FROM ruby:3.3-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    postgresql-client \
    tzdata

WORKDIR /app

# Copy gems and app
COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY --from=builder /app /app

# Create non-root user
RUN addgroup -g 1000 rails && \
    adduser -D -u 1000 -G rails rails && \
    chown -R rails:rails /app

USER rails

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Entrypoint for database setup
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
```

---

## Integration with Frontend

The frontend needs to know the backend API URL. In Docker Compose:

```yaml
frontend:
  # ...
  environment:
    VITE_API_BASE_URL: http://localhost:3000/api/v1  # For browser access from host
```

**Critical**: Use `localhost` (not `backend` service name) because the browser makes requests from the host machine.

---

## CI/CD Considerations

```bash
# Build without cache in CI
docker-compose build --no-cache

# Run database setup
docker-compose run --rm backend bundle exec rails db:create db:migrate

# Run tests
docker-compose run --rm backend bundle exec rspec

# Run smoke tests
docker-compose up -d
sleep 15  # Wait for services to start
curl -f http://localhost:3000/api/v1/greetings || exit 1

# Cleanup
docker-compose down -v
```

---

## Reference

- Rails Docker guide: https://guides.rubyonrails.org/docker.html
- PostgreSQL Docker image: https://hub.docker.com/_/postgres
- Ruby Docker best practices: https://lipanski.com/posts/dockerfile-ruby-best-practices
- Solid Queue: https://github.com/rails/solid_queue
```

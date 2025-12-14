# Build Plan: scaffold-backend — Complete (features, tests & Docker DB)

> **Scope:** Implement facts ingestion and greetings endpoints, add tests, and run with a Dockerized PostgreSQL for integration and CI parity.
> **Source:** Derived from original scaffold-backend build plan
> **Created:** 2025-12-14
> **Status:** In Progress

---

## 0. Pre-Implementation Checklist

- [ ] Read `.github/instructions/backend.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Confirm DB will be provided via Docker (PostgreSQL)
- [ ] List integration points with bootstrap plan: routes and initializers will be extended

### New Dependencies (for this phase)

| Gem | Purpose |
|---|---|
| `pg` | PostgreSQL adapter |
| `solid_queue` | Background job processing |
| `faraday` | HTTP client |
| Dev/Test: `rspec-rails`, `factory_bot_rails`, `faker`, `shoulda-matchers`, `database_cleaner-active_record`, `webmock` | Testing infrastructure |

---

## 1. Implementation Overview

**Approach:** Add a `Fact` model (Active Record), `FactsService` (business logic), and `Api::V1::GreetingsController`. Add RSpec tests for models, services, and controllers. Use Docker to run PostgreSQL during local runs and CI.

**Goal:** App compiles, tests pass, and the app can run against a real PostgreSQL started with Docker (instructions included). `GET /api/greetings` returns a greeting with a fact pulled from DB.

**Acceptance Criteria (Complete):**
- All RSpec tests pass (`rails spec`) ✅
- App can connect to Dockerized PostgreSQL and executes ingestion job ✅
- `GET /api/greetings` returns a greeting containing a Fact object ✅

---

## 2. Tasks

### Task 1: Add dependencies
- Use `bundle add` to install:
```bash
bundle add pg solid_queue faraday
bundle add rspec-rails factory_bot_rails faker --group development,test
bundle add shoulda-matchers database_cleaner-active_record webmock --group test
```

- Run `rails generate rspec:install` to set up RSpec.
- Run `rails solid_queue:install` to set up Solid Queue.

### Task 2: Configure database
- Update `config/database.yml` with PostgreSQL settings (default: `r3nd_development`, `r3nd_test`, `r3nd_production`).
- Run `rails db:create` and `rails db:migrate` once PostgreSQL is available.

### Task 3: Facts model & migration
- `rails generate model Fact external_id:string:uniq text:text source:string source_url:string language:string:index permalink:string`
- Add validations to `app/models/fact.rb`:
```ruby
validates :external_id, presence: true, uniqueness: true
validates :text, :source, :source_url, :language, :permalink, presence: true
```

### Task 4: Facts service
- `app/services/facts_service.rb` — `self.ingest_batch(size)` and `self.random` with upsert by `external_id` and `order('RANDOM()').first` usage.

### Task 5: Background job
- `rails generate job FactsIngestor` — scheduled job: hourly ingestion using Solid Queue recurring tasks.

### Task 6: Greetings controller
- `rails generate controller Api::V1::Greetings index --skip-routes`
- Implement `index` action to return greeting + fact.

### Task 7: Tests
- `spec/models/fact_spec.rb` — validations and uniqueness tests.
- `spec/services/facts_service_spec.rb` — mocks for Faraday; test ingest & random behavior.
- `spec/requests/api/v1/greetings_spec.rb` — mock `FactsService` and test controller.

### Task 8: Docker DB & integration
- Add a minimal `docker-compose.backend.yaml` or provide `docker run` instructions to start PostgreSQL for local dev.
- Example run command:
```bash
docker run -d --name r3nd-postgres -p 5432:5432 \
  -e POSTGRES_DB=r3nd_development \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16
```

### Task 9: Validate CI & local runs
- `rails db:migrate` should succeed.
- `rails spec` should pass locally (use mocked Faraday where appropriate).
- Start the app while Dockerized PostgreSQL is up and confirm `/api/greetings` returns a greeting with a persisted or sampled fact.

---

## 3. Files to Add (Complete)

| File Path | Action |
|---|---|
| `src/backend/app/models/fact.rb` | create |
| `src/backend/db/migrate/XXXXXX_create_facts.rb` | create |
| `src/backend/app/services/facts_service.rb` | create |
| `src/backend/app/jobs/facts_ingestor_job.rb` | create |
| `src/backend/app/controllers/api/v1/greetings_controller.rb` | create |
| `src/backend/spec/models/fact_spec.rb` | create |
| `src/backend/spec/services/facts_service_spec.rb` | create |
| `src/backend/spec/requests/api/v1/greetings_spec.rb` | create |
| `src/backend/spec/factories/facts.rb` | create |

---

## 4. Test Strategy

- Unit tests for domain logic (facts ingestion and retrieval) using RSpec and mocking Faraday.
- Request tests for endpoints using RSpec request specs.
- Integration check: run app against Dockerized PostgreSQL and run a small smoke test for `GET /api/greetings`.

---

## 5. Definition of Done (Complete)

- [ ] All dependencies installed via `bundle add` ✅
- [ ] RSpec and Solid Queue configured ✅
- [ ] PostgreSQL accessible via Docker ✅
- [ ] Migrations applied and models have validations ✅
- [ ] `rails spec` passes all tests ✅
- [ ] `rails server` starts without errors ✅
- [ ] `GET /api/greetings` returns greeting + fact ✅

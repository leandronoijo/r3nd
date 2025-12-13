# Build Plan: scaffold-backend

> **Source:** Internal scaffold requirements  
> **Created:** 2025-12-13  
> **Status:** In Progress | Complete

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [ ] Read `.github/instructions/backend.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Identify golden reference modules:
  - Backend: `src/backend/app/models/example.rb`, `src/backend/app/controllers/api/v1/examples_controller.rb`
- [ ] Confirm no new dependencies needed (or justify additions below)
- [ ] List integration points with existing modules (see Section 1)
- [ ] Review tech spec for any open questions

### New Dependencies (if any)

| Gem | Purpose | Justification |
|-----|---------|---------------|
| rails | Rails framework | Required for Rails app (v8.1.1) |
| pg | PostgreSQL adapter | Required for database |
| puma | Application server | Required for HTTP server |
| solid_queue | Job processing | Required for scheduled tasks (Rails 8+ default) |
| rspec-rails | Test framework | Per testing instructions |
| factory_bot_rails | Test fixtures | Per testing instructions |
| faker | Test data generation | Per testing instructions |
| shoulda-matchers | RSpec matchers | Per testing instructions |
| database_cleaner-active_record | Test DB cleanup | Per testing instructions |
| webmock | HTTP mocking | Per testing instructions |
| rack-cors | CORS handling | Required for API access |
| faraday | HTTP client | For external API calls |

---

## 1. Implementation Overview

**Approach:** Bootstrap a minimal Rails 8.1.1 API-only backend with PostgreSQL, a Facts model for hourly ingestion of random facts via Solid Queue, and a greetings endpoint returning a greeting with a random fact.

**Key Decisions:**
- Use Rails API-only mode (`rails new --api`).
- Use Active Record with PostgreSQL for persistence.
- Use Solid Queue for background jobs (native Rails 8+ solution).
- Facts stored in PostgreSQL with uniqueness constraint on external ID.
- Use Faraday for external HTTP calls.

**Integration Points:**
| Existing Module | Integration Type | Notes |
|-----------------|------------------|-------|
| None | — | Fresh scaffold |

---

## 2. Task Breakdown

### Phase 1: App Skeleton

#### Task 0: Bootstrap Rails application

- [ ] **Create Rails API app and install dependencies**
- **File(s):** `src/backend/` (entire directory)
- **Action:** create
- **Dependencies:** None
- **Details:**
  - **Prefer CLI**: Use `rails new backend --api --database=postgresql --skip-test --skip-bundle` to create initial Rails API app.
  - This creates the basic Rails directory structure in `src/backend/`.
  - Navigate to `src/backend/` and run `bundle install` to install dependencies.
  - **Why CLI**: Ensures proper Rails structure, default configuration, and follows Rails conventions.
- **Acceptance Criteria:**
  - Rails app structure created under `src/backend/`.
  - `Gemfile` and `Gemfile.lock` exist.
  - Directory structure follows Rails conventions.
- **Effort:** small

#### Task 0.5: Configure additional gems

- [ ] **Add required gems to Gemfile**
- **File(s):** `src/backend/Gemfile`
- **Action:** edit
- **Dependencies:** Task 0
- **Details:**
  - Add to Gemfile:
    ```ruby
    # Background jobs
    gem 'solid_queue'
    
    # CORS
    gem 'rack-cors'
    
    # HTTP client
    gem 'faraday'
    
    group :development, :test do
      gem 'rspec-rails', '~> 6.0'
      gem 'factory_bot_rails'
      gem 'faker'
      gem 'debug'
    end
    
    group :test do
      gem 'shoulda-matchers', '~> 5.0'
      gem 'database_cleaner-active_record'
      gem 'webmock'
    end
    ```
  - Run `bundle install` to install new gems.
  - Run `rails generate rspec:install` to set up RSpec.
  - Run `rails solid_queue:install` to set up Solid Queue.
- **Acceptance Criteria:**
  - All gems installed successfully.
  - RSpec configured with `spec/` directory.
  - Solid Queue migrations and initializer created.
- **Effort:** small

#### Task 0.6: Configure database and CORS

- [ ] **Set up database configuration and CORS**
- **File(s):** `src/backend/config/database.yml`, `src/backend/config/initializers/cors.rb`
- **Action:** edit
- **Dependencies:** Task 0.5
- **Details:**
  - Update `config/database.yml`:
    - Default database name: `r3nd_development`, `r3nd_test`, `r3nd_production`.
    - Use environment variable `DATABASE_URL` if present.
  - Uncomment and configure `config/initializers/cors.rb`:
    ```ruby
    Rails.application.config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins '*'
        resource '*', headers: :any, methods: [:get, :post, :put, :patch, :delete, :options, :head]
      end
    end
    ```
  - Run `rails db:create` and `rails db:migrate` to create databases.
- **Acceptance Criteria:**
  - Databases created successfully.
  - CORS enabled for all origins.
  - App can connect to PostgreSQL.
- **Effort:** small

#### Task 1: Configure routes and API versioning

- [ ] **Set up API routes structure**
- **File(s):** `src/backend/config/routes.rb`
- **Action:** edit
- **Dependencies:** Task 0
- **Details:**
  - Configure routes with `/api/v1` namespace:
    ```ruby
    Rails.application.routes.draw do
      namespace :api do
        namespace :v1 do
          resources :greetings, only: [:index]
        end
      end
    end
    ```
- **Acceptance Criteria:**
  - Routes namespaced under `/api/v1`.
  - Ready for controller implementation.
- **Effort:** small

#### Task 2: Configure RSpec and test helpers

- [ ] **Set up RSpec configuration**
- **File(s):** `src/backend/spec/rails_helper.rb`, `src/backend/spec/support/factory_bot.rb`, `src/backend/spec/support/database_cleaner.rb`, `src/backend/spec/support/shoulda_matchers.rb`, `src/backend/spec/support/webmock.rb`
- **Action:** create/edit
- **Dependencies:** Task 0.5
- **Details:**
  - Configure FactoryBot in `spec/support/factory_bot.rb`:
    ```ruby
    RSpec.configure do |config|
      config.include FactoryBot::Syntax::Methods
    end
    ```
  - Configure DatabaseCleaner in `spec/support/database_cleaner.rb`.
  - Configure ShouldaMatchers in `spec/support/shoulda_matchers.rb`.
  - Configure WebMock in `spec/support/webmock.rb` to allow localhost, disable net connections.
  - Uncomment `Dir[Rails.root.join('spec/support/**/*.rb')].sort.each { |f| require f }` in `spec/rails_helper.rb`.
- **Acceptance Criteria:**
  - RSpec configured with all test helpers.
  - `rails spec` runs successfully.
- **Effort:** small

### Phase 2: Facts Model and Service

#### Task 3: Create Fact model and migration

- [ ] **Define Active Record model for facts**
- **File(s):** `src/backend/app/models/fact.rb`, `src/backend/db/migrate/XXXXXX_create_facts.rb`
- **Action:** create
- **Dependencies:** Task 0.6
- **Golden Reference:** `src/backend/app/models/example.rb`
- **Details:**
  - Use Rails generator: `rails generate model Fact external_id:string:uniq text:text source:string source_url:string language:string:index permalink:string`.
  - Migration fields:
    - `external_id: string` — required, unique index.
    - `text: text` — required.
    - `source: string` — required.
    - `source_url: string` — required.
    - `language: string` — required, index.
    - `permalink: string` — required.
    - `timestamps` — automatic created_at/updated_at.
  - Add validations to model:
    ```ruby
    validates :external_id, presence: true, uniqueness: true
    validates :text, :source, :source_url, :language, :permalink, presence: true
    ```
  - Run `rails db:migrate` to apply migration.
- **Acceptance Criteria:**
  - Migration created and applied.
  - Model has validations.
  - Unique index on `external_id`.
  - Regular index on `language`.
- **Effort:** small

#### Task 4: Create Facts service object

- [ ] **Implement facts business logic**
- **File(s):** `src/backend/app/services/facts_service.rb`
- **Action:** create
- **Dependencies:** Task 3
- **Golden Reference:** `src/backend/app/services/example_service.rb`
- **Details:**
  - Create service class with methods:
    - `self.ingest_batch(size = 5)` — Fetch facts from API, upsert by `external_id`, return new inserts count.
    - `self.random` — Use `Fact.order('RANDOM()').first` to get random fact; if none, call `ingest_batch` once and retry; raise `ActiveRecord::RecordNotFound` if still empty.
  - Use Faraday for `https://uselessfacts.jsph.pl/api/v2/facts/random`.
  - Map API response to Fact attributes:
    ```ruby
    {
      external_id: response['id'],
      text: response['text'],
      source: response['source'],
      source_url: response['source_url'],
      language: response['language'],
      permalink: response['permalink']
    }
    ```
  - Use `find_or_create_by(external_id: ...)` for upsert logic.
- **Acceptance Criteria:**
  - Service handles ingestion and retrieval.
  - De-duplicates facts via unique constraint.
  - Raises appropriate exceptions.
- **Effort:** medium

#### Task 5: Create Solid Queue job for ingestion

- [ ] **Add hourly ingestion job**
- **File(s):** `src/backend/app/jobs/facts_ingestor_job.rb`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Create job: `rails generate job FactsIngestor`.
  - Implement `perform` method:
    ```ruby
    def perform
      count = FactsService.ingest_batch(5)
      Rails.logger.info "Ingested #{count} new facts"
    end
    ```
  - Schedule in `config/initializers/solid_queue.rb` or use recurring task configuration:
    ```ruby
    # Add to Solid Queue recurring tasks
    config.recurring_tasks = [
      { class_name: 'FactsIngestorJob', schedule: 'every hour' }
    ]
    ```
  - Alternatively, use `rails runner` with cron or native Solid Queue recurring tasks.
- **Acceptance Criteria:**
  - Job runs hourly via Solid Queue.
  - Logs insertion count.
  - Can be triggered manually with `FactsIngestorJob.perform_later`.
- **Effort:** small

#### Task 6: Create Fact model tests

- [ ] **Unit tests for Fact model**
- **File(s):** `src/backend/spec/models/fact_spec.rb`, `src/backend/spec/factories/facts.rb`
- **Action:** create
- **Dependencies:** Task 3
- **Details:**
  - Create factory with Faker data.
  - Test validations: presence, uniqueness of `external_id`.
  - Test that duplicate `external_id` raises error.
- **Acceptance Criteria:**
  - All model validations tested.
  - Factory creates valid facts.
- **Effort:** small

#### Task 7: Create Facts service tests

- [ ] **Unit tests for facts service**
- **File(s):** `src/backend/spec/services/facts_service_spec.rb`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Mock Faraday HTTP calls with WebMock.
  - Test `ingest_batch` inserts new facts, skips duplicates.
  - Test `random` returns fact, warms up if empty, raises if still empty after warmup.
- **Acceptance Criteria:**
  - All methods tested for success/error paths.
  - No real network calls.
- **Effort:** medium

### Phase 3: Greetings Controller

#### Task 8: Create Greetings controller

- [ ] **Implement greetings endpoint**
- **File(s):** `src/backend/app/controllers/api/v1/greetings_controller.rb`
- **Action:** create
- **Dependencies:** Task 4
- **Golden Reference:** `src/backend/app/controllers/api/v1/examples_controller.rb`
- **Details:**
  - Create controller: `rails generate controller Api::V1::Greetings index --skip-routes`.
  - Implement `index` action:
    ```ruby
    def index
      fact = FactsService.random
      render json: {
        greeting: "Hello from Rails API!",
        fact: {
          text: fact.text,
          language: fact.language,
          source: fact.source,
          permalink: fact.permalink
        }
      }
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'No facts available' }, status: :service_unavailable
    end
    ```
- **Acceptance Criteria:**
  - Endpoint at `/api/v1/greetings` returns greeting and fact.
  - Returns 503 if no facts available.
- **Effort:** small

#### Task 9: Create Greetings controller tests

- [ ] **Request tests for greetings controller**
- **File(s):** `src/backend/spec/requests/api/v1/greetings_spec.rb`
- **Action:** create
- **Dependencies:** Task 8
- **Details:**
  - Test `GET /api/v1/greetings` returns 200 with greeting and fact when facts exist.
  - Test returns 503 when no facts available.
  - Mock `FactsService.random` to return fixture or raise exception.
- **Acceptance Criteria:**
  - Controller tested for success and error scenarios.
- **Effort:** small

### Phase 4: Integration and Validation

#### Task 10: Validate application startup and endpoints

- [ ] **Ensure Rails app runs correctly**
- **File(s):** N/A
- **Action:** run commands
- **Dependencies:** All previous tasks
- **Details:**
  - Run `rails db:migrate` to ensure all migrations applied.
  - Run `rails spec` to ensure all tests pass.
  - Start server with `rails server` and verify:
    - App starts without errors.
    - `/api/v1/greetings` endpoint responds.
  - Manually trigger job: `FactsIngestorJob.perform_now` and verify facts inserted.
- **Acceptance Criteria:**
  - `rails db:migrate` completes successfully.
  - `rails spec` passes all tests.
  - `rails server` starts without errors.
  - Endpoint returns expected JSON.
  - Background job executes successfully.
- **Effort:** small

---

## 3. File/Module-level Changes

| File Path | Action | Rationale | Golden Reference |
|-----------|--------|-----------|------------------|
| `src/backend/` | create | Rails app structure | — |
| `src/backend/Gemfile` | create | Gem dependencies | — |
| `src/backend/config/database.yml` | edit | PostgreSQL config | — |
| `src/backend/config/initializers/cors.rb` | edit | CORS setup | — |
| `src/backend/config/routes.rb` | edit | API routes | — |
| `src/backend/app/models/fact.rb` | create | Fact data model | `app/models/example.rb` |
| `src/backend/db/migrate/XXXXXX_create_facts.rb` | create | Facts table | — |
| `src/backend/app/services/facts_service.rb` | create | Facts business logic | `app/services/example_service.rb` |
| `src/backend/app/jobs/facts_ingestor_job.rb` | create | Hourly ingestion job | — |
| `src/backend/app/controllers/api/v1/greetings_controller.rb` | create | Greetings endpoint | `app/controllers/api/v1/examples_controller.rb` |
| `src/backend/spec/models/fact_spec.rb` | create | Fact model tests | — |
| `src/backend/spec/services/facts_service_spec.rb` | create | Facts service tests | — |
| `src/backend/spec/requests/api/v1/greetings_spec.rb` | create | Greetings controller tests | — |
| `src/backend/spec/factories/facts.rb` | create | Test fixtures | — |

---

## 4. Schema & DTO Changes

### Database Schema Changes

| Field | Type | Required | Indexed | Notes |
|-------|------|----------|---------|-------|
| `external_id` | `string` | Yes | Unique | API `id` |
| `text` | `text` | Yes | No | Fact text |
| `source` | `string` | Yes | No | Fact source |
| `source_url` | `string` | Yes | No | Source URL |
| `language` | `string` | Yes | Index | Language code |
| `permalink` | `string` | Yes | No | Fact permalink |
| `created_at` | `datetime` | Yes (auto) | No | Creation timestamp |
| `updated_at` | `datetime` | Yes (auto) | No | Update timestamp |

### Strong Parameters

Controllers use Rails strong parameters for input validation (not needed for this scaffold as there's no input).

---

## 5. Test Strategy

### Unit Tests

| Test File | What to Test | Mocks Needed | Coverage Target |
|-----------|--------------|--------------|-----------------|
| `spec/models/fact_spec.rb` | Validations, uniqueness | None | All validations |
| `spec/services/facts_service_spec.rb` | `ingest_batch` inserts/de-duplicates | Faraday/WebMock | Success/error |
| `spec/services/facts_service_spec.rb` | `random` returns fact or warms up | None | Success/error |
| `spec/requests/api/v1/greetings_spec.rb` | `GET /api/v1/greetings` returns greeting + fact | `FactsService` | Success/error |

---

## 6. Deployment & Rollout

### Feature Flags

None.

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | No | `postgresql://localhost/r3nd_development` | DB connection |
| `RAILS_ENV` | No | `development` | Environment |
| `PORT` | No | `3000` | Server port |

### Migration Plan

Fresh schema, run `rails db:migrate` on deployment.

---

## 7. AI-Agent Guardrails

Follow `.github/instructions/backend.instructions.md` and `.github/instructions/testing.instructions.md`.

**Rails-specific rules:**
- Always use Rails generators for scaffolding.
- Use service objects for business logic (not in controllers or models).
- Use Active Record validations and callbacks appropriately.
- Use Solid Queue for background jobs.
- Use RSpec for testing with FactoryBot fixtures.
- Follow Rails API-only conventions.

---

## 8. Definition of Done

- [ ] All tasks in Section 2 marked complete
- [ ] `rails db:migrate` completes without errors
- [ ] `rails spec` passes all tests
- [ ] `rails server` starts without errors
- [ ] App connects to PostgreSQL
- [ ] Solid Queue job ingests facts hourly
- [ ] `GET /api/v1/greetings` returns greeting + fact
- [ ] All code follows Rails conventions
- [ ] No n+1 queries, no SQL injection risks
- [ ] All models have validations

---

## Implementation Notes (Added by Developer)

- Golden reference modules (`app/models/example.rb`, etc.) may not exist in repository; using Rails conventions and backend/testing instructions for patterns.
- Rails 8.1.1 uses Solid Queue as default job processor (replacing Sidekiq/DelayedJob).
- PostgreSQL required for production-grade reliability and advanced querying.
- API-only mode removes view layer overhead.
- CORS configured for frontend integration.

---

## Notes

This is a scaffold build plan for the developer agent to bootstrap the Rails API backend with PostgreSQL and Solid Queue.

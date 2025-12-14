# Build Plan: scaffold-backend — Bootstrap

> **Scope:** Bootstrap Rails API app so it compiles and runs locally (no DB required)
> **Source:** Derived from original scaffold-backend build plan
> **Created:** 2025-12-14
> **Status:** In Progress

---

## 0. Pre-Implementation Checklist

- [ ] Read `.github/instructions/backend.instructions.md`
- [ ] Read `.github/instructions/testing.instructions.md`
- [ ] Identify golden reference modules (if present)
- [ ] Confirm minimal dependencies needed for a working bootstrap
- [ ] Ensure local tooling: Ruby >= 3.2 and `bundle` available

### Minimal Dependencies & Tooling

This plan **prefers** using CLI tooling rather than hand-editing project manifests:

- Use the Rails CLI via `rails new` to scaffold the project in `src/backend` (preferred).
- Use the `bundle` CLI to install additional dependencies (`bundle add ...`).
- Typical gems: `rails`, `puma`, `rack-cors` (these are usually added by the Rails CLI).
- Typical dev gems: `rspec-rails` (added manually).

No database is required for this bootstrap plan (SQLite can be used as placeholder).

---

## 1. Implementation Overview

**Approach:** Create a minimal Rails API-only application that runs with `rails server`.

**Goal:** Developer can run `rails server` and see the app start, respond on a health endpoint, and exit cleanly.

**Acceptance Criteria (Bootstrap):**
- `Gemfile` exists with basic dependencies
- App boots without requiring a DB connection
- `GET /api/health` returns 200

---

## 2. Tasks

### Task A: Project skeleton & deps
- Prefer using the Rails CLI to create the project and install base dependencies. Example (preferred):

```bash
# From repo root (preferred) — Rails will create `src/backend`
rails new src/backend --api --skip-test --minimal

# OR if you want to specify directory:
mkdir -p src && cd src && rails new backend --api --skip-test --minimal
```

If for any reason you cannot use the Rails CLI, use the `bundle` CLI to init and install gems (manual fallback):

```bash
mkdir -p src/backend && cd src/backend
bundle init
bundle add rails puma rack-cors
```

After using the Rails CLI (or manual setup), **use `bundle` to add further gems** instead of hand-editing `Gemfile`:

```bash
# add RSpec for testing
bundle add rspec-rails --group development,test
```

### Task B: Configure CORS
- Uncomment and configure `config/initializers/cors.rb`:
```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'
    resource '*', headers: :any, methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

### Task C: Add health endpoint
- Add to `config/routes.rb`:
```ruby
Rails.application.routes.draw do
  namespace :api, defaults: { format: :json } do
    get '/health', to: proc { [200, {}, ['OK']] }
  end
end
```

### Task D: Validate build and run
- Run `rails server` to ensure app starts. From repo root you can run:

```bash
cd src/backend && rails server
```

- Confirm `GET /api/health` returns 200:

```bash
curl http://localhost:3000/api/health
```

---

## 3. Files to Add (Bootstrap)

| File Path | Action |
|---|---|
| `src/backend/Gemfile` | created by CLI |
| `src/backend/config/routes.rb` | modify |
| `src/backend/config/initializers/cors.rb` | modify |

---

## 4. Notes

- Prefer the CLI-generated project layout and dependencies rather than hand-adding gems to speed dev and keep locking consistent.
- Keep the app minimal in this plan; database integration and business logic is part of the complete plan.

---

## 5. Definition of Done (Bootstrap)

- [ ] Rails CLI scaffolded project in `src/backend` and `rails server` starts successfully ✅
- [ ] `GET /api/health` returns 200 ✅
- [ ] App starts without database connection errors ✅

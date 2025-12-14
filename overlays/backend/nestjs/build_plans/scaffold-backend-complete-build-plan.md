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
- [ ] List integration points with bootstrap plan: `AppModule` will import new modules

### New Dependencies (for this phase)

| Package | Purpose |
|---|---|
| `@nestjs/mongoose`, `mongoose` | MongoDB ODM |
| `@nestjs/config` | Environment config |
| `@nestjs/schedule` | Scheduled ingestion job |
| `class-validator`, `class-transformer` | Validation of incoming requests (if needed) |
| Dev: `jest`, `ts-jest`, `@nestjs/testing`, `supertest` | Testing infrastructure |

---

## 1. Implementation Overview

**Approach:** Add a `FactsModule` (schema, service, ingestor) and `GreetingsModule` (service, controller). Add unit tests for `FactsService` and controller tests for greetings. Use Docker to run MongoDB during local runs and CI.

**Goal:** App compiles, unit tests pass, and the app can run against a real MongoDB started with Docker (instructions included). `GET /api/greetings` returns a greeting with a fact pulled from DB.

**Acceptance Criteria (Complete):**
- All unit tests pass (`npm run test`) ✅
- App can connect to Dockerized MongoDB and executes ingestion job ✅
- `GET /api/greetings` returns a greeting containing a Fact object ✅

---

## 2. Tasks

### Task 1: Facts schema & service
- `src/backend/modules/facts/schemas/fact.schema.ts` — Mongoose schema with fields `externalId`, `text`, `source`, `sourceUrl`, `language`, `permalink`, `createdAt` and indexes.
- `src/backend/modules/facts/facts.service.ts` — `ingestBatch(size)` and `getRandom()` with upsert by `externalId` and `$sample` usage.

### Task 2: Ingestor
- `src/backend/modules/facts/facts.ingestor.ts` — scheduled job: hourly ingestion using `@Cron` if `@nestjs/schedule` is present.

### Task 3: Facts Module wiring
- `src/backend/modules/facts/facts.module.ts` — register schema (MongooseModule.forFeature), providers, export service.

### Task 4: Greetings module
- `src/backend/modules/greetings/greetings.service.ts` — `hello()` returns greeting + fact shape.
- `src/backend/modules/greetings/greetings.controller.ts` — expose `GET /greetings`.

### Task 5: Tests
- `src/backend/modules/facts/facts.service.spec.ts` — mocks for Model and fetch; test ingest & getRandom behavior.
- `src/backend/modules/greetings/greetings.controller.spec.ts` — mock `GreetingsService` and test controller.

### Task 6: Docker DB & integration
- Add a minimal `docker-compose.backend.yaml` or provide `docker run` instructions to start MongoDB for local dev.
- Example run command:
```
docker run -d --name r3nd-mongo -p 27017:27017 -e MONGO_INITDB_DATABASE=r3nd mongo:6.0
```
- Update `AppModule` to use `MONGODB_URI` (default `mongodb://localhost:27017/r3nd`) and document how to run the database via Docker.

### Task 7: Validate CI & local runs
- `npm run build` should succeed.
- `npm run test` should pass locally (use mocked Model where appropriate).
- Start the app while Dockerized MongoDB is up and confirm `/api/greetings` returns a greeting with a persisted or sampled fact.

---

## 3. Files to Add (Complete)

| File Path | Action |
|---|---|
| `src/backend/modules/facts/schemas/fact.schema.ts` | create |
| `src/backend/modules/facts/facts.service.ts` | create |
| `src/backend/modules/facts/facts.ingestor.ts` | create |
| `src/backend/modules/facts/facts.module.ts` | create |
| `src/backend/modules/facts/facts.service.spec.ts` | create |
| `src/backend/modules/greetings/greetings.service.ts` | create |
| `src/backend/modules/greetings/greetings.controller.ts` | create |
| `src/backend/modules/greetings/greetings.module.ts` | create |
| `src/backend/modules/greetings/greetings.controller.spec.ts` | create |
| `docker-compose.backend.yaml` (optional) | create/advise |

---

## 4. Test Strategy

- Unit tests for domain logic (facts ingestion and retrieval) using `@nestjs/testing` and mocking the `Model` and `fetch`.
- Controller tests for endpoints using `supertest` where appropriate.
- Integration check: run app against Dockerized MongoDB and run a small smoke test for `GET /api/greetings`.

---

## 5. Environment & Run Instructions (Dev)

1. Start MongoDB via Docker:

```bash
docker run -d --name r3nd-mongo -p 27017:27017 -e MONGO_INITDB_DATABASE=r3nd mongo:6.0
```

2. Start the app (dev):

```bash
export MONGODB_URI="mongodb://localhost:27017/r3nd"
npm run start:dev --prefix src/backend
```

3. Run tests:

```bash
npm run test --prefix src/backend
```

---

## 6. Definition of Done (Complete)

- All files in Section 3 implemented and unit tests passing ✅
- `npm run build` and `npm run test` succeed ✅
- App connects to Dockerized MongoDB and `GET /api/greetings` returns a greeting with a fact ✅

---

## 7. Notes & Implementation Considerations

- Use Node built-in `fetch` (Node 18+) where available; otherwise document fallback.
- Keep ingestion idempotent by upserting on `externalId`.
- In CI, bring up a short-lived MongoDB container for integration testing, using the same Docker command or a small docker-compose file.


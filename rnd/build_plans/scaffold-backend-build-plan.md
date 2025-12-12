# Build Plan: scaffold-backend

> **Source:** Internal scaffold requirements  
> **Created:** 2025-12-12  
> **Status:** Draft | In Progress | Complete

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [x] Read `.github/instructions/backend.instructions.md`
- [x] Read `.github/instructions/testing.instructions.md`
- [x] Identify golden reference modules:
  - Backend: `src/backend/modules/example/`
- [x] Confirm no new dependencies needed (or justify additions below)
- [x] List integration points with existing modules (see Section 1)
- [x] Review tech spec for any open questions

### New Dependencies (if any)

| Package | Purpose | Justification |
|---------|---------|---------------|
| @nestjs/schedule | For hourly cron job | Required for scheduled facts ingestion |
| @nestjs/config | For environment config | Standard NestJS config management |

---

## 1. Implementation Overview

**Approach:** Bootstrap a minimal NestJS backend with Mongoose, a facts module for hourly ingestion of random facts, and a greetings endpoint returning a greeting with a random fact.

**Key Decisions:**
- Use `@nestjs/schedule` for cron jobs if available; fallback to interval if not.
- Use Node's global `fetch` for API calls (Node 18+).
- Facts stored in MongoDB with de-duplication by external ID.

**Integration Points:**
| Existing Module | Integration Type | Notes |
|-----------------|------------------|-------|
| None | — | Fresh scaffold |

---

## 2. Task Breakdown

### Phase 1: App Skeleton

#### Task 1: Create main.ts

- [x] **Create NestJS bootstrap file**
- **File(s):** `src/backend/main.ts`
- **Action:** create
- **Dependencies:** None
- **Details:**
  - Use `NestFactory.create(AppModule)`.
  - Enable CORS.
  - Set global prefix `/api`.
  - Use `ValidationPipe({ whitelist: true, transform: true })`.
  - Listen on `process.env.PORT || 3000`.
- **Acceptance Criteria:**
  - App boots without errors.
  - CORS enabled.
  - Routes prefixed with `/api`.
- **Effort:** small

#### Task 2: Create app.module.ts

- [x] **Create root module**
- **File(s):** `src/backend/app.module.ts`
- **Action:** create
- **Dependencies:** Task 1
- **Details:**
  - Import `ConfigModule.forRoot({ isGlobal: true })`.
  - Import `MongooseModule.forRootAsync` using `ConfigService` for `MONGODB_URI` (default `mongodb://localhost:27017/r3nd`).
  - Import `ScheduleModule.forRoot()` if `@nestjs/schedule` available.
  - Import `FactsModule` and `GreetingsModule`.
- **Acceptance Criteria:**
  - Modules imported correctly.
  - Config and DB connection configured.
- **Effort:** small

### Phase 2: Facts Module

#### Task 3: Create Fact Schema

- [x] **Define Mongoose schema for facts**
- **File(s):** `src/backend/modules/facts/schemas/fact.schema.ts`
- **Action:** create
- **Dependencies:** None
- **Golden Reference:** `src/backend/modules/example/schemas/example.schema.ts`
- **Details:**
  - Use `@Schema()` and `SchemaFactory.createForClass(Fact)`.
  - Fields:
    - `externalId: string` — required, unique index.
    - `text: string` — required.
    - `source: string` — required.
    - `sourceUrl: string` — required.
    - `language: string` — required, index.
    - `permalink: string` — required.
    - `createdAt: Date` — default `Date.now`.
- **Acceptance Criteria:**
  - Schema compiles.
  - All fields explicit types, no `any`.
  - Indexes on `externalId` and `language`.
- **Effort:** small

#### Task 4: Create Facts Service

- [x] **Implement facts business logic**
- **File(s):** `src/backend/modules/facts/facts.service.ts`
- **Action:** create
- **Dependencies:** Task 3
- **Golden Reference:** `src/backend/modules/example/example.service.ts`
- **Details:**
  - `@Injectable()`, inject `Model<Fact>`.
  - Methods:
    - `async ingestBatch(size = 5): Promise<number>` — Fetch facts from API, upsert by `externalId`, return new inserts count.
    - `async getRandom(): Promise<Fact>` — Use `$sample` to get random fact; if empty, call `ingestBatch()` once and retry; else throw `NotFoundException`.
  - Use global `fetch` for `https://uselessfacts.jsph.pl/api/v2/facts/random`.
  - Map API response to schema fields.
- **Acceptance Criteria:**
  - Service handles ingestion and retrieval.
  - De-duplicates facts.
  - Throws appropriate exceptions.
- **Effort:** medium

#### Task 5: Create Facts Ingestor (Cron)

- [x] **Add hourly ingestion job**
- **File(s):** `src/backend/modules/facts/facts.ingestor.ts`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - If `@nestjs/schedule`: `@Injectable()`, `@Cron(CronExpression.EVERY_HOUR)` method calling `factsService.ingestBatch(5)` and log count.
  - Else: Add interval in `app.module.ts` to call `factsService.ingestBatch(5)` hourly.
- **Acceptance Criteria:**
  - Job runs hourly.
  - Logs insertion count.
- **Effort:** small

#### Task 6: Create Facts Module

- [x] **Wire facts module**
- **File(s):** `src/backend/modules/facts/facts.module.ts`
- **Action:** create
- **Dependencies:** Task 3, Task 4, Task 5
- **Golden Reference:** `src/backend/modules/example/example.module.ts`
- **Details:**
  - Register `MongooseModule.forFeature([{ name: Fact.name, schema: FactSchema }])`.
  - Declare `FactsService` and `FactsIngestor` in providers.
  - Export `FactsService`.
- **Acceptance Criteria:**
  - Module registers schema and providers.
- **Effort:** small

#### Task 7: Create Facts Service Tests

- [x] **Unit tests for facts service**
- **File(s):** `src/backend/modules/facts/facts.service.spec.ts`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Use `@nestjs/testing`.
  - Mock `Model<Fact>` and `fetch`.
  - Test `ingestBatch()` inserts/de-duplicates.
  - Test `getRandom()` returns fact, warms up if empty, throws if still empty.
- **Acceptance Criteria:**
  - All methods tested for success/error paths.
  - No real network calls.
- **Effort:** medium

### Phase 3: Greetings Module

#### Task 8: Create Greetings Service

- [x] **Implement greetings logic**
- **File(s):** `src/backend/modules/greetings/greetings.service.ts`
- **Action:** create
- **Dependencies:** Task 6
- **Golden Reference:** `src/backend/modules/example/example.service.ts`
- **Details:**
  - `@Injectable()`, inject `FactsService`.
  - Method: `async hello(): Promise<{ greeting: string; fact: Pick<Fact, 'text'|'language'|'source'|'permalink'> }>` — Return static greeting and random fact.
- **Acceptance Criteria:**
  - Delegates to `FactsService`.
  - Returns correct shape.
- **Effort:** small

#### Task 9: Create Greetings Controller

- [x] **Expose hello endpoint**
- **File(s):** `src/backend/modules/greetings/greetings.controller.ts`
- **Action:** create
- **Dependencies:** Task 8
- **Golden Reference:** `src/backend/modules/example/example.controller.ts`
- **Details:**
  - `@Controller('greetings')`, `@Get()` method calling `greetingsService.hello()`.
- **Acceptance Criteria:**
  - Endpoint at `/api/greetings` returns greeting and fact.
- **Effort:** small

#### Task 10: Create Greetings Module

- [x] **Wire greetings module**
- **File(s):** `src/backend/modules/greetings/greetings.module.ts`
- **Action:** create
- **Dependencies:** Task 8, Task 9
- **Golden Reference:** `src/backend/modules/example/example.module.ts`
- **Details:**
  - Import `FactsModule`.
  - Declare `GreetingsService` and `GreetingsController`.
- **Acceptance Criteria:**
  - Module imports and declares correctly.
- **Effort:** small

#### Task 11: Create Greetings Controller Tests

- [x] **Unit tests for greetings controller**
- **File(s):** `src/backend/modules/greetings/greetings.controller.spec.ts`
- **Action:** create
- **Dependencies:** Task 9
- **Details:**
  - Use `@nestjs/testing`.
  - Mock `GreetingsService`.
  - Test `GET /greetings` delegates and returns response.
- **Acceptance Criteria:**
  - Controller tested.
- **Effort:** small

---

## 3. File/Module-level Changes

| File Path | Action | Rationale | Golden Reference |
|-----------|--------|-----------|------------------|
| `src/backend/main.ts` | create | App bootstrap | — |
| `src/backend/app.module.ts` | create | Root module | — |
| `src/backend/modules/facts/schemas/fact.schema.ts` | create | Fact data model | `modules/example/schemas/example.schema.ts` |
| `src/backend/modules/facts/facts.service.ts` | create | Facts logic | `modules/example/example.service.ts` |
| `src/backend/modules/facts/facts.ingestor.ts` | create | Hourly job | — |
| `src/backend/modules/facts/facts.module.ts` | create | Facts wiring | `modules/example/example.module.ts` |
| `src/backend/modules/facts/facts.service.spec.ts` | create | Facts tests | `modules/example/example.service.spec.ts` |
| `src/backend/modules/greetings/greetings.service.ts` | create | Greetings logic | `modules/example/example.service.ts` |
| `src/backend/modules/greetings/greetings.controller.ts` | create | Hello endpoint | `modules/example/example.controller.ts` |
| `src/backend/modules/greetings/greetings.module.ts` | create | Greetings wiring | `modules/example/example.module.ts` |
| `src/backend/modules/greetings/greetings.controller.spec.ts` | create | Greetings tests | `modules/example/example.controller.spec.ts` |

---

## 4. Schema & DTO Changes

### Database Schema Changes

| Field | Type | Required | Indexed | Notes |
|-------|------|----------|---------|-------|
| `externalId` | `string` | Yes | Unique | API `id` |
| `text` | `string` | Yes | No | Fact text |
| `source` | `string` | Yes | No | Fact source |
| `sourceUrl` | `string` | Yes | No | Source URL |
| `language` | `string` | Yes | Index | Language code |
| `permalink` | `string` | Yes | No | Fact permalink |
| `createdAt` | `Date` | Yes (default) | No | Creation timestamp |

### DTOs

No DTOs required for this scaffold (no input validation needed).

---

## 5. Test Strategy

### Unit Tests

| Test File | What to Test | Mocks Needed | Coverage Target |
|-----------|--------------|--------------|-----------------|
| `facts.service.spec.ts` | `ingestBatch()` inserts/de-duplicates | `Model`, `fetch` | Success/error |
| `facts.service.spec.ts` | `getRandom()` returns fact or warms up | `Model`, `fetch` | Success/error |
| `greetings.controller.spec.ts` | `GET /greetings` delegates to service | `GreetingsService` | Delegation |

---

## 6. Deployment & Rollout

### Feature Flags

None.

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGODB_URI` | No | `mongodb://localhost:27017/r3nd` | DB connection |
| `PORT` | No | `3000` | Server port |

### Migration Plan

No migrations needed (fresh schema).

---

## 7. AI-Agent Guardrails

Follow `.github/instructions/backend.instructions.md` and `.github/instructions/testing.instructions.md`.

---

## 8. Definition of Done

- [x] All tasks in Section 2 marked complete
- [x] App starts, connects to DB
- [x] Hourly job ingests facts
- [x] `GET /api/greetings` returns greeting + fact
- [x] Tests pass
- [x] No `any` types, no unused code

---

## Notes

This is a scaffold build plan for the developer agent to bootstrap the backend.
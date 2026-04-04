# Technical Specification – <Feature Name>

**Feature ID:** <feature-id>  
**Product Spec:** `rnd/product_specs/<feature-id>-product-spec.md`  
**Author:** Architect  
**Date:** <yyyy-mm-dd>

---

## 1. Context & Existing System

Summarize the current state of the codebase relevant to this feature.  
Reference modules, services, and files that will be touched or extended.

### 1.1 Affected Modules

| Module / Path | Purpose | Impact |
|---------------|---------|--------|
| `src/backend/modules/<module>/` | Brief description | Extended / Modified / New |
| `src/frontend/features/<feature>/` | Brief description | Extended / Modified / New |

### 1.2 Related Infrastructure

List any infrastructure, configuration, or external services that interact with this feature.

- Database collections/tables affected
- Environment variables or config changes
- External APIs or third-party services

---

## 2. Requirements Mapping

Map each product goal to concrete technical requirements.

| Product Goal (from Spec) | Technical Requirement |
|--------------------------|----------------------|
| Goal 1 | How it will be achieved technically |
| Goal 2 | How it will be achieved technically |

---

## 3. Proposed Design

### 3.1 High-Level Architecture

Describe the overall approach and how components interact.  
Use text-based diagrams (ASCII or Mermaid) if helpful.

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │ ──▶  │   Backend   │ ──▶  │  Database   │
└─────────────┘      └─────────────┘      └─────────────┘
```

### 3.2 Backend Design

#### 3.2.1 New/Modified Modules

List modules to create or modify, with their responsibilities.

- **`src/backend/modules/<module-name>/`**
  - Controller: `<module>.controller.ts` — handles HTTP layer
  - Service: `<module>.service.ts` — business logic
  - DTOs: `<module>.dto.ts` — input/output validation
  - Repository (if needed): `<module>.repository.ts` — data access

#### 3.2.2 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/<resource>` | List resources | Required |
| POST | `/api/v1/<resource>` | Create resource | Required |

#### 3.2.3 Data Models

Define new or modified data structures.

```
// Example schema/interface
interface ExampleEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3 Frontend Design

#### 3.3.1 Components

| Component | Path | Purpose |
|-----------|------|---------|
| `FeaturePage` (component) | `src/frontend/features/<feature>/` | Main feature view |
| `FeatureList` (component) | `src/frontend/features/<feature>/components/` | List display |

#### 3.3.2 State Management

Describe store changes or new stores (follow `rnd/instructions/frontend.instructions.md`).

- **Store:** `use<Feature>Store` (file path: `src/frontend/stores/use<Feature>Store`)
  - State: `items`, `loading`, `error`
  - Actions: `fetchItems()`, `createItem()`

#### 3.3.3 API Client

Define new API client methods.

- `src/frontend/api/<feature>.api.ts`
  - `getItems(): Promise<Item[]>`
  - `createItem(data: CreateItemDto): Promise<Item>`

### 3.4 Data Flow

Describe the end-to-end flow for primary use cases.

1. User triggers action in UI
2. Component calls store action
3. Store calls API client
4. Backend controller receives request
5. Service processes business logic
6. Repository persists data
7. Response flows back through the stack

---

## 4. Impact Analysis

### 4.1 Behavioral Impact

How will existing functionality change?

| Component | Current Behavior | New Behavior |
|-----------|-----------------|--------------|
| Component A | Does X | Will now do X + Y |

### 4.2 Structural Impact

What new files, directories, or patterns are introduced?

- New directory: `src/backend/modules/<new-module>/`
- New store: `src/frontend/stores/use<Feature>Store.ts`
- Modified: `src/backend/app.module.ts` (to register new module)

### 4.3 Database Migrations

If applicable, describe schema changes and migration strategy.

- New collection: `<collection_name>`
- Index requirements: `{ field: 1 }`
- Data migration needs: None / Describe migration

---

## 5. Risks & Trade-offs

### 5.1 Backwards Compatibility

- Breaking changes to existing APIs?
- Client version requirements?
- Migration path for existing data?

### 5.2 Security Considerations

- Authentication/authorization requirements
- Input validation and sanitization
- Sensitive data handling

### 5.3 Performance Considerations

- Expected load and scaling requirements
- Caching strategy
- Query optimization needs

### 5.4 Complexity Trade-offs

Document decisions where simpler alternatives were considered.

| Decision | Alternative | Why Chosen |
|----------|-------------|------------|
| Approach A | Approach B | Rationale |

---

## 6. Testing & Observability

### 6.1 Unit Tests

| Component | Test File | Coverage Focus |
|-----------|-----------|----------------|
| `<module>.service.ts` | `<module>.service.spec.ts` | Business logic, edge cases |
| `use<Feature>Store.ts` | `use<Feature>Store.spec.ts` | State mutations, actions |

### 6.2 Integration Tests

| Scenario | Test Scope |
|----------|------------|
| API endpoint returns correct data | Controller + Service + Repository |
| Frontend displays fetched data | Component + Store + API mock |

### 6.3 E2E Tests

| User Flow | Test File |
|-----------|-----------|
| User completes primary workflow | `tests/e2e/<feature>.spec.ts` |

### 6.4 Observability

- **Logging:** Key operations to log (with context)
- **Metrics:** Counters, histograms, or gauges to track
- **Alerts:** Conditions that should trigger alerts

---

## 7. Open Technical Questions

Items requiring decisions before implementation begins.

| Question | Options | Recommendation | Status |
|----------|---------|----------------|--------|
| How should X be handled? | Option A, Option B | Option A because... | Open / Resolved |

---

## 8. Task Breakdown (REQUIRED)

This section defines the self-contained deliverables for this feature. Each task is a standalone piece of software that delivers value and can be tested, run, and deployed independently. The Team Lead will create a **separate build plan for each task**.

### Task Breakdown Principles

- Each task is a **self-contained deliverable** — it works on its own
- Tasks **stack** — later tasks build on earlier ones, but don't require changes to them
- Each task has **clear interfaces** with other tasks
- A task can be **tested in isolation** (with mocks for missing dependencies)

---

### Task T1: [Task Title]

- **Description**: What this task delivers and why it's valuable
- **Scope**: 
  - Included: [list what's in scope]
  - Excluded: [list what's explicitly out of scope]
- **Dependencies**: None | T[n] (specify which)
- **Interfaces**:
  - Exposes: [APIs, data contracts, events this task provides]
  - Consumes: [what it expects from dependencies]
- **Acceptance Criteria**:
  - [ ] Criterion 1
  - [ ] Criterion 2
  - [ ] All tests pass
- **Estimated Complexity**: Small | Medium | Large

---

### Task T2: [Task Title]

- **Description**: What this task delivers and why it's valuable
- **Scope**: 
  - Included: [list what's in scope]
  - Excluded: [list what's explicitly out of scope]
- **Dependencies**: T1 (describe the dependency)
- **Interfaces**:
  - Exposes: [APIs, data contracts, events this task provides]
  - Consumes: [what it expects from T1]
- **Acceptance Criteria**:
  - [ ] Criterion 1
  - [ ] Criterion 2
  - [ ] All tests pass
- **Estimated Complexity**: Small | Medium | Large

---

<!-- Add more tasks as needed following the same structure -->

### Task Dependency Graph

Visualize how tasks depend on each other. Tasks can be sequential or parallel where dependencies allow.

```
T1 ──→ T2 ──→ T3
        ↘
          T4
```

> **Note:** In this example, T4 depends only on T2 and can be implemented in parallel with T3. Design your tasks to maximize parallelism where dependencies permit.

### References

- Related product spec: `rnd/product_specs/<feature-id>-product-spec.md`
- Existing similar implementation: `src/backend/modules/<similar>/`
- Relevant documentation: `docs/<topic>.md`

---

## 9. Appendix (Optional)

### 9.1 Diagrams

Include any additional architectural or sequence diagrams.

### 9.2 API Request/Response Examples

```json
// POST /api/v1/<resource>
// Request
{
  "name": "Example",
  "description": "Example description"
}

// Response
{
  "id": "abc123",
  "name": "Example",
  "description": "Example description",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### 9.3 Related Documents

- Links to external documentation
- References to ADRs (Architecture Decision Records)
- Related tech specs
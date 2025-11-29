# Build Plan: `<feature-id>`

> **Source:** `rnd/tech_specs/<feature-id>-tech-spec.md`  
> **Created:** YYYY-MM-DD  
> **Status:** Draft | In Progress | Complete

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [ ] Read `.github/instructions/backend.instructions.md`
- [ ] Read `.github/instructions/frontend.instructions.md`
- [ ] Identify golden reference modules:
  - Backend: `src/backend/modules/example/`
  - Frontend: `src/frontend/components/example/`, `src/frontend/stores/exampleStore.ts`
- [ ] Confirm no new dependencies needed (or justify additions below)
- [ ] List integration points with existing modules (see Section 1)
- [ ] Review tech spec for any open questions

### New Dependencies (if any)

| Package | Purpose | Justification |
|---------|---------|---------------|
| _None_ | — | — |

---

## 1. Implementation Overview

<!-- 2-3 sentences summarizing the approach and key decisions -->

**Approach:** _Brief description of the architectural approach chosen._

**Key Decisions:**
- _Decision 1 and why_
- _Decision 2 and why_

**Integration Points:**
| Existing Module | Integration Type | Notes |
|-----------------|------------------|-------|
| `src/backend/modules/xxx/` | Extends / Imports / Calls | _How this feature integrates_ |
| `src/frontend/stores/xxxStore.ts` | Uses | _How this feature integrates_ |

---

## 2. Task Breakdown

### Phase 1: Backend Foundation

#### Task 1: Create Entity Schema

- [ ] **Create Mongoose schema**
- **File(s):** `src/backend/modules/<module-name>/schemas/<entity>.schema.ts`
- **Action:** create
- **Dependencies:** None
- **Golden Reference:** `src/backend/modules/example/schemas/example.schema.ts`
- **Details:**
  - Define schema class with `@Schema()` decorator
  - Fields:
    - `fieldName: string` — `@Prop({ required: true })`
    - `optionalField?: string` — `@Prop()`
    - `createdAt: Date` — `@Prop({ default: Date.now })`
  - Export schema and type: `export const EntitySchema = SchemaFactory.createForClass(Entity)`
  - Add indexes for frequently queried fields
- **Acceptance Criteria:**
  - Schema compiles without errors
  - All fields have explicit types (no `any` or `Mixed`)
  - Required fields marked with `required: true`
- **Effort:** small

---

#### Task 2: Create DTOs

- [ ] **Create CreateEntityDto**
- **File(s):** `src/backend/modules/<module-name>/dto/create-<entity>.dto.ts`
- **Action:** create
- **Dependencies:** Task 1
- **Golden Reference:** `src/backend/modules/example/dto/create-example.dto.ts`
- **Details:**
  - Class with class-validator decorators:
    ```typescript
    @IsString()
    @IsNotEmpty()
    fieldName: string;

    @IsOptional()
    @IsString()
    optionalField?: string;
    ```
  - Field names must match schema exactly
- **Acceptance Criteria:**
  - All fields have appropriate class-validator decorators
  - Field names match schema 1:1
  - TypeScript types explicit
- **Effort:** small

---

- [ ] **Create UpdateEntityDto**
- **File(s):** `src/backend/modules/<module-name>/dto/update-<entity>.dto.ts`
- **Action:** create
- **Dependencies:** Task 2 (CreateEntityDto)
- **Details:**
  - Extend `PartialType(CreateEntityDto)` from `@nestjs/mapped-types`
  - Add any update-specific fields
- **Acceptance Criteria:**
  - Properly extends CreateEntityDto with PartialType
- **Effort:** small

---

#### Task 3: Create Service

- [ ] **Create EntityService**
- **File(s):** `src/backend/modules/<module-name>/<module-name>.service.ts`
- **Action:** create
- **Dependencies:** Task 1, Task 2
- **Golden Reference:** `src/backend/modules/example/example.service.ts`
- **Details:**
  - Class decorated with `@Injectable()`
  - Inject model: `@InjectModel(Entity.name) private entityModel: Model<Entity>`
  - Methods:
    - `async create(dto: CreateEntityDto): Promise<Entity>`
    - `async findAll(): Promise<Entity[]>`
    - `async findById(id: string): Promise<Entity>`
    - `async update(id: string, dto: UpdateEntityDto): Promise<Entity>`
    - `async delete(id: string): Promise<void>`
  - Throw `NotFoundException` when entity not found
  - Log significant operations
- **Acceptance Criteria:**
  - `@Injectable()` decorator present
  - All methods return typed Mongoose documents
  - `NotFoundException` thrown with descriptive message
  - No business logic validation (DTOs handle input validation)
- **Effort:** medium
- ⚠️ **Warning:** Keep business logic in service, not controller. Use DTOs for input validation only.

---

#### Task 4: Create Controller

- [ ] **Create EntityController**
- **File(s):** `src/backend/modules/<module-name>/<module-name>.controller.ts`
- **Action:** create
- **Dependencies:** Task 3
- **Golden Reference:** `src/backend/modules/example/example.controller.ts`
- **Details:**
  - Class decorated with `@Controller('<route-prefix>')`
  - Inject service via constructor
  - Endpoints:
    - `@Post()` → `create(@Body() dto: CreateEntityDto)`
    - `@Get()` → `findAll()`
    - `@Get(':id')` → `findById(@Param('id') id: string)`
    - `@Patch(':id')` → `update(@Param('id') id: string, @Body() dto: UpdateEntityDto)`
    - `@Delete(':id')` → `delete(@Param('id') id: string)`
  - Use `@UseGuards()` for protected routes
- **Acceptance Criteria:**
  - Controller is thin — only HTTP handling, delegates to service
  - All DTOs used for request bodies
  - Appropriate HTTP status codes returned
- **Effort:** small

---

#### Task 5: Create Module

- [ ] **Create EntityModule**
- **File(s):** `src/backend/modules/<module-name>/<module-name>.module.ts`
- **Action:** create
- **Dependencies:** Task 1, Task 3, Task 4
- **Golden Reference:** `src/backend/modules/example/example.module.ts`
- **Details:**
  - Import `MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }])`
  - Declare controller in `controllers`
  - Declare service in `providers`
  - Export service if other modules need it
- **Acceptance Criteria:**
  - Module registers schema correctly
  - Controller and service properly declared
- **Effort:** small

---

- [ ] **Register module in AppModule**
- **File(s):** `src/backend/app.module.ts`
- **Action:** modify
- **Dependencies:** Task 5
- **Details:**
  - Add `EntityModule` to imports array
- **Acceptance Criteria:**
  - Module imported and app starts without errors
- **Effort:** small

---

### Phase 2: Backend Tests

#### Task 6: Unit Tests

- [ ] **Create service unit tests**
- **File(s):** `src/backend/modules/<module-name>/<module-name>.service.spec.ts`
- **Action:** create
- **Dependencies:** Task 3
- **Golden Reference:** `src/backend/modules/example/example.service.spec.ts`
- **Details:**
  - Use `Test.createTestingModule` from `@nestjs/testing`
  - Mock `Model<Entity>` for all methods
  - Test cases:
    - `create()` — returns saved entity
    - `findAll()` — returns array
    - `findById()` — returns entity when found
    - `findById()` — throws NotFoundException when not found
    - `update()` — returns updated entity
    - `delete()` — completes without error
- **Acceptance Criteria:**
  - All service methods tested for success path
  - Error paths tested (NotFoundException)
  - Mocks properly configured
- **Effort:** medium

---

- [ ] **Create controller unit tests**
- **File(s):** `src/backend/modules/<module-name>/<module-name>.controller.spec.ts`
- **Action:** create
- **Dependencies:** Task 4, Task 6
- **Details:**
  - Mock service
  - Verify controller methods call correct service methods
  - Test request validation
- **Acceptance Criteria:**
  - All endpoints tested
  - Service mocked correctly
- **Effort:** small

---

### Phase 3: Frontend Implementation

#### Task 7: Create Pinia Store

- [ ] **Create useEntityStore**
- **File(s):** `src/frontend/stores/useEntityStore.ts`
- **Action:** create
- **Dependencies:** Backend API complete (Task 4)
- **Golden Reference:** `src/frontend/stores/exampleStore.ts`
- **Details:**
  - Use `defineStore` with setup syntax (Composition API)
  - State:
    - `entities: ref<Entity[]>([])`
    - `currentEntity: ref<Entity | null>(null)`
    - `loading: ref<boolean>(false)`
    - `error: ref<string | null>(null)`
  - Actions:
    - `async fetchAll(): Promise<void>`
    - `async fetchById(id: string): Promise<void>`
    - `async create(dto: CreateEntityDto): Promise<Entity>`
    - `async update(id: string, dto: UpdateEntityDto): Promise<Entity>`
    - `async delete(id: string): Promise<void>`
  - Handle loading states and errors in each action
- **Acceptance Criteria:**
  - Store uses setup syntax (not options)
  - All API calls in actions, not components
  - Loading and error states managed
  - Typed interfaces for Entity
- **Effort:** medium

---

#### Task 8: Create Components

- [ ] **Create EntityList component**
- **File(s):** `src/frontend/components/<feature>/EntityList.vue`
- **Action:** create
- **Dependencies:** Task 7
- **Golden Reference:** `src/frontend/components/example/ExampleList.vue`
- **Details:**
  - Use `<script setup lang="ts">`
  - Import and use Pinia store
  - Vuetify components: `v-data-table` or `v-list`
  - Required `data-test-id` attributes:
    - `entity-list-container`
    - `entity-list-item-{id}`
    - `entity-list-loading`
    - `entity-list-empty`
- **Acceptance Criteria:**
  - Composition API with `<script setup>`
  - Vuetify components only
  - All interactive elements have `data-test-id`
  - Fetches data via store on mount
- **Effort:** medium

---

- [ ] **Create EntityForm component**
- **File(s):** `src/frontend/components/<feature>/EntityForm.vue`
- **Action:** create
- **Dependencies:** Task 7
- **Details:**
  - Use `<script setup lang="ts">`
  - Props: `entity?: Entity` (for edit mode), `mode: 'create' | 'edit'`
  - Emits: `submit`, `cancel`
  - Vuetify form components: `v-form`, `v-text-field`, `v-btn`
  - Client-side validation matching backend DTOs
  - Required `data-test-id` attributes:
    - `entity-form`
    - `entity-form-field-name` (for each field)
    - `entity-form-submit-btn`
    - `entity-form-cancel-btn`
- **Acceptance Criteria:**
  - Form validation present
  - Proper v-model bindings
  - Submit calls store action
  - All form elements have `data-test-id`
- **Effort:** medium

---

- [ ] **Create EntityDetail component**
- **File(s):** `src/frontend/components/<feature>/EntityDetail.vue`
- **Action:** create
- **Dependencies:** Task 7
- **Details:**
  - Display entity details
  - Actions: Edit, Delete buttons
  - Required `data-test-id` attributes:
    - `entity-detail-container`
    - `entity-detail-edit-btn`
    - `entity-detail-delete-btn`
- **Acceptance Criteria:**
  - Data fetched via store
  - Delete has confirmation dialog
  - All buttons have `data-test-id`
- **Effort:** small

---

#### Task 9: Create View and Route

- [ ] **Create EntityView**
- **File(s):** `src/frontend/views/<Feature>View.vue`
- **Action:** create
- **Dependencies:** Task 8
- **Details:**
  - Compose EntityList, EntityForm, EntityDetail
  - Handle routing for create/edit/view modes
- **Acceptance Criteria:**
  - View properly composes components
  - Handles all CRUD flows
- **Effort:** small

---

- [ ] **Add route**
- **File(s):** `src/frontend/router/index.ts`
- **Action:** modify
- **Dependencies:** Task 9
- **Details:**
  - Add routes:
    - `/entities` → EntityView (list mode)
    - `/entities/new` → EntityView (create mode)
    - `/entities/:id` → EntityView (detail mode)
    - `/entities/:id/edit` → EntityView (edit mode)
- **Acceptance Criteria:**
  - Routes registered and navigable
  - Lazy loading if appropriate
- **Effort:** small

---

### Phase 4: Frontend Tests

#### Task 10: Frontend Unit Tests

- [ ] **Create store tests**
- **File(s):** `tests/frontend/stores/useEntityStore.spec.ts`
- **Action:** create
- **Dependencies:** Task 7
- **Details:**
  - Use `createTestingPinia`
  - Mock API calls
  - Test all actions and state mutations
- **Acceptance Criteria:**
  - All actions tested
  - Loading/error states verified
- **Effort:** medium

---

- [ ] **Create component tests**
- **File(s):** `tests/frontend/components/EntityList.spec.ts`, `tests/frontend/components/EntityForm.spec.ts`
- **Action:** create
- **Dependencies:** Task 8
- **Details:**
  - Use `@vue/test-utils` with `mount`
  - Mock Pinia store
  - Test rendering, interactions
- **Acceptance Criteria:**
  - Components render correctly
  - User interactions trigger expected behavior
- **Effort:** medium

---

### Phase 5: E2E Tests

#### Task 11: Playwright E2E Tests

- [ ] **Create E2E test suite**
- **File(s):** `tests/e2e/<feature>.spec.ts`
- **Action:** create
- **Dependencies:** All previous tasks
- **Details:**
  - Use `data-test-id` selectors only
  - Test flows (see Section 5)
- **Acceptance Criteria:**
  - All critical user flows covered
  - Tests are idempotent and isolated
- **Effort:** medium

---

## 3. File/Module-level Changes

| File Path | Action | Rationale | Golden Reference |
|-----------|--------|-----------|------------------|
| `src/backend/modules/<module>/schemas/<entity>.schema.ts` | create | Entity persistence | `modules/example/schemas/example.schema.ts` |
| `src/backend/modules/<module>/dto/create-<entity>.dto.ts` | create | Input validation | `modules/example/dto/create-example.dto.ts` |
| `src/backend/modules/<module>/dto/update-<entity>.dto.ts` | create | Update validation | — |
| `src/backend/modules/<module>/<module>.service.ts` | create | Business logic | `modules/example/example.service.ts` |
| `src/backend/modules/<module>/<module>.controller.ts` | create | HTTP layer | `modules/example/example.controller.ts` |
| `src/backend/modules/<module>/<module>.module.ts` | create | Module wiring | `modules/example/example.module.ts` |
| `src/backend/app.module.ts` | modify | Register module | — |
| `src/frontend/stores/useEntityStore.ts` | create | State management | `stores/exampleStore.ts` |
| `src/frontend/components/<feature>/EntityList.vue` | create | List UI | `components/example/ExampleList.vue` |
| `src/frontend/components/<feature>/EntityForm.vue` | create | Form UI | — |
| `src/frontend/components/<feature>/EntityDetail.vue` | create | Detail UI | — |
| `src/frontend/views/<Feature>View.vue` | create | Page view | — |
| `src/frontend/router/index.ts` | modify | Add routes | — |

---

## 4. Schema & DTO Changes

### Database Schema Changes

| Field | Type | Required | Indexed | Notes |
|-------|------|----------|---------|-------|
| `fieldName` | `string` | Yes | No | _Description_ |
| `optionalField` | `string` | No | No | _Description_ |
| `createdAt` | `Date` | Yes (default) | Yes | Auto-set on creation |
| `updatedAt` | `Date` | No | No | Auto-set on update |

### DTO Decorators

| Field | CreateDto Decorators | UpdateDto | Notes |
|-------|---------------------|-----------|-------|
| `fieldName` | `@IsString()`, `@IsNotEmpty()` | Optional via PartialType | — |
| `optionalField` | `@IsOptional()`, `@IsString()` | Optional | — |

### Migration Plan

- [ ] No existing data — no migration needed
- [ ] _OR_ Migration script: `scripts/migrations/<date>-add-<entity>.ts`
- [ ] Backfill strategy: _describe_

---

## 5. Test Strategy

### Unit Tests (Jest)

| Test File | What to Test | Mocks Needed | Coverage Target |
|-----------|--------------|--------------|-----------------|
| `<module>.service.spec.ts` | `create()` returns saved entity | `Model.create` | Success path |
| `<module>.service.spec.ts` | `findById()` returns entity | `Model.findById` | Success path |
| `<module>.service.spec.ts` | `findById()` throws NotFoundException | `Model.findById` returns null | Error path |
| `<module>.service.spec.ts` | `update()` returns updated entity | `Model.findByIdAndUpdate` | Success path |
| `<module>.service.spec.ts` | `delete()` removes entity | `Model.findByIdAndDelete` | Success path |
| `<module>.controller.spec.ts` | POST calls service.create | `Service` | Delegation |
| `<module>.controller.spec.ts` | GET calls service.findAll | `Service` | Delegation |
| `useEntityStore.spec.ts` | `fetchAll()` populates state | API client | State mutation |
| `useEntityStore.spec.ts` | `create()` adds to state | API client | State mutation |
| `EntityList.spec.ts` | Renders list of entities | Store | Rendering |
| `EntityForm.spec.ts` | Submits form data | Store | User interaction |

### Integration Tests

| Endpoint | Test Case | Expected Result |
|----------|-----------|-----------------|
| `POST /entities` | Valid DTO | 201 + entity object |
| `POST /entities` | Missing required field | 400 + validation error |
| `GET /entities/:id` | Valid ID | 200 + entity object |
| `GET /entities/:id` | Invalid ID | 404 + NotFoundException |
| `PATCH /entities/:id` | Partial update | 200 + updated entity |
| `DELETE /entities/:id` | Valid ID | 204 No Content |

### E2E Tests (Playwright)

#### Flow 1: Create Entity

1. Navigate to `/entities`
2. Click "Add New" (`data-test-id="entity-list-add-btn"`)
3. Fill form fields:
   - `data-test-id="entity-form-field-name"` → enter value
4. Click submit (`data-test-id="entity-form-submit-btn"`)
5. `waitForResponse('**/api/entities', { method: 'POST' })`
6. Assert success toast (`data-test-id="toast-success"`)
7. Assert entity appears in list (`data-test-id="entity-list-item-*"`)

#### Flow 2: View Entity Details

1. Navigate to `/entities`
2. Click entity row (`data-test-id="entity-list-item-{id}"`)
3. Assert detail view shows (`data-test-id="entity-detail-container"`)
4. Verify entity data displayed

#### Flow 3: Edit Entity

1. Navigate to `/entities/{id}`
2. Click edit (`data-test-id="entity-detail-edit-btn"`)
3. Modify field (`data-test-id="entity-form-field-name"`)
4. Click submit
5. `waitForResponse('**/api/entities/*', { method: 'PATCH' })`
6. Assert success and updated data

#### Flow 4: Delete Entity

1. Navigate to `/entities/{id}`
2. Click delete (`data-test-id="entity-detail-delete-btn"`)
3. Confirm in dialog (`data-test-id="confirm-delete-btn"`)
4. `waitForResponse('**/api/entities/*', { method: 'DELETE' })`
5. Assert redirect to list
6. Assert entity removed from list

### Required `data-test-id` Values

| Element | `data-test-id` |
|---------|----------------|
| Add button | `entity-list-add-btn` |
| List container | `entity-list-container` |
| List item | `entity-list-item-{id}` |
| List loading | `entity-list-loading` |
| List empty state | `entity-list-empty` |
| Form container | `entity-form` |
| Form field (each) | `entity-form-field-{fieldName}` |
| Form submit | `entity-form-submit-btn` |
| Form cancel | `entity-form-cancel-btn` |
| Detail container | `entity-detail-container` |
| Detail edit button | `entity-detail-edit-btn` |
| Detail delete button | `entity-detail-delete-btn` |
| Confirm delete | `confirm-delete-btn` |
| Success toast | `toast-success` |
| Error toast | `toast-error` |

---

## 6. Deployment & Rollout

### Feature Flags

| Flag Name | Default | Purpose |
|-----------|---------|---------|
| _None_ | — | — |

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| _None_ | — | — | — |

### Migration Steps

1. _No migrations required for this feature_
2. _OR: Run migration script before deployment_

### Rollback Plan

1. Revert deployment to previous version
2. _If migration was run:_ Run rollback migration
3. Verify system health

### Monitoring & Logging

- [ ] Add structured logging for key operations
- [ ] Error tracking for new endpoints
- [ ] _Metrics to add (if any)_

---

## 7. AI-Agent Guardrails

⚠️ **Developer agents must read this section before implementing any task.**

| Area | Warning | Correct Pattern |
|------|---------|-----------------|
| **Frontend** | Use Vue 3 `<script setup>` only. No React, MUI, Tailwind. | Vuetify + Composition API |
| **Backend** | NestJS module/service/controller pattern. No logic in controllers. | Thin controllers, fat services |
| **DTOs** | Always add class-validator decorators. Sync with schema. | `@IsString()`, `@IsNotEmpty()`, etc. |
| **Tests** | Every new file needs a test. Use `data-test-id` for E2E. | `*.spec.ts` alongside source |
| **Imports** | Only import from allowed packages (vue, vuetify, pinia, nestjs, mongoose). | Check package.json first |
| **State** | Frontend state in Pinia only. No component-local shared state. | `defineStore` with setup syntax |
| **Queries** | No raw Mongo queries. Use Mongoose model methods. | `Model.find()`, not `db.collection()` |
| **Errors** | Use NestJS exceptions. Never swallow errors. | `NotFoundException`, `BadRequestException` |
| **Types** | No `any` types. Explicit interfaces required. | Define interfaces/types |
| **Files** | Max 300-400 lines per file. Split if larger. | Single responsibility |
| **Schema ↔ DTO** | Field names must match exactly. Add to both simultaneously. | Keep in sync always |
| **Validation** | Input validation via DTOs only, not in service business logic. | class-validator decorators |

### Common Mistakes to Avoid

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Logic in controllers | Move to service |
| `any` types | Define explicit interfaces |
| Missing `data-test-id` | Add to ALL interactive elements |
| Raw fetch in components | Use Pinia actions |
| Options API | Always `<script setup>` |
| Missing tests | Create test file for every new file |
| Hardcoded values | Use ConfigService / environment variables |
| Large files (>300 LOC) | Split into smaller modules |

---

## 8. Definition of Done

### Implementation Complete

- [ ] All tasks in Section 2 marked complete
- [ ] No `TODO` or `FIXME` comments left unresolved
- [ ] Code follows golden reference patterns

### Quality Gates

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Lint passing (`npm run lint`)
- [ ] Type-check passing (`npm run type-check`)
- [ ] No new warnings introduced

### Documentation

- [ ] README updated (if new module)
- [ ] API documentation updated (if new endpoints)
- [ ] Inline comments for complex logic

### Review Ready

- [ ] Self-review completed
- [ ] Golden reference patterns verified
- [ ] Schema ↔ DTO sync verified
- [ ] All `data-test-id` values added
- [ ] Feature tested manually in development

---

## Appendix: Task Dependency Graph

```
Task 1 (Schema)
    ↓
Task 2 (DTOs)
    ↓
Task 3 (Service) ──→ Task 6 (Service Tests)
    ↓
Task 4 (Controller) ──→ Task 6 (Controller Tests)
    ↓
Task 5 (Module)
    ↓
[Backend Complete]
    ↓
Task 7 (Store) ──→ Task 10 (Store Tests)
    ↓
Task 8 (Components) ──→ Task 10 (Component Tests)
    ↓
Task 9 (View + Route)
    ↓
[Frontend Complete]
    ↓
Task 11 (E2E Tests)
    ↓
[Done]
```

---

## Notes

<!-- Add any clarifications, decisions, or context for implementers -->

_Add notes here during implementation._
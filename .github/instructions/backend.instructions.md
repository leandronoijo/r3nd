---
title: Backend Instructions
applyTo: src/backend/**
---

# Backend Development Instructions

These rules apply to all code under `src/backend/`. AI agents and humans must follow them strictly.

---

## Stack & Constraints

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | NestJS | Module/Service/Controller pattern |
| Validation | class-validator + class-transformer | All DTOs validated |
| Database | MongoDB via Mongoose | Strict schemas, no ad-hoc fields |

**Testing & quality gates:** Follow `.github/instructions/testing.instructions.md`.

### CLI Tooling & Package Management

**Always prefer CLI tools over manual file editing:**
- **Installing packages**: Use `npm install <package>` instead of manually editing `package.json`.
- **Scaffolding**: Use NestJS CLI for generating modules, controllers, services:
  - `nest generate module <name>` or `nest g mo <name>`
  - `nest generate controller <name>` or `nest g co <name>`
  - `nest generate service <name>` or `nest g s <name>`
- **Project setup**: Use `nest new <project-name>` for initial project structure.

**Why**: CLI tools ensure correct imports, module registration, and follow NestJS conventions automatically.

### Forbidden

- Express patterns outside NestJS abstractions.
- Direct MongoDB driver calls; always use Mongoose models.
- Cross-module service injection without documented reason.
- Circular dependencies.
- Any ORM other than Mongoose.
- Unvalidated request bodies.

---

## File & Folder Conventions

```
src/backend/
├── modules/
│   └── <module-name>/
│       ├── <module-name>.module.ts
│       ├── <module-name>.controller.ts
│       ├── <module-name>.service.ts
│       ├── dto/
│       │   ├── create-<entity>.dto.ts
│       │   └── update-<entity>.dto.ts
│       ├── schemas/
│       │   └── <entity>.schema.ts
│       └── <module-name>.spec.ts
├── common/           # Shared guards, interceptors, pipes
├── config/           # Configuration modules
├── main.ts
└── app.module.ts
```

- One module per domain concept.
- Module folder name = kebab-case.
- Class names = PascalCase.

---

## Module Rules

1. Every module must be decorated with `@Module({})` and declare:
   - `controllers` — its own controllers only.
   - `providers` — its own services only.
   - `exports` — services other modules may use.
   - `imports` — other modules it depends on.
2. Register all modules in `app.module.ts`.
3. Never import a module just to access its internal service directly.

---

## Controller Rules

1. Controllers handle HTTP layer only — no business logic.
2. Decorate with `@Controller('route-prefix')`.
3. Use decorators: `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`.
4. Always use DTOs for request bodies: `@Body() dto: CreateXxxDto`.
5. Return plain objects or arrays; NestJS serializes automatically.
6. Use guards (`@UseGuards`) for auth/authorization.

---

## Service Rules

1. All services must be `@Injectable()`.
2. Business logic lives here, not in controllers.
3. Inject Mongoose models via `@InjectModel(Entity.name)`.
4. Keep methods small and single-purpose.
5. Throw NestJS exceptions (`NotFoundException`, `BadRequestException`, etc.).

---

## DTO Rules

1. Every input (create, update) must have a DTO class.
2. Use `class-validator` decorators: `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, etc.
3. Use `class-transformer` for transformation: `@Transform`, `@Type`.
4. DTO field names must match Mongoose schema field names exactly.
5. When adding a field:
   - Update DTO.
   - Update schema.
   - Update tests.
   - Plan migration if data exists.

---

## Schema Rules (Mongoose)

1. Define schemas with `@Schema()` decorator and `SchemaFactory.createForClass`.
2. Every field must have an explicit type annotation.
3. Use `@Prop({ required: true })` for mandatory fields.
4. Index frequently queried fields: `@Prop({ index: true })`.
5. No `Mixed` or `any` types — always explicit.
6. Keep schema and DTO in sync; they must evolve together.

---

## Common AI-Agent Mistakes to Avoid

| Mistake | Mitigation |
|---------|------------|
| Putting logic in controllers | Move to service; controller only calls service. |
| Skipping DTO validation | Always add class-validator decorators. |
| Raw MongoDB queries | Use Mongoose model methods only. |
| Circular module imports | Refactor to shared module or use `forwardRef` sparingly. |
| Adding schema fields without DTO | Update both simultaneously. |
| Large services (>300 lines) | Split into smaller, focused services. |
| Missing `@Injectable()` | Every service needs this decorator. |
| Hardcoded config values | Use `ConfigService` and environment variables. |
| No error handling | Throw appropriate NestJS HTTP exceptions. |
| Skipping tests | Every service/controller must have tests. |
| Using `any` types | Always use explicit types or interfaces. |
| Ad-hoc fields in Mongo docs | Schema must define every field. |

---

## Golden Reference

Follow the example module in:

- `src/backend/modules/example/`

Copy its structure for new features:

- `example.module.ts`
- `example.controller.ts`
- `example.service.ts`
- `dto/create-example.dto.ts`
- `schemas/example.schema.ts`
- `example.spec.ts`
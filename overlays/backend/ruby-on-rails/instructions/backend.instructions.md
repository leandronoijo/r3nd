```instructions
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
| Framework | Ruby on Rails 8.1.1 (API-only) | MVC pattern with service objects |
| Validation | Active Record validations | All models validated |
| Database | PostgreSQL via Active Record | Strict schema, migrations required |
| Background Jobs | Solid Queue | Native Rails 8+ job processor |

**Testing & quality gates:** Follow `.github/instructions/testing.instructions.md`.

### CLI Tooling & Code Generation

**Always prefer Rails generators and CLI tools over manual file creation:**
- **Installing gems**: Use `bundle add <gem>` instead of manually editing `Gemfile`.
- **Scaffolding**: Use Rails generators for models, controllers, jobs, etc.:
  - `rails generate model <Name> field:type field:type` — Creates model, migration, and test.
  - `rails generate controller <Name> action1 action2` — Creates controller with actions.
  - `rails generate job <Name>` — Creates background job.
  - `rails generate migration <DescriptiveName>` — Creates migration.
- **Running migrations**: Always use `rails db:migrate` and `rails db:rollback`.
- **Database operations**: Use `rails db:create`, `rails db:drop`, `rails db:seed`, etc.
- **Console access**: Use `rails console` for interactive debugging.

**If there is a missing ruby, rails, or bundler command, require the user to install it first.**

**Why**: Rails generators ensure correct file locations, proper inheritance, conventions compliance, and automatic test file creation.

### Forbidden

- Direct SQL queries outside of Active Record (use Arel or scopes).
- Business logic in controllers (use service objects).
- Business logic in models beyond validations/callbacks (use service objects).
- Fat models (models should be data-focused, not behavior-heavy).
- Unvalidated model attributes.
- Skipping migrations (always create migrations for schema changes).
- Using `update_attribute` (bypasses validations; use `update` or `update!`).
- N+1 queries (use `includes`, `joins`, `preload`, or `eager_load`).
- Any ORM other than Active Record.

---

## File & Folder Conventions

```
src/backend/
├── app/
│   ├── models/
│   │   └── <model_name>.rb
│   ├── controllers/
│   │   └── api/
│   │       └── v1/
│   │           └── <resource>_controller.rb
│   ├── services/
│   │   └── <domain>_service.rb
│   ├── jobs/
│   │   └── <job_name>_job.rb
│   └── serializers/           # Optional, for JSON serialization
│       └── <model>_serializer.rb
├── config/
│   ├── routes.rb
│   ├── database.yml
│   └── initializers/
│       ├── cors.rb
│       └── solid_queue.rb
├── db/
│   ├── migrate/
│   │   └── YYYYMMDDHHMMSS_<description>.rb
│   ├── schema.rb              # Auto-generated, do not edit manually
│   └── seeds.rb
├── spec/                      # RSpec tests
│   ├── models/
│   ├── requests/              # Controller/integration tests
│   ├── services/
│   ├── jobs/
│   ├── factories/             # FactoryBot factories
│   └── support/               # Test helpers
├── Gemfile
└── Gemfile.lock
```

- Models: singular, PascalCase (`Fact`, `User`).
- Controllers: plural, namespaced (`Api::V1::GreetingsController`).
- Services: domain-focused, PascalCase with `Service` suffix (`FactsService`).
- Jobs: PascalCase with `Job` suffix (`FactsIngestorJob`).
- Files: snake_case matching class name.

---

## Model Rules

1. Every model must inherit from `ApplicationRecord`.
2. Add validations for all required fields:
   - `validates :field_name, presence: true`
   - `validates :field_name, uniqueness: true`
   - `validates :field_name, format: { with: /regex/ }`
3. Use database constraints (unique indexes, foreign keys, NOT NULL) in migrations to mirror validations.
4. Keep models focused on data and simple behavior:
   - Validations
   - Associations (`has_many`, `belongs_to`, etc.)
   - Scopes (e.g., `scope :active, -> { where(active: true) }`)
   - Simple query methods
5. Move complex business logic to service objects.
6. Use callbacks sparingly (`before_save`, `after_create`, etc.) — prefer service objects for orchestration.
7. No SQL strings; use Active Record query interface or Arel.

---

## Controller Rules

1. Controllers handle HTTP layer only — no business logic.
2. API controllers should inherit from `ApplicationController` and be namespaced under `Api::V1`.
3. Use strong parameters to whitelist input:
   ```ruby
   def create
     @resource = Resource.new(resource_params)
     # ...
   end
   
   private
   
   def resource_params
     params.require(:resource).permit(:field1, :field2)
   end
   ```
4. Delegate business logic to service objects:
   ```ruby
   def create
     result = MyService.call(params)
     render json: result, status: :created
   end
   ```
5. Use standard REST actions when possible (`index`, `show`, `create`, `update`, `destroy`).
6. Return JSON using `render json:` or serializers.
7. Handle errors with rescue blocks or `rescue_from`:
   ```ruby
   rescue_from ActiveRecord::RecordNotFound, with: :not_found
   
   private
   
   def not_found
     render json: { error: 'Not found' }, status: :not_found
   end
   ```
8. Keep actions thin (<10 lines ideal).

---

## Service Object Rules

1. Service objects encapsulate complex business logic.
2. Place services in `app/services/`.
3. Name services with domain + `Service` suffix (e.g., `FactsService`, `UserRegistrationService`).
4. Use class methods for stateless operations:
   ```ruby
   class FactsService
     def self.ingest_batch(size = 5)
       # logic here
     end
   end
   ```
5. Use instance methods for stateful operations:
   ```ruby
   class OrderProcessor
     def initialize(order)
       @order = order
     end
     
     def process
       # logic here
     end
   end
   ```
6. Return results explicitly (objects, booleans, hashes, etc.).
7. Raise appropriate exceptions (`ActiveRecord::RecordNotFound`, `ArgumentError`, custom exceptions).
8. Keep services focused on a single responsibility.

---

## Migration Rules

1. Always use `rails generate migration <DescriptiveName>` to create migrations.
2. Use descriptive names: `AddEmailToUsers`, `CreateFacts`, `AddIndexToFactsExternalId`.
3. Include both `up` and `down` (or use `change` for reversible migrations).
4. Add indexes for:
   - Foreign keys
   - Frequently queried fields
   - Unique constraints
5. Use database-level constraints:
   ```ruby
   add_column :facts, :external_id, :string, null: false
   add_index :facts, :external_id, unique: true
   ```
6. Never edit `db/schema.rb` manually (it's auto-generated).
7. Run `rails db:migrate` after creating migrations.
8. Test rollback: `rails db:rollback` then `rails db:migrate`.

---

## Background Job Rules (Solid Queue)

1. Use Rails generators: `rails generate job <JobName>`.
2. Jobs should inherit from `ApplicationJob`.
3. Implement `perform` method:
   ```ruby
   class FactsIngestorJob < ApplicationJob
     queue_as :default
     
     def perform
       FactsService.ingest_batch(5)
     end
   end
   ```
4. Enqueue jobs with `JobName.perform_later` or `JobName.perform_now`.
5. Configure recurring jobs in `config/initializers/solid_queue.rb` or use cron.
6. Handle failures gracefully (Solid Queue has built-in retry logic).
7. Log job execution for debugging.

---

## Testing Rules (RSpec)

1. Use RSpec for all testing (`rails generate` auto-creates spec files).
2. Structure tests in `spec/` mirroring `app/`:
   - `spec/models/` for model tests.
   - `spec/requests/` for controller/API tests.
   - `spec/services/` for service tests.
   - `spec/jobs/` for job tests.
3. Use FactoryBot for test data:
   ```ruby
   # spec/factories/facts.rb
   FactoryBot.define do
     factory :fact do
       external_id { Faker::Alphanumeric.alpha(number: 10) }
       text { Faker::Lorem.sentence }
       # ...
     end
   end
   
   # Usage in specs
   fact = create(:fact)
   ```
4. Use WebMock to stub external HTTP calls:
   ```ruby
   stub_request(:get, "https://example.com/api")
     .to_return(status: 200, body: '{"data": "value"}', headers: {})
   ```
5. Use DatabaseCleaner to reset database between tests.
6. Use ShouldaMatchers for concise validation/association tests:
   ```ruby
   RSpec.describe Fact, type: :model do
     it { should validate_presence_of(:text) }
     it { should validate_uniqueness_of(:external_id) }
   end
   ```
7. Run tests with `rails spec` or `bundle exec rspec`.

---

## API Response Conventions

1. Return JSON for all API responses.
2. Use consistent structure:
   ```json
   {
     "data": { ... },
     "meta": { "total": 100, "page": 1 }
   }
   ```
3. Error responses:
   ```json
   {
     "error": "Error message",
     "details": ["field1 is invalid", "field2 is required"]
   }
   ```
4. Use appropriate HTTP status codes:
   - `200` OK — Successful GET/PUT/PATCH.
   - `201` Created — Successful POST.
   - `204` No Content — Successful DELETE.
   - `400` Bad Request — Invalid input.
   - `404` Not Found — Resource not found.
   - `422` Unprocessable Entity — Validation errors.
   - `500` Internal Server Error — Unexpected errors.
   - `503` Service Unavailable — External dependency failure.

---

## Common AI-Agent Mistakes to Avoid

| Mistake | Mitigation |
|---------|------------|
| Putting business logic in controllers | Move to service objects. |
| Putting business logic in models | Move to service objects; models for data only. |
| Skipping validations | Always validate required fields in models. |
| Editing `schema.rb` manually | Never; use migrations only. |
| Not adding database constraints | Mirror model validations with DB constraints. |
| N+1 queries | Use `includes`, `joins`, or `preload`. |
| Using `update_attribute` | Use `update` or `update!` to trigger validations. |
| Hardcoding values | Use environment variables or `Rails.application.credentials`. |
| Not using strong parameters | Always whitelist params in controllers. |
| Large service classes (>200 lines) | Split into multiple focused services. |
| Missing tests | Every model/controller/service must have tests. |
| Not mocking external HTTP calls | Use WebMock to prevent real network calls in tests. |
| Using `rails new` without `--api` | For API-only apps, always use `--api` flag. |

---

## Rails-Specific Best Practices

1. **Use Rails conventions**: Follow naming, file structure, and inheritance patterns.
2. **Leverage Active Record**: Use scopes, callbacks, and associations effectively.
3. **Environment config**: Use `Rails.env.development?`, `Rails.env.production?`, etc.
4. **Secrets management**: Use `Rails.application.credentials` or environment variables (never hardcode).
5. **Logging**: Use `Rails.logger.info`, `Rails.logger.error`, etc.
6. **Caching**: Use Rails caching (`Rails.cache`) for expensive operations.
7. **Transactions**: Wrap multi-step DB operations in `ActiveRecord::Base.transaction`.
8. **Eager loading**: Prevent N+1 with `includes` or `preload`.
9. **API versioning**: Namespace controllers under `Api::V1`, `Api::V2`, etc.
10. **CORS**: Configure in `config/initializers/cors.rb` using `rack-cors` gem.

---

## Code Quality Checklist

Before committing:
- [ ] All tests pass (`rails spec`).
- [ ] No N+1 queries (check with `bullet` gem in development).
- [ ] No hardcoded values (use environment variables).
- [ ] All models have validations and corresponding DB constraints.
- [ ] Strong parameters used in all controllers.
- [ ] Business logic in service objects, not controllers/models.
- [ ] External HTTP calls mocked in tests.
- [ ] Migrations tested (up and down).
- [ ] Code follows Rails conventions (Rubocop can help).
- [ ] No SQL injection risks (use parameterized queries).

---

## Additional Resources

- **Rails Guides**: https://guides.rubyonrails.org/
- **API-only Apps**: https://guides.rubyonrails.org/api_app.html
- **Active Record**: https://guides.rubyonrails.org/active_record_basics.html
- **Solid Queue**: https://github.com/rails/solid_queue
- **RSpec Rails**: https://github.com/rspec/rspec-rails
- **FactoryBot**: https://github.com/thoughtbot/factory_bot
- **Shoulda Matchers**: https://github.com/thoughtbot/shoulda-matchers

```

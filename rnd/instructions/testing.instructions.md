---
applyTo: src/**,tests/**
---

# Testing Instructions

This document defines the testing standards and best practices for the project. All code contributions must include appropriate tests following these guidelines.

---

## 1. Testing Framework Selectioni

- Use the testing frameworks specified in `frontend.instructions.md` and `backend.instructions.md` for your respective stack.
- If no framework is specified, use the current best practice for your technology:
  - **JavaScript/TypeScript**: Jest, Vitest, or framework-specific (Jasmine/Karma for Angular, Vue Test Utils for Vue)
  - **Python**: pytest with pytest-asyncio for async code
  - **Ruby**: RSpec
  - **Go**: built-in testing package
- Do not introduce new testing frameworks without justification and team approval.

---

## 2. Test Coverage Requirements

### Unit Tests (Required)

Write unit tests for all:

| Layer | Frontend | Backend |
|-------|----------|---------|
| **Services** | State services, API services | Business logic services |
| **Controllers** | — | All controller/router handlers |
| **Components** | All UI components | — |
| **Stores** | State stores (Pinia, Redux, etc.) | — |
| **Repositories** | — | Data access layer (mocked DB) |
| **Utilities** | Helper functions | Helper functions |

### Integration Tests (Required when applicable)

Write integration tests for:

- **API endpoints**: Test full request/response cycle with mocked or test database
- **Repositories**: Test actual database operations against a test database (use Docker containers for CI parity)
- **External service integrations**: Test with mocked HTTP responses

---

## 3. Test Scenarios

Every test suite must cover:

### Happy Paths
- Expected inputs produce expected outputs
- Normal user flows complete successfully
- Valid data is processed correctly

### Edge Cases
- Empty inputs, null values, undefined
- Boundary values (min/max, empty arrays, single items)
- Special characters and unicode in strings
- Large datasets and pagination boundaries
- Concurrent operations (where applicable)

### Error Handling
- Invalid inputs return appropriate errors
- Unexpected I/O errors are handled gracefully (network failures, DB timeouts, file system errors)
- External service failures trigger proper fallback behavior
- Error messages are meaningful and do not leak sensitive information

---

## 4. AAA Pattern (Arrange-Act-Assert)

Structure all tests using the AAA pattern for clarity and consistency:

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      // Arrange: Set up test data and dependencies
      const userData = { name: 'John', email: 'john@example.com' };
      const mockRepository = createMockRepository();
      const service = new UserService(mockRepository);

      // Act: Execute the code under test
      const result = await service.createUser(userData);

      // Assert: Verify the expected outcome
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(mockRepository.save).toHaveBeenCalledWith(userData);
    });
  });
});
```

---

## 5. Test Naming Conventions

Use descriptive names that explain what is being tested:

```typescript
// ✅ Good: Describes behavior and expected outcome
it('should return 404 when user is not found')
it('should throw ValidationError when email is invalid')
it('should retry 3 times before failing on network error')

// ❌ Bad: Vague or implementation-focused
it('test user')
it('works correctly')
it('handles error')
```

Use `describe` blocks to group related tests:

```typescript
describe('FactsService', () => {
  describe('ingestBatch', () => {
    it('should insert new facts into the database')
    it('should skip duplicate facts by external_id')
    it('should return count of newly inserted facts')
  });

  describe('getRandom', () => {
    it('should return a random fact when facts exist')
    it('should warm up database when no facts exist')
    it('should throw error when warmup fails')
  });
});
```

---

## 6. Mocking Best Practices

### What to Mock
- External HTTP calls (APIs, webhooks)
- Database connections in unit tests
- File system operations
- Time-dependent functions (`Date.now()`, timers)
- Environment variables

### What NOT to Mock
- The code under test itself
- Simple utility functions (unless they have side effects)
- Data transformations

### Mock Guidelines
- Keep mocks simple and focused
- Reset mocks between tests to prevent state leakage
- Use factory functions for complex mock objects
- Prefer dependency injection over module mocking when possible

```typescript
// ✅ Good: Inject dependencies
class GreetingService {
  constructor(private factRepository: FactRepository) {}
}

// Test with mock
const mockRepo = createMockFactRepository();
const service = new GreetingService(mockRepo);

// ❌ Avoid: Mocking module internals when DI is possible
jest.mock('../repositories/factRepository');
```

---

## 7. Test Isolation

- Each test must be independent and runnable in any order
- Clean up test data after each test (use `beforeEach`/`afterEach` hooks)
- Do not share mutable state between tests
- Use unique identifiers for test data to prevent collisions

```typescript
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Reset any shared state
  testDatabase.clear();
});

afterEach(async () => {
  // Clean up resources
  await testConnection.close();
});
```

---

## 8. Async Testing

- Always `await` async operations
- Use proper async matchers (`resolves`, `rejects`)
- Set appropriate timeouts for integration tests
- Handle promise rejections explicitly

```typescript
// ✅ Good: Properly awaited
it('should fetch greeting', async () => {
  const result = await service.fetchGreeting();
  expect(result.greeting).toBeDefined();
});

// ✅ Good: Testing rejections
it('should throw on network error', async () => {
  mockHttp.get.mockRejectedValue(new Error('Network error'));
  
  await expect(service.fetchGreeting()).rejects.toThrow('Network error');
});

// ❌ Bad: Missing await (test may pass incorrectly)
it('should fetch greeting', () => {
  service.fetchGreeting().then(result => {
    expect(result.greeting).toBeDefined();
  });
});
```

---

## 9. Test Data Management

- Use factories or builders for creating test objects
- Keep test data close to the test that uses it
- Use realistic but not real data (no production data in tests)
- Use libraries like Faker for generating test data

```typescript
// Factory function for test data
function createTestFact(overrides = {}) {
  return {
    id: faker.string.uuid(),
    externalId: faker.string.alphanumeric(10),
    text: faker.lorem.sentence(),
    source: 'test-source',
    language: 'en',
    ...overrides,
  };
}

// Usage in tests
it('should process fact with long text', () => {
  const fact = createTestFact({ text: 'A'.repeat(1000) });
  // ...
});
```

---

## 10. Assertions Best Practices

- Use specific assertions over generic ones
- One logical assertion per test (multiple `expect` calls are fine if testing one behavior)
- Assert on behavior, not implementation details
- Include meaningful error messages for complex assertions

```typescript
// ✅ Good: Specific assertions
expect(user.email).toBe('john@example.com');
expect(users).toHaveLength(3);
expect(result).toContainEqual({ id: 1, name: 'John' });

// ❌ Bad: Overly generic
expect(user).toBeTruthy();
expect(users.length > 0).toBe(true);

// ✅ Good: Testing behavior
expect(mockNotificationService.send).toHaveBeenCalledWith(
  expect.objectContaining({ userId: 123, type: 'welcome' })
);

// ❌ Bad: Testing implementation details
expect(service._internalCache.size).toBe(1);
```

---

## 11. Component Testing (Frontend)

- Test component rendering with different props/inputs
- Test user interactions (clicks, inputs, form submissions)
- Use `data-test-id` attributes for selecting elements (not CSS classes or tag names)
- Test accessibility where applicable

```typescript
// Using data-test-id for reliable selection
const card = fixture.debugElement.query(By.css('[data-test-id="greeting-card"]'));
const refreshBtn = screen.getByTestId('refresh-greeting-btn');

// Test user interaction
await userEvent.click(refreshBtn);
expect(mockService.fetchGreeting).toHaveBeenCalled();
```

---

## 12. API/Controller Testing

- Test all HTTP methods and status codes
- Test request validation (missing fields, invalid types)
- Test authentication/authorization when applicable
- Test response structure matches contract

```typescript
describe('GET /api/greetings', () => {
  it('should return 200 with greeting and fact', async () => {
    const response = await request(app).get('/api/greetings');
    
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      greeting: expect.any(String),
      fact: expect.objectContaining({
        text: expect.any(String),
        language: expect.any(String),
      }),
    });
  });

  it('should return 503 when no facts available', async () => {
    mockFactService.getRandom.mockRejectedValue(new Error('No facts'));
    
    const response = await request(app).get('/api/greetings');
    
    expect(response.status).toBe(503);
  });
});
```

---

## 13. Test Organization

```
project/
├── src/
│   ├── services/
│   │   ├── user.service.ts
│   │   └── user.service.spec.ts    # Co-located unit tests
│   └── components/
│       ├── Button/
│       │   ├── Button.tsx
│       │   └── Button.spec.tsx     # Co-located component tests
└── tests/
    ├── integration/                 # Integration tests
    │   ├── api/
    │   │   └── greetings.spec.ts
    │   └── repositories/
    │       └── fact.repository.spec.ts
    └── e2e/                         # End-to-end tests (if applicable)
        └── greeting-flow.spec.ts
```

- **Unit tests**: Co-locate with source files (`*.spec.ts` next to `*.ts`)
- **Integration tests**: Place in `tests/integration/`
- **E2E tests**: Place in `tests/e2e/`

---

## 14. Continuous Integration

- All tests must pass before merging
- Run tests in CI with the same configuration as local development
- Use Docker containers for database-dependent tests to ensure consistency
- Set reasonable timeouts (unit: 5s, integration: 30s, e2e: 60s)

---

## 15. Common Pitfalls to Avoid

| Pitfall | Solution |
|---------|----------|
| Testing implementation details | Test behavior and public API instead |
| Flaky tests (pass/fail randomly) | Fix race conditions, use proper waits, avoid time-dependent tests |
| Slow test suites | Mock external services, parallelize tests, use in-memory DBs |
| Brittle selectors in UI tests | Use `data-test-id` attributes |
| Not testing error paths | Include error scenarios in every test suite |
| Copy-pasting test code | Extract common setup into fixtures/factories |
| Ignoring test failures | Fix or remove tests, never skip indefinitely |
| Testing third-party code | Trust libraries; test your integration with them |

---

## 16. Definition of Done (Testing)

A feature is considered tested when:

- [ ] Unit tests exist for all new services, controllers, components, and stores
- [ ] Integration tests exist for new API endpoints and repository methods
- [ ] Happy paths are covered
- [ ] Edge cases are covered
- [ ] Error handling is tested
- [ ] All tests pass locally and in CI
- [ ] No skipped or pending tests without documented reason
- [ ] Test code follows the same quality standards as production code

---
applyTo: tests/e2e/**
---

# E2E Testing Instructions

This document defines the end-to-end (E2E) testing standards, framework setup, and patterns for the project. All E2E test implementations must follow these guidelines.

---

## 1. Framework Selection

**Standard Framework: Playwright**

- **Why Playwright:**
  - Modern, actively maintained
  - Excellent TypeScript support
  - Cross-browser testing (Chromium, Firefox, WebKit)
  - Built-in test runner with parallel execution support
  - Powerful debugging tools (trace viewer, screenshots, videos)
  - Reliable auto-waiting and retry mechanisms

- **Installation:**

```bash
# Install Playwright
npm install -D @playwright/test

# Install browser binaries
npx playwright install
```

- **Alternative frameworks** (e.g., Cypress) may be used if already established in the project, but Playwright is the recommended default for new projects.

---

## 2. Configuration

### Playwright Configuration Template

Create `playwright.config.ts` in the project root:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run (per testing.instructions.md)
  timeout: 60 * 1000, // 60 seconds
  
  // Maximum time the whole test suite can run
  globalTimeout: 30 * 60 * 1000, // 30 minutes
  
  // Test execution settings
  fullyParallel: false, // Run tests sequentially by default
  forbidOnly: !!process.env.CI, // Fail CI if test.only left in code
  retries: process.env.CI ? 2 : 0, // Retry on CI, not locally
  workers: 1, // Sequential execution (one test at a time)
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'tests/e2e/reports' }],
    ['json', { outputFile: 'tests/e2e/reports/results.json' }],
    ['list'], // Console output
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation (override with env var)
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
    
    // Collect trace only on failure to save space
    trace: 'on-first-retry',
    
    // Screenshot only on failure
    screenshot: 'only-on-failure',
    
    // Video only on failure
    video: 'retain-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true, // For local dev with self-signed certs
    
    // Network options
    actionTimeout: 15 * 1000, // 15 seconds for individual actions
  },
  
  // Test projects (browsers to test against)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment for cross-browser testing:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // Web server configuration (auto-start services using Docker Compose)
  // IMPORTANT: Use Docker Compose to run dependent services. Do NOT start services
  // manually (e.g. `npm run dev`) when running E2E tests — the test harness
  // should rely on the compose-managed environment instead.
  // The command below will build and bring up required services and Playwright
  // will wait for `baseURL` to be reachable.
  webServer: process.env.CI ? undefined : {
    command: 'docker compose up --build', // Start services via Docker Compose
    url: process.env.BASE_URL || 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 10 * 60 * 1000, // 10 minutes
  },
});
```

### Environment Variables

Tests should respect these environment variables:

- `BASE_URL`: Frontend application URL (default: `http://localhost:4173`)
- `API_BASE_URL`: Backend API URL (default: `http://localhost:3000`)
- `CI`: Set to `true` in CI environment for stricter behavior
- `PWDEBUG`: Set to `1` for Playwright debug mode

Example `.env.test`:

```bash
BASE_URL=http://localhost:4173
API_BASE_URL=http://localhost:3000
```

---

## 3. Selector Strategy

**CRITICAL: Use `data-test-id` attributes exclusively for E2E selectors.**

### Rules

| Rule | ✅ Correct | ❌ Incorrect |
|------|----------|-------------|
| Use `data-test-id` | `page.locator('[data-test-id="submit-btn"]')` | `page.locator('.submit-button')` |
| Never use CSS classes | `[data-test-id="..."]` | `.class-name`, `button.primary` |
| Never use IDs | `[data-test-id="..."]` | `#element-id` |
| Never use element tags | `[data-test-id="..."]` | `button`, `div.container` |
| Use semantic names | `[data-test-id="login-submit-btn"]` | `[data-test-id="btn1"]` |
| Be specific for lists | `[data-test-id="order-item-${id}"]` | `[data-test-id="item"]` |

### Why `data-test-id`?

- **Stable**: Not affected by styling changes (CSS refactoring)
- **Explicit**: Clear intent that element is used in tests
- **Discoverable**: Easy to search codebase for test integration points
- **Semantic**: Can use meaningful names independent of UI text

### Naming Conventions

Use descriptive, hyphen-separated names:

```typescript
// ✅ Good
'data-test-id="user-profile-edit-btn"'
'data-test-id="order-list-item-123"'
'data-test-id="payment-form-card-number-input"'
'data-test-id="success-toast"'

// ❌ Bad
'data-test-id="btn1"'
'data-test-id="element"'
'data-test-id="thing"'
```

### Developer Responsibility

The Developer agent must add `data-test-id` attributes to all interactive elements as part of implementation. The Build Plan specifies which `data-test-id` values are required.

---

## 4. Wait Patterns

**Never use arbitrary sleeps or timeouts.** Use explicit waits for specific conditions.

### Recommended Wait Patterns

```typescript
// ✅ Wait for selector to be visible
await page.waitForSelector('[data-test-id="submit-btn"]', { 
  state: 'visible',
  timeout: 10000 // 10 seconds
});

// ✅ Wait for network response
await page.waitForResponse(
  response => response.url().includes('/api/orders') && response.status() === 200,
  { timeout: 15000 }
);

// ✅ Wait for network idle (all requests finished)
await page.waitForLoadState('networkidle');

// ✅ Wait for element to be clickable (visible and enabled)
const button = page.locator('[data-test-id="submit-btn"]');
await button.waitFor({ state: 'visible' });
await expect(button).toBeEnabled();

// ✅ Wait for text content
await expect(page.locator('[data-test-id="status"]')).toHaveText('Success');

// ❌ NEVER do this
await page.waitForTimeout(3000); // Arbitrary wait, flaky!
```

### Auto-Waiting

Playwright automatically waits for elements before actions:

```typescript
// These automatically wait for the element to be actionable:
await page.click('[data-test-id="submit-btn"]');
await page.fill('[data-test-id="name-input"]', 'John');
await page.check('[data-test-id="agree-checkbox"]');
```

But you should still add explicit waits for:
- Network responses
- Complex state changes
- Dynamic content loading
- Multi-step interactions

---

## 5. Test Structure (AAA Pattern + Gherkin Mapping)

### AAA Pattern

Structure all tests using Arrange-Act-Assert:

```typescript
test('should create a new order successfully', async ({ page }) => {
  // Arrange: Set up the initial state
  await authenticateUser(page, testUser);
  await page.goto('/orders/new');
  await page.waitForLoadState('networkidle');
  
  // Act: Perform the action being tested
  await page.fill('[data-test-id="order-product-input"]', 'Widget');
  await page.fill('[data-test-id="order-quantity-input"]', '5');
  await page.click('[data-test-id="order-submit-btn"]');
  
  // Assert: Verify the expected outcome
  await expect(page.locator('[data-test-id="success-toast"]'))
    .toBeVisible();
  await expect(page.locator('[data-test-id="success-toast"]'))
    .toContainText('Order created successfully');
  
  // Verify API call was made
  const response = await page.waitForResponse('**/api/orders');
  expect(response.status()).toBe(201);
});
```

### Gherkin Mapping

Map Gherkin steps from test cases to test code:

| Gherkin | AAA | Playwright |
|---------|-----|------------|
| Given (precondition) | Arrange | `goto()`, `fill()`, authentication helpers |
| When (action) | Act | `click()`, `fill()`, `press()`, user interactions |
| Then (outcome) | Assert | `expect()`, `toBeVisible()`, `toHaveText()` |

Example:

```typescript
// Test Case: payments-v2-TC-01
// Given the user is authenticated and on the payment page
// When the user fills valid card details and submits
// Then the payment completes and a confirmation message is shown

test('payments-v2-TC-01: Successful one-time payment', async ({ page }) => {
  // Given: User is authenticated and on payment page
  await authenticateUser(page, testUser);
  await page.goto('/payment');
  await page.waitForLoadState('networkidle');
  
  // When: User fills valid card details and submits
  await page.fill('[data-test-id="card-number-input"]', '4111111111111111');
  await page.fill('[data-test-id="card-expiry-input"]', '12/25');
  await page.fill('[data-test-id="card-cvc-input"]', '123');
  await page.click('[data-test-id="payment-submit-btn"]');
  
  // Then: Payment completes and confirmation shown
  await page.waitForResponse(
    response => response.url().includes('/api/payments') && response.status() === 200
  );
  await expect(page.locator('[data-test-id="payment-confirmation"]'))
    .toBeVisible();
  await expect(page.locator('[data-test-id="payment-confirmation"]'))
    .toContainText('Payment successful');
});
```

---

## 6. Test Data and Fixtures

### Test Data Principles

1. **Unique identifiers**: Use UUIDs or timestamps to avoid conflicts
2. **Deterministic**: Avoid random data, use fixtures
3. **Isolated**: Each test should create and clean up its own data
4. **Realistic**: Use realistic data structures, not just "test" strings

### Fixtures Directory Structure

```
tests/e2e/
├── <feature-id>/
│   ├── <feature-id>-TC-01.spec.ts
│   ├── <feature-id>-TC-02.spec.ts
│   └── fixtures/
│       ├── test-data.ts       # Test data factories
│       ├── test-users.ts      # User credentials
│       └── helpers.ts          # Shared utilities
└── shared/
    ├── auth.ts                 # Authentication helpers
    └── api.ts                  # API call helpers
```

### Example: Test Data Factory

```typescript
// tests/e2e/orders/fixtures/test-data.ts
import { v4 as uuidv4 } from 'uuid';

export const createTestOrder = () => ({
  id: uuidv4(),
  product: `Test Product ${Date.now()}`,
  quantity: 5,
  price: 99.99,
  customer: {
    email: `test-${uuidv4()}@example.com`,
    name: 'Test User',
  },
});

export const createTestUser = () => ({
  email: `test-${uuidv4()}@example.com`,
  password: 'Test123!',
  name: 'Test User',
});
```

### Example: Authentication Helper

```typescript
// tests/e2e/shared/auth.ts
import { Page } from '@playwright/test';

export async function authenticateUser(page: Page, user: { email: string; password: string }) {
  await page.goto('/login');
  await page.fill('[data-test-id="login-email-input"]', user.email);
  await page.fill('[data-test-id="login-password-input"]', user.password);
  await page.click('[data-test-id="login-submit-btn"]');
  
  // Wait for redirect to home page
  await page.waitForURL('/');
  await page.waitForLoadState('networkidle');
}

export async function logout(page: Page) {
  await page.click('[data-test-id="user-menu"]');
  await page.click('[data-test-id="logout-btn"]');
  await page.waitForURL('/login');
}
```

### Cleanup

Each test should clean up its data:

```typescript
test.afterEach(async ({ page }) => {
  // Clean up test data
  await deleteTestOrder(page, testOrderId);
  await deleteTestUser(page, testUserId);
});
```

Or use Playwright's `test.use()` for shared setup/teardown:

```typescript
test.use({
  storageState: async ({ }, use) => {
    const state = await setupTestUser();
    await use(state);
    await cleanupTestUser();
  },
});
```

---

## 7. Test Independence

**CRITICAL: Tests must be independent and runnable in any order.**

### Rules

- No shared mutable state between tests
- Each test creates its own test data
- Tests do not depend on other tests running first
- Clean up after each test

### Example: Independent Tests

```typescript
// ✅ Good: Each test is independent
test('should create order', async ({ page }) => {
  const user = await createTestUser();
  await authenticateUser(page, user);
  
  // ... test logic ...
  
  await cleanup(user);
});

test('should update order', async ({ page }) => {
  const user = await createTestUser();
  const order = await createTestOrder();
  await authenticateUser(page, user);
  
  // ... test logic ...
  
  await cleanup(user, order);
});

// ❌ Bad: Second test depends on first
test('should create order', async ({ page }) => {
  // Creates order with ID 123
});

test('should update order', async ({ page }) => {
  // Assumes order 123 exists from previous test
});
```

---

## 8. Error Handling and Debugging

### Handling Expected Errors

```typescript
// Test error scenarios
test('should show error for invalid payment', async ({ page }) => {
  await page.fill('[data-test-id="card-number-input"]', '0000');
  await page.click('[data-test-id="payment-submit-btn"]');
  
  // Assert error is shown
  await expect(page.locator('[data-test-id="error-message"]'))
    .toBeVisible();
  await expect(page.locator('[data-test-id="error-message"]'))
    .toContainText('Invalid card number');
  
  // Verify API returned 400
  const response = await page.waitForResponse('**/api/payments');
  expect(response.status()).toBe(400);
});
```

### Debugging Failed Tests

When tests fail, Playwright provides:

1. **Screenshots**: Automatically captured on failure
2. **Videos**: Recorded if configured
3. **Traces**: Full execution trace with DOM snapshots
4. **Console logs**: Browser console output

View traces:

```bash
npx playwright show-trace tests/e2e/artifacts/trace.zip
```

Run in debug mode:

```bash
PWDEBUG=1 npx playwright test
```

---

## 9. API Mocking (When Needed)

For tests that should not hit real external services:

```typescript
test('should handle API timeout gracefully', async ({ page }) => {
  // Mock API to timeout
  await page.route('**/api/payments', route => {
    // Delay indefinitely to simulate timeout
    // (test will timeout per configured timeout)
  });
  
  await page.goto('/payment');
  await page.fill('[data-test-id="card-number-input"]', '4111111111111111');
  await page.click('[data-test-id="payment-submit-btn"]');
  
  // Assert timeout error shown
  await expect(page.locator('[data-test-id="error-message"]'))
    .toContainText('Request timed out');
});
```

---

## 10. Running Tests

### Local Development

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/orders/orders-TC-01.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
PWDEBUG=1 npx playwright test

# Run specific test by name
npx playwright test -g "should create order successfully"
```

### CI/CD

```bash
# Install dependencies
npm ci
npx playwright install --with-deps

# Run tests
npm run test:e2e

# Generate HTML report
npx playwright show-report
```

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "PWDEBUG=1 playwright test"
  }
}
```

---

## 11. Complete Example Test File

```typescript
// tests/e2e/orders/orders-TC-01.spec.ts
import { test, expect } from '@playwright/test';
import { authenticateUser } from '../shared/auth';
import { createTestUser, createTestOrder } from './fixtures/test-data';

/**
 * Test Case ID: orders-v1-TC-01
 * Title: Create new order successfully
 * Objective: Verify authenticated user can create a new order
 */
test.describe('orders-v1-TC-01: Create new order', () => {
  let testUser: { email: string; password: string };
  let testOrder: { product: string; quantity: number };

  test.beforeEach(async () => {
    // Create fresh test data for each test
    testUser = createTestUser();
    testOrder = createTestOrder();
  });

  test('should create order and show confirmation', async ({ page }) => {
    // Arrange (Given): User is authenticated and on orders page
    await authenticateUser(page, testUser);
    await page.goto('/orders/new');
    await page.waitForLoadState('networkidle');
    
    // Act (When): User fills order form and submits
    await page.fill('[data-test-id="order-product-input"]', testOrder.product);
    await page.fill('[data-test-id="order-quantity-input"]', testOrder.quantity.toString());
    await page.click('[data-test-id="order-submit-btn"]');
    
    // Assert (Then): Order created and confirmation shown
    // Wait for API response
    const response = await page.waitForResponse(
      response => response.url().includes('/api/orders') && response.status() === 201,
      { timeout: 15000 }
    );
    
    // Verify response data
    const responseData = await response.json();
    expect(responseData).toMatchObject({
      product: testOrder.product,
      quantity: testOrder.quantity,
    });
    
    // Verify UI confirmation
    await expect(page.locator('[data-test-id="success-toast"]'))
      .toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-test-id="success-toast"]'))
      .toContainText('Order created successfully');
    
    // Verify redirect to order detail page
    await page.waitForURL(/\/orders\/\d+/);
    await expect(page.locator('[data-test-id="order-detail-product"]'))
      .toHaveText(testOrder.product);
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    // (Implementation depends on your cleanup strategy)
  });
});
```

---

## 12. Best Practices Summary

| Practice | Details |
|----------|---------|
| **Selectors** | Use `data-test-id` exclusively, never CSS/IDs |
| **Waits** | Explicit waits for conditions, never arbitrary sleeps |
| **Structure** | AAA pattern (Arrange-Act-Assert) |
| **Mapping** | Map Gherkin Given/When/Then to Arrange/Act/Assert |
| **Data** | Use fixtures, unique IDs, deterministic data |
| **Independence** | Each test creates and cleans up its own data |
| **Sequential** | Run tests one at a time (not parallel) |
| **Artifacts** | Save screenshots/videos only on failure |
| **Timeouts** | 60s per test, 10min service startup |
| **Comments** | Include test case ID and objective in comments |
| **Error handling** | Test both success and error paths |

---

## 13. Common Pitfalls to Avoid

| Pitfall | Solution |
|---------|----------|
| Using CSS selectors | Always use `[data-test-id="..."]` |
| Arbitrary waits (`setTimeout`) | Use `waitForSelector`, `waitForResponse` |
| Hardcoded data | Use fixtures and unique identifiers |
| Test dependencies | Make each test independent |
| Missing cleanup | Clean up test data after each test |
| Not testing errors | Include negative test cases |
| Parallel execution issues | Run tests sequentially |
| Missing explicit waits | Add waits for all async operations |
| Not checking API responses | Verify both UI and API behavior |
| Keeping all artifacts | Only save artifacts for failures |

---

## 14. Framework-Specific Resources

### Playwright Documentation

- **Official Docs**: https://playwright.dev
- **API Reference**: https://playwright.dev/docs/api/class-test
- **Best Practices**: https://playwright.dev/docs/best-practices
- **Trace Viewer**: https://playwright.dev/docs/trace-viewer

### Useful Playwright Commands

```bash
# Generate code by recording actions
npx playwright codegen http://localhost:4173

# Open last HTML report
npx playwright show-report

# Run tests with UI mode (interactive)
npx playwright test --ui

# Update snapshots
npx playwright test --update-snapshots
```

---

## 15. Integration with E2E Engineer Agent

The E2E Engineer agent will:

1. Read test cases from `rnd/test_cases/<feature-id>-test-cases.md`
2. Read build plans for `data-test-id` contracts from `rnd/build_plans/<feature-id>-build-plan.md`
3. Generate test files following patterns in this document
4. Start services per environment setup requirements
5. Run tests sequentially using `playwright test`
6. Diagnose failures (environment/methodology/code)
7. Save artifacts only for failed tests
8. Generate result report in `rnd/e2e-results/<feature-id>-e2e-result.md`

**E2E Engineer will use these instructions as the source of truth for all test generation and execution patterns.**

---

Keep tests simple, stable, and focused on validating end-to-end user flows.

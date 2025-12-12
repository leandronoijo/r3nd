import { test, expect } from '@playwright/test';

test.describe('Greeting Flow', () => {
  test('should load home page and display greeting with fact', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('[data-test-id="home-view"]');
    await page.waitForSelector('[data-test-id="greeting-card"]');

    const loadingIndicator = page.locator('[data-test-id="greeting-loading"]');
    await expect(loadingIndicator).toBeHidden({ timeout: 10000 });

    const greetingText = page.locator('[data-test-id="greeting-text"]');
    await expect(greetingText).toBeVisible();
    await expect(greetingText).toContainText('Hello from R3ND');

    const factText = page.locator('[data-test-id="greeting-fact-text"]');
    await expect(factText).toBeVisible();
    await expect(factText).not.toBeEmpty();

    const factLink = page.locator('[data-test-id="greeting-fact-link"]');
    await expect(factLink).toBeVisible();
    await expect(factLink).toHaveAttribute('href', /.+/);
  });

  test('should refresh greeting when refresh button clicked', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('[data-test-id="greeting-card"]');
    
    const loadingIndicator = page.locator('[data-test-id="greeting-loading"]');
    await expect(loadingIndicator).toBeHidden({ timeout: 10000 });

    const initialFactText = await page.locator('[data-test-id="greeting-fact-text"]').textContent();

    const refreshBtn = page.locator('[data-test-id="refresh-greeting-btn"]');
    await expect(refreshBtn).toBeVisible();
    
    await refreshBtn.click();

    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden({ timeout: 10000 });

    const greetingText = page.locator('[data-test-id="greeting-text"]');
    await expect(greetingText).toBeVisible();
    await expect(greetingText).toContainText('Hello from R3ND');

    const newFactText = await page.locator('[data-test-id="greeting-fact-text"]').textContent();
    expect(newFactText).toBeTruthy();
  });

  test('should have all required data-test-id attributes', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-test-id="home-view"]')).toBeVisible();
    await expect(page.locator('[data-test-id="greeting-card"]')).toBeVisible();
    await expect(page.locator('[data-test-id="refresh-greeting-btn"]')).toBeVisible();
    
    const loadingIndicator = page.locator('[data-test-id="greeting-loading"]');
    await expect(loadingIndicator).toBeHidden({ timeout: 10000 });

    await expect(page.locator('[data-test-id="greeting-text"]')).toBeVisible();
    await expect(page.locator('[data-test-id="greeting-fact-text"]')).toBeVisible();
    await expect(page.locator('[data-test-id="greeting-fact-link"]')).toBeVisible();
  });
});

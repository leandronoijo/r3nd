import { test, expect } from '@playwright/test';

test.describe('Greeting Flow', () => {
  test('should load home page and display greeting with fact', async ({ page }) => {
    await page.goto('/');

    // Wait for greeting card to appear
    const greetingCard = page.locator('[data-test-id="greeting-card"]');
    await expect(greetingCard).toBeVisible();

    // Wait for loading to complete
    await expect(page.locator('[data-test-id="greeting-loading"]')).not.toBeVisible({ timeout: 10000 });

    // Verify greeting text is displayed
    const greetingText = page.locator('[data-test-id="greeting-text"]');
    await expect(greetingText).toBeVisible();
    await expect(greetingText).toContainText('Hello from R3ND');

    // Verify fact is displayed
    const factText = page.locator('[data-test-id="greeting-fact-text"]');
    await expect(factText).toBeVisible();
    await expect(factText).not.toBeEmpty();

    // Verify fact link is present
    const factLink = page.locator('[data-test-id="greeting-fact-link"]');
    await expect(factLink).toBeVisible();
    await expect(factLink).toHaveAttribute('href', /.+/);
  });

  test('should refresh greeting when refresh button is clicked', async ({ page }) => {
    await page.goto('/');

    // Wait for initial load
    await expect(page.locator('[data-test-id="greeting-loading"]')).not.toBeVisible({ timeout: 10000 });

    // Get initial fact text
    const factText = page.locator('[data-test-id="greeting-fact-text"]');
    const initialFact = await factText.textContent();

    // Click refresh button
    const refreshButton = page.locator('[data-test-id="refresh-greeting-btn"]');
    await refreshButton.click();

    // Wait for new content (loading indicator should appear and disappear)
    await expect(page.locator('[data-test-id="greeting-loading"]')).toBeVisible();
    await expect(page.locator('[data-test-id="greeting-loading"]')).not.toBeVisible({ timeout: 10000 });

    // Verify greeting is still displayed
    await expect(page.locator('[data-test-id="greeting-text"]')).toBeVisible();

    // Note: We can't reliably test that the fact changed since the API might return the same fact
    // But we can verify the fact is still present
    await expect(factText).toBeVisible();
  });
});

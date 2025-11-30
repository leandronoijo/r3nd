import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.describe('Flow 1: Homepage loads with all sections', () => {
    test('should display all sections on homepage', async ({ page }) => {
      await page.goto('/');
      
      await page.waitForSelector('[data-test-id="homepage"]');
      
      await expect(page.locator('[data-test-id="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-test-id="features-section"]')).toBeVisible();
      await expect(page.locator('[data-test-id="differentiators-section"]')).toBeVisible();
      await expect(page.locator('[data-test-id="pipeline-section"]')).toBeVisible();
      await expect(page.locator('[data-test-id="quickstart-section"]')).toBeVisible();
      await expect(page.locator('[data-test-id="cta-section"]')).toBeVisible();
    });
  });

  test.describe('Flow 2: Hero section displays correct content', () => {
    test('should display correct headline and tagline', async ({ page }) => {
      await page.goto('/');
      
      const headline = page.locator('[data-test-id="hero-headline"]');
      await expect(headline).toContainText('AI-Driven R&D Pipeline');
      
      const tagline = page.locator('[data-test-id="hero-tagline"]');
      await expect(tagline).toContainText('From Idea to Code');
    });
  });

  test.describe('Flow 3: Feature cards render correctly', () => {
    test('should display all 5 feature cards', async ({ page }) => {
      await page.goto('/');
      
      for (let i = 0; i < 5; i++) {
        const card = page.locator(`[data-test-id="feature-card-${i}"]`);
        await expect(card).toBeVisible();
      }
    });

    test('each feature card should contain a title', async ({ page }) => {
      await page.goto('/');
      
      const expectedTitles = [
        'Out-of-the-box Personas',
        'End-to-end Multi-stage Workflow',
        'Clear R&D Artifact Structure',
        'Real Application Structure',
        'Repo-wide & Path-specific Copilot Rules'
      ];

      for (let i = 0; i < 5; i++) {
        const card = page.locator(`[data-test-id="feature-card-${i}"]`);
        await expect(card).toContainText(expectedTitles[i]);
      }
    });
  });

  test.describe('Flow 4: Copy button copies text to clipboard', () => {
    test('should copy command to clipboard when copy button is clicked', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      
      await page.goto('/');
      
      const copyButton = page.locator('[data-test-id="copy-button-0"]');
      await copyButton.click();
      
      // Read clipboard content
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardContent).toContain('git clone');
    });
  });

  test.describe('Flow 5: CTA buttons are clickable links', () => {
    test('should have href attributes on all CTA buttons', async ({ page }) => {
      await page.goto('/');
      
      const getStartedBtn = page.locator('[data-test-id="cta-get-started"]');
      const docsBtn = page.locator('[data-test-id="cta-documentation"]');
      const contributeBtn = page.locator('[data-test-id="cta-contribute"]');
      
      await expect(getStartedBtn).toHaveAttribute('href', /.+/);
      await expect(docsBtn).toHaveAttribute('href', /.+/);
      await expect(contributeBtn).toHaveAttribute('href', /.+/);
    });
  });

  test.describe('Flow 6: Responsive layout on mobile viewport', () => {
    test('should display all sections on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      await expect(page.locator('[data-test-id="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-test-id="features-section"]')).toBeVisible();
      await expect(page.locator('[data-test-id="differentiators-section"]')).toBeVisible();
      await expect(page.locator('[data-test-id="pipeline-section"]')).toBeVisible();
      await expect(page.locator('[data-test-id="quickstart-section"]')).toBeVisible();
      await expect(page.locator('[data-test-id="cta-section"]')).toBeVisible();
    });

    test('should not have horizontal scroll on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Player Credits', () => {
  test('should display 10,000 credits on Bridge screen', async ({ page }) => {
    await page.goto('/bridge');
    await page.waitForSelector('.system-map');

    await expect(page.locator('text=10,000')).toBeVisible();
    await expect(page.locator('.status-panel__label')).toContainText('BALANCE');
  });

  test('should display credits on Cargo screen', async ({ page }) => {
    await page.goto('/cargo');
    await page.waitForSelector('.cargo-view');

    await expect(page.locator('text=10,000')).toBeVisible();
    await expect(page.locator('.status-panel__label')).toContainText('BALANCE');
  });

  test('should maintain credits when navigating between screens', async ({ page }) => {
    // Start on Bridge
    await page.goto('/bridge');
    await page.waitForSelector('.system-map');
    await expect(page.locator('text=10,000')).toBeVisible();

    // Navigate to Cargo
    await page.locator('a', { hasText: 'Cargo' }).click();
    await expect(page).toHaveURL(/\/cargo/);
    await expect(page.locator('text=10,000')).toBeVisible();

    // Navigate back to Bridge
    await page.locator('a', { hasText: 'Bridge' }).click();
    await expect(page).toHaveURL(/\/bridge/);
    await expect(page.locator('text=10,000')).toBeVisible();
  });

  test('should display credits with proper formatting', async ({ page }) => {
    await page.goto('/bridge');
    await page.waitForSelector('.system-map');

    // Check for thousands separator formatting
    const creditsValue = page.locator('.status-panel__value');
    await expect(creditsValue).toBeVisible();
    await expect(creditsValue).toContainText('10,000');
  });

  test('should have Status panel with LCARS frame', async ({ page }) => {
    await page.goto('/bridge');
    await page.waitForSelector('.system-map');

    // Verify the Status panel exists with proper structure
    await expect(page.locator('.status-panel')).toBeVisible();
    await expect(page.locator('.status-panel__value')).toBeVisible();
    await expect(page.locator('.status-panel__label')).toBeVisible();
  });
});

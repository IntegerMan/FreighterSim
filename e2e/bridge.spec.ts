import { test, expect } from '@playwright/test';

test.describe('Bridge View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the bridge title', async ({ page }) => {
    await expect(page.locator('.bridge-view__title-text')).toContainText('SPACE FREIGHTER SIM');
  });

  test('should display system name in map', async ({ page }) => {
    await expect(page.locator('.system-map__system-name')).toContainText('Kestrel Reach');
  });

  test('should have navigation panel', async ({ page }) => {
    await expect(page.locator('text=Navigation').first()).toBeVisible();
  });

  test('should have sensors panel', async ({ page }) => {
    await expect(page.locator('text=Sensors').first()).toBeVisible();
  });

  test('should have docking panel', async ({ page }) => {
    await expect(page.locator('text=Docking').first()).toBeVisible();
  });

  test('should have time panel', async ({ page }) => {
    await expect(page.locator('text=Time').first()).toBeVisible();
  });
});

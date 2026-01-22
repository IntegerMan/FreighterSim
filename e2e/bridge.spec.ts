import { test, expect } from '@playwright/test';

test.describe('Bridge View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bridge');
    await page.waitForSelector('.system-map');
  });

  test('should display the application title', async ({ page }) => {
    await expect(page.locator('.app__title-text')).toContainText('SPACE FREIGHTER SIM');
  });

  test('should display bridge station title', async ({ page }) => {
    await expect(page.locator('.bridge-view__title-text')).toContainText('TACTICAL OVERVIEW');
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

  test('should have time panel', async ({ page }) => {
    await expect(page.locator('text=Time').first()).toBeVisible();
  });

  test('should have station tabs', async ({ page }) => {
    await expect(page.locator('.lcars-tab-bar')).toBeVisible();
    await expect(page.locator('a', { hasText: 'Bridge' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Helm' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Sensors' })).toBeVisible();
  });

  test('should navigate to Helm when clicking tab', async ({ page }) => {
    await page.locator('a', { hasText: 'Helm' }).click();
    await expect(page).toHaveURL(/\/helm/);
    await expect(page.locator('.helm-view__title-text')).toContainText('HELM CONTROL');
  });
});

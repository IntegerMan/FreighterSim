import { test, expect } from '@playwright/test';

test.describe('Cargo Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cargo');
    await page.waitForSelector('.cargo-view');
  });

  test('should display cargo hold title', async ({ page }) => {
    await expect(page.locator('.cargo-view__title-text')).toContainText('CARGO HOLD');
  });

  test('should show cargo bay frame', async ({ page }) => {
    await expect(page.locator('text=Cargo Bay')).toBeVisible();
  });

  test('should show cargo status panel', async ({ page }) => {
    await expect(page.locator('text=Cargo Status')).toBeVisible();
  });

  test('should display empty state when no cargo loaded', async ({ page }) => {
    await expect(page.locator('.cargo-grid__empty-text')).toContainText('NO CARGO LOADED');
  });

  test('should display capacity stats', async ({ page }) => {
    await expect(page.locator('text=BAY SLOTS')).toBeVisible();
    await expect(page.locator('text=OCCUPIED')).toBeVisible();
    await expect(page.locator('text=AVAILABLE')).toBeVisible();
  });

  test('should show total capacity of 24 slots', async ({ page }) => {
    // Default cargo bay is 4x6 = 24 slots
    const totalStat = page.locator('.cargo-panel__stat').filter({ hasText: 'BAY SLOTS' });
    await expect(totalStat.locator('.cargo-panel__stat-value')).toContainText('24');
  });

  test('should show empty status when no cargo', async ({ page }) => {
    await expect(page.locator('.cargo-panel__status--empty')).toContainText('EMPTY');
  });

  test('should display bay usage gauge', async ({ page }) => {
    await expect(page.locator('text=Bay Usage')).toBeVisible();
  });

  test('should navigate to Bridge when clicking tab', async ({ page }) => {
    await page.locator('a', { hasText: 'Bridge' }).click();
    await expect(page).toHaveURL(/\/bridge/);
  });

  test('should be accessible from navigation', async ({ page }) => {
    // Navigate away and back
    await page.goto('/bridge');
    await page.locator('a', { hasText: 'Cargo' }).click();
    await expect(page).toHaveURL(/\/cargo/);
  });
});

test.describe('Cargo Grid Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cargo');
    await page.waitForSelector('.cargo-view');
  });

  test('should have cargo grid container', async ({ page }) => {
    await expect(page.locator('.cargo-grid')).toBeVisible();
  });

  test('should show empty state with correct styling', async ({ page }) => {
    const emptyText = page.locator('.cargo-grid__empty-text');
    await expect(emptyText).toBeVisible();
    await expect(emptyText).toHaveCSS('text-transform', 'uppercase');
  });
});

test.describe('Cargo Panel Capacity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cargo');
    await page.waitForSelector('.cargo-panel');
  });

  test('should show 0 occupied slots when empty', async ({ page }) => {
    const occupiedStat = page.locator('.cargo-panel__stat').filter({ hasText: 'OCCUPIED' });
    await expect(occupiedStat.locator('.cargo-panel__stat-value')).toContainText('0');
  });

  test('should show 24 available slots when empty', async ({ page }) => {
    const availableStat = page.locator('.cargo-panel__stat').filter({ hasText: 'AVAILABLE' });
    await expect(availableStat.locator('.cargo-panel__stat-value')).toContainText('24');
  });

  test('should have gauge with 0% when empty', async ({ page }) => {
    // The gauge should show 0%
    await expect(page.locator('.lcars-gauge__value')).toContainText('0 %');
  });
});

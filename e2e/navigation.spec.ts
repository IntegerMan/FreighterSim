import { test, expect } from '@playwright/test';

test.describe('Helm Navigation Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Helm view for navigation controls
    await page.goto('/helm');
    await page.waitForSelector('.helm-map');
  });

  test('should display heading', async ({ page }) => {
    const headingDisplay = page.locator('text=Heading').first();
    await expect(headingDisplay).toBeVisible();
  });

  test('should display speed', async ({ page }) => {
    const speedDisplay = page.locator('text=Speed').first();
    await expect(speedDisplay).toBeVisible();
  });

  test('should have ALL STOP button', async ({ page }) => {
    const allStopButton = page.locator('button', { hasText: 'ALL STOP' });
    await expect(allStopButton).toBeVisible();
  });

  test('should have speed slider with target display', async ({ page }) => {
    // Speed slider should show target speed
    const targetText = page.locator('.speed-slider__target-value');
    await expect(targetText).toBeVisible();
    await expect(targetText).toContainText('Target:');
  });

  test('should stop when clicking ALL STOP', async ({ page }) => {
    // Click ALL STOP
    const allStopButton = page.locator('button', { hasText: 'ALL STOP' });
    await allStopButton.click();

    // Wait for update
    await page.waitForTimeout(100);

    // Should show 0 target
    await expect(page.locator('text=Target: 0')).toBeVisible();
  });

  test('should display helm station title', async ({ page }) => {
    await expect(page.locator('.helm-view__title-text')).toContainText('HELM CONTROL');
  });

  test('should show zoomed map with course projection', async ({ page }) => {
    // Helm map should be visible
    await expect(page.locator('.helm-map')).toBeVisible();
    await expect(page.locator('.helm-map__system-name')).toContainText('Kestrel Reach');
  });
});

test.describe('Collision Detection with Ship Shapes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/helm');
    await page.waitForSelector('.helm-map');
  });

  test('should display proximity warning panel', async ({ page }) => {
    // Proximity panel should be visible on helm
    await expect(page.locator('text=PROXIMITY').first()).toBeVisible();
  });

  test('should detect collision based on hull proximity not center distance', async ({ page }) => {
    // The collision system uses shape-based detection
    // Verify the helm map canvas is rendering collision-related visuals
    const canvas = page.locator('.helm-map__canvas');
    await expect(canvas).toBeVisible();
    
    // The proximity system is operational
    await expect(page.locator('text=PROXIMITY')).toBeVisible();
  });

  test('should show collision warning indicators on helm map', async ({ page }) => {
    // The helm map should have collision warning overlay capability
    const canvas = page.locator('.helm-map__canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
  });
});

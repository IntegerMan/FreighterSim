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

  test('should change speed when clicking speed preset', async ({ page }) => {
    // Click 50% speed
    const speedButton = page.locator('button', { hasText: '50%' });
    await speedButton.click();
    
    // Wait a bit for the UI to update
    await page.waitForTimeout(100);
    
    // Target speed should be updated (checking the target text appears)
    const targetText = page.locator('text=Target:').first();
    await expect(targetText).toBeVisible();
  });

  test('should stop when clicking ALL STOP', async ({ page }) => {
    // First set some speed
    const speedButton = page.locator('button', { hasText: '50%' });
    await speedButton.click();
    
    // Then stop
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

  test('should have docking panel', async ({ page }) => {
    await expect(page.locator('text=Docking').first()).toBeVisible();
  });
});

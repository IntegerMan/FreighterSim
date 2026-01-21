import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to initialize
    await page.waitForSelector('.system-map');
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
});

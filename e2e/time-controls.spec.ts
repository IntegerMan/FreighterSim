import { test, expect } from '@playwright/test';

test.describe('Time Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.system-map');
  });

  test('should display elapsed time', async ({ page }) => {
    await expect(page.locator('text=ELAPSED')).toBeVisible();
    // Should show time format HH:MM:SS
    await expect(page.locator('text=00:00:')).toBeVisible();
  });

  test('should have time scale buttons', async ({ page }) => {
    await expect(page.locator('button', { hasText: '1x' })).toBeVisible();
    await expect(page.locator('button', { hasText: '2x' })).toBeVisible();
    await expect(page.locator('button', { hasText: '4x' })).toBeVisible();
    await expect(page.locator('button', { hasText: '8x' })).toBeVisible();
  });

  test('should change time scale when clicking button', async ({ page }) => {
    const button2x = page.locator('button', { hasText: '2x' });
    await button2x.click();
    
    // Button should become active (gold color)
    await expect(button2x).toHaveClass(/lcars-button--active/);
  });

  test('should show running status', async ({ page }) => {
    await expect(page.locator('text=RUNNING')).toBeVisible();
  });
});

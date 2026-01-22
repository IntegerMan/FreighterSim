import { test, expect } from '@playwright/test';

test.describe('Sensors on Bridge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bridge');
    await page.waitForSelector('.system-map');
  });

  test('should display contacts count', async ({ page }) => {
    // Should show some contacts (stations and planets nearby)
    await expect(page.locator('text=CONTACTS')).toBeVisible();
  });

  test('should list nearby stations', async ({ page }) => {
    // Wait for sensors to detect contacts
    await page.waitForTimeout(600); // Wait for sensor refresh interval
    
    // Nexus Trading Hub should be visible (it's close to spawn)
    await expect(page.locator('text=Nexus Trading Hub')).toBeVisible();
  });

  test('should be able to select a contact', async ({ page }) => {
    await page.waitForTimeout(600);
    
    // Click on a contact
    const contact = page.locator('.sensor-panel__contact').first();
    await contact.click();
    
    // Should become selected
    await expect(contact).toHaveClass(/sensor-panel__contact--selected/);
  });
});

test.describe('Sensors View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sensors');
    await page.waitForSelector('.sensors-view');
  });

  test('should display sensor station title', async ({ page }) => {
    await expect(page.locator('.sensors-view__title-text')).toContainText('SENSOR STATION');
  });

  test('should show radar placeholder', async ({ page }) => {
    await expect(page.locator('text=RADAR DISPLAY')).toBeVisible();
    await expect(page.locator('text=Coming Soon')).toBeVisible();
  });

  test('should have sensor panel', async ({ page }) => {
    await expect(page.locator('text=Sensors').first()).toBeVisible();
  });

  test('should navigate to Bridge when clicking tab', async ({ page }) => {
    await page.locator('a', { hasText: 'Bridge' }).click();
    await expect(page).toHaveURL(/\/bridge/);
  });
});

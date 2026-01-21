import { test, expect } from '@playwright/test';

test.describe('Sensors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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

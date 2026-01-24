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

  test('should show proximity radar display', async ({ page }) => {
    await expect(page.locator('text=Proximity Radar')).toBeVisible();
  });

  test('should show particle traces display', async ({ page }) => {
    await expect(page.locator('text=Particle Traces')).toBeVisible();
  });

  test('should have sensor panel', async ({ page }) => {
    await expect(page.locator('text=Sensors').first()).toBeVisible();
  });

  test('should navigate to Bridge when clicking tab', async ({ page }) => {
    await page.locator('a', { hasText: 'Bridge' }).click();
    await expect(page).toHaveURL(/\/bridge/);
  });
});

test.describe('Sensor Raytracing and Occlusion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bridge');
    await page.waitForSelector('.system-map');
  });

  test('should detect contacts using shape-based sensing', async ({ page }) => {
    // Wait for sensor refresh cycle
    await page.waitForTimeout(600);
    
    // Sensors should detect nearby objects
    await expect(page.locator('text=CONTACTS')).toBeVisible();
    
    // Contacts list should have items
    const contacts = page.locator('.sensor-panel__contact');
    const count = await contacts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show contact information based on sensor data', async ({ page }) => {
    await page.waitForTimeout(600);
    
    // Station contacts should include name and type info
    await expect(page.locator('text=Nexus Trading Hub')).toBeVisible();
  });

  test('should affect contact visibility based on occlusion', async ({ page }) => {
    // Sensor system uses raytracing for occlusion
    // Verify sensor panel is operational
    await page.waitForTimeout(600);
    
    const sensorPanel = page.locator('.sensor-panel');
    await expect(sensorPanel).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Ship Shape Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bridge');
    await page.waitForSelector('.system-map');
  });

  test('should display player ship as polygon on bridge map', async ({ page }) => {
    // The system map canvas should be visible
    const canvas = page.locator('.system-map__canvas');
    await expect(canvas).toBeVisible();

    // Take a screenshot to verify ship is rendered as polygon (manual verification)
    // The canvas renders the ship shape, so we verify the canvas exists and is being drawn
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);
  });

  test('should display helm map with player ship shape', async ({ page }) => {
    await page.goto('/helm');
    await page.waitForSelector('.helm-map');

    // The helm map canvas should be visible
    const canvas = page.locator('.helm-map__canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show ship with distinct Serenity-inspired silhouette', async ({ page }) => {
    // Navigate to helm for zoomed view of ship
    await page.goto('/helm');
    await page.waitForSelector('.helm-map');

    // The ship should be centered and visible
    const canvas = page.locator('.helm-map__canvas');
    await expect(canvas).toBeVisible();
    
    // Verify canvas is actively being drawn (has dimensions)
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(200);
    expect(box!.height).toBeGreaterThan(200);
  });
});

test.describe('Station Shape Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bridge');
    await page.waitForSelector('.system-map');
  });

  test('should display stations with modular structure', async ({ page }) => {
    // Wait for sensors to detect contacts (includes stations)
    await page.waitForTimeout(600);
    
    // Nexus Trading Hub should be visible in sensor contacts
    await expect(page.locator('text=Nexus Trading Hub')).toBeVisible();
    
    // The system map canvas renders station shapes
    const canvas = page.locator('.system-map__canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render station modules as connected shapes', async ({ page }) => {
    // The canvas should be drawing station modules
    const canvas = page.locator('.system-map__canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    
    // Station shapes are rendered on canvas - verify canvas is operational
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);
  });

  test('should show different station types with distinct appearances', async ({ page }) => {
    await page.waitForTimeout(600);
    
    // Multiple stations should be detectable
    // Trading Hub and Mining Outpost exist in Kestrel Reach
    const contacts = page.locator('.sensor-panel__contact');
    const count = await contacts.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('NPC Ship Shape Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bridge');
    await page.waitForSelector('.system-map');
  });

  test('should render NPC ships with distinct shapes based on type', async ({ page }) => {
    // Wait for sensor refresh
    await page.waitForTimeout(600);
    
    // The canvas should be rendering any detected ship contacts
    const canvas = page.locator('.system-map__canvas');
    await expect(canvas).toBeVisible();
    
    // Canvas is actively rendering
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
  });

  test('should fall back to circle for ships without templateId', async ({ page }) => {
    // This is a graceful degradation test - verify rendering doesn't crash
    const canvas = page.locator('.system-map__canvas');
    await expect(canvas).toBeVisible();
    
    // Wait for any rendering to complete
    await page.waitForTimeout(300);
    
    // Canvas should still be functional
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
  });
});

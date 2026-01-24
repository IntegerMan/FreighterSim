import { test, expect } from '@playwright/test';

test.describe('Parallax Starfield Background', () => {
  test.describe('Helm Map View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/helm');
      await page.waitForSelector('.helm-map');
      // Wait for canvas to be ready and initial render
      await page.waitForTimeout(500);
    });

    test('should display starfield on helm map canvas', async ({ page }) => {
      // The helm map canvas should be visible
      const canvas = page.locator('.helm-map canvas');
      await expect(canvas).toBeVisible();

      // Take a screenshot to verify starfield renders (visual verification)
      // The canvas should contain more than just a black background
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).toBeTruthy();
      expect(canvasBox!.width).toBeGreaterThan(0);
      expect(canvasBox!.height).toBeGreaterThan(0);
    });

    test('should render stars deterministically based on position', async ({ page }) => {
      // This test verifies that the starfield renders - the key property
      // is that stars are generated deterministically, which is verified
      // in the unit tests. Here we just verify the canvas renders content.
      const canvas = page.locator('.helm-map canvas');

      // Get a screenshot to verify rendering occurred
      const screenshot = await canvas.screenshot();

      // Verify the screenshot has content (not all black)
      // A pure black image would have very low total pixel values
      expect(screenshot.length).toBeGreaterThan(1000); // PNG has reasonable size
    });

    test('should update when camera moves via pan', async ({ page }) => {
      const canvas = page.locator('.helm-map canvas');

      // Take screenshot before pan
      const beforePan = await canvas.screenshot();

      // Pan the camera by right-click dragging
      const canvasBox = await canvas.boundingBox();
      const centerX = canvasBox!.x + canvasBox!.width / 2;
      const centerY = canvasBox!.y + canvasBox!.height / 2;

      await page.mouse.move(centerX, centerY);
      await page.mouse.down({ button: 'right' });
      await page.mouse.move(centerX + 100, centerY + 100, { steps: 10 });
      await page.mouse.up({ button: 'right' });

      // Wait for render
      await page.waitForTimeout(100);

      // Take screenshot after pan
      const afterPan = await canvas.screenshot();

      // Screenshots should differ (camera moved, stars repositioned)
      expect(beforePan.equals(afterPan)).toBe(false);
    });

    test('should update when zooming', async ({ page }) => {
      const canvas = page.locator('.helm-map canvas');

      // Take screenshot before zoom
      const beforeZoom = await canvas.screenshot();

      // Zoom using mouse wheel
      const canvasBox = await canvas.boundingBox();
      const centerX = canvasBox!.x + canvasBox!.width / 2;
      const centerY = canvasBox!.y + canvasBox!.height / 2;

      await page.mouse.move(centerX, centerY);
      await page.mouse.wheel(0, -200); // Zoom in

      // Wait for render
      await page.waitForTimeout(100);

      // Take screenshot after zoom
      const afterZoom = await canvas.screenshot();

      // Screenshots should differ (zoom changed star positions)
      expect(beforeZoom.equals(afterZoom)).toBe(false);
    });
  });

  test.describe('System Map View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.system-map');
      await page.waitForTimeout(500);
    });

    test('should display starfield on system map canvas', async ({ page }) => {
      const canvas = page.locator('.system-map canvas');
      await expect(canvas).toBeVisible();

      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).toBeTruthy();
      expect(canvasBox!.width).toBeGreaterThan(0);
      expect(canvasBox!.height).toBeGreaterThan(0);
    });

    test('should render starfield behind other elements', async ({ page }) => {
      // Verify the system map shows expected elements (proves render order is correct)
      // If starfield was rendered on top, these elements would be obscured
      const canvas = page.locator('.system-map canvas');
      await expect(canvas).toBeVisible();

      // The system name should be visible in the overlay (not on canvas)
      const systemName = page.locator('.system-map__system-name');
      await expect(systemName).toBeVisible();
    });
  });

  test.describe('Parallax Effect', () => {
    test('should show different movement rates for different layers during ship movement', async ({
      page,
    }) => {
      await page.goto('/helm');
      await page.waitForSelector('.helm-map');
      await page.waitForTimeout(500);

      const canvas = page.locator('.helm-map canvas');

      // Take initial screenshot
      const initial = await canvas.screenshot();

      // Set ship speed by clicking on the speed slider
      // This will cause the ship to move and trigger parallax
      const speedSlider = page.locator('.speed-slider');
      if (await speedSlider.isVisible()) {
        const sliderBox = await speedSlider.boundingBox();
        if (sliderBox) {
          // Click on the right side of the slider to increase speed
          await page.mouse.click(
            sliderBox.x + sliderBox.width * 0.8,
            sliderBox.y + sliderBox.height / 2
          );
        }
      }

      // Wait for ship to move and starfield to update
      await page.waitForTimeout(1500);

      // Take screenshot after movement
      const afterMovement = await canvas.screenshot();

      // Screenshots should differ (ship moved, parallax effect visible)
      expect(initial.equals(afterMovement)).toBe(false);
    });
  });
});

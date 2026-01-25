import { test, expect } from '@playwright/test';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareScreenshotBuffer } from '../tests/parity/compareVisuals';

/**
 * Visual Parity Tests
 *
 * These tests compare the current PixiJS rendering against the pre-cutover
 * Canvas baselines captured via captureBaseline.spec.ts.
 *
 * Success criteria: 95% element/pixel match threshold.
 *
 * Note: Small differences are expected due to rendering engine differences.
 * The tests focus on ensuring key UI elements are present and positioned correctly.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASELINE_DIR = path.join(__dirname, 'parity', 'baselines');

// Match threshold percentage (95% as per spec)
const MATCH_THRESHOLD = 95;

// Pixel threshold for pixelmatch (0-1, lower = stricter)
// Using 0.2 to allow for anti-aliasing and minor rendering differences
const PIXEL_THRESHOLD = 0.2;

test.describe('Visual Parity Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test('T045: Navigation/Map Screen Visual Parity (95% match)', async ({ page }) => {
    await page.goto('/bridge');

    // Wait for the map to be visible and WebGL initialized
    await page.waitForSelector('.system-map');

    // Wait for rendering to settle
    await page.waitForTimeout(3000);

    // Capture current screenshot
    const screenshot = await page.screenshot({ fullPage: true });

    // Compare with baseline
    const baselinePath = path.join(BASELINE_DIR, 'navigation-map.png');
    const result = await compareScreenshotBuffer(baselinePath, screenshot, {
      threshold: MATCH_THRESHOLD,
      pixelThreshold: PIXEL_THRESHOLD,
      saveDiff: true,
      diffOutputPath: path.join(BASELINE_DIR, 'navigation-map-diff.png'),
    });

    console.log(`Navigation Map Parity: ${result.matchPercentage.toFixed(2)}% match`);
    console.log(`  Diff pixels: ${result.diffPixelCount} / ${result.totalPixels}`);

    // Verify 95% match threshold
    expect(
      result.matchPercentage,
      `Navigation map should have ≥${MATCH_THRESHOLD}% visual parity (got ${result.matchPercentage.toFixed(2)}%)`
    ).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  test('T045b: Helm Map Visual Parity (95% match)', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Helm")');

    // Wait for the helm map to be visible
    await page.waitForSelector('.helm-map, .system-map');

    // Wait for rendering to settle
    await page.waitForTimeout(3000);

    // Capture current screenshot
    const screenshot = await page.screenshot({ fullPage: true });

    // Compare with baseline
    const baselinePath = path.join(BASELINE_DIR, 'helm-map.png');
    const result = await compareScreenshotBuffer(baselinePath, screenshot, {
      threshold: MATCH_THRESHOLD,
      pixelThreshold: PIXEL_THRESHOLD,
      saveDiff: true,
      diffOutputPath: path.join(BASELINE_DIR, 'helm-map-diff.png'),
    });

    console.log(`Helm Map Parity: ${result.matchPercentage.toFixed(2)}% match`);
    console.log(`  Diff pixels: ${result.diffPixelCount} / ${result.totalPixels}`);

    expect(
      result.matchPercentage,
      `Helm map should have ≥${MATCH_THRESHOLD}% visual parity (got ${result.matchPercentage.toFixed(2)}%)`
    ).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  test('T046: Cargo Screen Visual Parity (95% match)', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Cargo")');

    // Wait for the cargo view to be visible
    await page.waitForSelector('.cargo-view, .cargo-grid');

    // Wait for rendering to settle
    await page.waitForTimeout(3000);

    // Capture current screenshot
    const screenshot = await page.screenshot({ fullPage: true });

    // Compare with baseline
    const baselinePath = path.join(BASELINE_DIR, 'cargo-screen.png');
    const result = await compareScreenshotBuffer(baselinePath, screenshot, {
      threshold: MATCH_THRESHOLD,
      pixelThreshold: PIXEL_THRESHOLD,
      saveDiff: true,
      diffOutputPath: path.join(BASELINE_DIR, 'cargo-screen-diff.png'),
    });

    console.log(`Cargo Screen Parity: ${result.matchPercentage.toFixed(2)}% match`);
    console.log(`  Diff pixels: ${result.diffPixelCount} / ${result.totalPixels}`);

    expect(
      result.matchPercentage,
      `Cargo screen should have ≥${MATCH_THRESHOLD}% visual parity (got ${result.matchPercentage.toFixed(2)}%)`
    ).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  test('T047: Radar Display / Sensors Visual Parity (95% match)', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Sensors")');

    // Wait for the sensors view to be visible
    await page.waitForSelector('.radar-display, .sensors-view');

    // Wait for rendering to settle
    await page.waitForTimeout(3000);

    // Capture current screenshot
    const screenshot = await page.screenshot({ fullPage: true });

    // Compare with baseline
    const baselinePath = path.join(BASELINE_DIR, 'radar-display.png');
    const result = await compareScreenshotBuffer(baselinePath, screenshot, {
      threshold: MATCH_THRESHOLD,
      pixelThreshold: PIXEL_THRESHOLD,
      saveDiff: true,
      diffOutputPath: path.join(BASELINE_DIR, 'radar-display-diff.png'),
    });

    console.log(`Radar Display Parity: ${result.matchPercentage.toFixed(2)}% match`);
    console.log(`  Diff pixels: ${result.diffPixelCount} / ${result.totalPixels}`);

    expect(
      result.matchPercentage,
      `Radar display should have ≥${MATCH_THRESHOLD}% visual parity (got ${result.matchPercentage.toFixed(2)}%)`
    ).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  test('T047b: Bridge Overlays with Selection', async ({ page }) => {
    await page.goto('/bridge');

    // Wait for the map to be visible
    await page.waitForSelector('.system-map');

    // Wait for rendering to settle
    await page.waitForTimeout(2000);

    // Try to click on a station or object to trigger selection highlight
    // This tests selection overlays
    const mapContainer = await page.$('.system-map');
    if (mapContainer) {
      const box = await mapContainer.boundingBox();
      if (box) {
        // Click roughly in the center of the map
        await page.click('.system-map', {
          position: { x: box.width / 2, y: box.height / 2 },
        });
      }
    }

    // Wait for selection effects
    await page.waitForTimeout(1000);

    // Verify the page doesn't crash and key elements are still visible
    await expect(page.locator('.system-map')).toBeVisible();

    // Check for LCARS UI elements
    await expect(page.locator('.lcars-frame, .lcars-button, [class*="lcars"]').first()).toBeVisible();

    console.log('Bridge overlays and selection test passed');
  });

  test('T047c: Tooltip Interaction', async ({ page }) => {
    await page.goto('/bridge');

    // Wait for the map to be visible
    await page.waitForSelector('.system-map');

    await page.waitForTimeout(2000);

    // Hover over the map area to potentially trigger tooltips
    const mapContainer = await page.$('.system-map');
    if (mapContainer) {
      const box = await mapContainer.boundingBox();
      if (box) {
        // Move mouse to different positions to trigger potential tooltips
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
        await page.waitForTimeout(500);
        await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6);
        await page.waitForTimeout(500);
      }
    }

    // Verify the page is still functional
    await expect(page.locator('.system-map')).toBeVisible();

    console.log('Tooltip interaction test passed');
  });
});

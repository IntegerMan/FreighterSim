import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Utility to capture baseline screenshots for visual parity testing.
 * This should be run ONCE for the legacy Canvas version before it is removed.
 * Screenshots are saved to tests/parity/baselines/
 */

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASELINE_DIR = path.join(__dirname, 'baselines');

test.describe('Baseline Capture', () => {
    test.beforeAll(async () => {
        if (!fs.existsSync(BASELINE_DIR)) {
            fs.mkdirSync(BASELINE_DIR, { recursive: true });
        }
    });

    test('Capture Navigation/Map Baseline', async ({ page }) => {
        await page.goto('/bridge');
        // Wait for the app to load and the map to be visible
        await page.waitForSelector('.system-map');

        // Give some time for initial animations/rendering to settle
        await page.waitForTimeout(3000);

        await page.screenshot({
            path: path.join(BASELINE_DIR, 'navigation-map.png'),
            fullPage: true
        });

        console.log(`Captured baseline: ${path.join(BASELINE_DIR, 'navigation-map.png')}`);
    });

    test('Capture Helm Map Baseline', async ({ page }) => {
        await page.goto('/');
        await page.click('a:has-text("Helm")');
        await page.waitForSelector('.helm-map, .system-map');

        await page.waitForTimeout(3000);

        await page.screenshot({
            path: path.join(BASELINE_DIR, 'helm-map.png'),
            fullPage: true
        });

        console.log(`Captured baseline: ${path.join(BASELINE_DIR, 'helm-map.png')}`);
    });

    test('Capture Cargo Screen Baseline', async ({ page }) => {
        await page.goto('/');
        await page.click('a:has-text("Cargo")');
        await page.waitForSelector('.cargo-view, .cargo-grid');

        await page.waitForTimeout(3000);

        await page.screenshot({
            path: path.join(BASELINE_DIR, 'cargo-screen.png'),
            fullPage: true
        });

        console.log(`Captured baseline: ${path.join(BASELINE_DIR, 'cargo-screen.png')}`);
    });

    test('Capture Radar Display Baseline', async ({ page }) => {
        await page.goto('/');
        await page.click('a:has-text("Sensors")');
        await page.waitForSelector('.radar-display, .sensors-view');

        await page.waitForTimeout(3000);

        await page.screenshot({
            path: path.join(BASELINE_DIR, 'radar-display.png'),
            fullPage: true
        });

        console.log(`Captured baseline: ${path.join(BASELINE_DIR, 'radar-display.png')}`);
    });
});

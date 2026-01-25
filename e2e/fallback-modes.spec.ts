import { test, expect } from '@playwright/test';

/**
 * E2E tests for fallback modes and graceful degradation.
 * Tests the app's behavior when WebGL is unavailable or in fallback mode.
 *
 * Per SC-004: When WebGL/GPU is unavailable at startup, the app presents a clear,
 * actionable error message within 2 seconds explaining WebGL requirement and halts gracefully.
 */

test.describe('Fallback Modes', () => {
  test('T050: WebGL1 fallback mode functionality', async ({ page }) => {
    // Mock WebGL2 to be unavailable, but allow WebGL1
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        contextId: string,
        options?: unknown
      ) {
        // Block WebGL2, allow WebGL1
        if (contextId === 'webgl2') {
          return null;
        }
        return originalGetContext.call(this, contextId, options);
      };
    });

    await page.goto('/');

    // App should still function with WebGL1 fallback
    // Wait for the app to load and render
    await page.waitForSelector('.app', { timeout: 5000 });

    // Verify no error is shown (WebGL1 is sufficient)
    const errorElement = page.locator('.capability-error');
    await expect(errorElement).not.toBeVisible();

    // Verify the app header is visible (app is functional)
    const header = page.locator('.app__header');
    await expect(header).toBeVisible();
  });

  test('T051: WebGL unavailable shows clear error message', async ({ page }) => {
    // Mock both WebGL2 and WebGL1 to be unavailable
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        contextId: string,
        options?: unknown
      ) {
        // Block all WebGL contexts
        if (
          contextId === 'webgl' ||
          contextId === 'webgl2' ||
          contextId === 'experimental-webgl'
        ) {
          return null;
        }
        return originalGetContext.call(this, contextId, options);
      };
    });

    await page.goto('/');

    // Wait for the error component to appear
    const errorElement = page.locator('.capability-error');
    await expect(errorElement).toBeVisible({ timeout: 5000 });

    // Verify the error title is displayed
    const title = page.locator('.capability-error__title');
    await expect(title).toContainText('Graphics Not Available');

    // Verify the user message is displayed
    const message = page.locator('.capability-error__message');
    await expect(message).toBeVisible();
    await expect(message).toContainText('WebGL');

    // Verify suggestions are displayed
    const suggestions = page.locator('.capability-error__suggestions');
    await expect(suggestions).toBeVisible();

    // Verify the WebGL support link is present
    const link = page.locator('.capability-error__link');
    await expect(link).toHaveAttribute('href', 'https://get.webgl.org/');

    // Verify the app content is NOT visible (app halted)
    const appContent = page.locator('.app');
    await expect(appContent).not.toBeVisible();
  });

  test('T052: Error message appears within 2 seconds and app halts', async ({
    page,
  }) => {
    // Mock all WebGL and Canvas to be unavailable for complete failure
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        contextId: string,
        options?: unknown
      ) {
        // Block all WebGL contexts (Canvas 2D is allowed but not sufficient per spec)
        if (
          contextId === 'webgl' ||
          contextId === 'webgl2' ||
          contextId === 'experimental-webgl'
        ) {
          return null;
        }
        return originalGetContext.call(this, contextId, options);
      };
    });

    const startTime = Date.now();
    await page.goto('/');

    // Wait for error to appear with a 2-second timeout (SC-004 requirement)
    const errorElement = page.locator('.capability-error');
    await expect(errorElement).toBeVisible({ timeout: 2000 });

    const elapsedTime = Date.now() - startTime;

    // Verify error appeared within 2 seconds
    expect(elapsedTime).toBeLessThan(2000);

    // Verify the error code is displayed
    const errorCode = page.locator('.capability-error__code');
    await expect(errorCode).toBeVisible();
    await expect(errorCode).toContainText('WEBGL_UNAVAILABLE');

    // Verify that the main app did not render (halted gracefully)
    const mainApp = page.locator('.app');
    await expect(mainApp).not.toBeVisible();

    // Verify no game loop started (no console errors about missing stores)
    // This is implicitly tested by the app not crashing
  });

  test('App functions normally with full WebGL2 support', async ({ page }) => {
    // No mocking - use browser's native WebGL support
    await page.goto('/');

    // Wait for the app to load
    await page.waitForSelector('.app', { timeout: 10000 });

    // Verify no error is shown
    const errorElement = page.locator('.capability-error');
    await expect(errorElement).not.toBeVisible();

    // Verify the app is functional
    const header = page.locator('.app__header');
    await expect(header).toBeVisible();

    // Verify navigation tabs are present
    const tabBar = page.locator('.lcars-tab-bar');
    await expect(tabBar).toBeVisible();
  });
});

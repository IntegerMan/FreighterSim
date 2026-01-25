import { expect, Page, test } from '@playwright/test';

async function waitForTelemetry(page: Page) {
	await page.waitForFunction(() => Boolean((window as any).__telemetry));
}

test.describe('Rendering performance', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/helm');
		await waitForTelemetry(page);
		await page.waitForTimeout(250);
	});

	test('busy scene sustains target frame time', async ({ page }) => {
		await page.waitForTimeout(1500);
		const metrics = await page.evaluate(() => (window as any).__telemetry?.getRendererMetrics());
		expect(metrics).toBeTruthy();
		const avgFps = metrics?.avgFps ?? metrics?.fps ?? 0;
		expect(avgFps).toBeGreaterThanOrEqual(55);
		expect(metrics?.frameTimeP95Ms ?? 0).toBeLessThanOrEqual(30);
	});

	test('particle-heavy scene obeys particle cap', async ({ page }) => {
		await page.evaluate(() => {
			const telemetry = (window as any).__telemetry;
			if (!telemetry) throw new Error('Telemetry not available');
			const store = telemetry.getParticleStore();
			const profile = telemetry.getPerformanceProfile();
			store.reset();

			const cap = profile.particleCap ?? 5000;
			for (let i = 0; i < cap + 1200; i++) {
				store.emitParticles({ x: (i % 200) * 10, y: Math.floor(i / 200) * 10 }, 1);
			}
		});

		await page.waitForTimeout(200);
		const { particleCount, cap } = await page.evaluate(() => {
			const telemetry = (window as any).__telemetry;
			const metrics = telemetry?.getRendererMetrics();
			const profile = telemetry?.getPerformanceProfile();
			return { particleCount: metrics?.particleCount ?? 0, cap: profile?.particleCap ?? 5000 };
		});

		expect(particleCount).toBeLessThanOrEqual(cap);
	});

	test('input latency surrogate stays under threshold', async ({ page }) => {
		await page.waitForTimeout(1200);
		const metrics = await page.evaluate(() => (window as any).__telemetry?.getRendererMetrics());
		expect(metrics).toBeTruthy();
		// Frame time p95 below 25ms implies responsive input (<100ms perceived latency)
		expect(metrics?.frameTimeP95Ms ?? 999).toBeLessThanOrEqual(25);
	});
});

import { test, expect } from '@playwright/test';

test('Check Capabilities', async ({ page }) => {
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`PAGE ERROR: ${msg.text()}`);
    });
    page.on('pageerror', err => {
        console.log(`PAGE UNCAUGHT ERROR: ${err.message}`);
    });

    await page.goto('/');

    // Wait for a bit for the app to initialize
    await page.waitForTimeout(5000);

    const capabilities = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const webgl2 = !!canvas.getContext('webgl2');
        const webgl1 = !!canvas.getContext('webgl');
        return { webgl2, webgl1 };
    });
    console.log('Capabilities:', capabilities);

    const html = await page.content();
    console.log('HTML Snippet:', html.substring(0, 1000));

    const bodyText = await page.innerText('body');
    console.log('Body Text:', bodyText.substring(0, 500));

    const path = await page.evaluate(() => window.location.pathname);
    console.log('Current Path:', path);
});

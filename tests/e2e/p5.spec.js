const { test, expect } = require('@playwright/test');

test.describe('p5.js adapter (index.html)', () => {
    test('page loads without JS errors', async ({ page }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));

        await page.goto('/index.html');
        // Wait long enough for p5 setup() to complete and one draw() tick to run
        await page.waitForTimeout(800);

        expect(errors).toHaveLength(0);
    });

    test('canvas element is present and has non-zero dimensions', async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForTimeout(500);

        const canvas = page.locator('canvas');
        await expect(canvas).toBeVisible();
        const box = await canvas.boundingBox();
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
    });

    test('gameEngine global is initialised with a grid', async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForTimeout(500);

        const gridSize = await page.evaluate(() => ({
            rows: window.gameEngine.gameEngine.rows,
            cols: window.gameEngine.gameEngine.cols,
            mapLength: window.gameEngine.gameEngine.gameMap.length,
        }));

        expect(gridSize.rows).toBeGreaterThan(0);
        expect(gridSize.cols).toBeGreaterThan(0);
        expect(gridSize.mapLength).toBe(gridSize.rows);
    });

    test('ArrowRight key moves Pac-Man right (or stays if wall is present)', async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForTimeout(500);

        // Force-clear any right wall on Pac-Man's starting cell so movement is guaranteed
        await page.evaluate(() => {
            const eng = window.gameEngine.gameEngine;
            eng.gameMap[eng.pacman.pacman.x][eng.pacman.pacman.y].removeRightWall();
        });

        const before = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.x);

        // p5 keyPressed reads p5's own keyCode global — we trigger the DOM event on the canvas
        await page.locator('canvas').press('ArrowRight');
        await page.waitForTimeout(200);

        const after = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.x);
        expect(after).toBeGreaterThan(before);
    });

    test('ArrowLeft key moves Pac-Man left (or stays if wall is present)', async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForTimeout(500);

        await page.evaluate(() => {
            const eng = window.gameEngine.gameEngine;
            eng.gameMap[eng.pacman.pacman.x][eng.pacman.pacman.y].removeLeftWall();
        });

        const before = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.x);

        await page.locator('canvas').press('ArrowLeft');
        await page.waitForTimeout(200);

        const after = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.x);
        expect(after).toBeLessThan(before);
    });

    test('Pac-Man never moves outside the grid boundaries', async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForTimeout(500);

        // Press a key many times and verify position stays in bounds
        for (let i = 0; i < 30; i++) {
            await page.locator('canvas').press('ArrowRight');
        }
        await page.waitForTimeout(500);

        const { x, y, cols, rows } = await page.evaluate(() => ({
            x: window.gameEngine.gameEngine.pacman.pacman.x,
            y: window.gameEngine.gameEngine.pacman.pacman.y,
            cols: window.gameEngine.gameEngine.cols,
            rows: window.gameEngine.gameEngine.rows,
        }));

        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(cols);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(rows);
    });
});

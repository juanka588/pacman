const { test, expect } = require('@playwright/test');

test.describe('SVG adapter (flatSVG.html)', () => {
    test('page loads without JS errors', async ({ page }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));

        await page.goto('/flatSVG.html');
        await page.waitForTimeout(800);

        expect(errors).toHaveLength(0);
    });

    test('SVG element is present and has non-zero dimensions', async ({ page }) => {
        await page.goto('/flatSVG.html');
        await page.waitForTimeout(500);

        const svg = page.locator('#game-screen');
        await expect(svg).toBeVisible();
        const box = await svg.boundingBox();
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
    });

    test('SVG contains wall lines after maze generation', async ({ page }) => {
        await page.goto('/flatSVG.html');
        await page.waitForTimeout(500);

        // Maze walls are rendered as <line> elements inside the SVG
        const lineCount = await page.locator('#game-screen line').count();
        expect(lineCount).toBeGreaterThan(0);
    });

    test('SVG contains Pac-Man group element', async ({ page }) => {
        await page.goto('/flatSVG.html');
        await page.waitForTimeout(500);

        const pacman = page.locator('#game-screen .pacman-container');
        await expect(pacman).toBeAttached();
    });

    test('gameEngine global is initialised with a grid', async ({ page }) => {
        await page.goto('/flatSVG.html');
        await page.waitForTimeout(500);

        const gridSize = await page.evaluate(() => ({
            rows: window.gameEngine.gameEngine.rows,
            cols: window.gameEngine.gameEngine.cols,
        }));

        expect(gridSize.rows).toBeGreaterThan(0);
        expect(gridSize.cols).toBeGreaterThan(0);
    });

    test('ArrowRight key moves Pac-Man right', async ({ page }) => {
        await page.goto('/flatSVG.html');
        await page.waitForTimeout(500);

        // Clear the right wall to guarantee movement
        await page.evaluate(() => {
            const eng = window.gameEngine.gameEngine;
            eng.gameMap[eng.pacman.pacman.x][eng.pacman.pacman.y].removeRightWall();
        });

        const before = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.x);

        // SVG listens for keydown on the svg element itself (tabindex="0")
        await page.locator('#game-screen').press('ArrowRight');
        // Wait for at least one game loop tick (frameRate = 100ms)
        await page.waitForTimeout(250);

        const after = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.x);
        expect(after).toBeGreaterThan(before);
    });

    test('ArrowLeft key moves Pac-Man left', async ({ page }) => {
        await page.goto('/flatSVG.html');
        await page.waitForTimeout(500);

        await page.evaluate(() => {
            const eng = window.gameEngine.gameEngine;
            eng.gameMap[eng.pacman.pacman.x][eng.pacman.pacman.y].removeLeftWall();
        });

        const before = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.x);

        await page.locator('#game-screen').press('ArrowLeft');
        await page.waitForTimeout(250);

        const after = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.x);
        expect(after).toBeLessThan(before);
    });

    test('ArrowDown key moves Pac-Man down', async ({ page }) => {
        await page.goto('/flatSVG.html');
        await page.waitForTimeout(500);

        await page.evaluate(() => {
            const eng = window.gameEngine.gameEngine;
            eng.gameMap[eng.pacman.pacman.x][eng.pacman.pacman.y].removeBottomWall();
        });

        const before = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.y);

        await page.locator('#game-screen').press('ArrowDown');
        await page.waitForTimeout(250);

        const after = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.y);
        expect(after).toBeGreaterThan(before);
    });

    test('ArrowUp key moves Pac-Man up', async ({ page }) => {
        await page.goto('/flatSVG.html');
        await page.waitForTimeout(500);

        await page.evaluate(() => {
            const eng = window.gameEngine.gameEngine;
            eng.gameMap[eng.pacman.pacman.x][eng.pacman.pacman.y].removeTopWall();
        });

        const before = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.y);

        await page.locator('#game-screen').press('ArrowUp');
        await page.waitForTimeout(250);

        const after = await page.evaluate(() => window.gameEngine.gameEngine.pacman.pacman.y);
        expect(after).toBeLessThan(before);
    });

    test('Pac-Man never moves outside the grid boundaries', async ({ page }) => {
        await page.goto('/flatSVG.html');
        await page.waitForTimeout(500);

        for (let i = 0; i < 30; i++) {
            await page.locator('#game-screen').press('ArrowRight');
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

// Tests for Pacman, Cell, Pellet, MazeGenerator (pacman.js)

function makeCell(x, y, pelletPoints) {
    const pellet = pelletPoints !== undefined ? new Pellet(x, y, pelletPoints) : undefined;
    return new Cell(x, y, pellet);
}

function makeGrid(rows, cols) {
    const grid = [];
    for (let i = 0; i < rows; i++) {
        grid[i] = [];
        for (let j = 0; j < cols; j++) {
            grid[i][j] = makeCell(i, j);
        }
    }
    return grid;
}

const RIGHT = { x: 1, y: 0 };
const LEFT  = { x: -1, y: 0 };
const DOWN  = { x: 0, y: 1 };
const UP    = { x: 0, y: -1 };
const NONE  = { x: 0, y: 0 };

// ─── Pacman ───────────────────────────────────────────────────────────────────

describe('Pacman constructor', () => {
    test('initializes x, y and score to 0', () => {
        const p = new Pacman(3, 5);
        expect(p.x).toBe(3);
        expect(p.y).toBe(5);
        expect(p.score).toBe(0);
    });
});

describe('Pacman.canMove', () => {
    const rows = 5, cols = 5;

    test('returns false when moving left off the left edge', () => {
        const p = new Pacman(0, 2);
        expect(p.canMove(LEFT, rows, cols)).toBe(false);
    });

    test('returns false when moving right off the right edge', () => {
        const p = new Pacman(cols - 1, 2);
        expect(p.canMove(RIGHT, rows, cols)).toBe(false);
    });

    test('returns false when moving up off the top edge', () => {
        const p = new Pacman(2, 0);
        expect(p.canMove(UP, rows, cols)).toBe(false);
    });

    test('returns false when moving down off the bottom edge', () => {
        const p = new Pacman(2, rows - 1);
        expect(p.canMove(DOWN, rows, cols)).toBe(false);
    });

    test('returns true for valid interior move', () => {
        const p = new Pacman(2, 2);
        expect(p.canMove(RIGHT, rows, cols)).toBe(true);
        expect(p.canMove(LEFT, rows, cols)).toBe(true);
        expect(p.canMove(UP, rows, cols)).toBe(true);
        expect(p.canMove(DOWN, rows, cols)).toBe(true);
    });
});

describe('Pacman.move', () => {
    test('updates position in the direction when no wall', () => {
        const grid = makeGrid(5, 5);
        const p = new Pacman(2, 2);
        p.move(RIGHT, grid);
        expect(p.x).toBe(3);
        expect(p.y).toBe(2);
    });

    test('does not move when a wall blocks the direction', () => {
        const grid = makeGrid(5, 5);
        grid[2][2].createRightWall();
        const p = new Pacman(2, 2);
        p.move(RIGHT, grid);
        expect(p.x).toBe(2);
        expect(p.y).toBe(2);
    });

    test('marks the departure cell as visited', () => {
        const grid = makeGrid(5, 5);
        const p = new Pacman(2, 2);
        p.move(RIGHT, grid);
        expect(grid[2][2].visited).toBe(true);
    });

    test('collects pellet from the NEW cell after moving (bug 0.2 regression)', () => {
        const grid = makeGrid(5, 5);
        // Place pellet on the destination cell (2+1=3, 2)
        grid[3][2] = makeCell(3, 2, 7);
        const p = new Pacman(2, 2);
        p.move(RIGHT, grid);
        expect(p.score).toBe(7);
        expect(grid[3][2].hasPellet()).toBe(false);
    });

    test('does NOT consume a pellet from the old cell', () => {
        const grid = makeGrid(5, 5);
        // Place pellet on the departure cell (2, 2)
        grid[2][2] = makeCell(2, 2, 5);
        const p = new Pacman(2, 2);
        p.move(RIGHT, grid);
        // Score should be 0 because pellet was on the cell we left, not the one we moved to
        expect(p.score).toBe(0);
    });
});

// ─── Cell ─────────────────────────────────────────────────────────────────────

describe('Cell.hasWallsInDirection', () => {
    test('detects left wall', () => {
        const c = makeCell(1, 1);
        c.createLeftWall();
        expect(c.hasWallsInDirection(LEFT)).toBe(true);
        expect(c.hasWallsInDirection(RIGHT)).toBe(false);
    });

    test('detects right wall', () => {
        const c = makeCell(1, 1);
        c.createRightWall();
        expect(c.hasWallsInDirection(RIGHT)).toBe(true);
        expect(c.hasWallsInDirection(LEFT)).toBe(false);
    });

    test('detects top wall', () => {
        const c = makeCell(1, 1);
        c.createTopWall();
        expect(c.hasWallsInDirection(UP)).toBe(true);
        expect(c.hasWallsInDirection(DOWN)).toBe(false);
    });

    test('detects bottom wall', () => {
        const c = makeCell(1, 1);
        c.createBottomWall();
        expect(c.hasWallsInDirection(DOWN)).toBe(true);
        expect(c.hasWallsInDirection(UP)).toBe(false);
    });

    test('returns false for NONE direction', () => {
        const c = makeCell(1, 1);
        c.createLeftWall();
        c.createRightWall();
        expect(c.hasWallsInDirection(NONE)).toBe(false);
    });
});

describe('Cell.removePellet', () => {
    test('returns the pellet points and clears the pellet', () => {
        const c = makeCell(0, 0, 9);
        expect(c.hasPellet()).toBe(true);
        const score = c.removePellet();
        expect(score).toBe(9);
        expect(c.hasPellet()).toBe(false);
    });
});

// ─── MazeGenerator border seal ────────────────────────────────────────────────

describe('MazeGenerator border seal (bug 0.3)', () => {
    function buildAndGenerate(rows, cols) {
        const grid = makeGrid(rows, cols);
        const gen = new MazeGenerator(grid);
        gen.generate();
        return grid;
    }

    test('all cells in row 0 have a left wall', () => {
        const grid = buildAndGenerate(5, 5);
        for (let j = 0; j < 5; j++) {
            expect(grid[0][j].hasLeftWall()).toBe(true);
        }
    });

    test('all cells in last row have a right wall', () => {
        const grid = buildAndGenerate(5, 5);
        for (let j = 0; j < 5; j++) {
            expect(grid[4][j].hasRightWall()).toBe(true);
        }
    });

    test('all cells in col 0 have a top wall', () => {
        const grid = buildAndGenerate(5, 5);
        for (let i = 0; i < 5; i++) {
            expect(grid[i][0].hasTopWall()).toBe(true);
        }
    });

    test('all cells in last col have a bottom wall', () => {
        const grid = buildAndGenerate(5, 5);
        for (let i = 0; i < 5; i++) {
            expect(grid[i][4].hasBottomWall()).toBe(true);
        }
    });
});

// ─── MazeGenerator connectivity (Stage 2) ────────────────────────────────────

describe('MazeGenerator connectivity (Randomized Prims + loop-carving)', () => {
    const ROWS = 10, COLS = 10;

    function buildAndGenerate(rows, cols) {
        const grid = makeGrid(rows, cols);
        new MazeGenerator(grid).generate();
        return grid;
    }

    // BFS through passable walls to count reachable cells from [0][0]
    function bfsReachable(grid, rows, cols) {
        const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
        const queue = [{ x: 0, y: 0 }];
        visited[0][0] = true;
        let count = 1;
        const moves = [
            { x: -1, y: 0, wallCheck: c => c.hasLeftWall()   },
            { x: 1,  y: 0, wallCheck: c => c.hasRightWall()  },
            { x: 0,  y: -1, wallCheck: c => c.hasTopWall()   },
            { x: 0,  y: 1,  wallCheck: c => c.hasBottomWall() },
        ];
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            for (const { x: dx, y: dy, wallCheck } of moves) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= rows || ny < 0 || ny >= cols) continue;
                if (visited[nx][ny]) continue;
                if (wallCheck(grid[x][y])) continue;
                visited[nx][ny] = true;
                count++;
                queue.push({ x: nx, y: ny });
            }
        }
        return count;
    }

    test('every cell is reachable from [0][0] (no isolated areas)', () => {
        const grid = buildAndGenerate(ROWS, COLS);
        expect(bfsReachable(grid, ROWS, COLS)).toBe(ROWS * COLS);
    });

    test('loop-carving creates at least some cells with multiple exit directions', () => {
        const grid = buildAndGenerate(ROWS, COLS);
        const dirs = [
            { dx: -1, dy: 0, wallCheck: c => c.hasLeftWall()   },
            { dx: 1,  dy: 0, wallCheck: c => c.hasRightWall()  },
            { dx: 0,  dy: -1, wallCheck: c => c.hasTopWall()   },
            { dx: 0,  dy: 1,  wallCheck: c => c.hasBottomWall() },
        ];
        let multiExitCount = 0;
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                const exits = dirs.filter(({ dx, dy, wallCheck }) => {
                    const nx = i + dx, ny = j + dy;
                    return nx >= 0 && nx < ROWS && ny >= 0 && ny < COLS && !wallCheck(grid[i][j]);
                }).length;
                if (exits >= 2) multiExitCount++;
            }
        }
        // On a 10×10 grid with 35% loop-carving there will always be junction cells
        expect(multiExitCount).toBeGreaterThan(0);
    });
});

// Tests for Ghost entity and GameEngine ghost integration

function makeGrid(rows, cols) {
    const grid = [];
    for (let i = 0; i < rows; i++) {
        grid[i] = [];
        for (let j = 0; j < cols; j++) {
            grid[i][j] = new Cell(i, j, undefined);
        }
    }
    return grid;
}

const ROWS = 10, COLS = 10;

// ─── availableDirections ─────────────────────────────────────────────────────

describe('Ghost.availableDirections', () => {
    test('never returns the reverse of the current direction', () => {
        const grid = makeGrid(ROWS, COLS);
        const g = new Ghost(5, 5, 'blinky');
        g.direction = { x: 1, y: 0 }; // moving right
        const dirs = g.availableDirections(grid, ROWS, COLS);
        expect(dirs).not.toContainEqual({ x: -1, y: 0 });
    });

    test('never returns a direction blocked by a wall', () => {
        const grid = makeGrid(ROWS, COLS);
        grid[5][5].createRightWall();
        const g = new Ghost(5, 5, 'blinky');
        g.direction = { x: 1, y: 0 };
        const dirs = g.availableDirections(grid, ROWS, COLS);
        expect(dirs).not.toContainEqual({ x: 1, y: 0 });
    });

    test('never returns out-of-bounds directions', () => {
        const grid = makeGrid(ROWS, COLS);
        const g = new Ghost(0, 0, 'blinky');
        g.direction = { x: 1, y: 0 };
        const dirs = g.availableDirections(grid, ROWS, COLS);
        expect(dirs).not.toContainEqual({ x: -1, y: 0 });
        expect(dirs).not.toContainEqual({ x: 0, y: -1 });
    });

    test('returns at least one direction from an open interior cell', () => {
        const grid = makeGrid(ROWS, COLS);
        const g = new Ghost(5, 5, 'blinky');
        g.direction = { x: 1, y: 0 };
        expect(g.availableDirections(grid, ROWS, COLS).length).toBeGreaterThan(0);
    });
});

// ─── targetTile ───────────────────────────────────────────────────────────────

describe('Ghost.targetTile', () => {
    function makePacman(x, y, dir) {
        const p = new Pacman(x, y);
        p.direction = dir || { x: 1, y: 0 };
        return p;
    }

    test("Blinky's chase target is Pac-Man's position", () => {
        const g = new Ghost(0, 0, 'blinky');
        g.mode = 'chase';
        const pacman = makePacman(5, 5);
        expect(g.targetTile(pacman, null)).toEqual({ x: 5, y: 5 });
    });

    test("Pinky's chase target is 4 tiles ahead of Pac-Man's direction", () => {
        const g = new Ghost(0, 0, 'pinky');
        g.mode = 'chase';
        const pacman = makePacman(5, 5, { x: 1, y: 0 });
        expect(g.targetTile(pacman, null)).toEqual({ x: 9, y: 5 });
    });

    test("Scatter mode returns the ghost's fixed corner", () => {
        const g = new Ghost(0, 0, 'blinky');
        g.mode = 'scatter';
        const pacman = makePacman(5, 5);
        const target = g.targetTile(pacman, null);
        // blinky scatters to top-left (0,0)
        expect(target).toEqual({ x: 0, y: 0 });
    });

    test("Clyde chases Pac-Man when distance > 8 tiles", () => {
        const g = new Ghost(0, 0, 'clyde');
        g.mode = 'chase';
        const pacman = makePacman(9, 9);
        const target = g.targetTile(pacman, null);
        expect(target).toEqual({ x: 9, y: 9 });
    });

    test("Clyde retreats to scatter corner when within 8 tiles of Pac-Man", () => {
        const g = new Ghost(5, 5, 'clyde');
        g.mode = 'chase';
        const pacman = makePacman(6, 5); // 1 tile away
        const target = g.targetTile(pacman, null);
        expect(target).toEqual(g._scatterTargets.clyde);
    });
});

// ─── frighten / tick ─────────────────────────────────────────────────────────

describe('Ghost.frighten and tick', () => {
    test('frighten sets mode to frightened and stores timer', () => {
        const g = new Ghost(0, 0, 'blinky');
        g.frighten(10);
        expect(g.mode).toBe('frightened');
        expect(g.frightTimer).toBe(10);
    });

    test('tick decrements frightTimer', () => {
        const g = new Ghost(0, 0, 'blinky');
        g.frighten(5);
        g.tick();
        expect(g.frightTimer).toBe(4);
    });

    test('tick reverts to previous mode when timer reaches 0', () => {
        const g = new Ghost(0, 0, 'blinky');
        g.mode = 'chase';
        g.frighten(1);
        g.tick();
        expect(g.frightTimer).toBe(0);
        expect(g.mode).toBe('chase');
    });

    test('chooseDirection returns random direction in frightened mode', () => {
        const grid = makeGrid(ROWS, COLS);
        const g = new Ghost(5, 5, 'blinky');
        g.frighten(100);
        const pacman = new Pacman(0, 0);
        // Run many times — direction should vary (not always the same)
        const seen = new Set();
        for (let i = 0; i < 50; i++) {
            const d = g.chooseDirection(grid, ROWS, COLS, pacman, null);
            seen.add(`${d.x},${d.y}`);
        }
        expect(seen.size).toBeGreaterThan(1);
    });
});

// ─── GameEngine ghost integration ────────────────────────────────────────────

describe('GameEngine ghost collision', () => {
    function stubPacman(x, y) { return new Pacman(x, y); }
    function stubPellet(x, y, p) { return new Pellet(x, y, p); }
    function stubCell(x, y, pellet) { return new Cell(x, y, pellet); }
    function stubGhost(x, y, id) { return new Ghost(x, y, id); }

    test('gameOver is false at game start', () => {
        const eng = new GameEngine(10, 10, stubPacman, stubPellet, stubCell, stubGhost);
        expect(eng.gameOver).toBe(false);
    });

    test('gameOver becomes true when a ghost shares Pac-Man\'s cell', () => {
        const eng = new GameEngine(10, 10, stubPacman, stubPellet, stubCell, stubGhost);
        const pacPos = { x: eng.pacman.x, y: eng.pacman.y };
        // Teleport first ghost directly onto Pac-Man
        eng.ghosts[0].x = pacPos.x;
        eng.ghosts[0].y = pacPos.y;
        eng.gameLoop({ x: 0, y: 0 }); // trigger collision check
        expect(eng.gameOver).toBe(true);
    });

    test('game loop stops processing after gameOver', () => {
        const eng = new GameEngine(10, 10, stubPacman, stubPellet, stubCell, stubGhost);
        eng.gameOver = true;
        const startX = eng.pacman.x;
        eng.gameMap[startX][eng.pacman.y].walls[2] = false; // clear right wall
        eng.gameLoop({ x: 1, y: 0 });
        expect(eng.pacman.x).toBe(startX); // should not have moved
    });
});

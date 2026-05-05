// Adapter interface contract tests.
// Any new adapter (pixel art, 3D, etc.) must pass these by registering its
// stub implementations in the ADAPTERS array below.

const PACMAN_METHODS  = ['move', 'canMove', 'draw'];
const PELLET_METHODS  = ['score', 'draw'];
const CELL_METHODS    = [
    'hasPellet', 'removePellet', 'hasWallsInDirection',
    'createLeftWall', 'createTopWall', 'createRightWall', 'createBottomWall',
    'removeLeftWall', 'removeTopWall', 'removeRightWall', 'removeBottomWall',
    'hasLeftWall', 'hasTopWall', 'hasRightWall', 'hasBottomWall',
    'draw',
];

// ─── Stub implementations ─────────────────────────────────────────────────────
// Add a new entry here for each adapter added in later stages.

class StubPacmanAdapter {
    constructor() {}
    move() {}
    canMove() { return true; }
    draw() {}
}

class StubPelletAdapter {
    constructor() {}
    score() { return 0; }
    draw() {}
}

class StubCellAdapter {
    constructor() { this._cell = new Cell(0, 0, undefined); }
    hasPellet() { return false; }
    removePellet() { return 0; }
    hasWallsInDirection() { return false; }
    createLeftWall() {}
    createTopWall() {}
    createRightWall() {}
    createBottomWall() {}
    removeLeftWall() {}
    removeTopWall() {}
    removeRightWall() {}
    removeBottomWall() {}
    hasLeftWall() { return false; }
    hasTopWall() { return false; }
    hasRightWall() { return false; }
    hasBottomWall() { return false; }
    draw() {}
}

const ADAPTERS = [
    { name: 'Stub', PacmanAdapter: StubPacmanAdapter, PelletAdapter: StubPelletAdapter, CellAdapter: StubCellAdapter },
];

// ─── Contract checks ──────────────────────────────────────────────────────────

describe.each(ADAPTERS)('$name adapter contract', ({ PacmanAdapter, PelletAdapter, CellAdapter }) => {
    test.each(PACMAN_METHODS)('PacmanAdapter has method: %s', (method) => {
        const a = new PacmanAdapter();
        expect(typeof a[method]).toBe('function');
    });

    test.each(PELLET_METHODS)('PelletAdapter has method: %s', (method) => {
        const a = new PelletAdapter();
        expect(typeof a[method]).toBe('function');
    });

    test.each(CELL_METHODS)('CellAdapter has method: %s', (method) => {
        const a = new CellAdapter();
        expect(typeof a[method]).toBe('function');
    });

    test('PacmanAdapter.canMove returns a boolean', () => {
        const a = new PacmanAdapter();
        expect(typeof a.canMove({ x: 1, y: 0 }, 10, 10)).toBe('boolean');
    });

    test('PelletAdapter.score returns a number', () => {
        const a = new PelletAdapter();
        expect(typeof a.score()).toBe('number');
    });

    test('CellAdapter.hasPellet returns a boolean', () => {
        const a = new CellAdapter();
        expect(typeof a.hasPellet()).toBe('boolean');
    });
});

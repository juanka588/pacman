// End-to-end scenario tests using a fixed deterministic maze.
//
// makeFixedEngine() builds a 6×6 open grid (no walls, no pellets) so Pac-Man
// and ghosts can move freely. Tests place pellets explicitly for full control.

function makeOpenCell(x, y, pellet) {
    const c = new Cell(x, y, pellet);
    // Remove all walls so movement is never blocked
    c.removeLeftWall();
    c.removeTopWall();
    c.removeRightWall();
    c.removeBottomWall();
    return c;
}

function makeFixedEngine(rows = 6, cols = 6) {
    const pacmanCreator = (x, y) => new Pacman(x, y);
    const pelletCreator  = (x, y, p) => new Pellet(x, y, p);
    const ghostCreator   = (x, y, id) => new Ghost(x, y, id);

    const eng = new GameEngine(rows, cols, pacmanCreator, pelletCreator, makeOpenCell, ghostCreator);

    // Re-open every cell, clear all pellets, reset win counter
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const c = eng.gameMap[i][j];
            c.removeLeftWall();
            c.removeTopWall();
            c.removeRightWall();
            c.removeBottomWall();
            c.pellet = undefined;
        }
    }
    eng._totalPellets = 0; // cleared — tests set their own pellets + update this
    return eng;
}

// ─── Win condition: collect all pellets ──────────────────────────────────────

describe('Scenario: Pac-Man collects all pellets', () => {
    test('gameWon becomes true when every pellet is eaten', () => {
        const eng = makeFixedEngine();

        const px = eng.pacman.x;
        const py = eng.pacman.y;
        eng.gameMap[px + 1][py].pellet = new Pellet(px + 1, py, 10);
        eng.gameMap[px + 2][py].pellet = new Pellet(px + 2, py, 10);
        eng._totalPellets = 2; // inform engine pellets exist

        // Move right twice
        eng.gameLoop({ x: 1, y: 0 });
        eng.gameLoop({ x: 1, y: 0 });

        expect(eng.pacman.score).toBe(20);
        expect(eng.gameWon).toBe(true);
    });

    test('gameWon is false while pellets remain', () => {
        const eng = makeFixedEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;
        eng.gameMap[px + 1][py].pellet = new Pellet(px + 1, py, 10);
        eng.gameMap[px + 2][py].pellet = new Pellet(px + 2, py, 10);
        eng._totalPellets = 2;

        eng.gameLoop({ x: 1, y: 0 }); // eat first pellet only

        expect(eng.gameWon).toBe(false);
    });

    test('gameLoop does not process after gameWon', () => {
        const eng = makeFixedEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;
        eng.gameMap[px + 1][py].pellet = new Pellet(px + 1, py, 10);
        eng._totalPellets = 1;

        eng.gameLoop({ x: 1, y: 0 }); // eats last pellet, gameWon = true
        expect(eng.gameWon).toBe(true);

        const posAfterWin = eng.pacman.x;
        eng.gameLoop({ x: 1, y: 0 }); // should be a no-op
        expect(eng.pacman.x).toBe(posAfterWin);
    });
});

// ─── Lose condition: ghost kills Pac-Man ─────────────────────────────────────

describe('Scenario: ghost kills Pac-Man', () => {
    test('gameOver becomes true when a ghost is placed on Pac-Man', () => {
        const eng = makeFixedEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;

        eng.ghosts[0].x = px;
        eng.ghosts[0].y = py;

        eng.gameLoop({ x: 0, y: 0 });

        expect(eng.gameOver).toBe(true);
    });

    test('gameOver is false when ghost is adjacent but not on Pac-Man', () => {
        const eng = makeFixedEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;

        eng.ghosts[0].x = px + 1;
        eng.ghosts[0].y = py;

        // Move ghost away from pacman so collision logic sees them separate
        // Force scatter mode so ghost moves toward its corner, away from center
        eng.ghosts.forEach(g => { g.mode = 'scatter'; });
        eng.gameLoop({ x: 0, y: 0 });

        expect(eng.gameOver).toBe(false);
    });

    test('gameLoop stops after gameOver', () => {
        const eng = makeFixedEngine();
        eng.gameOver = true;
        const startX = eng.pacman.x;
        eng.gameLoop({ x: 1, y: 0 });
        expect(eng.pacman.x).toBe(startX);
    });

    test('ghost moving onto Pac-Man triggers gameOver', () => {
        const eng = makeFixedEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;

        // Place ghost one step left of Pac-Man, moving right
        const g = eng.ghosts[0];
        g.x = px - 1;
        g.y = py;
        g.direction = { x: 1, y: 0 };
        g.mode = 'chase';

        // Advance enough ticks for ghost to step onto Pac-Man
        // (ghost moves every other tick, _ghostTick starts at 0)
        for (let i = 0; i < 6; i++) {
            if (!eng.gameOver) eng.gameLoop({ x: 0, y: 0 });
        }

        expect(eng.gameOver).toBe(true);
    });
});

// ─── Super pellet: Pac-Man eats ghost ────────────────────────────────────────

describe('Scenario: super pellet and ghost eaten', () => {
    test('frightened ghost on Pac-Man cell is eaten not game over', () => {
        const eng = makeFixedEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;

        // Frighten the first ghost and place it on Pac-Man
        eng.ghosts[0].frighten(50);
        eng.ghosts[0].x = px;
        eng.ghosts[0].y = py;

        eng.gameLoop({ x: 0, y: 0 });

        expect(eng.gameOver).toBe(false);
        expect(eng.ghosts[0].eaten).toBe(true);
    });

    test('eaten ghost respawns after its respawn timer expires', () => {
        const eng = makeFixedEngine();

        eng.ghosts[0].frighten(1);
        eng.ghosts[0].x = eng.pacman.x;
        eng.ghosts[0].y = eng.pacman.y;
        eng.gameLoop({ x: 0, y: 0 }); // ghost eaten

        expect(eng.ghosts[0].eaten).toBe(true);

        // Advance until respawn timer elapses
        const respawn = eng._respawnTicks;
        for (let i = 0; i < respawn; i++) {
            eng.gameLoop({ x: 0, y: 0 });
        }

        expect(eng.ghosts[0].eaten).toBe(false);
        expect(eng.ghosts[0].mode).toBe('scatter');
    });

    test('respawned ghost can kill Pac-Man', () => {
        const eng = makeFixedEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;

        eng.ghosts[0].frighten(1);
        eng.ghosts[0].x = px;
        eng.ghosts[0].y = py;
        eng.gameLoop({ x: 0, y: 0 }); // ghost eaten, respawn timer starts

        expect(eng.gameOver).toBe(false);

        // Wait for respawn, then move ghost back onto Pac-Man
        const respawn = eng._respawnTicks;
        for (let i = 0; i < respawn; i++) {
            eng.gameLoop({ x: 0, y: 0 });
        }
        expect(eng.ghosts[0].eaten).toBe(false);

        // Teleport respawned ghost onto Pac-Man and trigger collision.
        // Run up to 3 loops in case the ghost moves on the same tick it lands.
        eng.ghosts[0].x = eng.pacman.x;
        eng.ghosts[0].y = eng.pacman.y;
        for (let i = 0; i < 3; i++) {
            if (!eng.gameOver) eng.gameLoop({ x: 0, y: 0 });
        }

        expect(eng.gameOver).toBe(true);
    });

    test('eating ghost increments score', () => {
        const eng = makeFixedEngine();
        const before = eng.pacman.score;

        eng.ghosts[0].frighten(50);
        eng.ghosts[0].x = eng.pacman.x;
        eng.ghosts[0].y = eng.pacman.y;
        eng.gameLoop({ x: 0, y: 0 });

        expect(eng.pacman.score).toBeGreaterThan(before);
    });
});

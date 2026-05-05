// Tests for GameEngine

function makeStubCell(x, y, pellet) {
    return new Cell(x, y, pellet);
}

function makeStubPacman(x, y) {
    return new Pacman(x, y);
}

function makeStubPellet(x, y, points) {
    return new Pellet(x, y, points);
}

describe('GameEngine constructor', () => {
    test('creates a grid of the correct dimensions', () => {
        const engine = new GameEngine(4, 6, makeStubPacman, makeStubPellet, makeStubCell);
        expect(engine.gameMap.length).toBe(4);
        for (let i = 0; i < 4; i++) {
            expect(engine.gameMap[i].length).toBe(6);
        }
    });

    test('places Pacman at the center of the grid', () => {
        const engine = new GameEngine(10, 10, makeStubPacman, makeStubPellet, makeStubCell);
        expect(engine.pacman.x).toBe(5);
        expect(engine.pacman.y).toBe(5);
    });

    test('all grid entries are Cell instances', () => {
        const engine = new GameEngine(3, 3, makeStubPacman, makeStubPellet, makeStubCell);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                expect(engine.gameMap[i][j]).toBeInstanceOf(Cell);
            }
        }
    });
});

describe('GameEngine.gameLoop', () => {
    const RIGHT = { x: 1, y: 0 };
    const NONE  = { x: 0, y: 0 };

    test('does not move Pacman when direction is NONE', () => {
        const engine = new GameEngine(10, 10, makeStubPacman, makeStubPellet, makeStubCell);
        const startX = engine.pacman.x;
        const startY = engine.pacman.y;
        engine.gameLoop(NONE);
        expect(engine.pacman.x).toBe(startX);
        expect(engine.pacman.y).toBe(startY);
    });

    test('moves Pacman right when the path is clear', () => {
        const engine = new GameEngine(10, 10, makeStubPacman, makeStubPellet, makeStubCell);
        // Remove any right wall that random generation may have placed
        engine.gameMap[engine.pacman.x][engine.pacman.y].walls[2] = false;
        const startX = engine.pacman.x;
        engine.gameLoop(RIGHT);
        expect(engine.pacman.x).toBe(startX + 1);
    });

    test('does not move Pacman when a wall blocks the direction', () => {
        const engine = new GameEngine(10, 10, makeStubPacman, makeStubPellet, makeStubCell);
        engine.gameMap[engine.pacman.x][engine.pacman.y].createRightWall();
        const startX = engine.pacman.x;
        engine.gameLoop(RIGHT);
        expect(engine.pacman.x).toBe(startX);
    });

    test('score increases after moving onto a pellet cell', () => {
        const engine = new GameEngine(10, 10, makeStubPacman, makeStubPellet, makeStubCell);
        const px = engine.pacman.x;
        const py = engine.pacman.y;
        // Clear any right wall and place a known pellet on the destination cell
        engine.gameMap[px][py].walls[2] = false;
        engine.gameMap[px + 1][py] = new Cell(px + 1, py, new Pellet(px + 1, py, 8));
        engine.gameLoop(RIGHT);
        expect(engine.pacman.score).toBe(8);
    });
});

describe('GameEngine.events', () => {
    const RIGHT = { x: 1, y: 0 };
    const NONE  = { x: 0, y: 0 };

    function makeOpenEngine() {
        const eng = new GameEngine(10, 10, makeStubPacman, makeStubPellet, makeStubCell,
            (x, y, id) => new Ghost(x, y, id));
        // Open right wall so Pacman can always move right
        eng.gameMap[eng.pacman.x][eng.pacman.y].walls[2] = false;
        // Clear all random pellets so we control what's there
        for (let i = 0; i < 10; i++)
            for (let j = 0; j < 10; j++)
                eng.gameMap[i][j].pellet = undefined;
        eng._totalPellets = 0;
        return eng;
    }

    test('events is defined before the first gameLoop call', () => {
        const eng = new GameEngine(10, 10, makeStubPacman, makeStubPellet, makeStubCell);
        expect(eng.events).toBeDefined();
    });

    test('pelletEaten is true when Pacman eats a regular pellet', () => {
        const eng = makeOpenEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;
        eng.gameMap[px + 1][py] = new Cell(px + 1, py, new Pellet(px + 1, py, 5));
        eng.gameLoop(RIGHT);
        expect(eng.events.pelletEaten).toBe(true);
        expect(eng.events.superPelletEaten).toBe(false);
    });

    test('superPelletEaten is true when Pacman eats a super pellet', () => {
        const eng = makeOpenEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;
        eng.gameMap[px + 1][py] = new Cell(px + 1, py, new SuperPellet(px + 1, py));
        eng.gameLoop(RIGHT);
        expect(eng.events.superPelletEaten).toBe(true);
        expect(eng.events.pelletEaten).toBe(false);
    });

    test('ghostEaten is true when Pacman collides with a frightened ghost', () => {
        const eng = makeOpenEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;
        eng.ghosts[0].x = px;
        eng.ghosts[0].y = py;
        eng.ghosts[0].frighten(50);
        eng.gameLoop(NONE);
        expect(eng.events.ghostEaten).toBe(true);
        expect(eng.gameOver).toBe(false);
    });

    test('died is true when Pacman collides with a non-frightened ghost', () => {
        const eng = makeOpenEngine();
        eng.ghosts[0].x = eng.pacman.x;
        eng.ghosts[0].y = eng.pacman.y;
        eng.gameLoop(NONE);
        expect(eng.events.died).toBe(true);
        expect(eng.gameOver).toBe(true);
    });

    test('frightenedRatio is between 0 and 1 when a ghost is frightened', () => {
        const eng = makeOpenEngine();
        eng.ghosts[0].frighten(30);
        eng.gameLoop(NONE);
        expect(eng.events.frightenedRatio).toBeGreaterThan(0);
        expect(eng.events.frightenedRatio).toBeLessThanOrEqual(1);
    });

    test('frightenedRatio is 0 when no ghost is frightened', () => {
        const eng = makeOpenEngine();
        eng.gameLoop(NONE);
        expect(eng.events.frightenedRatio).toBe(0);
    });

    test('superPelletEaten triggers all ghosts to be frightened', () => {
        const eng = makeOpenEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;
        eng.gameMap[px + 1][py] = new Cell(px + 1, py, new SuperPellet(px + 1, py));
        eng.gameLoop(RIGHT);
        eng.ghosts.forEach(g => expect(g.mode).toBe('frightened'));
    });

    test('ateSuper flag is cleared after gameLoop processes it', () => {
        const eng = makeOpenEngine();
        const px = eng.pacman.x;
        const py = eng.pacman.y;
        eng.gameMap[px + 1][py] = new Cell(px + 1, py, new SuperPellet(px + 1, py));
        eng.gameLoop(RIGHT);
        expect(eng.pacman.ateSuper).toBe(false);
    });

    test('all events are false/0 when nothing happens', () => {
        const eng = makeOpenEngine();
        // Block movement so nothing changes
        eng.gameMap[eng.pacman.x][eng.pacman.y].createRightWall();
        eng.gameLoop(RIGHT);
        expect(eng.events.pelletEaten).toBe(false);
        expect(eng.events.superPelletEaten).toBe(false);
        expect(eng.events.ghostEaten).toBe(false);
        expect(eng.events.died).toBe(false);
        expect(eng.events.frightenedRatio).toBe(0);
    });
});

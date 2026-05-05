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

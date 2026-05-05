class Pacman {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.score = 0;
    }

    move(direction, gameMap) {
        let cell = gameMap[this.x][this.y];
        cell.visited = true;
        if (cell.hasWallsInDirection(direction)) {
            return;
        }
        this.y = this.y + direction.y;
        this.x = this.x + direction.x;
        let newCell = gameMap[this.x][this.y];
        if (newCell.hasPellet()) {
            this.score = this.score + newCell.removePellet();
        }
    }

    canMove(direction, rows, cols) {
        let newX = this.x + direction.x;
        let newY = this.y + direction.y;
        if (
            newX < 0 || newX >= cols ||
            newY < 0 || newY >= rows
        ) {
            return false;
        }
        return true;
    }
}

class Pellet {
    constructor(x, y, points) {
        this.x = x;
        this.y = y;
        this.points = points;
    }

    score() {
        return this.points;
    }
}

class Cell {
    constructor(x, y, pellet) {
        this.x = x;
        this.y = y;
        this.walls = [
            false, // left
            false, // top
            false, // right
            false, // down
        ];
        this.pellet = pellet;
        this.visited = false;
    }

    hasPellet() {
        return !(this.pellet === undefined);
    }

    removePellet() {
        let score = this.pellet.score();
        this.pellet = undefined;
        return score;
    }

    hasWallsInDirection(direction) {
        if (direction.x < 0) {
            return this.hasLeftWall();
        }
        if (direction.y < 0) {
            return this.hasTopWall();
        }
        if (direction.x > 0) {
            return this.hasRightWall();
        }
        if (direction.y > 0) {
            return this.hasBottomWall();
        }
        return false;
    }

    createLeftWall() {
        this.walls[0] = true;
    }

    createTopWall() {
        this.walls[1] = true;
    }

    createRightWall() {
        this.walls[2] = true;
    }

    createBottomWall() {
        this.walls[3] = true;
    }

    removeLeftWall() {
        this.walls[0] = false;
    }

    removeTopWall() {
        this.walls[1] = false;
    }

    removeRightWall() {
        this.walls[2] = false;
    }

    removeBottomWall() {
        this.walls[3] = false;
    }

    hasLeftWall() {
        return this.walls[0];
    }

    hasTopWall() {
        return this.walls[1];
    }

    hasRightWall() {
        return this.walls[2];
    }

    hasBottomWall() {
        return this.walls[3];
    }
}

class MazeGenerator {
    constructor(gameMap) {
        this.gameMap = gameMap;
        this.loopCarvingProb = 0.35;
    }

    generate() {
        this._initAllWalls();
        this._randomizedPrims();
        this._carveLoops();
        this._sealBorders();
    }

    // Step 1: start with every cell fully walled
    _initAllWalls() {
        for (let i = 0; i < this.gameMap.length; i++) {
            for (let j = 0; j < this.gameMap[i].length; j++) {
                const c = this.gameMap[i][j];
                c.createLeftWall();
                c.createTopWall();
                c.createRightWall();
                c.createBottomWall();
            }
        }
    }

    // Step 2: Randomized Prim's — builds a spanning tree guaranteeing full connectivity
    _randomizedPrims() {
        const rows = this.gameMap.length;
        const cols = this.gameMap[0].length;
        const visited = [];
        for (let i = 0; i < rows; i++) {
            visited[i] = new Array(cols).fill(false);
        }

        visited[0][0] = true;
        // frontier: each entry is {ax, ay, bx, by} where a is visited, b is not yet
        const frontier = this._neighbors(0, 0, visited, rows, cols);

        while (frontier.length > 0) {
            const idx = Math.floor(randomInRange(0, frontier.length));
            const { ax, ay, bx, by } = frontier.splice(idx, 1)[0];

            if (visited[bx][by]) continue;

            // Remove the shared wall between a and b
            this._removeWallBetween(ax, ay, bx, by);
            visited[bx][by] = true;

            const newNeighbors = this._neighbors(bx, by, visited, rows, cols);
            for (const n of newNeighbors) frontier.push(n);
        }
    }

    _neighbors(x, y, visited, rows, cols) {
        const result = [];
        if (x > 0        && !visited[x - 1][y]) result.push({ ax: x, ay: y, bx: x - 1, by: y });
        if (x < rows - 1 && !visited[x + 1][y]) result.push({ ax: x, ay: y, bx: x + 1, by: y });
        if (y > 0        && !visited[x][y - 1]) result.push({ ax: x, ay: y, bx: x, by: y - 1 });
        if (y < cols - 1 && !visited[x][y + 1]) result.push({ ax: x, ay: y, bx: x, by: y + 1 });
        return result;
    }

    _removeWallBetween(ax, ay, bx, by) {
        const a = this.gameMap[ax][ay];
        const b = this.gameMap[bx][by];
        if (bx === ax - 1) { a.removeLeftWall();   b.removeRightWall();  }
        if (bx === ax + 1) { a.removeRightWall();  b.removeLeftWall();   }
        if (by === ay - 1) { a.removeTopWall();    b.removeBottomWall(); }
        if (by === ay + 1) { a.removeBottomWall(); b.removeTopWall();    }
    }

    // Step 3: punch open random interior walls to create multiple paths (Pac-Man open feel)
    _carveLoops() {
        const rows = this.gameMap.length;
        const cols = this.gameMap[0].length;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (randomInRange(0, 1) <= this.loopCarvingProb) {
                    // pick a random interior wall direction and open it
                    const dirs = [];
                    if (i > 0)        dirs.push({ ax: i, ay: j, bx: i - 1, by: j });
                    if (i < rows - 1) dirs.push({ ax: i, ay: j, bx: i + 1, by: j });
                    if (j > 0)        dirs.push({ ax: i, ay: j, bx: i, by: j - 1 });
                    if (j < cols - 1) dirs.push({ ax: i, ay: j, bx: i, by: j + 1 });
                    if (dirs.length === 0) continue;
                    const { ax, ay, bx, by } = dirs[Math.floor(randomInRange(0, dirs.length))];
                    this._removeWallBetween(ax, ay, bx, by);
                }
            }
        }
    }

    // Step 4: ensure outer border walls are always present
    _sealBorders() {
        const rows = this.gameMap.length;
        const cols = this.gameMap[0].length;
        for (let i = 0; i < rows; i++) {
            this.gameMap[i][0].createTopWall();
            this.gameMap[i][cols - 1].createBottomWall();
        }
        for (let j = 0; j < cols; j++) {
            this.gameMap[0][j].createLeftWall();
            this.gameMap[rows - 1][j].createRightWall();
        }
    }
}

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Allow Node/Jest to require this file without breaking browser script-tag loading
if (typeof module !== 'undefined') {
    module.exports = { Pacman, Pellet, Cell, MazeGenerator, randomInRange };
}
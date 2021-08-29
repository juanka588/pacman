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
        if (cell.hasPellet()) {
            this.score = this.score + cell.removePellet();
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
        this.randomWallProb = 0.4;
    }

    createRandomWall(x, y) {
        let cell = this.gameMap[x][y];
        let wallType = Math.floor(random(0, 4));
        switch (wallType) {
            case 0: // LEFT
                cell.createLeftWall();
                if (x > 0) {
                    let leftCell = this.gameMap[x - 1][y];
                    leftCell.createRightWall();
                }
                break;
            case 1: // Top
                cell.createTopWall();
                if (y > 0) {
                    let topCell = this.gameMap[x][y - 1];
                    topCell.createBottomWall();
                }
                break;
            case 2: // Right
                cell.createRightWall();
                if (x < this.gameMap[x].length - 1) {
                    let rightCell = this.gameMap[x + 1][y];
                    rightCell.createLeftWall();
                }
                break;
            case 3: // Bottom
                cell.createBottomWall();
                if (y < this.gameMap.length - 1) {
                    let bottomCell = this.gameMap[x][y + 1];
                    bottomCell.createTopWall();
                }
                break;
        }
    }

    generate() {
        for (let i = 0; i < this.gameMap.length; i++) {
            for (let j = 0; j < this.gameMap[i].length; j++) {
                if (random() <= this.randomWallProb) {
                    this.createRandomWall(i, j);
                }
            }
        }
    }
}
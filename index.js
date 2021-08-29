let pacman;
let rows;
let cols;
let directions = [
    {x: 0, y: 0}, // 0 none
    {x: 1, y: 0}, // 1 right
    {x: 0, y: 1}, // 2 down
    {x: 0, y: -1},// 3 up
    {x: -1, y: 0} // 4 left
];
let currentDirection = 0;
let size = 40;

let gameMap = [];

let pelletProb = 0.2;

function setup() {
    createCanvas(400, 400);
    frameRate(10);
    rows = width / size;
    cols = width / size;
    pacman = new Pacman(rows / 2, cols / 2, size);
    for (let i = 0; i < rows; i++) {
        gameMap[i] = [];
        for (let j = 0; j < cols; j++) {
            let pellet;
            if (random() <= pelletProb) {
                pellet = new Pellet(i, j, size, random(5, 10));
            }
            gameMap[i][j] = new Cell(i, j, size, pellet);
        }
    }

    let mazeGen = new MazeGenerator(gameMap);
    mazeGen.generate();
}

function draw() {
    background(220);
    let direction = directions[currentDirection];
    if (pacman.canMove(direction)) {
        pacman.move(direction, gameMap);
    }
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            gameMap[i][j].draw();
        }
    }
    pacman.draw();
}

function keyPressed() {
    if (keyCode === LEFT_ARROW) {
        currentDirection = 4;
    } else if (keyCode === RIGHT_ARROW) {
        currentDirection = 1;
    } else if (keyCode === UP_ARROW) {
        currentDirection = 3;
    } else if (keyCode === DOWN_ARROW) {
        currentDirection = 2;
    }
}

class Pacman {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.score = 0;
    }

    move(direction, gameMap) {
        let cell = gameMap[this.x][this.y];

        if (cell.hasWallsInDirection(direction)) {
            return;
        }
        this.y = this.y + direction.y;
        this.x = this.x + direction.x;
        if (cell.hasPellet()) {
            this.score = this.score + cell.pellet.points;
            cell.removePellet();
        }
        cell.visited = true;
    }

    canMove(direction) {
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

    draw() {
        fill(212, 205, 13);
        ellipse(this.x * this.size + this.size / 2, this.y * this.size + this.size / 2, this.size, this.size);
    }
}

class Pellet {
    constructor(x, y, size, points) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.points = points;
    }

    draw() {
        fill(255, this.points);
        ellipse(this.x * this.size + this.size / 2, this.y * this.size + this.size / 2, this.size / 2, this.size / 2);
    }
}

class Cell {
    constructor(x, y, size, pellet) {
        this.x = x;
        this.y = y;
        this.size = size;
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
        this.pellet = undefined;
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

    draw() {
        stroke(0);
        let top = this.y * this.size;
        let bottom = (this.y + 1) * this.size;
        let left = this.x * this.size;
        let right = (this.x + 1) * this.size;

        if (this.hasLeftWall()) {
            line(left, top, left, bottom);
        }
        if (this.hasTopWall()) {
            line(left, top, right, top);
        }
        if (this.hasRightWall()) {
            line(right, top, right, bottom);
        }
        if (this.hasBottomWall()) {
            line(left, bottom, right, bottom);
        }
        if (this.visited) {
            noStroke();
            fill(0, 0, 255, 80);
            rect(left, top, this.size, this.size);
        }

        if (this.hasPellet()) {
            this.pellet.draw();
        }
    }
}


class MazeGenerator {
    constructor(gameMap) {
        this.gameMap = gameMap;

        this.randomWallProb = 0.2;
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
                if (x < cols - 1) {
                    let rightCell = this.gameMap[x + 1][y];
                    rightCell.createLeftWall();
                }
                break;
            case 3: // Bottom
                cell.createBottomWall();
                if (y < rows - 1) {
                    let bottomCell = this.gameMap[x][y + 1];
                    bottomCell.createTopWall();
                }
                break;
        }
    }

    generate() {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (random() <= this.randomWallProb) {
                    this.createRandomWall(i, j);
                }
            }
        }
    }
}
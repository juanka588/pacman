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
let size = 20;

let gameEngine;

function setup() {
    createCanvas(400, 400);
    frameRate(10);
    rows = width / size;
    cols = width / size;
    gameEngine = new P5GameAdapter(new GameEngine(rows, cols, pacmanCreator, pelletCreator, cellCreator));
}

function draw() {
    background(220);
    let direction = directions[currentDirection];
    gameEngine.gameLoop(direction);
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

class PacmanAdapter {
    constructor(pacman, size) {
        this.pacman = pacman;
        this.size = size;
        this.closingAngle = 0.8;
        this.animationRate = 0.05;
        this.rotation = 0;
    }

    move(direction, gameMap) {
        if (direction.y < 0) { // up
            this.rotation = -PI / 2;
        }
        if (direction.y > 0) { // down
            this.rotation = PI / 2;
        }
        if (direction.x > 0) { // right
            this.rotation = 0;
        }
        if (direction.x < 0) { // left
            this.rotation = -3 * PI / 4;
        }
        this.pacman.move(direction, gameMap);
    }

    canMove(direction, rows, cols) {
        return this.pacman.canMove(direction, rows, cols);
    }

    draw() {
        push();
        let xCenter = this.pacman.x * this.size;
        let yCenter = this.pacman.y * this.size;
        let offset = this.size / 2;
        let size = this.size;

        this.closingAngle = this.closingAngle + this.animationRate;
        if (this.closingAngle >= 1) {
            this.animationRate = -this.animationRate;
        }
        if (this.closingAngle < 0.8) {
            this.animationRate = -this.animationRate;
        }

        translate(xCenter + offset, yCenter + offset);
        let sign = -1;
        if (this.rotation === (-3 * PI / 4)) {
            // must mirror
            sign = 1;
        }
        rotate(this.rotation);
        fill(212, 205, 13);
        arc(0, 0, size, size, 0, 2 * PI * this.closingAngle);

        fill(0);
        circle(sign * offset * 0.3, sign * offset * 0.5, size * 0.1);
        pop();
    }
}

class PelletAdapter {
    constructor(pellet, size) {
        this.pellet = pellet;
        this.size = size;
    }

    score() {
        return this.pellet.score();
    }

    draw() {
        fill(255, this.pellet.points);
        let offset = this.size / 2;
        let xCenter = this.pellet.x * this.size;
        let yCenter = this.pellet.y * this.size;
        let size = this.size / 3;
        circle(xCenter + offset, yCenter + offset, size);
    }
}

class CellAdapter {
    constructor(cell, size) {
        this.cell = cell;
        this.size = size;
    }

    hasPellet() {
        return this.cell.hasPellet();
    }

    removePellet() {
        this.cell.removePellet();
    }

    hasWallsInDirection(direction) {
       return  this.cell.hasWallsInDirection(direction);
    }

    createLeftWall() {
        this.cell.createLeftWall()
    }

    createTopWall() {
        this.cell.createTopWall()
    }

    createRightWall() {
        this.cell.createRightWall()
    }

    createBottomWall() {
        this.cell.createBottomWall()
    }

    hasLeftWall() {
        return this.cell.hasLeftWall()
    }

    hasTopWall() {
        return this.cell.hasTopWall()
    }

    hasRightWall() {
        return this.cell.hasRightWall()
    }

    hasBottomWall() {
        return this.cell.hasBottomWall();
    }

    draw() {
        stroke(0);
        let top = this.cell.y * this.size;
        let bottom = (this.cell.y + 1) * this.size;
        let left = this.cell.x * this.size;
        let right = (this.cell.x + 1) * this.size;

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
        if (this.cell.visited) {
            noStroke();
            fill(0, 0, 255, 80);
            rect(left, top, this.size, this.size);
        }

        if (this.cell.hasPellet()) {
            this.cell.pellet.draw();
        }
    }
}

class P5GameAdapter {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
    }

    gameLoop(direction) {
        this.gameEngine.gameLoop(direction);
        for (let i = 0; i < this.gameEngine.rows; i++) {
            for (let j = 0; j < this.gameEngine.cols; j++) {
                this.gameEngine.gameMap[i][j].draw();
            }
        }
        this.gameEngine.pacman.draw();
    }
}

function pacmanCreator(x, y) {
    return new PacmanAdapter(new Pacman(x, y), size);
}

function pelletCreator(x, y, points) {
    return new PelletAdapter(new Pellet(x, y, points), size);
}

function cellCreator(x, y, pellet) {
    return new CellAdapter(new Cell(x, y, pellet), size);
}
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
let size = 20;

let gameMap = [];

let pelletProb = 1;

function setup() {
    createCanvas(400, 400);
    frameRate(30);
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

        // verify no walls
        this.y = this.y + direction.y;
        this.x = this.x + direction.x;
        if (cell.hasPellet()) {
            this.score = this.score + cell.pellet.points;
            cell.removePellet();
        }
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
        ellipse(this.x * this.size + this.size / 2, this.y * this.size + this.size / 2, this.size / 2, this.size / 2);
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
        this.walls = [];
        this.pellet = pellet;
    }

    hasPellet() {
        return !(this.pellet === undefined);
    }

    removePellet() {
        this.pellet = undefined;
    }

    draw() {
        noFill();
        stroke(0);
        rect(this.x * this.size, this.y * this.size, this.size, this.size);

        if (this.hasPellet()) {
            this.pellet.draw();
        }
    }
}
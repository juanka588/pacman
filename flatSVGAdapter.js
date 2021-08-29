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
let size = 10;

let gameEngine;

let svgElement;
let width = 400;
let height = 400;

function setup() {
    svgElement = document.querySelector("#game-screen");
    svgElement.setAttribute("width", width);
    svgElement.setAttribute("height", height);
    svgElement.addEventListener("keydown", keyPressed);
    rows = width / size;
    cols = width / size;
    gameEngine = new SVGGameAdapter(new GameEngine(rows, cols, pacmanCreator, pelletCreator, cellCreator));
    setTimeout(() => {
        draw();
    }, 500);
}

function draw() {
    //background(220);
    let direction = directions[currentDirection];
    gameEngine.gameLoop(direction);
    // setTimeout(() => {
    //     draw();
    // }, 500);
}

function keyPressed(evt) {
    const keyCode = evt.key;
    if (keyCode === "ArrowRight") {
        currentDirection = 1;
    }
    if (keyCode === "ArrowDown") {
        currentDirection = 2;
    }
    if (keyCode === "ArrowUp") {
        currentDirection = 3;
    }
    if (keyCode === "ArrowLeft") {
        currentDirection = 4;
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
        // push();
        let xCenter = this.pacman.x * this.size;
        let yCenter = this.pacman.y * this.size;
        let offset = this.size / 2;
        let size = this.size;
        //
        // this.closingAngle = this.closingAngle + this.animationRate;
        // if (this.closingAngle >= 1) {
        //     this.animationRate = -this.animationRate;
        // }
        // if (this.closingAngle < 0.8) {
        //     this.animationRate = -this.animationRate;
        // }
        //
        // translate(xCenter + offset, yCenter + offset);
        let sign = -1;
        // if (this.rotation === (-3 * PI / 4)) {
        //     // must mirror
        //     sign = 1;
        // }
        // rotate(this.rotation);
        // fill(212, 205, 13);
        // arc(0, 0, size, size, 0, 2 * PI * this.closingAngle);
        createCircle(xCenter + offset, yCenter + offset, size / 2, "pacman");
        //
        // fill(0);
        createCircle(xCenter + offset + sign * offset * 0.3, yCenter + offset + sign * offset * 0.5, size * 0.1, "pacman-eye");
        // pop();
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
        let offset = this.size / 2;
        let xCenter = this.pellet.x * this.size;
        let yCenter = this.pellet.y * this.size;
        let size = this.size / 3;
        createCircle(xCenter + offset, yCenter + offset, size, "pellet");
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
        return this.cell.hasWallsInDirection(direction);
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
        let top = this.cell.y * this.size;
        let bottom = (this.cell.y + 1) * this.size;
        let left = this.cell.x * this.size;
        let right = (this.cell.x + 1) * this.size;
        let className = "wall";

        if (this.hasLeftWall()) {
            createLine(left, top, left, bottom, className);
        }
        if (this.hasTopWall()) {
            createLine(left, top, right, top, className);
        }
        if (this.hasRightWall()) {
            createLine(right, top, right, bottom, className);
        }
        if (this.hasBottomWall()) {
            createLine(left, bottom, right, bottom, className);
        }

        if (this.cell.hasPellet()) {
            this.cell.pellet.draw();
        }
    }
}

class SVGGameAdapter {
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


const svgNS = "http://www.w3.org/2000/svg";

function createCircle(cx, cy, r, className) {
    let myCircle = document.createElementNS(svgNS, "circle");
    myCircle.setAttributeNS(null, "cx", cx);
    myCircle.setAttributeNS(null, "cy", cy);
    myCircle.setAttributeNS(null, "r", r);
    myCircle.setAttributeNS(null, "class", className);
    svgElement.appendChild(myCircle);
    return myCircle;
}

function createLine(x1, y1, x2, y2, className) {
    let myLine = document.createElementNS(svgNS, "line");
    myLine.setAttributeNS(null, "x1", x1);
    myLine.setAttributeNS(null, "y1", y1);
    myLine.setAttributeNS(null, "x2", x2);
    myLine.setAttributeNS(null, "y2", y2);
    myLine.setAttributeNS(null, "stroke", "green");
    myLine.setAttributeNS(null, "className", className);
    svgElement.appendChild(myLine);
    return myLine;
}
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
let size = 50;

let gameEngine;

let svgElement;
let width = 400;
let height = 400;
const PI = Math.PI;
const frameRate = 100;

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
    }, frameRate);
}

function draw() {
    let direction = directions[currentDirection];
    gameEngine.gameLoop(direction);
    setTimeout(() => {
        draw();
    }, frameRate);
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
        this.rotation = 0;
        this.geometryRef = undefined;
    }

    move(direction, gameMap) {
        if (direction.y < 0) { // up
            this.rotation = -90;
        }
        if (direction.y > 0) { // down
            this.rotation = 90;
        }
        if (direction.x > 0) { // right
            this.rotation = 0;
        }
        if (direction.x < 0) { // left
            this.rotation = 180;
        }
        this.pacman.move(direction, gameMap);
    }

    canMove(direction, rows, cols) {
        return this.pacman.canMove(direction, rows, cols);
    }

    draw() {
        if (this.geometryRef) {
            this.moveAndTransformRef();
            return;
        }
        let group = createGroup("pacman-container");

        let xCenter = this.pacman.x * this.size;
        let yCenter = this.pacman.y * this.size;
        let offset = this.size / 2;
        let size = this.size;
        translateAndRotate(group, xCenter + offset, yCenter + offset, this.rotation);
        let body = createCircle(0, 0, size / 2, "pacman");
        let eye = createCircle(offset * 0.3, -offset * 0.5, size * 0.1, "pacman-eye");

        group.appendChild(body);
        group.appendChild(eye);

        this.geometryRef = group;
        svgElement.appendChild(this.geometryRef);
    }

    moveAndTransformRef() {
        let group = this.geometryRef;
        let xCenter = this.pacman.x * this.size;
        let yCenter = this.pacman.y * this.size;
        let offset = this.size / 2;
        translateAndRotate(group, xCenter + offset, yCenter + offset, this.rotation);
    }
}

class PelletAdapter {
    constructor(pellet, size) {
        this.pellet = pellet;
        this.size = size;
        this.hasBeenCreated = false;
        this.geometryRef = undefined;
    }

    score() {
        if (this.geometryRef) {
            svgElement.removeChild(this.geometryRef);
            this.geometryRef = undefined;
        }
        return this.pellet.score();
    }

    draw() {
        if (this.hasBeenCreated) {
            return;
        }
        let offset = this.size / 2;
        let xCenter = this.pellet.x * this.size;
        let yCenter = this.pellet.y * this.size;
        let size = this.size / 3;
        this.geometryRef = createCircle(xCenter + offset, yCenter + offset, size, "pellet");
        svgElement.appendChild(this.geometryRef);
        this.hasBeenCreated = true;
    }
}

class CellAdapter {
    constructor(cell, size) {
        this.cell = cell;
        this.size = size;
        this.hasBeenCreated = false;
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
        if (this.hasBeenCreated) {
            return;
        }
        let top = this.cell.y * this.size;
        let bottom = (this.cell.y + 1) * this.size;
        let left = this.cell.x * this.size;
        let right = (this.cell.x + 1) * this.size;
        let className = "wall";

        if (this.hasLeftWall()) {
            svgElement.appendChild(createLine(left, top, left, bottom, className));
        }
        if (this.hasTopWall()) {
            svgElement.appendChild(createLine(left, top, right, top, className));
        }
        if (this.hasRightWall()) {
            svgElement.appendChild(createLine(right, top, right, bottom, className));
        }
        if (this.hasBottomWall()) {
            svgElement.appendChild(createLine(left, bottom, right, bottom, className));
        }

        if (this.cell.hasPellet()) {
            this.cell.pellet.draw();
        }
        this.hasBeenCreated = true;
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
    return myCircle;
}

function createGroup(className) {
    let myGroup = document.createElementNS(svgNS, "g");
    myGroup.setAttributeNS(null, "class", className);
    return myGroup;
}

function createLine(x1, y1, x2, y2, className) {
    let myLine = document.createElementNS(svgNS, "line");
    myLine.setAttributeNS(null, "x1", x1);
    myLine.setAttributeNS(null, "y1", y1);
    myLine.setAttributeNS(null, "x2", x2);
    myLine.setAttributeNS(null, "y2", y2);
    myLine.setAttributeNS(null, "stroke", "green");
    myLine.setAttributeNS(null, "className", className);
    return myLine;
}

function translateAndRotate(element, x, y, angle) {
    if (angle === 180) {
        element.setAttributeNS(null, "transform", `translate(${x},${y}) scale(-1,1)`);
    } else {
        element.setAttributeNS(null, "transform", `translate(${x},${y}) rotate(${angle})`);
    }
    return element;
}

function translate(element, x, y) {
    element.setAttributeNS(null, "transform", `translate(${x},${y})`);
    return element;
}

function rotate(element, angle) {
    element.setAttributeNS(null, "transform", `rotate(${angle})`);
    return element;
}
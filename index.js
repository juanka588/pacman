let rows;
let cols;
let size = 20;

let gameEngine;
let controls;

function setup() {
    const cnv = createCanvas(400, 400);
    cnv.parent('game-canvas-container');
    frameRate(10);
    rows = width / size;
    cols = width / size;
    gameEngine = new P5GameAdapter(new GameEngine(rows, cols, pacmanCreator, pelletCreator, cellCreator, ghostCreator));
    window.gameEngine = gameEngine;
    controls = new KeyboardControlAdapter(document);
    window.controls = controls;
}

function draw() {
    background(0);
    gameEngine.gameLoop(controls.getDirection());
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
        noStroke();
        fill(255, 215, 0);
        arc(0, 0, size, size, 0, 2 * PI * this.closingAngle);

        fill(0);
        circle(sign * offset * 0.3, sign * offset * 0.5, size * 0.12);
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
        noStroke();
        fill(255, 184, 151);
        let offset = this.size / 2;
        let xCenter = this.pellet.x * this.size;
        let yCenter = this.pellet.y * this.size;
        let size = this.size / 4;
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
        return this.cell.removePellet();
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

    removeLeftWall() {
        this.cell.removeLeftWall()
    }

    removeTopWall() {
        this.cell.removeTopWall()
    }

    removeRightWall() {
        this.cell.removeRightWall()
    }

    removeBottomWall() {
        this.cell.removeBottomWall()
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
        strokeWeight(2.5);
        stroke(26, 120, 255);
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
        strokeWeight(1);

        if (this.cell.hasPellet()) {
            this.cell.pellet.draw();
        }
    }
}

const GHOST_COLORS = {
    blinky: [255, 0,   0  ],
    pinky:  [255, 184, 255],
    inky:   [0,   255, 255],
    clyde:  [255, 184, 82 ],
};

class GhostAdapter {
    constructor(ghost, size) {
        this.ghost = ghost;
        this.size = size;
    }

    draw() {
        const g = this.ghost;
        push();
        const xCenter = g.x * this.size + this.size / 2;
        const yCenter = g.y * this.size + this.size / 2;
        const r = this.size / 2;
        translate(xCenter, yCenter);

        let bodyColor;
        if (g.mode === 'frightened') {
            // flicker between blue and white based on millis
            bodyColor = (millis() % 300 < 150) ? color(0, 0, 204) : color(255, 255, 255);
        } else {
            const [cr, cg, cb] = GHOST_COLORS[g.id] || [200, 200, 200];
            bodyColor = color(cr, cg, cb);
        }
        fill(bodyColor);
        noStroke();
        // Body: semicircle top + rectangular bottom
        arc(0, 0, r * 2, r * 2, PI, 0);
        rect(-r, 0, r * 2, r);
        // Wavy bottom — three bumps cut out with background colour
        fill(0);
        const bumpR = r / 3;
        for (let b = -1; b <= 1; b++) {
            circle(b * bumpR * 2, r, bumpR);
        }
        // Eyes (hidden when frightened)
        if (g.mode !== 'frightened') {
            fill(255);
            circle(-r * 0.35, -r * 0.1, r * 0.5);
            circle( r * 0.35, -r * 0.1, r * 0.5);
            fill(0, 0, 180);
            circle(-r * 0.35, -r * 0.1, r * 0.25);
            circle( r * 0.35, -r * 0.1, r * 0.25);
        }
        pop();
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
        for (const ghost of this.gameEngine.ghosts) {
            ghost.draw();
        }
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            const pac = this.gameEngine.pacman.pacman || this.gameEngine.pacman;
            scoreEl.textContent = `SCORE: ${Math.floor(pac.score)}`;
        }
        if (this.gameEngine.gameOver) {
            fill(255, 0, 0);
            noStroke();
            textSize(32);
            textAlign(CENTER, CENTER);
            text('GAME OVER', width / 2, height / 2);
        }
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

function ghostCreator(x, y, id) {
    return new GhostAdapter(new Ghost(x, y, id), size);
}
let rows;
let cols;
let size = 20;

let gameEngine;
let controls;

function setup() {
    const cnv = createCanvas(400, 400);
    cnv.parent('game-canvas-container');
    frameRate(6);
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
        this.pellet  = pellet;
        this.size    = size;
        this.isSuper = pellet.isSuper || false;
    }

    score() {
        return this.pellet.score();
    }

    draw() {
        noStroke();
        const offset  = this.size / 2;
        const xCenter = this.pellet.x * this.size + offset;
        const yCenter = this.pellet.y * this.size + offset;
        if (this.isSuper) {
            // Pulsing white super pellet
            const r = 5 + Math.sin(frameCount * 0.3) * 1.5;
            fill(255, 255, 255);
            circle(xCenter, yCenter, r * 2);
        } else {
            fill(255, 184, 151);
            circle(xCenter, yCenter, this.size / 4);
        }
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

// ─── Sound engine ─────────────────────────────────────────────────────────────
const _sfxP5 = (() => {
    let ctx = null;
    function _ctx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx;
    }
    function tone(freq, type, duration, volume, delay) {
        const ac = _ctx();
        ac.resume().then(() => {
            const osc  = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain); gain.connect(ac.destination);
            osc.type = type || 'square';
            osc.frequency.value = freq;
            const t = ac.currentTime + (delay || 0);
            gain.gain.setValueAtTime(volume || 0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
            osc.start(t); osc.stop(t + duration);
        });
    }
    return {
        pellet()  { tone(440, 'square',   0.06, 0.10); },
        super()   { tone(660, 'sawtooth', 0.10, 0.20); tone(880, 'sawtooth', 0.10, 0.20, 0.07); },
        die()     { tone(220, 'sawtooth', 0.14, 0.28); tone(150, 'sawtooth', 0.18, 0.28, 0.12); tone(90, 'sawtooth', 0.22, 0.28, 0.24); },
        eatGhost(){ tone(330, 'sine', 0.05, 0.28); tone(660, 'sine', 0.05, 0.28, 0.06); tone(990, 'sine', 0.08, 0.28, 0.12); },
    };
})();

class P5GameAdapter {
    constructor(gameEngine) {
        this.gameEngine   = gameEngine;
        this._gameOverSnd = false;
    }

    gameLoop(direction) {
        const eng      = this.gameEngine;
        const pac      = eng.pacman.pacman || eng.pacman;
        const scorePre = pac.score;
        const wasOver  = eng.gameOver;
        const frightenedBefore = eng.ghosts.map(g => (g.ghost || g).mode === 'frightened');

        eng.gameLoop(direction);

        if (pac.score > scorePre) {
            if (pac.score - scorePre >= 50) _sfxP5.super();
            else                             _sfxP5.pellet();
        }
        eng.ghosts.forEach((g, i) => {
            if (frightenedBefore[i] && (g.ghost || g).eaten) _sfxP5.eatGhost();
        });
        if (eng.gameOver && !wasOver && !this._gameOverSnd) {
            this._gameOverSnd = true;
            _sfxP5.die();
        }

        for (let i = 0; i < eng.rows; i++)
            for (let j = 0; j < eng.cols; j++)
                eng.gameMap[i][j].draw();

        eng.pacman.draw();
        for (const ghost of eng.ghosts) ghost.draw();

        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = `SCORE: ${Math.floor(pac.score)}`;

        if (eng.gameOver) {
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

function pelletCreator(x, y, points, isSuper) {
    const pellet = isSuper ? new SuperPellet(x, y) : new Pellet(x, y, points);
    return new PelletAdapter(pellet, size);
}

function cellCreator(x, y, pellet) {
    return new CellAdapter(new Cell(x, y, pellet), size);
}

function ghostCreator(x, y, id) {
    return new GhostAdapter(new Ghost(x, y, id), size);
}
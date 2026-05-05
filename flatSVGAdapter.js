let rows;
let cols;
let size = 20;

let gameEngine;
let controls;

let svgElement;
let width = 400;
let height = 400;
const PI = Math.PI;
const FRAME_RATE = 150;

function setup() {
    svgElement = document.querySelector("#game-screen");
    svgElement.setAttribute("width", width);
    svgElement.setAttribute("height", height);
    rows = width / size;
    cols = width / size;
    gameEngine = new SVGGameAdapter(new GameEngine(rows, cols, pacmanCreator, pelletCreator, cellCreator, ghostCreator, sfxEventListener));
    window.gameEngine = gameEngine;
    controls = new KeyboardControlAdapter(document);
    window.controls = controls;
    svgElement.focus();
    setTimeout(() => { draw(); }, FRAME_RATE);
}

function draw() {
    gameEngine.gameLoop(controls.getDirection());
    setTimeout(() => { draw(); }, FRAME_RATE);
}

class PacmanAdapter {
    constructor(pacman, size) {
        this.pacman = pacman;
        this.size = size;
        this.rotation = 0;
        this.geometryRef = undefined;
    }

    move(direction, gameMap) {
        if (direction.y < 0) this.rotation = -90;
        if (direction.y > 0) this.rotation = 90;
        if (direction.x > 0) this.rotation = 0;
        if (direction.x < 0) this.rotation = 180;
        this.pacman.move(direction, gameMap);
    }

    canMove(direction, rows, cols) {
        return this.pacman.canMove(direction, rows, cols);
    }

    draw() {
        if (!this.geometryRef) {
            this._create();
        }
        this._updateTransform();
        this._updateMouth();
    }

    _create() {
        const group = createGroup('pacman-container');
        const r = this.size * 0.44;

        // Full yellow circle — perfectly centered at origin
        const body = createCircle(0, 0, r, 'pacman-body');

        // Black mouth wedge drawn on top to create the chomping gap
        const mouth = document.createElementNS(svgNS, 'path');
        mouth.setAttributeNS(null, 'fill', '#000000');

        const eye = createCircle(r * 0.2, -r * 0.45, r * 0.12, 'pacman-eye');

        group.appendChild(body);
        group.appendChild(mouth);
        group.appendChild(eye);

        this._r = r;
        this._mouthEl = mouth;
        this._mouthAngle = 0.4;
        this._animDir = -1;

        svgElement.appendChild(group);
        this.geometryRef = group;
    }

    _updateMouth() {
        this._mouthAngle += 0.12 * this._animDir;
        if (this._mouthAngle > 0.55) this._animDir = -1;
        if (this._mouthAngle < 0.04) this._animDir = 1;

        const r = this._r;
        const a = Math.max(0.04, this._mouthAngle);
        // Small-arc wedge from top-jaw to bottom-jaw (clockwise), closes to center
        const tx = +(Math.cos(-a) * r).toFixed(3);
        const ty = +(Math.sin(-a) * r).toFixed(3);
        const bx = +(Math.cos(a) * r).toFixed(3);
        const by = +(Math.sin(a) * r).toFixed(3);
        const d = `M 0 0 L ${tx} ${ty} A ${r} ${r} 0 0 1 ${bx} ${by} Z`;
        this._mouthEl.setAttributeNS(null, 'd', d);
    }

    _updateTransform() {
        const xCenter = this.pacman.x * this.size + this.size / 2;
        const yCenter = this.pacman.y * this.size + this.size / 2;
        this.geometryRef.setAttributeNS(null, 'transform',
            `translate(${xCenter},${yCenter}) rotate(${this.rotation})`);
    }
}

class PelletAdapter {
    constructor(pellet, size) {
        this.pellet = pellet;
        this.size = size;
        this.hasBeenCreated = false;
        this.geometryRef = undefined;
        this.isSuper = pellet.isSuper || false;
    }

    score() {
        if (this.geometryRef) {
            svgElement.removeChild(this.geometryRef);
            this.geometryRef = undefined;
        }
        return this.pellet.score();
    }

    draw() {
        if (this.hasBeenCreated) return;
        const offset  = this.size / 2;
        const xCenter = this.pellet.x * this.size + offset;
        const yCenter = this.pellet.y * this.size + offset;
        if (this.isSuper) {
            this.geometryRef = createCircle(xCenter, yCenter, this.size * 0.42, 'super-pellet');
        } else {
            this.geometryRef = createCircle(xCenter, yCenter, this.size / 3, 'pellet');
        }
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
        return this.cell.removePellet();
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
        this._gameOverShown = false;
    }

    gameLoop(direction) {
        const eng = this.gameEngine;
        eng.gameLoop(direction);
        const ev  = eng.events;

        const bar = document.getElementById('power-bar');
        if (bar) {
            bar.style.width = (ev.frightenedRatio * 100) + '%';
            bar.classList.toggle('urgent', ev.frightenedRatio > 0 && ev.frightenedRatio < 0.3);
        }

        for (let i = 0; i < eng.rows; i++)
            for (let j = 0; j < eng.cols; j++)
                eng.gameMap[i][j].draw();

        eng.pacman.draw();
        for (const ghost of eng.ghosts) ghost.draw();

        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = `SCORE: ${Math.floor(eng.score)}`;

        if (eng.gameOver && !this._gameOverShown) {
            this._gameOverShown = true;
            const txt = document.createElementNS(svgNS, 'text');
            txt.setAttributeNS(null, 'x', svgElement.getAttribute('width') / 2);
            txt.setAttributeNS(null, 'y', svgElement.getAttribute('height') / 2);
            txt.setAttributeNS(null, 'text-anchor', 'middle');
            txt.setAttributeNS(null, 'dominant-baseline', 'middle');
            txt.setAttributeNS(null, 'class', 'game-over-text');
            txt.textContent = 'GAME OVER';
            svgElement.appendChild(txt);
        }
    }
}

const SVG_GHOST_COLORS = {
    blinky: '#FF0000',
    pinky:  '#FFB8FF',
    inky:   '#00FFFF',
    clyde:  '#FFB852',
};

class SVGGhostAdapter {
    constructor(ghost, size) {
        this.ghost = ghost;
        this.size = size;
        this.geometryRef = null;
    }

    draw() {
        if (!this.geometryRef) {
            this._create();
        }
        this._updateTransform();
        this._updateColor();
    }

    _create() {
        const s = this.size;
        const r = s / 2;
        const group = createGroup('ghost-container ghost-' + this.ghost.id);

        // Body: arc top + rect bottom as a single path
        const bumpW = r / 3;
        // M = top-left of bounding box, arc across the top, straight down sides,
        // three upward bumps along the bottom
        const d = [
            `M ${-r} 0`,
            `A ${r} ${r} 0 0 1 ${r} 0`,
            `L ${r} ${r}`,
            `Q ${r - bumpW * 0.5} ${r} ${r - bumpW} ${r - bumpW}`,
            `Q ${r - bumpW * 1.5} ${r - bumpW * 2} ${r - bumpW * 2} ${r}`,
            `Q ${r - bumpW * 2.5} ${r} ${-r + bumpW * 2} ${r}`,
            `Q ${-r + bumpW * 1.5} ${r - bumpW * 2} ${-r + bumpW} ${r - bumpW}`,
            `Q ${-r + bumpW * 0.5} ${r} ${-r} ${r}`,
            'Z',
        ].join(' ');

        const body = document.createElementNS(svgNS, 'path');
        body.setAttributeNS(null, 'd', d);
        body.setAttributeNS(null, 'class', 'ghost-body');

        // Eyes
        const eyeL = createCircle(-r * 0.35, -r * 0.1, r * 0.25, 'ghost-eye-white');
        const eyeR = createCircle( r * 0.35, -r * 0.1, r * 0.25, 'ghost-eye-white');
        const pupilL = createCircle(-r * 0.35, -r * 0.1, r * 0.12, 'ghost-pupil');
        const pupilR = createCircle( r * 0.35, -r * 0.1, r * 0.12, 'ghost-pupil');

        group.appendChild(body);
        group.appendChild(eyeL);
        group.appendChild(eyeR);
        group.appendChild(pupilL);
        group.appendChild(pupilR);

        svgElement.appendChild(group);
        this.geometryRef = group;
    }

    _updateTransform() {
        const xCenter = this.ghost.x * this.size + this.size / 2;
        const yCenter = this.ghost.y * this.size + this.size / 2;
        this.geometryRef.setAttributeNS(null, 'transform', `translate(${xCenter},${yCenter})`);
    }

    _updateColor() {
        const body = this.geometryRef.querySelector('.ghost-body');
        if (!body) return;
        if (this.ghost.mode === 'frightened') {
            this.geometryRef.setAttributeNS(null, 'class', 'ghost-container ghost-' + this.ghost.id + ' ghost-frightened');
            body.removeAttributeNS(null, 'fill');
        } else {
            this.geometryRef.setAttributeNS(null, 'class', 'ghost-container ghost-' + this.ghost.id);
            body.setAttributeNS(null, 'fill', SVG_GHOST_COLORS[this.ghost.id] || '#CCCCCC');
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
    return new SVGGhostAdapter(new Ghost(x, y, id), size);
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
    myLine.setAttributeNS(null, "class", className);
    return myLine;
}

function translateAndRotate(element, x, y, angle, mustMirror) {
    let scale = "";
    if (mustMirror) {
        scale = "scale(-1,1)";
    }
    let angleToApply = angle;
    if (angle === 180) {
        angleToApply = 0;
    }
    element.setAttributeNS(null, "transform", `translate(${x},${y}) ${scale} rotate(${angleToApply})`);
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
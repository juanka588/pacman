const TILE = 16;

const GHOST_COLORS = {
    blinky: '#FF0000',
    pinky:  '#FFB8FF',
    inky:   '#00FFFF',
    clyde:  '#FFB852',
};

// ─── PixelArtCellAdapter ──────────────────────────────────────────────────────

class PixelArtCellAdapter {
    constructor(cell, tile) {
        this.cell = cell;
        this.tile = tile;
        this.hasBeenCreated = false;
        // Reference to the pellet adapter stored for draw/erase tracking
        this._pelletAdapter = null;
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

    createLeftWall()   { this.cell.createLeftWall(); }
    createTopWall()    { this.cell.createTopWall(); }
    createRightWall()  { this.cell.createRightWall(); }
    createBottomWall() { this.cell.createBottomWall(); }

    removeLeftWall()   { this.cell.removeLeftWall(); }
    removeTopWall()    { this.cell.removeTopWall(); }
    removeRightWall()  { this.cell.removeRightWall(); }
    removeBottomWall() { this.cell.removeBottomWall(); }

    hasLeftWall()   { return this.cell.hasLeftWall(); }
    hasTopWall()    { return this.cell.hasTopWall(); }
    hasRightWall()  { return this.cell.hasRightWall(); }
    hasBottomWall() { return this.cell.hasBottomWall(); }

    draw(ctx) {
        if (this.hasBeenCreated) return;

        const x = this.cell.x * this.tile;
        const y = this.cell.y * this.tile;
        const t = this.tile;

        // Black floor
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, t, t);

        // Neon-blue walls (2px thick)
        ctx.strokeStyle = '#1a78ff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        if (this.cell.hasLeftWall()) {
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + t);
        }
        if (this.cell.hasTopWall()) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + t, y);
        }
        if (this.cell.hasRightWall()) {
            ctx.moveTo(x + t, y);
            ctx.lineTo(x + t, y + t);
        }
        if (this.cell.hasBottomWall()) {
            ctx.moveTo(x, y + t);
            ctx.lineTo(x + t, y + t);
        }
        ctx.stroke();

        this.hasBeenCreated = true;
    }
}

// Redraws the floor + walls for a single cell — called after an entity leaves it
function _redrawCell(ctx, gameMap, gx, gy, tile) {
    const cellAdapter = gameMap[gx][gy];
    const x = gx * tile;
    const y = gy * tile;
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, tile, tile);
    ctx.strokeStyle = '#1a78ff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (cellAdapter.hasLeftWall())   { ctx.moveTo(x,        y);      ctx.lineTo(x,        y + tile); }
    if (cellAdapter.hasTopWall())    { ctx.moveTo(x,        y);      ctx.lineTo(x + tile, y);        }
    if (cellAdapter.hasRightWall())  { ctx.moveTo(x + tile, y);      ctx.lineTo(x + tile, y + tile); }
    if (cellAdapter.hasBottomWall()) { ctx.moveTo(x,        y+tile); ctx.lineTo(x + tile, y + tile); }
    ctx.stroke();
    // Redraw pellet if still present
    if (cellAdapter._pelletAdapter && cellAdapter.hasPellet()) {
        const pa = cellAdapter._pelletAdapter;
        const cx = Math.floor(gx * tile + tile / 2);
        const cy = Math.floor(gy * tile + tile / 2);
        if (pa.isSuper) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#FFB897';
            ctx.fillRect(cx - 2, cy - 2, 4, 4);
        }
    }
}

// ─── PixelArtPelletAdapter ────────────────────────────────────────────────────

class PixelArtPelletAdapter {
    constructor(pellet, tile) {
        this.pellet = pellet;
        this.tile = tile;
        this.hasBeenEaten = false;
        this._drawn = false;
        this.isSuper = pellet.isSuper || false;
    }

    score() {
        return this.pellet.score();
    }

    draw(ctx, tick) {
        if (this.hasBeenEaten) return;

        const cx = Math.floor(this.pellet.x * this.tile + this.tile / 2);
        const cy = Math.floor(this.pellet.y * this.tile + this.tile / 2);

        if (this.isSuper) {
            // Pulsing white circle for super pellet — redrawn every tick
            const r = 4 + Math.round(Math.sin((tick || 0) * 0.4) * 1.5);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        } else {
            if (this._drawn) return;
            ctx.fillStyle = '#FFB897';
            ctx.fillRect(cx - 2, cy - 2, 4, 4);
            this._drawn = true;
        }
    }

    erase(ctx) {
        if (this.hasBeenEaten) return;
        const cx = Math.floor(this.pellet.x * this.tile + this.tile / 2);
        const cy = Math.floor(this.pellet.y * this.tile + this.tile / 2);
        const r = 7; // large enough to clear the pulsing super pellet
        ctx.fillStyle = '#000000';
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        this.hasBeenEaten = true;
    }
}

// ─── PixelArtPacmanAdapter ────────────────────────────────────────────────────

class PixelArtPacmanAdapter {
    constructor(pacman, tile) {
        this.pacman = pacman;
        this.tile = tile;
        this._direction = { x: 1, y: 0 };
        this._mouthOpen = true;
        this._prevX = pacman.x;
        this._prevY = pacman.y;
    }

    move(direction, gameMap) {
        if (direction.x !== 0 || direction.y !== 0) {
            this._direction = direction;
        }
        this.pacman.move(direction, gameMap);
    }

    canMove(direction, rows, cols) {
        return this.pacman.canMove(direction, rows, cols);
    }

    draw(ctx, gameMap) {
        const t = this.tile;

        // Redraw the cell we just left (black floor + walls) so walls are not erased
        if (this._prevX !== this.pacman.x || this._prevY !== this.pacman.y) {
            _redrawCell(ctx, gameMap, this._prevX, this._prevY, t);
        }

        // Toggle mouth animation each tick
        this._mouthOpen = !this._mouthOpen;

        const px = this.pacman.x;
        const py = this.pacman.y;
        const cx = px * t + t / 2;
        const cy = py * t + t / 2;
        const r = t / 2 - 1;  // radius fits in tile

        // Draw gold Pac-Man body — filled square with 1px corners removed for roundness
        ctx.fillStyle = '#FFD700';
        // Main cross fills
        ctx.fillRect(cx - r + 1, cy - r, (r - 1) * 2, t - 2);     // vertical bar
        ctx.fillRect(cx - r, cy - r + 1, t - 2, t - 4);            // horizontal bar

        // Draw mouth wedge (black) based on direction and open/close state
        if (this._mouthOpen) {
            ctx.fillStyle = '#000000';
            const dir = this._direction;

            if (dir.x > 0) {
                // Facing right: wedge from center to right edge
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + r, cy - r / 2);
                ctx.lineTo(cx + r, cy + r / 2);
                ctx.closePath();
                ctx.fill();
            } else if (dir.x < 0) {
                // Facing left: wedge from center to left edge
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx - r, cy - r / 2);
                ctx.lineTo(cx - r, cy + r / 2);
                ctx.closePath();
                ctx.fill();
            } else if (dir.y < 0) {
                // Facing up: wedge from center to top edge
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx - r / 2, cy - r);
                ctx.lineTo(cx + r / 2, cy - r);
                ctx.closePath();
                ctx.fill();
            } else if (dir.y > 0) {
                // Facing down: wedge from center to bottom edge
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx - r / 2, cy + r);
                ctx.lineTo(cx + r / 2, cy + r);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Draw eye (small black dot offset perpendicular to movement direction)
        const dir = this._direction;
        ctx.fillStyle = '#000000';
        // Eye is perpendicular to direction, offset slightly towards head
        const eyeOffX = -dir.y * Math.round(r * 0.4) + dir.x * Math.round(r * 0.1);
        const eyeOffY =  dir.x * Math.round(r * 0.4) + dir.y * Math.round(r * 0.1);
        ctx.fillRect(cx + eyeOffX - 1, cy + eyeOffY - 1, 2, 2);

        this._prevX = px;
        this._prevY = py;
    }
}

// ─── PixelArtGhostAdapter ─────────────────────────────────────────────────────

class PixelArtGhostAdapter {
    constructor(ghost, tile) {
        this.ghost = ghost;
        this.tile = tile;
        this._prevX = ghost.x;
        this._prevY = ghost.y;
    }

    draw(ctx, gameMap) {
        const t = this.tile;

        // Redraw the cell we just left so its walls are not erased
        if (this._prevX !== this.ghost.x || this._prevY !== this.ghost.y) {
            _redrawCell(ctx, gameMap, this._prevX, this._prevY, t);
        }

        const gx = this.ghost.x;
        const gy = this.ghost.y;
        const x = gx * t;
        const y = gy * t;
        const r = t / 2;
        const cx = x + r;
        const cy = y + r;

        // Pick color — flicker blue/white when frightened
        let bodyColor;
        if (this.ghost.mode === 'frightened') {
            bodyColor = (Date.now() % 300 < 150) ? '#0000CC' : '#aaaaff';
        } else {
            bodyColor = GHOST_COLORS[this.ghost.id] || '#CCCCCC';
        }

        ctx.fillStyle = bodyColor;

        // Body: draw rounded rectangle approximation
        // Top half: 4 corner pixels removed for rounded look
        ctx.fillRect(x + 2, y,     t - 4, 2);           // top row (narrow)
        ctx.fillRect(x + 1, y + 1, t - 2, 2);           // second row (slightly wider)
        ctx.fillRect(x,     y + 3, t,     t - 3 - 3);   // main body (full width)

        // Bottom row: 3 bumps (leave gaps between them)
        const bumpW = Math.floor(t / 3);
        ctx.fillRect(x,               y + t - 3, bumpW,     3);  // left bump
        ctx.fillRect(x + bumpW + 1,   y + t - 3, bumpW - 1, 3);  // center bump
        ctx.fillRect(x + bumpW * 2 + 1, y + t - 3, bumpW - 1, 3); // right bump

        // Eyes (white dots with dark pupils) — hidden when frightened
        if (this.ghost.mode !== 'frightened') {
            const eyeY = Math.round(cy - r * 0.2);
            // Left eye white
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(Math.round(cx - r * 0.45) - 2, eyeY - 2, 4, 4);
            // Right eye white
            ctx.fillRect(Math.round(cx + r * 0.45) - 2, eyeY - 2, 4, 4);
            // Pupils
            ctx.fillStyle = '#000088';
            ctx.fillRect(Math.round(cx - r * 0.45) - 1, eyeY - 1, 2, 2);
            ctx.fillRect(Math.round(cx + r * 0.45) - 1, eyeY - 1, 2, 2);
        }

        this._prevX = gx;
        this._prevY = gy;
    }
}

// ─── PixelArtGameAdapter ──────────────────────────────────────────────────────

class PixelArtGameAdapter {
    constructor(gameEngine, canvas) {
        this.gameEngine = gameEngine;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this._gameOverShown = false;

        // Build a flat list of all pellet adapters for draw/erase management
        this._pelletAdapters = [];
        for (let i = 0; i < gameEngine.rows; i++) {
            for (let j = 0; j < gameEngine.cols; j++) {
                const cellAdapter = gameEngine.gameMap[i][j];
                if (cellAdapter._pelletAdapter) {
                    this._pelletAdapters.push(cellAdapter._pelletAdapter);
                }
            }
        }
    }

    gameLoop(direction, tick) {
        const ctx     = this.ctx;
        const eng     = this.gameEngine;
        eng.gameLoop(direction);
        const ev = eng.events;

        const bar = document.getElementById('power-bar');
        if (bar) {
            bar.style.width = (ev.frightenedRatio * 100) + '%';
            bar.classList.toggle('urgent', ev.frightenedRatio > 0 && ev.frightenedRatio < 0.3);
        }

        // Draw all cells (only draws once, tracked internally)
        for (let i = 0; i < eng.rows; i++) {
            for (let j = 0; j < eng.cols; j++) {
                eng.gameMap[i][j].draw(ctx);
            }
        }

        // Draw pellets
        for (let i = 0; i < eng.rows; i++) {
            for (let j = 0; j < eng.cols; j++) {
                const cellAdapter = eng.gameMap[i][j];
                if (!cellAdapter._pelletAdapter) continue;
                const pa = cellAdapter._pelletAdapter;
                if (!cellAdapter.hasPellet() && !pa.hasBeenEaten) {
                    pa.erase(ctx);
                } else if (cellAdapter.hasPellet()) {
                    pa.draw(ctx, tick);
                }
            }
        }

        eng.pacman.draw(ctx, eng.gameMap);
        for (const ghost of eng.ghosts) {
            ghost.draw(ctx, eng.gameMap);
        }

        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = `SCORE: ${Math.floor(eng.score)}`;

        if (eng.gameOver && !this._gameOverShown) {
            this._gameOverShown = true;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 10;
            ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            ctx.shadowBlur = 0;
        }
    }
}

// ─── Sound engine (Web Audio API, no files needed) ────────────────────────────


// ─── Factory functions ────────────────────────────────────────────────────────

function pacmanCreator(x, y) {
    return new PixelArtPacmanAdapter(new Pacman(x, y), TILE);
}

function pelletCreator(x, y, points, isSuper) {
    const pellet = isSuper ? new SuperPellet(x, y) : new Pellet(x, y, points);
    return new PixelArtPelletAdapter(pellet, TILE);
}

function cellCreator(x, y, pellet) {
    const innerCell   = new Cell(x, y, pellet);
    const cellAdapter = new PixelArtCellAdapter(innerCell, TILE);
    if (pellet) cellAdapter._pelletAdapter = pellet;
    return cellAdapter;
}

function ghostCreator(x, y, id) {
    return new PixelArtGhostAdapter(new Ghost(x, y, id), TILE);
}

// ─── Setup & draw loop ────────────────────────────────────────────────────────

function setup() {
    const canvas = document.getElementById('game-screen');
    const ge = new GameEngine(20, 20, pacmanCreator, pelletCreator, cellCreator, ghostCreator, sfxEventListener);
    pixelArtGameAdapter = new PixelArtGameAdapter(ge, canvas);
    window.gameEngine = pixelArtGameAdapter;
    controls = new KeyboardControlAdapter(document);
    window.controls = controls;
    draw();
}

let _drawTick = 0;
function draw() {
    _drawTick++;
    pixelArtGameAdapter.gameLoop(controls.getDirection(), _drawTick);
    setTimeout(draw, 150);
}

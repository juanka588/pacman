class GameEngine {
    constructor(rows, cols, pacmanCreator, pelletCreator, cellCreator, ghostCreator) {
        this.rows = rows;
        this.cols = cols;
        this.pacman = pacmanCreator(rows / 2, cols / 2);
        this.gameOver = false;
        this.gameWon = false;
        this._ghostTick = 0;
        this._respawnTicks = 30; // ticks before an eaten ghost respawns

        let pelletProb = 0.2;
        this.gameMap = [];
        for (let i = 0; i < rows; i++) {
            this.gameMap[i] = [];
            for (let j = 0; j < cols; j++) {
                let pellet;
                if (randomInRange(0, 1) <= pelletProb) {
                    pellet = pelletCreator(i, j, randomInRange(5, 10));
                }
                this.gameMap[i][j] = cellCreator(i, j, pellet);
            }
        }

        let mazeGen = new MazeGenerator(this.gameMap);
        mazeGen.generate();

        this.ghosts = [];
        if (ghostCreator) {
            const ids = ['blinky', 'pinky', 'inky', 'clyde'];
            const corners = [
                [0,              0             ],
                [rows - 1,       0             ],
                [0,              cols - 1      ],
                [rows - 1,       cols - 1      ],
            ];
            ids.forEach((id, i) => {
                this.ghosts.push(ghostCreator(corners[i][0], corners[i][1], id));
            });
        }

        // Count initial pellets so win is only possible if there were any
        this._totalPellets = 0;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (this.gameMap[i][j].hasPellet()) this._totalPellets++;
            }
        }

        // Mode schedule: alternating scatter/chase phases (in game ticks).
        // Ghosts start in scatter so players have a brief grace period.
        // At 10 fps: 30 ticks = 3 s scatter, 100 ticks = 10 s chase.
        this._modeSchedule = [30, 100, 20, 100, 20, 100, 20];
        this._modePhase = 0;      // index into _modeSchedule
        this._modeTimer = 0;      // ticks elapsed in current phase
        this._phaseIsScatter = true;
    }

    gameLoop(direction) {
        if (this.gameOver || this.gameWon) return;

        if (this.pacman.canMove(direction, this.rows, this.cols)) {
            this.pacman.move(direction, this.gameMap);
        }

        this._checkWinCondition();
        if (this.gameWon) return;

        if (this.ghosts.length > 0) {
            this._updateGhostMode();

            // Respawn countdown runs every tick so the timer is predictable
            this.ghosts.forEach(g => { (g.ghost || g).respawnTick(); });

            // Ghosts move every other tick so Pac-Man feels faster
            this._ghostTick++;
            if (this._ghostTick % 2 === 0) {
                const blinky = this.ghosts.find(g => (g.ghost || g).id === 'blinky');
                const blinkyPos = blinky ? { x: (blinky.ghost || blinky).x, y: (blinky.ghost || blinky).y } : null;
                const pacmanCore = this.pacman.pacman || this.pacman;
                this.ghosts.forEach(g => {
                    const core = g.ghost || g;
                    core.tick();
                    if (!core.eaten) {
                        core.move(this.gameMap, this.rows, this.cols, pacmanCore, blinkyPos);
                    }
                });
            }
            this._checkGhostCollision();
        }
    }

    _updateGhostMode() {
        if (this._modePhase >= this._modeSchedule.length) return; // locked in chase forever
        this._modeTimer++;
        if (this._modeTimer >= this._modeSchedule[this._modePhase]) {
            this._modeTimer = 0;
            this._modePhase++;
            this._phaseIsScatter = !this._phaseIsScatter;
            const newMode = this._phaseIsScatter ? 'scatter' : 'chase';
            this.ghosts.forEach(g => {
                const core = g.ghost || g;
                if (core.mode !== 'frightened') core.mode = newMode;
            });
        }
    }

    _checkGhostCollision() {
        const pacCore = this.pacman.pacman || this.pacman;
        const px = pacCore.x;
        const py = pacCore.y;
        for (const g of this.ghosts) {
            const core = g.ghost || g;
            if (core.eaten) continue;
            if (core.x === px && core.y === py) {
                if (core.mode === 'frightened') {
                    // Pac-Man eats the ghost
                    const spawnCorners = [
                        [0,              0             ],
                        [this.rows - 1,  0             ],
                        [0,              this.cols - 1 ],
                        [this.rows - 1,  this.cols - 1 ],
                    ];
                    const ids = ['blinky', 'pinky', 'inky', 'clyde'];
                    const idx = ids.indexOf(core.id);
                    const [sx, sy] = spawnCorners[idx] || spawnCorners[0];
                    core.eat(sx, sy, this._respawnTicks);
                    pacCore.score += 200;
                } else {
                    this.gameOver = true;
                    return;
                }
            }
        }
    }

    _checkWinCondition() {
        // Win only if at least one pellet existed when the game started
        if (this._totalPellets === 0) return;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.gameMap[i][j].hasPellet()) return;
            }
        }
        this.gameWon = true;
    }
}

// Allow Node/Jest to require this file without breaking browser script-tag loading
if (typeof module !== 'undefined') {
    module.exports = { GameEngine };
}


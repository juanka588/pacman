class GameEngine {
    constructor(rows, cols, pacmanCreator, pelletCreator, cellCreator, ghostCreator) {
        this.rows = rows;
        this.cols = cols;
        this.pacman = pacmanCreator(rows / 2, cols / 2);
        this.gameOver = false;
        this._ghostTick = 0;

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

        // Mode schedule: alternating scatter/chase phases (in game ticks).
        // Ghosts start in scatter so players have a brief grace period.
        // At 10 fps: 30 ticks = 3 s scatter, 100 ticks = 10 s chase.
        this._modeSchedule = [30, 100, 20, 100, 20, 100, 20];
        this._modePhase = 0;      // index into _modeSchedule
        this._modeTimer = 0;      // ticks elapsed in current phase
        this._phaseIsScatter = true;
    }

    gameLoop(direction) {
        if (this.gameOver) return;

        if (this.pacman.canMove(direction, this.rows, this.cols)) {
            this.pacman.move(direction, this.gameMap);
        }

        if (this.ghosts.length > 0) {
            this._updateGhostMode();

            // Ghosts move every other tick so Pac-Man feels faster
            this._ghostTick++;
            if (this._ghostTick % 2 === 0) {
                const blinky = this.ghosts.find(g => (g.ghost || g).id === 'blinky');
                const blinkyPos = blinky ? { x: (blinky.ghost || blinky).x, y: (blinky.ghost || blinky).y } : null;
                const pacmanCore = this.pacman.pacman || this.pacman;
                this.ghosts.forEach(g => {
                    const core = g.ghost || g;
                    core.tick();
                    core.move(this.gameMap, this.rows, this.cols, pacmanCore, blinkyPos);
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
        const px = (this.pacman.pacman || this.pacman).x;
        const py = (this.pacman.pacman || this.pacman).y;
        for (const g of this.ghosts) {
            const core = g.ghost || g;
            if (core.x === px && core.y === py) {
                this.gameOver = true;
                return;
            }
        }
    }
}

// Allow Node/Jest to require this file without breaking browser script-tag loading
if (typeof module !== 'undefined') {
    module.exports = { GameEngine };
}


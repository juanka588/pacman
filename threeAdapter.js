/* Three.js 3D adapter for Pac-Man
 * Requires three.js r150 (UMD) loaded before this file.
 * Coordinate mapping: game cell.x → world X, game cell.y → world Z, Y = up.
 */

// ─── Sound engine ─────────────────────────────────────────────────────────────
const _sfx3 = (() => {
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
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.type = type || 'square';
            osc.frequency.value = freq;
            const t = ac.currentTime + (delay || 0);
            gain.gain.setValueAtTime(volume || 0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
            osc.start(t);
            osc.stop(t + duration);
        });
    }
    return {
        pellet()  { tone(440, 'square',   0.06, 0.10); },
        super()   { tone(660, 'sawtooth', 0.10, 0.20);
                    tone(880, 'sawtooth', 0.10, 0.20, 0.07); },
        die()     { tone(220, 'sawtooth', 0.14, 0.28);
                    tone(150, 'sawtooth', 0.18, 0.28, 0.12);
                    tone(90,  'sawtooth', 0.22, 0.28, 0.24); },
        eatGhost(){ tone(330, 'sine', 0.05, 0.28);
                    tone(660, 'sine', 0.05, 0.28, 0.06);
                    tone(990, 'sine', 0.08, 0.28, 0.12); },
    };
})();

const CELL_SIZE = 2;   // world units per tile
const WALL_H    = 1.4; // wall height
const WALL_T    = 0.18; // wall thickness

// ─── ThreeCellAdapter ─────────────────────────────────────────────────────────

class ThreeCellAdapter {
    constructor(cell, scene) {
        this.cell   = cell;
        this.scene  = scene;
        this._built = false;
    }

    hasPellet()               { return this.cell.hasPellet(); }
    removePellet()            { return this.cell.removePellet(); }
    hasWallsInDirection(d)    { return this.cell.hasWallsInDirection(d); }
    createLeftWall()          { this.cell.createLeftWall(); }
    createTopWall()           { this.cell.createTopWall(); }
    createRightWall()         { this.cell.createRightWall(); }
    createBottomWall()        { this.cell.createBottomWall(); }
    removeLeftWall()          { this.cell.removeLeftWall(); }
    removeTopWall()           { this.cell.removeTopWall(); }
    removeRightWall()         { this.cell.removeRightWall(); }
    removeBottomWall()        { this.cell.removeBottomWall(); }
    hasLeftWall()             { return this.cell.hasLeftWall(); }
    hasTopWall()              { return this.cell.hasTopWall(); }
    hasRightWall()            { return this.cell.hasRightWall(); }
    hasBottomWall()           { return this.cell.hasBottomWall(); }

    build() {
        if (this._built) return;
        this._built = true;

        const C  = CELL_SIZE;
        const cx = this.cell.x * C + C / 2;
        const cz = this.cell.y * C + C / 2;

        // Dark floor tile
        const floorGeo = new THREE.PlaneGeometry(C - 0.04, C - 0.04);
        const floorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
        const floor    = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(cx, 0.01, cz);
        floor.receiveShadow = true;
        this.scene.add(floor);

        const wallMat = new THREE.MeshPhongMaterial({
            color:    0x1a78ff,
            emissive: 0x061430,
            shininess: 40,
        });

        // addWall: wx/wz = wall center, rotY rotates the box
        const addWall = (wx, wz, rotY) => {
            const geo  = new THREE.BoxGeometry(C, WALL_H, WALL_T);
            const mesh = new THREE.Mesh(geo, wallMat);
            mesh.position.set(wx, WALL_H / 2, wz);
            mesh.rotation.y = rotY;
            mesh.castShadow    = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        };

        if (this.cell.hasLeftWall())   addWall(cx - C / 2, cz, Math.PI / 2);
        if (this.cell.hasRightWall())  addWall(cx + C / 2, cz, Math.PI / 2);
        if (this.cell.hasTopWall())    addWall(cx, cz - C / 2, 0);
        if (this.cell.hasBottomWall()) addWall(cx, cz + C / 2, 0);
    }
}

// ─── ThreePelletAdapter ───────────────────────────────────────────────────────

class ThreePelletAdapter {
    constructor(pellet, scene) {
        this.pellet  = pellet;
        this.scene   = scene;
        this._mesh   = null;
        this._built  = false;
        this.isSuper = pellet.isSuper || false;
        this._tick   = 0;
    }

    score() {
        if (this._mesh) {
            this.scene.remove(this._mesh);
            this._mesh.geometry.dispose();
            this._mesh = null;
        }
        return this.pellet.score();
    }

    build() {
        if (this._built) return;
        this._built = true;

        const C  = CELL_SIZE;
        const cx = this.pellet.x * C + C / 2;
        const cz = this.pellet.y * C + C / 2;

        if (this.isSuper) {
            const geo = new THREE.SphereGeometry(0.45, 12, 10);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            this._mesh = new THREE.Mesh(geo, mat);
            this._mesh.position.set(cx, 0.45, cz);
        } else {
            const geo = new THREE.SphereGeometry(0.18, 8, 6);
            const mat = new THREE.MeshBasicMaterial({ color: 0xFFB897 });
            this._mesh = new THREE.Mesh(geo, mat);
            this._mesh.position.set(cx, 0.22, cz);
        }
        this.scene.add(this._mesh);
    }

    // Called each frame so super pellets can pulse
    animateTick() {
        if (!this._mesh || !this.isSuper) return;
        this._tick++;
        const s = 1 + Math.sin(this._tick * 0.25) * 0.2;
        this._mesh.scale.setScalar(s);
    }
}

// ─── ThreePacmanAdapter ───────────────────────────────────────────────────────
// Pac-Man is built from two SphereGeometry halves (top jaw / bottom jaw)
// on pivot sub-groups so the mouth opens and closes by rotating each jaw.

class ThreePacmanAdapter {
    constructor(pacman, scene) {
        this.pacman      = pacman;
        this.scene       = scene;
        this._group      = null;  // root group — positioned & yaw-rotated
        this._topJaw     = null;  // pivots open upward   (+X rotation)
        this._botJaw     = null;  // pivots open downward (-X rotation)
        this._mouthAngle = 0.35;  // current jaw opening angle (radians)
        this._mouthDir   = 1;
        this._lastDirX   = 1;
        this._lastDirZ   = 0;
    }

    move(direction, gameMap) { this.pacman.move(direction, gameMap); }
    canMove(dir, rows, cols) { return this.pacman.canMove(dir, rows, cols); }

    get x()         { return this.pacman.x; }
    get y()         { return this.pacman.y; }
    get score()     { return this.pacman.score; }
    get direction() { return this.pacman.direction; }

    build() {
        if (this._group) return;

        const R   = 0.5;
        const mat = new THREE.MeshPhongMaterial({ color: 0xFFD700, shininess: 100, side: THREE.FrontSide });

        // Each jaw: a hemisphere. SphereGeometry(r, wSeg, hSeg, phiStart, phiLen, thetaStart, thetaLen)
        // Top jaw: upper hemisphere (thetaStart=0, thetaLen=PI/2)
        // Bot jaw: lower hemisphere (thetaStart=PI/2, thetaLen=PI/2)
        // Both face the +Z direction (mouth opening faces forward in local space)
        const topGeo = new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0,       Math.PI / 2);
        const botGeo = new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);

        this._group  = new THREE.Group();

        // Top jaw pivot group — the mesh sits at origin, pivot rotates about X
        this._topJaw = new THREE.Group();
        const topMesh = new THREE.Mesh(topGeo, mat);
        topMesh.castShadow = true;
        this._topJaw.add(topMesh);

        // Bottom jaw pivot group
        this._botJaw = new THREE.Group();
        const botMesh = new THREE.Mesh(botGeo, mat);
        botMesh.castShadow = true;
        this._botJaw.add(botMesh);

        // Eye: small dark sphere on top-front
        const eyeGeo = new THREE.SphereGeometry(0.09, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const eye    = new THREE.Mesh(eyeGeo, eyeMat);
        // Position relative to group: up a bit, forward, slightly left
        eye.position.set(-0.18, 0.3, -0.35);

        this._group.add(this._topJaw, this._botJaw, eye);
        this.scene.add(this._group);
    }

    update() {
        if (!this._group) this.build();

        const C  = CELL_SIZE;
        const tx = this.pacman.x * C + C / 2;
        const tz = this.pacman.y * C + C / 2;
        this._group.position.set(tx, 0.5, tz);

        // Animate mouth open/close
        this._mouthAngle += 0.14 * this._mouthDir;
        if (this._mouthAngle > 0.55) this._mouthDir = -1;
        if (this._mouthAngle < 0.02) this._mouthDir =  1;
        this._topJaw.rotation.x = -this._mouthAngle; // upper jaw tilts up
        this._botJaw.rotation.x =  this._mouthAngle; // lower jaw tilts down

        // Yaw to face movement direction
        const dir = this.pacman.direction;
        if (dir.x !== 0 || dir.y !== 0) {
            this._lastDirX = dir.x;
            this._lastDirZ = dir.y;
            // atan2(dx, dz) gives the angle from +Z axis, matching our mesh orientation
            this._group.rotation.y = Math.atan2(dir.x, dir.y);
        }
    }

    worldPos() {
        const C = CELL_SIZE;
        return {
            x:  this.pacman.x * C + C / 2,
            z:  this.pacman.y * C + C / 2,
            dx: this._lastDirX,
            dz: this._lastDirZ,
        };
    }
}

// ─── ThreeGhostAdapter ────────────────────────────────────────────────────────

const THREE_GHOST_COLORS = {
    blinky: 0xFF2222,
    pinky:  0xFFB8FF,
    inky:   0x00FFFF,
    clyde:  0xFFB852,
};

class ThreeGhostAdapter {
    constructor(ghost, scene) {
        this.ghost = ghost;
        this.scene = scene;
        this._mesh = null;
        this._mat  = null;
    }

    build() {
        if (this._mesh) return;

        const color = THREE_GHOST_COLORS[this.ghost.id] || 0xCCCCCC;
        this._mat   = new THREE.MeshPhongMaterial({ color, shininess: 50 });

        // Body: capsule (r=0.38, height=0.5)
        const geo  = new THREE.CapsuleGeometry(0.38, 0.5, 4, 8);
        this._mesh = new THREE.Mesh(geo, this._mat);
        this._mesh.castShadow = true;

        // White eye balls
        const eyeGeo = new THREE.SphereGeometry(0.1, 6, 6);
        const eyeWht = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eyeL   = new THREE.Mesh(eyeGeo, eyeWht);
        const eyeR   = new THREE.Mesh(eyeGeo, eyeWht);
        eyeL.position.set(-0.16, 0.28, -0.32);
        eyeR.position.set( 0.16, 0.28, -0.32);

        // Dark pupils
        const pupilGeo = new THREE.SphereGeometry(0.055, 5, 5);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0000aa });
        const pL = new THREE.Mesh(pupilGeo, pupilMat);
        const pR = new THREE.Mesh(pupilGeo, pupilMat);
        pL.position.set(-0.16, 0.28, -0.42);
        pR.position.set( 0.16, 0.28, -0.42);

        this._mesh.add(eyeL, eyeR, pL, pR);
        this.scene.add(this._mesh);
    }

    update() {
        if (!this._mesh) this.build();

        const C  = CELL_SIZE;
        const tx = this.ghost.x * C + C / 2;
        const tz = this.ghost.y * C + C / 2;

        if (this.ghost.eaten) {
            this._mesh.visible = false;
            return;
        }
        this._mesh.visible = true;
        this._mesh.position.set(tx, 0.7, tz);

        if (this._mat) {
            if (this.ghost.mode === 'frightened') {
                const flash = Math.floor(Date.now() / 140) % 2 === 0;
                this._mat.color.setHex(flash ? 0x0000CC : 0xaaaaff);
            } else {
                this._mat.color.setHex(THREE_GHOST_COLORS[this.ghost.id] || 0xCCCCCC);
            }
        }
    }
}

// ─── ThreeGameAdapter ─────────────────────────────────────────────────────────

class ThreeGameAdapter {
    constructor(gameEngine, canvas, cameraMode) {
        this.gameEngine      = gameEngine;
        this._cameraMode     = cameraMode || 'isometric';
        this._gameOverShown  = false;

        const W = 600;
        const H = 600;

        // Renderer — use explicit pixel size to avoid 0×0 canvas race
        this._renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this._renderer.setSize(W, H);
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

        // Scene
        this._scene            = new THREE.Scene();
        this._scene.background = new THREE.Color(0x000510);

        // Lighting
        // Bright ambient so the whole maze is visible
        const ambient = new THREE.AmbientLight(0xaabbcc, 0.8);
        this._scene.add(ambient);

        // Main directional sun from upper-left
        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(-20, 40, -15);
        sun.castShadow            = true;
        sun.shadow.camera.near    = 1;
        sun.shadow.camera.far     = 150;
        sun.shadow.camera.left    = -50;
        sun.shadow.camera.right   =  50;
        sun.shadow.camera.top     =  50;
        sun.shadow.camera.bottom  = -50;
        sun.shadow.mapSize.width  = 1024;
        sun.shadow.mapSize.height = 1024;
        this._scene.add(sun);

        // Warm Pac-Man glow light — follows pacman
        this._pacLight = new THREE.PointLight(0xFFD700, 1.8, 14);
        this._pacLight.castShadow = false;
        this._scene.add(this._pacLight);

        // Grid metadata
        const rows = gameEngine.rows;
        const cols = gameEngine.cols;
        this._gridCX   = (cols * CELL_SIZE) / 2;
        this._gridCZ   = (rows * CELL_SIZE) / 2;
        this._gridSpan = Math.max(rows, cols) * CELL_SIZE;

        // Build all scene objects
        this._buildScene();

        // Camera + initial position
        this._camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 300);
        this.setCameraMode(this._cameraMode);
    }

    _buildScene() {
        const eng = this.gameEngine;

        // Large ground plane beneath everything
        const groundGeo = new THREE.PlaneGeometry(
            eng.cols * CELL_SIZE + 4,
            eng.rows * CELL_SIZE + 4
        );
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x0a0a18 });
        const ground    = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(this._gridCX, 0, this._gridCZ);
        ground.receiveShadow = true;
        this._scene.add(ground);

        // Cells
        for (let i = 0; i < eng.rows; i++) {
            for (let j = 0; j < eng.cols; j++) {
                const raw     = eng.gameMap[i][j];
                const adapter = new ThreeCellAdapter(raw, this._scene);
                adapter.build();
                eng.gameMap[i][j] = adapter;
            }
        }

        // Pellets — keep a list of 3D adapters so we can animate super pellets
        this._pelletAdapters = [];
        for (let i = 0; i < eng.rows; i++) {
            for (let j = 0; j < eng.cols; j++) {
                const cellAdapter = eng.gameMap[i][j];
                if (cellAdapter.hasPellet()) {
                    const rawPellet     = cellAdapter.cell.pellet;
                    const pelletAdapter = new ThreePelletAdapter(rawPellet, this._scene);
                    pelletAdapter.build();
                    cellAdapter.cell.pellet = pelletAdapter;
                    this._pelletAdapters.push(pelletAdapter);
                }
            }
        }

        // Pac-Man (engine stores raw Pacman — no adapter wrapper in this path)
        const rawPac       = eng.pacman.pacman || eng.pacman;
        this._pacAdapter   = new ThreePacmanAdapter(rawPac, this._scene);
        this._pacAdapter.build();

        // Ghosts
        this._ghostAdapters = [];
        for (const g of eng.ghosts) {
            const rawGhost = g.ghost || g;
            const ga       = new ThreeGhostAdapter(rawGhost, this._scene);
            ga.build();
            this._ghostAdapters.push(ga);
        }
    }

    setCameraMode(mode) {
        this._cameraMode = mode;

        if (mode === 'overhead') {
            // True top-down: camera directly above center, looking straight down.
            // +0.01 Z offset disambiguates "up" so world +X maps to screen right
            // and world +Z maps to screen down — matching every other adapter.
            const span = this._gridSpan;
            this._camera.position.set(this._gridCX, span * 1.1, this._gridCZ + 0.01);
            this._camera.lookAt(this._gridCX, 0, this._gridCZ);
        }
        if (mode === 'tpp') {
            // Snap camera to its fixed offset above grid centre on first switch
            // so it doesn't lerp in slowly from the overhead position.
            const pos = this._pacAdapter.worldPos();
            this._camera.position.set(pos.x - 14, 18, pos.z + 14);
            this._camera.lookAt(pos.x, 0, pos.z);
        }
    }

    gameLoop(direction) {
        const eng      = this.gameEngine;
        const pacCore  = eng.pacman.pacman || eng.pacman;
        const scorePre = pacCore.score;
        const wasOver  = eng.gameOver;
        const frightenedBefore = eng.ghosts.map(g => (g.ghost || g).mode === 'frightened');

        eng.gameLoop(direction);

        // Sounds
        if (pacCore.score > scorePre) {
            if (pacCore.score - scorePre >= 50) _sfx3.super();
            else                                 _sfx3.pellet();
        }
        eng.ghosts.forEach((g, i) => {
            if (frightenedBefore[i] && (g.ghost || g).eaten) _sfx3.eatGhost();
        });
        if (eng.gameOver && !wasOver) _sfx3.die();

        // Animate super pellets (pulse scale)
        for (const pa of this._pelletAdapters) pa.animateTick();

        this._pacAdapter.update();
        for (const ga of this._ghostAdapters) ga.update();

        // Pac-Man light follows him
        const pos = this._pacAdapter.worldPos();
        this._pacLight.position.set(pos.x, 3, pos.z);

        // Third-person follow camera: fixed world-space offset, always looking
        // at Pac-Man. The angle never changes when Pac-Man turns — camera just
        // slides to keep him centred (same as Diablo / isometric action games).
        if (this._cameraMode === 'tpp') {
            const OFFSET_X = -14; // fixed world offset from Pac-Man (south-west)
            const OFFSET_Y =  18; // height
            const OFFSET_Z =  14;
            const LERP      = 0.18; // smoothing — lower = more lag, higher = snappier

            const targetX = pos.x + OFFSET_X;
            const targetY = OFFSET_Y;
            const targetZ = pos.z + OFFSET_Z;

            this._camera.position.x += (targetX - this._camera.position.x) * LERP;
            this._camera.position.y += (targetY - this._camera.position.y) * LERP;
            this._camera.position.z += (targetZ - this._camera.position.z) * LERP;

            this._camera.lookAt(pos.x, 0, pos.z);
        }

        // Score
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = `SCORE: ${Math.floor(this._pacAdapter.score)}`;
        }

        this._renderer.render(this._scene, this._camera);

        if (this.gameEngine.gameOver && !this._gameOverShown) {
            this._gameOverShown = true;
            const el = document.getElementById('game-over-overlay');
            if (el) el.style.display = 'flex';
        }
    }
}

// ─── Setup & draw loop ────────────────────────────────────────────────────────

function setup() {
    const canvas = document.getElementById('game-screen');

    const pacmanCreatorFn = (x, y)             => new Pacman(x, y);
    const pelletCreatorFn = (x, y, p, isSuper) => isSuper ? new SuperPellet(x, y) : new Pellet(x, y, p);
    const cellCreatorFn   = (x, y, pel)        => new Cell(x, y, pel);
    const ghostCreatorFn  = (x, y, id)         => new Ghost(x, y, id);

    const ge = new GameEngine(20, 20, pacmanCreatorFn, pelletCreatorFn, cellCreatorFn, ghostCreatorFn);
    window.threeGameAdapter = new ThreeGameAdapter(ge, canvas, 'overhead');
    window.controls         = new KeyboardControlAdapter(document);

    document.getElementById('btn-overhead').addEventListener('click', () => {
        window.threeGameAdapter.setCameraMode('overhead');
    });
    document.getElementById('btn-tpp').addEventListener('click', () => {
        window.threeGameAdapter.setCameraMode('tpp');
    });

    draw();
}

function draw() {
    if (window.threeGameAdapter) {
        window.threeGameAdapter.gameLoop(window.controls.getDirection());
    }
    setTimeout(draw, 150);
}

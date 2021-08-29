class GameEngine {
    constructor(rows, cols, pacmanCreator, pelletCreator, cellCreator) {
        this.rows = rows;
        this.cols = cols;
        this.pacman = pacmanCreator(rows / 2, cols / 2);
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
    }

    gameLoop(direction) {
        if (this.pacman.canMove(direction, this.rows, this.cols)) {
            this.pacman.move(direction, this.gameMap);
        }
    }
}

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}
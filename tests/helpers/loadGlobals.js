const path = require('path');

function load(file) {
    const exports = require(path.resolve(__dirname, '../../', file));
    Object.assign(global, exports);
}

// Load in the same order as the HTML script tags
load('pacman.js');
load('GameEngine.js');

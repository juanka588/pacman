const path = require('path');

function load(file) {
    const exports = require(path.resolve(__dirname, '../../', file));
    Object.assign(global, exports);
}

// Load in the same order as the HTML script tags — order matters for globals
load('pacman.js');
load('GameEngine.js');
load('controls/KeyboardControlAdapter.js');
load('controls/SwipeControlAdapter.js');
load('controls/GamepadControlAdapter.js');

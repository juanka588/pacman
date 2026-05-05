class KeyboardControlAdapter {
    constructor(target) {
        this._direction = { x: 0, y: 0 };
        this._handler = (evt) => {
            if      (evt.key === 'ArrowRight') this._direction = { x: 1,  y: 0  };
            else if (evt.key === 'ArrowLeft')  this._direction = { x: -1, y: 0  };
            else if (evt.key === 'ArrowDown')  this._direction = { x: 0,  y: 1  };
            else if (evt.key === 'ArrowUp')    this._direction = { x: 0,  y: -1 };
        };
        this._target = target;
        target.addEventListener('keydown', this._handler);
    }

    getDirection() {
        return this._direction;
    }

    destroy() {
        this._target.removeEventListener('keydown', this._handler);
    }
}

if (typeof module !== 'undefined') {
    module.exports = { KeyboardControlAdapter };
}

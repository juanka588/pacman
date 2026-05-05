class SwipeControlAdapter {
    constructor(target) {
        this._direction = { x: 0, y: 0 };
        this._startX = 0;
        this._startY = 0;
        this._threshold = 15;

        this._startHandler = (e) => {
            const t = e.changedTouches[0];
            this._startX = t.clientX;
            this._startY = t.clientY;
        };

        this._endHandler = (e) => {
            const t = e.changedTouches[0];
            const dx = t.clientX - this._startX;
            const dy = t.clientY - this._startY;
            if (Math.abs(dx) < this._threshold && Math.abs(dy) < this._threshold) return;
            if (Math.abs(dx) >= Math.abs(dy)) {
                this._direction = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
            } else {
                this._direction = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
            }
        };

        this._target = target;
        target.addEventListener('touchstart', this._startHandler, { passive: true });
        target.addEventListener('touchend', this._endHandler, { passive: true });
    }

    getDirection() {
        return this._direction;
    }

    destroy() {
        this._target.removeEventListener('touchstart', this._startHandler);
        this._target.removeEventListener('touchend', this._endHandler);
    }
}

if (typeof module !== 'undefined') {
    module.exports = { SwipeControlAdapter };
}

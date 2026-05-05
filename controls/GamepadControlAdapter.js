class GamepadControlAdapter {
    constructor() {
        this._deadzone = 0.5;
        // D-pad button indices per the Gamepad API standard mapping
        this._DPAD_UP    = 12;
        this._DPAD_DOWN  = 13;
        this._DPAD_LEFT  = 14;
        this._DPAD_RIGHT = 15;
    }

    getDirection() {
        const pads = (navigator.getGamepads ? navigator.getGamepads() : []);
        const gp = Array.from(pads).find(p => p && p.connected);
        if (!gp) return { x: 0, y: 0 };

        // D-pad takes priority over analogue stick
        if (gp.buttons[this._DPAD_RIGHT] && gp.buttons[this._DPAD_RIGHT].pressed) return { x: 1,  y: 0  };
        if (gp.buttons[this._DPAD_LEFT]  && gp.buttons[this._DPAD_LEFT].pressed)  return { x: -1, y: 0  };
        if (gp.buttons[this._DPAD_DOWN]  && gp.buttons[this._DPAD_DOWN].pressed)  return { x: 0,  y: 1  };
        if (gp.buttons[this._DPAD_UP]    && gp.buttons[this._DPAD_UP].pressed)    return { x: 0,  y: -1 };

        // Left analogue stick (axes[0] = horizontal, axes[1] = vertical)
        const ax = gp.axes[0] || 0;
        const ay = gp.axes[1] || 0;
        if (Math.abs(ax) < this._deadzone && Math.abs(ay) < this._deadzone) return { x: 0, y: 0 };
        if (Math.abs(ax) >= Math.abs(ay)) {
            return ax > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        } else {
            return ay > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
        }
    }

    // No event listeners to clean up — gamepad is polled each tick
    destroy() {}
}

if (typeof module !== 'undefined') {
    module.exports = { GamepadControlAdapter };
}

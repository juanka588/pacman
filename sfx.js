// Shared Web Audio sound effects engine.
// Exposes a single global `sfx` object used by all renderer adapters.

const sfx = (() => {
    let ctx = null;
    let _frightenedTimer = null;
    let _frightenedActive = false;
    let _frightenedInterval = 500;

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

    // Beep loop: reads _frightenedInterval each cycle so ratio updates take effect
    function _frightenedBeep() {
        if (!_frightenedActive) return;
        tone(200, 'sine', 0.07, 0.10);
        tone(260, 'sine', 0.07, 0.08, 0.04);
        _frightenedTimer = setTimeout(_frightenedBeep, _frightenedInterval);
    }

    return {
        pellet()   { tone(440, 'square',   0.06, 0.12); },
        super()    { tone(660, 'sawtooth', 0.08, 0.22);
                     tone(880, 'sawtooth', 0.08, 0.22, 0.06); },
        die()      { tone(220, 'sawtooth', 0.12, 0.30);
                     tone(150, 'sawtooth', 0.18, 0.30, 0.10);
                     tone(90,  'sawtooth', 0.22, 0.30, 0.22); },
        eatGhost() { tone(330, 'sine',     0.05, 0.28);
                     tone(660, 'sine',     0.05, 0.28, 0.06);
                     tone(990, 'sine',     0.08, 0.28, 0.12); },

        // ratio: 0.0 = nearly expired (fast beeps), 1.0 = just started (slow beeps)
        // Safe to call every game tick — updates interval, starts loop if not running
        startFrightened(ratio) {
            _frightenedInterval = 150 + Math.round(ratio * 650); // 150ms–800ms
            if (!_frightenedActive) {
                _frightenedActive = true;
                _frightenedBeep();
            }
        },

        stopFrightened() {
            _frightenedActive = false;
            clearTimeout(_frightenedTimer);
            _frightenedTimer = null;
        },
    };
})();

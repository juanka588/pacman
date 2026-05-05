// Shared Web Audio sound effects engine.
// Exposes a single global `sfx` object used by all renderer adapters.

const sfx = (() => {
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
        pellet()   { tone(440, 'square',   0.06, 0.12); },
        super()    { tone(660, 'sawtooth', 0.08, 0.22);
                     tone(880, 'sawtooth', 0.08, 0.22, 0.06); },
        die()      { tone(220, 'sawtooth', 0.12, 0.30);
                     tone(150, 'sawtooth', 0.18, 0.30, 0.10);
                     tone(90,  'sawtooth', 0.22, 0.30, 0.22); },
        eatGhost() { tone(330, 'sine',     0.05, 0.28);
                     tone(660, 'sine',     0.05, 0.28, 0.06);
                     tone(990, 'sine',     0.08, 0.28, 0.12); },
    };
})();

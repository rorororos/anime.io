function SoundSystem() {
    this.enabled = true;
    this.volume = 0.3;

    try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
    } catch (e) {
        this.enabled = false;
        this.ctx = null;
    }
}

SoundSystem.prototype.setVolume = function (v) {
    this.volume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
};

SoundSystem.prototype.resume = function () {
    if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
};

SoundSystem.prototype._tone = function (freq, duration, type, vol, detune) {
    if (!this.enabled || !this.ctx) return;
    try {
        var ctx = this.ctx;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.value = freq;
        if (detune) osc.detune.value = detune;
        gain.gain.setValueAtTime((vol || 0.3) * this.volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
};

SoundSystem.prototype._noise = function (duration, vol) {
    if (!this.enabled || !this.ctx) return;
    try {
        var ctx = this.ctx;
        var bufferSize = Math.floor(ctx.sampleRate * duration);
        if (bufferSize <= 0) return;
        var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        var source = ctx.createBufferSource();
        source.buffer = buffer;
        var gain = ctx.createGain();
        gain.gain.setValueAtTime((vol || 0.15) * this.volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start(ctx.currentTime);
    } catch (e) {}
};

// --- GAME SOUNDS ---

SoundSystem.prototype.shoot = function () {
    this._tone(200, 0.08, 'square', 0.15);
    this._noise(0.05, 0.08);
};

SoundSystem.prototype.hit = function () {
    this._tone(300, 0.06, 'square', 0.12);
    this._noise(0.04, 0.1);
};

SoundSystem.prototype.kill = function () {
    this._tone(150, 0.15, 'sawtooth', 0.2);
    this._tone(100, 0.2, 'square', 0.15);
    this._noise(0.1, 0.15);
};

SoundSystem.prototype.playerHit = function () {
    this._tone(120, 0.12, 'sawtooth', 0.2);
    this._noise(0.08, 0.12);
};

SoundSystem.prototype.playerDeath = function () {
    var self = this;
    this._tone(200, 0.1, 'sawtooth', 0.25);
    setTimeout(function () { self._tone(150, 0.15, 'sawtooth', 0.2); }, 100);
    setTimeout(function () { self._tone(80, 0.3, 'sawtooth', 0.2); }, 200);
};

SoundSystem.prototype.levelUp = function () {
    var self = this;
    this._tone(440, 0.1, 'square', 0.2);
    setTimeout(function () { self._tone(550, 0.1, 'square', 0.2); }, 80);
    setTimeout(function () { self._tone(660, 0.15, 'square', 0.2); }, 160);
};

SoundSystem.prototype.xpPickup = function () {
    this._tone(800 + Math.random() * 400, 0.04, 'sine', 0.08);
};

SoundSystem.prototype.ability = function () {
    this._tone(300, 0.08, 'sawtooth', 0.15);
    this._tone(450, 0.1, 'square', 0.12, 10);
    this._noise(0.06, 0.08);
};

SoundSystem.prototype.dash = function () {
    this._noise(0.08, 0.12);
    this._tone(250, 0.06, 'sine', 0.1);
};

SoundSystem.prototype.shapeBreak = function () {
    this._tone(400 + Math.random() * 200, 0.05, 'square', 0.08);
    this._noise(0.03, 0.06);
};

SoundSystem.prototype.punch = function () {
    this._noise(0.06, 0.15);
    this._tone(100, 0.08, 'square', 0.12);
};

SoundSystem.prototype.swordSlash = function () {
    this._noise(0.08, 0.1);
    this._tone(600, 0.06, 'sawtooth', 0.08);
    this._tone(900, 0.04, 'sine', 0.05);
};

SoundSystem.prototype.combo = function (count) {
    var freq = 400 + Math.min(count * 20, 600);
    this._tone(freq, 0.06, 'sine', 0.1);
};

SoundSystem.prototype.mapEvent = function () {
    var self = this;
    this._tone(200, 0.15, 'square', 0.2);
    setTimeout(function () { self._tone(300, 0.15, 'square', 0.2); }, 150);
    setTimeout(function () { self._tone(400, 0.2, 'square', 0.25); }, 300);
};
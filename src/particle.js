function Particle() { this.reset(); }

Particle.prototype.reset = function () {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.radius = 3; this.startRadius = 3; this.endRadius = 0;
    this.color = '#1a1a1a';
    this.startColor = null; this.endColor = null;
    this.alpha = 1; this.startAlpha = 1;
    this.life = 0; this.maxLife = 500; this.alive = false;
    this.gravity = 0; this.friction = 0.98;
    this.glow = false; this.glowSize = 0;
    this.shape = 'circle'; this.rotation = 0; this.rotationSpeed = 0;
    this.text = null; this.fontSize = 16; this.fontWeight = '700';
    this.outline = false; this.outlineColor = '#f5f0e8';
};

Particle.prototype.init = function (config) {
    for (var k in config) { if (config.hasOwnProperty(k)) this[k] = config[k]; }
    this.alive = true; this.life = 0;
    this.startAlpha = this.alpha; this.startRadius = this.radius;
};

Particle.prototype.update = function (dt) {
    if (!this.alive) return;
    this.life += dt;
    if (this.life >= this.maxLife) { this.alive = false; return; }
    var t = this.life / this.maxLife;
    this.vx *= this.friction; this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx; this.y += this.vy;
    this.radius = Utils.lerp(this.startRadius, this.endRadius, t);
    this.alpha = Utils.lerp(this.startAlpha, 0, t);
    if (this.startColor && this.endColor) {
        var r = Math.floor(Utils.lerp(this.startColor.r, this.endColor.r, t));
        var g = Math.floor(Utils.lerp(this.startColor.g, this.endColor.g, t));
        var b = Math.floor(Utils.lerp(this.startColor.b, this.endColor.b, t));
        this.color = 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    this.rotation += this.rotationSpeed;
};

Particle.prototype.render = function (ctx) {
    if (!this.alive || this.alpha <= 0.01) return;
    ctx.globalAlpha = this.alpha;
    if (this.text) {
        ctx.font = this.fontWeight + ' ' + this.fontSize + 'px "Bangers", "Impact", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (this.outline) {
            ctx.strokeStyle = this.outlineColor || '#f5f0e8';
            ctx.lineWidth = 3;
            ctx.strokeText(this.text, this.x, this.y);
        }
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1; return;
    }
    ctx.fillStyle = this.color;
    if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.radius), 0, Math.PI * 2);
        ctx.fill();
    } else if (this.shape === 'square') {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }
    ctx.globalAlpha = 1;
};
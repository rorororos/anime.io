function VFXManager() {
    this.particlePool = new ObjectPool(
        function () { return new Particle(); },
        function (p) { p.reset(); },
        CONST.PARTICLE_POOL_SIZE
    );
    this.effects = [];
    this.screenFlash = { active: false, alpha: 0, color: '#f5f0e8', duration: 0, timer: 0 };
    this.slowMotion = { active: false, factor: 1, duration: 0, timer: 0 };
}

VFXManager.prototype.spawnParticle = function (config) {
    var p = this.particlePool.get();
    p.init(config);
    return p;
};

VFXManager.prototype.burst = function (x, y, count, color, opts) {
    opts = opts || {};
    var speed = opts.speed || 3, speedVar = opts.speedVar || 1.5;
    var radius = opts.radius || 4, life = opts.life || 400;
    var friction = opts.friction || 0.96;
    for (var i = 0; i < count; i++) {
        var a = Math.random() * Math.PI * 2;
        var s = speed + (Math.random() - 0.5) * speedVar;
        this.spawnParticle({
            x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            radius: radius + Math.random() * 2, endRadius: 0, color: color,
            maxLife: life + (Math.random() - 0.5) * 100, friction: friction
        });
    }
};

VFXManager.prototype.directionalBurst = function (x, y, angle, spread, count, color, opts) {
    opts = opts || {};
    var speed = opts.speed || 4, life = opts.life || 300, radius = opts.radius || 3;
    for (var i = 0; i < count; i++) {
        var a = angle + (Math.random() - 0.5) * spread;
        var s = speed + Math.random() * 2;
        this.spawnParticle({
            x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            radius: radius + Math.random() * 2, endRadius: 0, color: color,
            maxLife: life + Math.random() * 100, friction: 0.95
        });
    }
};

VFXManager.prototype.ring = function (x, y, count, color, opts) {
    opts = opts || {};
    var speed = opts.speed || 3, radius = opts.radius || 3, life = opts.life || 300;
    for (var i = 0; i < count; i++) {
        var a = (Math.PI * 2 / count) * i;
        this.spawnParticle({
            x: x, y: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
            radius: radius, endRadius: 0, color: color, maxLife: life, friction: 0.97
        });
    }
};

// Add these to VFXManager.prototype

VFXManager.prototype.deathShatter = function(x, y, color) {
    // Large ink shards
    for (var i = 0; i < 12; i++) {
        var a = Math.random() * Math.PI * 2;
        var s = 2 + Math.random() * 4;
        this.spawnParticle({
            x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            radius: 4 + Math.random() * 5, endRadius: 0,
            color: CONST.COLOR_INK, maxLife: 600, shape: 'square',
            rotationSpeed: 0.1, friction: 0.94
        });
    }
    // Color burst
    this.burst(x, y, 15, color, { speed: 4, radius: 3, life: 400 });
    this.shockwave(x, y, 100, 400, CONST.COLOR_INK, 3);
};

VFXManager.prototype.spawnXPOrb = function(x, y, value) {
    this.effects.push({
        type: 'xp_orb',
        x: x, y: y,
        value: value,
        alive: true,
        life: 0,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        duration: 10000 // Lasts 10s before disappearing
    });
};

VFXManager.prototype.impactSpark = function (x, y, color) {
    this.burst(x, y, 6, color || '#1a1a1a', { speed: 4, radius: 2, life: 150 });
};

VFXManager.prototype.hitFlash = function (x, y) {
    this.spawnParticle({ x: x, y: y, vx: 0, vy: 0, radius: 12, endRadius: 0, color: CONST.COLOR_PAPER, maxLife: 80, alpha: 0.4, friction: 1 });
};

VFXManager.prototype.shockwave = function (x, y, maxRadius, duration, color, lineWidth) {
    this.effects.push({ type: 'shockwave', x: x, y: y, radius: 0, maxRadius: maxRadius, life: 0, duration: duration, color: color || 'rgba(26,26,26,0.3)', lineWidth: lineWidth || 2, alive: true });
};

VFXManager.prototype.aura = function (entity, color, radius, duration) {
    this.effects.push({ type: 'aura', entity: entity, color: color, radius: radius, life: 0, duration: duration || 1000, alive: true });
};

VFXManager.prototype.afterimage = function (x, y, radius, color, angle) {
    this.effects.push({ type: 'afterimage', x: x, y: y, radius: radius, color: color, angle: angle, life: 0, duration: 300, alive: true });
};

VFXManager.prototype.chargeGlow = function (x, y, maxRadius, duration, color) {
    this.effects.push({ type: 'charge_glow', x: x, y: y, maxRadius: maxRadius, life: 0, duration: duration, color: color, alive: true });
};

VFXManager.prototype.beamFlash = function (x1, y1, x2, y2, color, width, duration) {
    this.effects.push({ type: 'beam', x1: x1, y1: y1, x2: x2, y2: y2, color: color, width: width || 4, life: 0, duration: duration || 200, alive: true });
};

VFXManager.prototype.screenFlashEffect = function (color, duration, intensity) {
    this.screenFlash = { active: true, color: CONST.COLOR_PAPER, duration: duration || 300, alpha: intensity || 0.6, timer: 0 };
};

VFXManager.prototype.triggerSlowMo = function (factor, duration) {
    this.slowMotion = { active: true, factor: factor || 0.3, duration: duration || 500, timer: 0 };
};

VFXManager.prototype.getSlowMoFactor = function () {
    return this.slowMotion.active ? this.slowMotion.factor : 1;
};

VFXManager.prototype.spiralBurst = function (x, y, count, color, opts) {
    opts = opts || {};
    var speed = opts.speed || 4, radius = opts.radius || 3, life = opts.life || 500;
    for (var i = 0; i < count; i++) {
        var ba = (Math.PI * 2 / count) * i, s = speed + Math.random() * 1.5;
        this.spawnParticle({ x: x, y: y, vx: Math.cos(ba) * s, vy: Math.sin(ba) * s, radius: radius, endRadius: 0, color: color, maxLife: life, friction: 0.97 });
    }
};

VFXManager.prototype.floatingText = function (x, y, text, color, opts) {
    opts = opts || {};
    this.spawnParticle({
        x: x, y: y - 5, vx: (Math.random() - 0.5) * 0.8, vy: -2.5,
        text: text, color: color || '#1a1a1a', fontSize: opts.fontSize || 16,
        fontWeight: opts.fontWeight || '900', outline: opts.outline !== false,
        outlineColor: CONST.COLOR_PAPER, maxLife: opts.life || 800,
        radius: 0, endRadius: 0, friction: 0.97, gravity: 0.03
    });
};

VFXManager.prototype.levelUpBurst = function (x, y) {
    this.ring(x, y, 16, CONST.COLOR_INK, { speed: 4, radius: 3, life: 400 });
    this.burst(x, y, 12, CONST.COLOR_INK, { speed: 3, life: 500, radius: 3 });
    this.shockwave(x, y, 60, 350, CONST.COLOR_INK, 2);
    this.floatingText(x, y - 40, 'LEVEL UP!', '#1a1a1a', { fontSize: 22, life: 1200 });
};

VFXManager.prototype.killBurst = function (x, y, color) {
    color = color || '#1a1a1a';
    this.burst(x, y, 15, color, { speed: 4, radius: 3, life: 350 });
    this.shockwave(x, y, 50, 250, CONST.COLOR_INK);
    this.ring(x, y, 10, CONST.COLOR_INK, { speed: 3, radius: 2, life: 200 });
};

VFXManager.prototype.shapeDestroy = function (x, y, color) {
    this.burst(x, y, 8, color, { speed: 3, radius: 3, life: 250 });
};

VFXManager.prototype.xpPickup = function (x, y) {
    for (var i = 0; i < 3; i++) {
        this.spawnParticle({ x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10, vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 2, radius: 2, endRadius: 0, color: '#c9a84c', maxLife: 200, friction: 0.96 });
    }
};

VFXManager.prototype.update = function (dt) {
    var ap = this.particlePool.getActive();
    for (var i = ap.length - 1; i >= 0; i--) {
        ap[i].update(dt);
        if (!ap[i].alive) this.particlePool.release(ap[i]);
    }
    for (var j = this.effects.length - 1; j >= 0; j--) {
        var e = this.effects[j];
        e.life += dt;
        if (e.life >= e.duration) { this.effects.splice(j, 1); continue; }
        if (e.type === 'shockwave') e.radius = e.maxRadius * Utils.easeOutCubic(e.life / e.duration);
    }
    if (this.screenFlash.active) { this.screenFlash.timer += dt; if (this.screenFlash.timer >= this.screenFlash.duration) this.screenFlash.active = false; }
    if (this.slowMotion.active) { this.slowMotion.timer += dt; if (this.slowMotion.timer >= this.slowMotion.duration) { this.slowMotion.active = false; this.slowMotion.factor = 1; } }
};

VFXManager.prototype.render = function (ctx, camera) {
    ctx.shadowBlur = 0;
    var ap = this.particlePool.getActive();
    for (var i = 0; i < ap.length; i++) {
        var p = ap[i];
        if (p.alive && (p.text || camera.isVisible(p.x, p.y, p.radius + 20))) p.render(ctx);
    }
    for (var j = 0; j < this.effects.length; j++) {
        var e = this.effects[j], t = e.life / e.duration;
        
        if (e.type === 'xp_orb' && camera.isVisible(e.x, e.y, 20)) {
            ctx.fillStyle = '#c9a84c';
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Shine
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(e.x - 1, e.y - 1, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (e.type === 'shockwave' && camera.isVisible(e.x, e.y, e.radius)) {
            ctx.globalAlpha = (1 - t) * 0.5;
            ctx.strokeStyle = CONST.COLOR_INK; ctx.lineWidth = (e.lineWidth || 2) * (1 - t);
            ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1;
        }
        if (e.type === 'aura' && e.entity && e.entity.alive) {
            var pulse = 1 + Math.sin(e.life * 0.01) * 0.15;
            ctx.globalAlpha = (1 - t) * 0.12;
            ctx.strokeStyle = CONST.COLOR_INK; ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.arc(e.entity.x, e.entity.y, e.radius * pulse, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]); ctx.globalAlpha = 1;
        }
        if (e.type === 'afterimage') {
            ctx.globalAlpha = (1 - t) * 0.12;
            ctx.fillStyle = e.color; ctx.strokeStyle = CONST.COLOR_INK; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.globalAlpha = 1;
        }
        if (e.type === 'beam') {
            ctx.globalAlpha = (1 - t) * 0.6;
            ctx.strokeStyle = e.color; ctx.lineWidth = e.width * (1 - t * 0.5);
            ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke();
            ctx.globalAlpha = 1;
        }
        if (e.type === 'charge_glow') {
            var r = e.maxRadius * Utils.easeOutCubic(t);
            ctx.globalAlpha = (1 - t) * 0.12;
            ctx.fillStyle = e.color;
            ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
};

VFXManager.prototype.renderScreenEffects = function (ctx, cw, ch) {
    if (this.screenFlash.active) {
        var t = this.screenFlash.timer / this.screenFlash.duration;
        ctx.globalAlpha = this.screenFlash.alpha * (1 - t);
        ctx.fillStyle = CONST.COLOR_PAPER;
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalAlpha = 1;
    }
};

Object.defineProperty(VFXManager.prototype, 'particleCount', {
    get: function () { return this.particlePool.activeCount; }
});
function Projectile() { this.reset(); }

Projectile.prototype.reset = function () {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.radius = 6; this.damage = 10; this.penetration = 1;
    this.alive = false; this.ownerId = -1; this.ownerType = 'player';
    this.color = '#1a1a1a'; this.glowColor = 'rgba(0,0,0,0)';
    this.spawnTime = 0; this.lifetime = CONST.PROJ_LIFETIME;
    this.hitEntities = {}; this.trailTimer = 0;
};

Projectile.prototype.init = function (config) {
    for (var k in config) { if (config.hasOwnProperty(k)) this[k] = config[k]; }
    this.alive = true; this.spawnTime = Utils.now(); this.hitEntities = {}; this.trailTimer = 0;
};

Projectile.prototype.update = function (dt, game) {
    if (!this.alive) return;
    this.x += this.vx; this.y += this.vy;
    if (Utils.now() - this.spawnTime > this.lifetime) { this.alive = false; return; }
    if (this.x < -50 || this.x > CONST.MAP_WIDTH + 50 || this.y < -50 || this.y > CONST.MAP_HEIGHT + 50) { this.alive = false; return; }
    this.trailTimer += dt;
    if (this.trailTimer > 50 && game && game.vfx) {
        this.trailTimer = 0;
        game.vfx.spawnParticle({ x: this.x, y: this.y, vx: -this.vx * 0.02, vy: -this.vy * 0.02, radius: this.radius * 0.3, endRadius: 0, color: this.color, maxLife: 100, alpha: 0.25, friction: 0.96 });
    }
};

Projectile.prototype.render = function (ctx) {
    if (!this.alive) return;
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath(); ctx.arc(this.x + 2, this.y + 2, this.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.color; ctx.strokeStyle = CONST.COLOR_INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(245,240,232,0.35)';
    ctx.beginPath(); ctx.arc(this.x - this.radius * 0.2, this.y - this.radius * 0.2, this.radius * 0.3, 0, Math.PI * 2); ctx.fill();
};

Projectile.prototype.onHit = function (entity) {
    if (this.hitEntities[entity.id]) return false;
    this.hitEntities[entity.id] = true;
    this.penetration--;
    if (this.penetration <= 0) this.alive = false;
    return true;
};
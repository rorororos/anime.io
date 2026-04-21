function Shape() {
    Entity.call(this);
    this.type = 'shape'; this.shapeType = 'SQUARE'; this.sides = 4;
    this.rotation = 0; this.rotSpeed = 0.01;
    this.color = '#c9a84c'; this.strokeColor = '#1a1a1a';
    this.xpValue = 10; this.knockbackVx = 0; this.knockbackVy = 0;
    this.isBig = false;
}
Shape.prototype = Object.create(Entity.prototype);
Shape.prototype.constructor = Shape;

Shape.prototype.init = function (shapeType, x, y) {
    var d = CONST.SHAPE_TYPES[shapeType];
    this.shapeType = shapeType; this.sides = d.sides; this.radius = d.radius;
    this.hp = d.hp; this.maxHp = d.hp; this.xpValue = d.xp;
    this.color = d.color; this.strokeColor = d.strokeColor; this.rotSpeed = d.rotSpeed;
    this.x = x; this.y = y; this.rotation = Math.random() * Math.PI * 2;
    this.alive = true; this.vx = 0; this.vy = 0;
    this.knockbackVx = 0; this.knockbackVy = 0; this.isBig = false;
};

Shape.prototype.initBig = function (x, y) {
    var d = CONST.BIG_PENTAGON;
    this.shapeType = 'BIG_PENTAGON'; this.sides = d.sides; this.radius = d.radius;
    this.hp = d.hp; this.maxHp = d.hp; this.xpValue = d.xp;
    this.color = d.color; this.strokeColor = d.strokeColor; this.rotSpeed = d.rotSpeed;
    this.x = x; this.y = y; this.rotation = Math.random() * Math.PI * 2;
    this.alive = true; this.vx = 0; this.vy = 0;
    this.knockbackVx = 0; this.knockbackVy = 0; this.isBig = true;
};

Shape.prototype.update = function (dt) {
    this.rotation += this.rotSpeed;
    this.knockbackVx *= 0.92; this.knockbackVy *= 0.92;
    this.x += this.knockbackVx; this.y += this.knockbackVy;
    this.clampToMap();
};

Shape.prototype.render = function (ctx) {
    var r = this.radius;
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    Utils.drawPolygon(ctx, this.x + 3, this.y + 3, r, this.sides, this.rotation); ctx.fill();
    ctx.fillStyle = this.color; ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.isBig ? 3 : 2;
    Utils.drawPolygon(ctx, this.x, this.y, r, this.sides, this.rotation); ctx.fill(); ctx.stroke();
    if (this.hp < this.maxHp) {
        var bW = this.radius * 2, bH = this.isBig ? 5 : 3;
        var bX = this.x - bW / 2, bY = this.y - this.radius - (this.isBig ? 12 : 8);
        var f = this.hp / this.maxHp;
        ctx.fillStyle = CONST.COLOR_PAPER; ctx.strokeStyle = CONST.COLOR_INK; ctx.lineWidth = 1;
        ctx.fillRect(bX, bY, bW, bH); ctx.strokeRect(bX, bY, bW, bH);
        ctx.fillStyle = CONST.COLOR_INK; ctx.fillRect(bX, bY, bW * f, bH);
    }
};

Shape.prototype.applyKnockback = function (angle, force) {
    this.knockbackVx += Math.cos(angle) * force;
    this.knockbackVy += Math.sin(angle) * force;
};
var _entityNextId = 0;

function Entity() {
    this.id = _entityNextId++;
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.radius = 20;
    this.angle = 0;
    this.hp = 100; this.maxHp = 100;
    this.alive = true;
    this.type = 'entity';
    this.lastDamageTime = 0;
}

Entity.prototype.takeDamage = function (amount, source) {
    if (!this.alive) return;
    this.hp -= amount;
    this.lastDamageTime = Utils.now();
    if (this.hp <= 0) { this.hp = 0; this.die(source); }
};

Entity.prototype.die = function (killer) { this.alive = false; };

Entity.prototype.clampToMap = function () {
    this.x = Utils.clamp(this.x, this.radius, CONST.MAP_WIDTH - this.radius);
    this.y = Utils.clamp(this.y, this.radius, CONST.MAP_HEIGHT - this.radius);
};
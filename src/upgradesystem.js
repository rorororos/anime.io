function UpgradeSystem(owner) {
    this.owner = owner;
    this.statPoints = 0;
    this.stats = {};
    for (var i = 0; i < CONST.STAT_KEYS.length; i++) {
        this.stats[CONST.STAT_KEYS[i]] = 0;
    }
}

UpgradeSystem.prototype.addStatPoint = function (count) {
    this.statPoints += (count || 1);
};

UpgradeSystem.prototype.upgradeStat = function (key) {
    if (this.statPoints <= 0) return false;
    var found = false;
    for (var i = 0; i < CONST.STAT_KEYS.length; i++) {
        if (CONST.STAT_KEYS[i] === key) { found = true; break; }
    }
    if (!found) return false;
    if (this.stats[key] >= CONST.STAT_MAX_LEVEL) return false;

    this.stats[key]++;
    this.statPoints--;
    this._applyToOwner();
    return true;
};

UpgradeSystem.prototype._applyToOwner = function () {
    var o = this.owner;
    var s = this.stats;
    var m = CONST.STAT_MULTIPLIERS;

    o.maxHp = CONST.PLAYER_BASE_HP + s.maxHp * m.maxHp;
    o.hpRegen = CONST.PLAYER_BASE_HP_REGEN + s.hpRegen * m.hpRegen;
    o.moveSpeed = CONST.PLAYER_BASE_SPEED + s.moveSpeed * m.moveSpeed;
    o.projDamage = CONST.PLAYER_BASE_DAMAGE + s.projDamage * m.projDamage;
    o.projSpeed = CONST.PLAYER_BASE_PROJ_SPEED + s.projSpeed * m.projSpeed;
    o.reloadTime = Math.max(80, CONST.PLAYER_BASE_RELOAD + s.reload * m.reload);
    o.projPenetration = CONST.PLAYER_BASE_PROJ_PEN + s.projPen * m.projPen;
    o.projSize = CONST.PLAYER_BASE_PROJ_SIZE + s.projSize * m.projSize;

    if (o.hp > o.maxHp) o.hp = o.maxHp;
};

UpgradeSystem.prototype.autoDistribute = function () {
    if (this.statPoints <= 0) return;
    var w = [3, 2, 2, 4, 2, 3, 1, 1];
    var available = [];
    for (var i = 0; i < CONST.STAT_KEYS.length; i++) {
        if (this.stats[CONST.STAT_KEYS[i]] < CONST.STAT_MAX_LEVEL) {
            available.push({ key: CONST.STAT_KEYS[i], weight: w[i] });
        }
    }
    if (available.length === 0) return;

    var total = 0;
    for (var j = 0; j < available.length; j++) total += available[j].weight;
    var r = Math.random() * total;
    for (var k = 0; k < available.length; k++) {
        r -= available[k].weight;
        if (r <= 0) {
            this.upgradeStat(available[k].key);
            return;
        }
    }
    this.upgradeStat(available[0].key);
};

UpgradeSystem.prototype.reset = function () {
    this.statPoints = 0;
    for (var i = 0; i < CONST.STAT_KEYS.length; i++) {
        this.stats[CONST.STAT_KEYS[i]] = 0;
    }
};
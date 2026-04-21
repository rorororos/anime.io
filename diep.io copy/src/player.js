function Player(name, isBot) {
    Entity.call(this);
    this.type = isBot ? 'bot' : 'player';
    this.name = name || 'Player';
    this.radius = CONST.PLAYER_RADIUS;
    this.color = isBot ? CONST.COLOR_BOT : CONST.COLOR_PLAYER;
    this.barrelColor = isBot ? CONST.COLOR_BOT_BARREL : CONST.COLOR_PLAYER_BARREL;
    this.maxHp = CONST.PLAYER_BASE_HP;
    this.hp = this.maxHp;
    this.hpRegen = CONST.PLAYER_BASE_HP_REGEN;
    this.moveSpeed = CONST.PLAYER_BASE_SPEED;
    this.projDamage = CONST.PLAYER_BASE_DAMAGE;
    this.projSpeed = CONST.PLAYER_BASE_PROJ_SPEED;
    this.reloadTime = CONST.PLAYER_BASE_RELOAD;
    this.projPenetration = CONST.PLAYER_BASE_PROJ_PEN;
    this.projSize = CONST.PLAYER_BASE_PROJ_SIZE;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = Utils.xpForLevel(1);
    this.kills = 0;
    this.score = 0;
    this.routeId = null;
    this.routeData = null;
    this.characterId = null;
    this.characterData = null;
    this.routeLocked = false;
    this.lastShotTime = 0;
    this.upgradeSystem = new UpgradeSystem(this);
    this.abilitySystem = new AbilitySystem(this);
    this.damageFlashTimer = 0;
    this.invulnTimer = 0;
    this.barrelRecoil = 0;
    this.passiveXpTimer = 0;
    this.levelUpFlash = 0;
    this._game = null;

    // Shield system
    this._shieldActive = false;
    this._shieldReduction = 1;

    // Sword animation
    this._swordSwing = 0;
    this._swordAlt = 0;

    // Sandbox flags
    this._sandboxInvincible = false;

    // Prevent double route selection
    this._routeSelecting = false;

    // Dash cooldown
    this.dashCooldownTimer = 0;
}

Player.prototype = Object.create(Entity.prototype);
Player.prototype.constructor = Player;

Player.prototype.getScore = function () {
    return this.level * CONST.SCORE_LEVEL_MULT + this.kills * CONST.SCORE_KILL_MULT;
};

Player.prototype.addXp = function (amount) {
    var b = 1 + this.level * CONST.SHAPE_XP_BONUS_PER_LEVEL;
    this.xp += Math.floor(amount * b);
    while (this.xp >= this.xpToNext && this.level < CONST.MAX_LEVEL) {
        this.xp -= this.xpToNext;
        this.levelUp();
    }
    if (this.level >= CONST.MAX_LEVEL) this.xp = 0;
};

Player.prototype.levelUp = function () {
    this.level++;
    this.xpToNext = Utils.xpForLevel(this.level);
    this.upgradeSystem.addStatPoint(CONST.STAT_POINTS_PER_LEVEL);
    var bonusLevels = CONST.BONUS_STAT_LEVELS;
    for (var i = 0; i < bonusLevels.length; i++) {
        if (bonusLevels[i] === this.level) {
            this.upgradeSystem.addStatPoint(1);
            break;
        }
    }
    this.hp = Math.min(this.hp + this.maxHp * 0.4, this.maxHp);
    this.levelUpFlash = 600;
    this.score = this.getScore();
    if (this._game && this.routeLocked) {
        AbilityData.checkNewAbility(this, this._game);
        if (this._game && this._game.sound) this._game.sound.levelUp();
    }
};

Player.prototype.getWeaponType = function () {
    if (this.characterId && typeof WeaponSystem !== 'undefined') {
        return WeaponSystem.getWeaponType(this.characterId);
    }
    return 'ranged';
};

Player.prototype.shoot = function (game) {
    var weaponType = this.getWeaponType();

    if (weaponType === 'fist') {
        WeaponSystem.fistAttack(this, game);
        return;
    }

    if (weaponType === 'sword') {
        WeaponSystem.swordAttack(this, game);
        return;
    }

    // Default: ranged attack
    var now = Utils.now();
    if (now - this.lastShotTime < this.reloadTime) return;
    this.lastShotTime = now;
    this.barrelRecoil = 6;

    var proj = game.projectilePool.get();
    var btx = this.x + Math.cos(this.angle) * (CONST.BARREL_LENGTH + this.radius);
    var bty = this.y + Math.sin(this.angle) * (CONST.BARREL_LENGTH + this.radius);
    var pc = this.characterData ? this.characterData.color : this.color;

    proj.init({
        x: btx,
        y: bty,
        vx: Math.cos(this.angle) * this.projSpeed,
        vy: Math.sin(this.angle) * this.projSpeed,
        radius: this.projSize,
        damage: this.projDamage,
        penetration: this.projPenetration,
        ownerId: this.id,
        ownerType: this.type,
        color: pc,
        glowColor: 'rgba(0,0,0,0)'
    });

    game.vfx.directionalBurst(btx, bty, this.angle, 0.5, 3, CONST.COLOR_INK, { 
        speed: 2, radius: 2, life: 100
    });

        if (game.sound) game.sound.shoot();

    this.vx -= Math.cos(this.angle) * 0.8;
    this.vy -= Math.sin(this.angle) * 0.8;
};

Player.prototype.performDash = function(game) {
    this.dashCooldownTimer = CONST.DASH_COOLDOWN;
    var angle = this.angle;
    // If moving, dash in movement direction instead of aim
    var mx = 0, my = 0;
    if (game.input.isKeyDown('w')) my--; 
    if (game.input.isKeyDown('s')) my++;
    if (game.input.isKeyDown('a')) mx--; 
    if (game.input.isKeyDown('d')) mx++;
        if (game.sound) game.sound.dash();
    if (mx !== 0 || my !== 0) angle = Math.atan2(my, mx);

    var sx = this.x, sy = this.y;
    this.x += Math.cos(angle) * CONST.DASH_DISTANCE;
    this.y += Math.sin(angle) * CONST.DASH_DISTANCE;
    this.clampToMap();

    game.vfx.beamFlash(sx, sy, this.x, this.y, this.color, 2, 200);
    game.vfx.afterimage(sx, sy, this.radius, this.color, this.angle);
    game.vfx.burst(sx, sy, 8, CONST.COLOR_INK, { speed: 2, life: 200 });
    this.invulnTimer = Math.max(this.invulnTimer, 150); // Brief I-frames
};

// SINGLE takeDamage that handles all cases: shield, invuln, sandbox
Player.prototype.takeDamage = function (amount, source) {
    // Never take damage if dead
    if (!this.alive) return;

    // Sandbox invincibility
    if (this._sandboxInvincible) return;

    // Invulnerability timer (respawn protection etc)
    if (this.invulnTimer > 0) return;

    // Apply shield reduction if active
    if (this._shieldActive) {
        amount = amount * this._shieldReduction;
    }

    this.hp -= amount;
    this.lastDamageTime = Utils.now();
    this.damageFlashTimer = 120;
        if (this._game && this._game.sound && this.type === 'player') {
        this._game.sound.playerHit();
    }
        // Trigger vignette if game exists
    if (this._game && this._game.damageVignette && source) {
        var dmgAngle = Utils.angleBetween(this.x, this.y, source.x, source.y);
        this._game.damageVignette.trigger(dmgAngle);
    }

    if (this.hp <= 0) {
        this.hp = 0;
        this.die(source);
    }
};

Player.prototype.die = function (killer) {
    this.alive = false;
    this._shieldActive = false;
    this._shieldReduction = 1;

    if (killer && killer.addXp) {
        killer.addXp(this.level * CONST.KILL_XP_MULTIPLIER);
        killer.kills++;
        killer.score = killer.getScore();
    }
};

Player.prototype.respawn = function () {
    var pos = Utils.randomSpawnPos();
    this.x = pos.x;
    this.y = pos.y;
    this.alive = true;
    this._shieldActive = false;
    this._shieldReduction = 1;
    this._routeSelecting = false;

    var nl = Math.max(1, Math.floor(this.level * CONST.DEATH_LEVEL_KEEP));
    this.level = 1;
    this.xp = 0;
    this.xpToNext = Utils.xpForLevel(1);
    this.upgradeSystem.reset();
    this.abilitySystem.clear();
    this.kills = 0;

    for (var i = 1; i < nl; i++) {
        this.levelUp();
    }

    this.upgradeSystem._applyToOwner();
    this.hp = this.maxHp;
    this.invulnTimer = 2500;
    this.vx = 0;
    this.vy = 0;
    this.score = this.getScore();
    this.levelUpFlash = 0;
    this._swordSwing = 0;
    this._swordAlt = 0;
    this.dashCooldownTimer = 0;
};

Player.prototype.update = function (dt, game) {
    if (!this.alive) return;
    this._game = game;

    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.barrelRecoil > 0) this.barrelRecoil -= dt * 0.035;
    if (this.levelUpFlash > 0) this.levelUpFlash -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;

    // Sword swing decay
    if (this._swordSwing > 0) {
        this._swordSwing -= dt * 0.005;
        if (this._swordSwing < 0) this._swordSwing = 0;
    }

    // HP regen
    this.hp = Math.min(this.hp + this.hpRegen * (dt / 16.67), this.maxHp);

    // Dash Input
    if (game.input.isKeyDown(' ') && this.dashCooldownTimer <= 0) {
        this.performDash(game);
    }

    // Passive XP
    this.passiveXpTimer += dt;
    if (this.passiveXpTimer >= CONST.PASSIVE_XP_INTERVAL) {
        this.passiveXpTimer -= CONST.PASSIVE_XP_INTERVAL;
        this.addXp(CONST.PASSIVE_XP_RATE + this.level * 0.1);
    }

    // Physics
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.85;
    this.vy *= 0.85;
    this.clampToMap();

    // Abilities
    this.abilitySystem.update(dt);

    // Score
    this.score = this.getScore();
};

Player.prototype.render = function (ctx, camera) {
    if (!this.alive) return;
    if (!camera.isVisible(this.x, this.y, this.radius + 80)) return;

    var flash = this.damageFlashTimer > 0;
    var inv = this.invulnTimer > 0;
    var bc = this.characterData ? this.characterData.color : this.color;

    if (inv) {
        ctx.globalAlpha = 0.5 + Math.sin(Utils.now() * 0.012) * 0.2;
    }

    // Level up ring
    if (this.levelUpFlash > 0) {
        var lt = 1 - this.levelUpFlash / 600;
        var savedAlpha = ctx.globalAlpha;
        ctx.globalAlpha = savedAlpha * (1 - lt) * 0.3;
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 15 + lt * 35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = inv ? 0.5 + Math.sin(Utils.now() * 0.012) * 0.2 : 1;
    }

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.arc(this.x + 3, this.y + 3, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Weapon rendering
    var weaponType = this.getWeaponType();
    if (typeof WeaponSystem !== 'undefined') {
        WeaponSystem.renderWeapon(ctx, this, weaponType);
    } else {
        // Fallback barrel
        var ro = Math.max(0, this.barrelRecoil);
        var bl = CONST.BARREL_LENGTH - ro;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(this.radius - 4 + 2, -CONST.BARREL_WIDTH / 2 + 2, bl + 4, CONST.BARREL_WIDTH);
        ctx.fillStyle = flash ? CONST.COLOR_PAPER : this.barrelColor;
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 2;
        ctx.fillRect(this.radius - 4, -CONST.BARREL_WIDTH / 2, bl + 4, CONST.BARREL_WIDTH);
        ctx.strokeRect(this.radius - 4, -CONST.BARREL_WIDTH / 2, bl + 4, CONST.BARREL_WIDTH);
        ctx.restore();
    }

    // Body
    ctx.fillStyle = flash ? CONST.COLOR_PAPER : bc;
    ctx.strokeStyle = CONST.COLOR_INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Body highlight
    ctx.fillStyle = 'rgba(245,240,232,0.25)';
    ctx.beginPath();
    ctx.arc(this.x - 5, this.y - 5, this.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    // Character letter
    if (this.characterData) {
        ctx.font = 'bold 13px "Bangers", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = CONST.COLOR_PAPER;
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 1;
        ctx.strokeText(this.characterData.name[0], this.x, this.y + 1);
        ctx.fillText(this.characterData.name[0], this.x, this.y + 1);
    }

    // Name
    var ny = this.y - this.radius - 22;
    ctx.font = '12px "Patrick Hand", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = CONST.COLOR_PAPER;
    ctx.lineWidth = 3;
    ctx.strokeText(this.name, this.x, ny);
    ctx.fillStyle = CONST.COLOR_INK;
    ctx.fillText(this.name, this.x, ny);

    // Level
    ctx.font = 'bold 10px "Black Han Sans", sans-serif';
    ctx.strokeStyle = CONST.COLOR_PAPER;
    ctx.lineWidth = 2;
    ctx.strokeText('Lv.' + this.level, this.x, ny - 13);
    ctx.fillStyle = CONST.COLOR_INK;
    ctx.fillText('Lv.' + this.level, this.x, ny - 13);

    // Character name
    if (this.characterData) {
        ctx.font = '10px "Patrick Hand", cursive';
        ctx.fillStyle = this.characterData.color;
        ctx.strokeStyle = CONST.COLOR_PAPER;
        ctx.lineWidth = 2;
        ctx.strokeText(this.characterData.name, this.x, ny - 24);
        ctx.fillText(this.characterData.name, this.x, ny - 24);
    }

    // HP bar
    var hW = this.radius * 2.4;
    var hH = 4;
    var hX = this.x - hW / 2;
    var hY = this.y - this.radius - 7;
    var hF = this.hp / this.maxHp;
    ctx.fillStyle = CONST.COLOR_PAPER;
    ctx.strokeStyle = CONST.COLOR_INK;
    ctx.lineWidth = 1;
    ctx.fillRect(hX, hY, hW, hH);
    ctx.strokeRect(hX, hY, hW, hH);
    ctx.fillStyle = CONST.COLOR_INK;
    ctx.fillRect(hX, hY, hW * hF, hH);
};

Player.prototype.selectRoute = function (routeId, routeSystem) {
    // Prevent double selection
    if (this._routeSelecting) return;
    this._routeSelecting = true;

    var route = routeSystem.getRoute(routeId);
    if (!route) { this._routeSelecting = false; return; }

    this.routeId = routeId;
    this.routeData = route;
    this.routeLocked = true;

    var ch = routeSystem.getRandomCharacter(routeId);
    this.characterId = ch.id;
    this.characterData = ch;
    this.color = ch.color;
    this.barrelColor = ch.secondaryColor || ch.color;

    AbilityData.applyAbilitiesForLevel(this);
};
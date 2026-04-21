function AIController(bot) {
    this.bot = bot; this.state = 'farm'; this.target = null; this.targetShape = null;
    this.decisionTimer = 0; this.decisionInterval = 400 + Math.random() * 300;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.dodgeTimer = 0; this.strafeDir = Math.random() > 0.5 ? 1 : -1;
    this.aggression = 0.2 + Math.random() * 0.45;
    this.accuracy = 0.45 + Math.random() * 0.35;
    this.dodgeSkill = 0.2 + Math.random() * 0.35;
    this.farmPreference = 0.3 + Math.random() * 0.3;
    this.abilityTimer = 0; this.abilityInterval = 2000 + Math.random() * 3000;
}

AIController.prototype.update = function (dt, game) {
    var bot = this.bot;
    if (!bot.alive) return;
    bot._game = game;
    this.decisionTimer += dt;
    if (this.dodgeTimer > 0) this.dodgeTimer -= dt;
    if (this.decisionTimer >= this.decisionInterval) { this.decisionTimer = 0; this.makeDecision(game); }
    switch (this.state) {
        case 'aggressive': this.executeAggressive(game); break;
        case 'cautious': this.executeCautious(game); break;
        case 'flee': this.executeFlee(game); break;
        default: this.executeFarm(game); break;
    }
    this.tryDodge(game);
    if (bot.upgradeSystem.statPoints > 0 && Math.random() < 0.3) bot.upgradeSystem.autoDistribute();
    if (bot.level >= CONST.ROUTE_SELECTION_LEVEL && !bot.routeLocked) {
        var routes = Object.keys(ROUTES);
        bot.selectRoute(routes[Utils.randInt(0, routes.length - 1)], game.routeSystem);
        game.vfx.burst(bot.x, bot.y, 8, bot.characterData ? bot.characterData.color : CONST.COLOR_INK, { speed: 3, life: 250, radius: 2 });
    }
    this.abilityTimer += dt;
    if (this.abilityTimer >= this.abilityInterval) { this.abilityTimer = 0; this.tryUseAbility(game); }
};

AIController.prototype.tryUseAbility = function (game) {
    var ab = this.bot.abilitySystem.getAbilities();
    if (!ab.length) return;
    var ready = [];
    for (var i = 0; i < ab.length; i++) if (ab[i].ready) ready.push(i);
    if (!ready.length) return;
    if (this.state === 'aggressive' || this.state === 'cautious') {
        this.bot.abilitySystem.useAbility(Utils.pickRandom(ready), game);
    } else if (Math.random() < 0.3) {
        this.bot.abilitySystem.useAbility(ready[0], game);
    }
};

AIController.prototype.makeDecision = function (game) {
    var bot = this.bot, hp = bot.hp / bot.maxHp;
    var ne = this.findNearestEnemy(game), ns = this.findNearestShape(game);
    if (hp < 0.3) { this.state = 'flee'; this.target = ne; }
    else if (Math.random() < this.farmPreference && ns) { this.state = 'farm'; this.targetShape = ns; }
    else if (hp > 0.7 && ne && (ne.level < bot.level - 5 || ne.hp / ne.maxHp < 0.3 || Math.random() < this.aggression * 0.7)) { this.state = 'aggressive'; this.target = ne; }
    else if (ne && Utils.dist(bot.x, bot.y, ne.x, ne.y) < 400) { this.state = 'cautious'; this.target = ne; }
    else { this.state = 'farm'; this.targetShape = ns; }
    if (Math.random() < 0.3) this.strafeDir *= -1;
        // Speech bubble
    if (game.botBubbles) {
        if (this.state === 'aggressive') game.botBubbles.say(bot, 'aggressive');
        else if (this.state === 'flee') game.botBubbles.say(bot, 'flee');
    }
};

AIController.prototype.findNearestEnemy = function (game) {
    var b = this.bot, n = null, nd = Infinity;
    if (game.player && game.player.alive && game.player.id !== b.id) { var d = Utils.dist(b.x, b.y, game.player.x, game.player.y); if (d < 700 && d < nd) { n = game.player; nd = d; } }
    for (var i = 0; i < game.bots.length; i++) { var o = game.bots[i]; if (o === b || !o.alive) continue; var d2 = Utils.dist(b.x, b.y, o.x, o.y); if (d2 < 700 && d2 < nd) { n = o; nd = d2; } }
    return n;
};

AIController.prototype.findNearestShape = function (game) {
    var b = this.bot, n = null, nd = Infinity;
    for (var i = 0; i < game.shapes.length; i++) { var s = game.shapes[i]; if (!s.alive) continue; var d = Utils.dist(b.x, b.y, s.x, s.y); if (d < nd) { n = s; nd = d; } }
    return n;
};

AIController.prototype.executeAggressive = function (game) {
    var b = this.bot;
    if (!this.target || !this.target.alive) { this.state = 'farm'; return; }
    var dx = this.target.x - b.x, dy = this.target.y - b.y;
    var dist = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
    if (dist > 220) { b.vx += Math.cos(a) * b.moveSpeed * 0.13; b.vy += Math.sin(a) * b.moveSpeed * 0.13; }
    b.angle = a + (Math.random() - 0.5) * (1 - this.accuracy) * 0.5;
    if (Math.random() < 0.85) b.shoot(game);
};

AIController.prototype.executeCautious = function (game) {
    var b = this.bot;
    if (!this.target || !this.target.alive) { this.state = 'farm'; return; }
    var dx = this.target.x - b.x, dy = this.target.y - b.y;
    var dist = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
    if (dist < 280) { b.vx -= Math.cos(a) * b.moveSpeed * 0.1; b.vy -= Math.sin(a) * b.moveSpeed * 0.1; }
    else if (dist > 450) { b.vx += Math.cos(a) * b.moveSpeed * 0.07; b.vy += Math.sin(a) * b.moveSpeed * 0.07; }
    var pa = a + Math.PI / 2;
    b.vx += Math.cos(pa) * this.strafeDir * b.moveSpeed * 0.07;
    b.vy += Math.sin(pa) * this.strafeDir * b.moveSpeed * 0.07;
    b.angle = a + (Math.random() - 0.5) * (1 - this.accuracy) * 0.5;
    if (Math.random() < 0.75) b.shoot(game);
};

AIController.prototype.executeFlee = function (game) {
    var b = this.bot, threat = this.findNearestEnemy(game);
    if (threat) {
        var a = Utils.angleBetween(threat.x, threat.y, b.x, b.y);
        b.vx += Math.cos(a) * b.moveSpeed * 0.16; b.vy += Math.sin(a) * b.moveSpeed * 0.16;
        b.angle = Math.atan2(threat.y - b.y, threat.x - b.x);
        if (Math.random() < 0.3) b.shoot(game);
    } else this.state = 'farm';
};

AIController.prototype.executeFarm = function (game) {
    var b = this.bot;
    if (!this.targetShape || !this.targetShape.alive) this.targetShape = this.findNearestShape(game);
    if (this.targetShape && this.targetShape.alive) {
        var dx = this.targetShape.x - b.x, dy = this.targetShape.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
        if (dist > 130) { b.vx += Math.cos(a) * b.moveSpeed * 0.1; b.vy += Math.sin(a) * b.moveSpeed * 0.1; }
        b.angle = a; b.shoot(game);
    } else {
        this.wanderAngle += (Math.random() - 0.5) * 0.2;
        b.vx += Math.cos(this.wanderAngle) * b.moveSpeed * 0.06;
        b.vy += Math.sin(this.wanderAngle) * b.moveSpeed * 0.06;
        if (b.x < 400) this.wanderAngle = 0;
        if (b.x > CONST.MAP_WIDTH - 400) this.wanderAngle = Math.PI;
        if (b.y < 400) this.wanderAngle = Math.PI / 2;
        if (b.y > CONST.MAP_HEIGHT - 400) this.wanderAngle = -Math.PI / 2;
    }
};

AIController.prototype.tryDodge = function (game) {
    if (this.dodgeTimer > 0) return;
    var b = this.bot, pr = game.projectilePool.getActive();
    for (var i = 0; i < pr.length; i++) {
        var p = pr[i];
        if (!p.alive || p.ownerId === b.id) continue;
        var d = Utils.dist(b.x, b.y, p.x, p.y);
        if (d > 180) continue;
        var pa = Math.atan2(p.vy, p.vx), tb = Math.atan2(b.y - p.y, b.x - p.x);
        if (Math.abs(Utils.normalizeAngle(pa - tb)) < 0.4 && Math.random() < this.dodgeSkill) {
            var dd = Math.random() > 0.5 ? 1 : -1;
            b.vx += Math.cos(pa + Math.PI / 2 * dd) * 3.5;
            b.vy += Math.sin(pa + Math.PI / 2 * dd) * 3.5;
            this.dodgeTimer = 400; break;
        }
    }
};
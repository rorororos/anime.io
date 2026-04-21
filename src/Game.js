function Game(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsTimer = 0;
    this.fpsCount = 0;
    this.playerDeathHandled = false;

    this.resize();
    var self = this;
    window.addEventListener('resize', function () { self.resize(); });

    this.camera = new Camera(canvas);
    this.input = new InputManager(canvas);
    this.vfx = new VFXManager();
    this.routeSystem = new RouteSystem();
    this.spatialGrid = new SpatialGrid(CONST.MAP_WIDTH, CONST.MAP_HEIGHT, CONST.SPATIAL_CELL_SIZE);
    this.projectilePool = new ObjectPool(
        function () { return new Projectile(); },
        function (p) { p.reset(); },
        CONST.PROJ_POOL_SIZE
    );

    this.player = null;
    this.bots = [];
    this.shapes = [];
    this.bigPentagons = [];
    this.abilityEntities = [];

    this.ui = new UIManager(this);
    this.minimap = new Minimap(this);
    this.leaderboard = new LeaderboardManager(this);

    this.routePromptShown = false;
    this.shapeSpawnTimer = 0;
    this.bigPentagonSpawnTimer = 0;
    this.sandboxMode = false;
    this.sandboxBotCount = CONST.BOT_COUNT;
    this.freezeTimer = 0;
    this.mapEvents = new MapEvents(this);
    this.combo = new ComboSystem(this);
    this.impactLines = new ImpactLines();
    this.damageVignette = new DamageVignette();
    this.botBubbles = new BotBubbles(this);

    var game = this;
    document.getElementById('respawn-button').addEventListener('click', function () {
        game.respawnPlayer();
    });
}

Game.prototype.resize = function () {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
};

Game.prototype.start = function (playerName) {
    this.player = new Player(playerName || 'Player');
    var sp = Utils.randomSpawnPos();
    this.player.x = sp.x;
    this.player.y = sp.y;
    this.player.hp = this.player.maxHp;
    this.playerDeathHandled = false;

    this.bots = [];
    for (var i = 0; i < CONST.BOT_COUNT; i++) this.spawnBot();

    this.shapes = [];
    this.bigPentagons = [];
    for (var j = 0; j < CONST.SHAPE_MAX; j++) this.spawnShape();
    for (var k = 0; k < CONST.BIG_PENTAGON_MAX; k++) this.spawnBigPentagon();

    this.abilityEntities = [];
    this.routePromptShown = false;
    this.paused = false;
    this.sandboxMode = false;
    this.sandboxBotCount = CONST.BOT_COUNT;
        this.sound = new SoundSystem();
        this.freezeTimer = 0;
    this.combo.count = 0;
    this.combo.xpMultiplier = 1;

    this.ui.hideMainMenu();
    this.ui.hideGameOver();

    this.running = true;
    this.lastTime = performance.now();
    var self = this;
    requestAnimationFrame(function (t) { self.loop(t); });
};

Game.prototype.spawnBot = function () {
    var n = CONST.BOT_NAMES[Utils.randInt(0, CONST.BOT_NAMES.length - 1)] + Utils.randInt(1, 99);
    var b = new Bot(n);
    var sp = Utils.randomSpawnPos();
    b.x = sp.x;
    b.y = sp.y;
    var sl = Utils.randInt(1, 4);
    for (var i = 1; i < sl; i++) b.addXp(b.xpToNext);
    while (b.upgradeSystem.statPoints > 0) b.upgradeSystem.autoDistribute();
    this.bots.push(b);
};

Game.prototype.spawnShape = function () {
    var s = new Shape();
    var ti = Utils.weightedRandom(CONST.SHAPE_SPAWN_WEIGHTS);
    var types = ['SQUARE', 'TRIANGLE', 'PENTAGON'];
    var p = Utils.randomSpawnPos();
    s.init(types[ti], p.x, p.y);
    this.shapes.push(s);
};

Game.prototype.spawnBigPentagon = function () {
    var s = new Shape();
    var p = Utils.centerSpawnPos(CONST.BIG_PENTAGON_ZONE);
    s.initBig(p.x, p.y);
    this.bigPentagons.push(s);
    this.shapes.push(s);
};

Game.prototype.getAllCombatants = function () {
    var l = [];
    if (this.player && this.player.alive) l.push(this.player);
    for (var i = 0; i < this.bots.length; i++) {
        if (this.bots[i].alive) l.push(this.bots[i]);
    }
    return l;
};

Game.prototype.getEnemiesInRadius = function (x, y, r, exId) {
    var res = [];
    var nearby = this.spatialGrid.query(x, y, r);
    for (var i = 0; i < nearby.length; i++) {
        var e = nearby[i];
        if (!e.alive || e.id === exId) continue;
        if (e.type !== 'player' && e.type !== 'bot') continue;
        if (Utils.dist(x, y, e.x, e.y) <= r) res.push(e);
    }
    return res;
};

Game.prototype.getShapesInRadius = function (x, y, r) {
    var res = [];
    var nearby = this.spatialGrid.query(x, y, r);
    for (var i = 0; i < nearby.length; i++) {
        var e = nearby[i];
        if (!e.alive || e.type !== 'shape') continue;
        if (Utils.dist(x, y, e.x, e.y) <= r) res.push(e);
    }
    return res;
};

Game.prototype.applyAOE = function (x, y, r, d, ownerId, color) {
    var en = this.getEnemiesInRadius(x, y, r, ownerId);
    var sh = this.getShapesInRadius(x, y, r);
    var owner = this.getEntityById(ownerId);
    for (var i = 0; i < en.length; i++) {
        en[i].takeDamage(d, owner);
        this.vfx.floatingText(en[i].x, en[i].y - en[i].radius - 10,
            '-' + Math.floor(d), color || '#1a1a1a', { fontSize: 15 });
        this.vfx.impactSpark(en[i].x, en[i].y, color || CONST.COLOR_INK);
        if (!en[i].alive) this.handleKill(owner, en[i]);
    }
    for (var j = 0; j < sh.length; j++) {
        sh[j].takeDamage(d, owner);
        if (!sh[j].alive) {
            if (owner) {
                owner.addXp(sh[j].xpValue);
                this.vfx.floatingText(sh[j].x, sh[j].y - 20,
                    '+' + sh[j].xpValue + ' XP', '#c9a84c', { fontSize: 12 });
            }
            this.vfx.shapeDestroy(sh[j].x, sh[j].y, sh[j].color);
                this.sound.shapeBreak();
        }
    }
    return en.length + sh.length;
};

Game.prototype.handleKill = function (killer, victim) {
    if (victim.alive) return;
    if (victim === this.player && this.playerDeathHandled) return;

    this.vfx.deathShatter(victim.x, victim.y,
        victim.characterData ? victim.characterData.color : CONST.COLOR_INK);

            if (victim === this.player) {
        this.sound.playerDeath();
    } else if (killer === this.player) {
        this.sound.kill();
    }

    // Impact lines on kill
    this.impactLines.spawn(victim.x, victim.y, {
        numLines: 20, innerRadius: 20, outerRadius: 120, duration: 300
    });

    // Freeze frame on player-involved kills
    if (victim === this.player || killer === this.player) {
        this.freezeTimer = CONST.FREEZE_FRAME_DURATION;
    }

    // Combo
    if (killer === this.player) {
        this.combo.addHit();
        this.combo.addHit(); // Kills count as 2 combo hits
    }

    this.camera.shake(3, 150);
    this.ui.addKillFeedEntry(killer ? killer.name : '???', victim.name);

    if (victim === this.player) {
        this.playerDeathHandled = true;
        this.combo.break2();
        this.onPlayerDeath();
    }

    if (killer) {
        this.vfx.floatingText(killer.x, killer.y - 40,
            'KILL!', '#c0392b', { fontSize: 20, life: 1000 });

        // Bot taunt on kill
        if (killer.type === 'bot') {
            this.botBubbles.say(killer, 'kill');
        }
    }
};

Game.prototype.getEntityById = function (id) {
    if (this.player && this.player.id === id) return this.player;
    for (var i = 0; i < this.bots.length; i++) {
        if (this.bots[i].id === id) return this.bots[i];
    }
    return null;
};

Game.prototype.getAverageLevel = function () {
    var t = this.player ? this.player.level : 0;
    var c = this.player ? 1 : 0;
    for (var i = 0; i < this.bots.length; i++) {
        if (this.bots[i].alive) { t += this.bots[i].level; c++; }
    }
    return c > 0 ? t / c : 1;
};

Game.prototype.loop = function (timestamp) {
    if (!this.running) return;
    this.deltaTime = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;
    this.fpsCount++;
    this.fpsTimer += this.deltaTime;
    if (this.fpsTimer >= 1000) {
        this.fps = this.fpsCount;
        this.fpsCount = 0;
        this.fpsTimer = 0;
    }
    var eDt = this.deltaTime;
    if (!this.paused) {
        eDt = this.deltaTime * this.vfx.getSlowMoFactor();
        this.update(eDt);
    }
    this.vfx.update(this.deltaTime);
    this.render();
    this.frameCount++;
    var self = this;
    requestAnimationFrame(function (t) { self.loop(t); });
};

Game.prototype.update = function (dt) {
    this.input.updateWorldMouse(this.camera);

    if (this.player && this.player.alive) {
        this.updatePlayerInput(dt);
                // Mobile controls
        if (this.mobile && this.mobile.active) {
            this.mobile.update(dt);
        }
        this.player.update(dt, this);

        if (this.player.level >= CONST.ROUTE_SELECTION_LEVEL &&
            !this.player.routeLocked &&
            !this.routePromptShown &&
            !this.player._routeSelecting) {
            this.routePromptShown = true;
            this.paused = true;
            this.player.invulnTimer = Math.max(this.player.invulnTimer, 30000);
            this.ui.showRouteSelection();
            return;
        }
    }

    for (var i = this.bots.length - 1; i >= 0; i--) {
        var b = this.bots[i];
        if (b.alive) {
            b.update(dt, this);
        } else {
            b._deathTimer = (b._deathTimer || 0) + dt;
            if (b._deathTimer > 3000) {
                b._deathTimer = 0;
                b.respawn();
                var cu = Math.max(1, Math.floor(this.getAverageLevel() * 0.5));
                for (var j = 1; j < cu; j++) b.addXp(b.xpToNext);
                while (b.upgradeSystem.statPoints > 0) b.upgradeSystem.autoDistribute();
            }
        }
    }

    var targetBots = this.sandboxMode ? this.sandboxBotCount : CONST.BOT_COUNT;
    while (this.bots.length < targetBots) this.spawnBot();

    var pr = this.projectilePool.getActive();
    for (var pi = pr.length - 1; pi >= 0; pi--) {
        pr[pi].update(dt, this);
        if (!pr[pi].alive) this.projectilePool.release(pr[pi]);
    }

    for (var ai = this.abilityEntities.length - 1; ai >= 0; ai--) {
        var ae = this.abilityEntities[ai];
        if (ae.update) ae.update(dt, this);
        if (!ae.alive) this.abilityEntities.splice(ai, 1);
    }

    for (var si = this.shapes.length - 1; si >= 0; si--) {
        var s = this.shapes[si];
        if (s.alive) {
            s.update(dt);
        } else {
            this.shapes.splice(si, 1);
            var bi = this.bigPentagons.indexOf(s);
            if (bi !== -1) this.bigPentagons.splice(bi, 1);
        }
    }

    this.shapeSpawnTimer += dt;
    if (this.shapeSpawnTimer > 60) {
        this.shapeSpawnTimer = 0;
        var def = CONST.SHAPE_MAX - this.shapes.length + this.bigPentagons.length;
        if (def > 0) {
            for (var d = 0; d < Math.min(def, 3); d++) this.spawnShape();
        }
    }

    this.bigPentagonSpawnTimer += dt;
    if (this.bigPentagonSpawnTimer > 5000) {
        this.bigPentagonSpawnTimer = 0;
        if (this.bigPentagons.length < CONST.BIG_PENTAGON_MAX) {
            this.spawnBigPentagon();
        }
    }

    this.rebuildSpatialGrid();
    this.checkCollisions();

    if (this.player && this.player.alive) {
        this.camera.follow(this.player.x, this.player.y);
    }
    this.camera.update(dt);

        // Map events
    this.mapEvents.update(dt);

    // Combo system
    this.combo.update(dt);

    // Impact lines
    this.impactLines.update(dt);

    // Damage vignette
    this.damageVignette.update(dt);

    // Bot bubbles
    this.botBubbles.update(dt);

    // XP orb magnet
    this.updateXPOrbs(dt);

    this.ui.update();
    this.leaderboard.update();
};

Game.prototype.updatePlayerInput = function (dt) {
    var p = this.player;
    var inp = this.input;

    // Only use keyboard if not on mobile
    if (!this.mobile || !this.mobile.active) {
        var mx = 0, my = 0;
        if (inp.isKeyDown('w') || inp.isKeyDown('arrowup')) my -= 1;
        if (inp.isKeyDown('s') || inp.isKeyDown('arrowdown')) my += 1;
        if (inp.isKeyDown('a') || inp.isKeyDown('arrowleft')) mx -= 1;
        if (inp.isKeyDown('d') || inp.isKeyDown('arrowright')) mx += 1;

        if (mx !== 0 || my !== 0) {
            var l = Math.sqrt(mx * mx + my * my);
            mx /= l; my /= l;
            p.vx += mx * p.moveSpeed * 0.28;
            p.vy += my * p.moveSpeed * 0.28;
        }

        p.angle = Utils.angleBetween(p.x, p.y, inp.mouseWorldX, inp.mouseWorldY);
        if (inp.isShooting()) p.shoot(this);
    }

    // Keyboard abilities work on both
    for (var k = 1; k <= 6; k++) {
        if (inp.isKeyDown(String(k))) {
            p.abilitySystem.useAbilityByKey(String(k), this);
        }
    }

    // Dash on spacebar (desktop)
    if ((!this.mobile || !this.mobile.active) && inp.isKeyDown(' ')) {
        if (p.dashCooldownTimer <= 0 && p.performDash) {
            p.performDash(this);
        }
    }
};

Game.prototype.rebuildSpatialGrid = function () {
    this.spatialGrid.clear();
    if (this.player && this.player.alive) this.spatialGrid.insert(this.player);
    for (var i = 0; i < this.bots.length; i++) {
        if (this.bots[i].alive) this.spatialGrid.insert(this.bots[i]);
    }
    for (var j = 0; j < this.shapes.length; j++) {
        if (this.shapes[j].alive) this.spatialGrid.insert(this.shapes[j]);
    }
};

Game.prototype.updateXPOrbs = function (dt) {
    if (!this.player || !this.player.alive) return;
    var effects = this.vfx.effects;
    for (var i = effects.length - 1; i >= 0; i--) {
        var o = effects[i];
        if (o.type !== 'xp_orb' || !o.alive) continue;

        o.life += dt;
        if (o.life >= o.duration) { effects.splice(i, 1); continue; }

        var d = Utils.dist(this.player.x, this.player.y, o.x, o.y);
        if (d < CONST.XP_MAGNET_RADIUS) {
            var a = Utils.angleBetween(o.x, o.y, this.player.x, this.player.y);
            var pull = (1 - d / CONST.XP_MAGNET_RADIUS) * 12;
            o.vx += Math.cos(a) * pull * (dt / 16);
            o.vy += Math.sin(a) * pull * (dt / 16);
        }

        o.x += o.vx;
        o.y += o.vy;
        o.vx *= 0.92;
        o.vy *= 0.92;

        if (d < this.player.radius + 15) {
            var xpVal = Math.floor(o.value * this.combo.xpMultiplier);
            this.player.addXp(xpVal);
            this.vfx.xpPickup(this.player.x, this.player.y);
            if (xpVal !== o.value) {
                this.vfx.floatingText(this.player.x, this.player.y - 30,
                    '+' + xpVal + ' XP (x' + this.combo.xpMultiplier.toFixed(1) + ')',
                    '#c9a84c', { fontSize: 13 });
            }
            effects.splice(i, 1);
        }
    }
};

Game.prototype.checkCollisions = function () {
    var pr = this.projectilePool.getActive();
    for (var i = pr.length - 1; i >= 0; i--) {
        var proj = pr[i];
        if (!proj.alive) continue;
        var nearby = this.spatialGrid.query(proj.x, proj.y, proj.radius + 50);
        for (var ni = 0; ni < nearby.length; ni++) {
            var entity = nearby[ni];
            if (!entity.alive || entity.id === proj.ownerId) continue;
            if (Utils.circleCollision(proj.x, proj.y, proj.radius, entity.x, entity.y, entity.radius)) {
                if (proj.onHit(entity)) {
                    var killer = this.getEntityById(proj.ownerId);
                    entity.takeDamage(proj.damage, killer);
                    var hitAngle = Utils.angleBetween(proj.x, proj.y, entity.x, entity.y);
                    this.vfx.impactSpark((proj.x + entity.x) / 2, (proj.y + entity.y) / 2, proj.color);
                    this.camera.shake(1, 50);
                    this.vfx.floatingText(entity.x, entity.y - entity.radius - 10,
                        '-' + Math.floor(proj.damage), '#c0392b', { fontSize: 14 });
                    if (entity.type === 'shape' && entity.applyKnockback) {
                        entity.applyKnockback(hitAngle, 2.5);
                    }
                    if (!entity.alive) {
                        if (entity.type === 'shape') {
                            if (killer) {
                                this.vfx.spawnXPOrb(entity.x, entity.y, entity.xpValue);
                                // Combo hit for player
                                if (killer === this.player) this.combo.addHit();
                            }
                            this.vfx.shapeDestroy(entity.x, entity.y, entity.color);
                            if (entity.isBig) {
                                this.camera.shake(3, 150);
                                this.vfx.shockwave(entity.x, entity.y, 80, 400, CONST.COLOR_INK);
                                this.vfx.floatingText(entity.x, entity.y - 35,
                                    'BONUS!', '#2c3e8c', { fontSize: 18, life: 1000 });
                            }
                        } else if (entity.type === 'player' || entity.type === 'bot') {
                            this.handleKill(killer, entity);
                        }
                    }
                }
            }
        }
    }

    // Body collision
    var all = this.getAllCombatants();
    for (var a = 0; a < all.length; a++) {
        for (var b2 = a + 1; b2 < all.length; b2++) {
            var ea = all[a];
            var eb = all[b2];
            var dx = eb.x - ea.x;
            var dy = eb.y - ea.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var md = ea.radius + eb.radius;

            if (dist < md && dist > 0) {
                var ov = (md - dist) / 2;
                var nx = dx / dist;
                var ny2 = dy / dist;
                ea.x -= nx * ov;
                ea.y -= ny2 * ov;
                eb.x += nx * ov;
                eb.y += ny2 * ov;

                // No body damage during pause
                if (!this.paused) {
                    var now = Utils.now();
                    // Only damage if not invuln and not sandbox invincible
                    if (now - ea.lastDamageTime > CONST.COLLISION_DAMAGE_COOLDOWN &&
                        ea.invulnTimer <= 0 && !ea._sandboxInvincible) {
                        ea.takeDamage(2, eb);
                        if (!ea.alive) this.handleKill(eb, ea);
                    }
                    if (now - eb.lastDamageTime > CONST.COLLISION_DAMAGE_COOLDOWN &&
                        eb.invulnTimer <= 0 && !eb._sandboxInvincible) {
                        eb.takeDamage(2, ea);
                        if (!eb.alive) this.handleKill(ea, eb);
                    }
                }
            }
        }
    }
};

Game.prototype.onPlayerDeath = function () {
    // Already handled — don't show twice
    if (this.playerDeathHandled) return;
    this.playerDeathHandled = true;

    var self = this;
    setTimeout(function () {
        // Double check player is still dead when timeout fires
        if (self.player && !self.player.alive) {
            self.ui.showGameOver(self.player);
        } else {
            // Player somehow revived, reset the flag
            self.playerDeathHandled = false;
        }
    }, 1200);
};

Game.prototype.respawnPlayer = function () {
    this.ui.hideGameOver();
    this.playerDeathHandled = false;
    this.player.respawn();

    if (this.player.routeLocked) {
        this.routePromptShown = true;
        this.player._routeSelecting = false;
        AbilityData.applyAbilitiesForLevel(this.player);
    } else {
        this.routePromptShown = false;
    }

    this.vfx.burst(this.player.x, this.player.y, 15, CONST.COLOR_INK, {
        speed: 4, life: 350, radius: 3
    });
    this.vfx.shockwave(this.player.x, this.player.y, 50, 250, CONST.COLOR_INK);
};

Game.prototype.render = function () {
    var ctx = this.ctx;
    
    var cam = this.camera;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = CONST.COLOR_BG;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    cam.applyTransform(ctx);
    var view = cam.getViewRect();

    // Grid
    var gs = CONST.GRID_SIZE;
    var sx = Math.floor(view.x1 / gs) * gs;
    var sy = Math.floor(view.y1 / gs) * gs;
    var ex = Math.ceil(view.x2 / gs) * gs;
    var ey = Math.ceil(view.y2 / gs) * gs;
    ctx.strokeStyle = CONST.COLOR_GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = sx; x <= ex; x += gs) {
        if (x >= 0 && x <= CONST.MAP_WIDTH) {
            ctx.moveTo(x, Math.max(0, view.y1));
            ctx.lineTo(x, Math.min(CONST.MAP_HEIGHT, view.y2));
        }
    }
    for (var y = sy; y <= ey; y += gs) {
        if (y >= 0 && y <= CONST.MAP_HEIGHT) {
            ctx.moveTo(Math.max(0, view.x1), y);
            ctx.lineTo(Math.min(CONST.MAP_WIDTH, view.x2), y);
        }
    }
    ctx.stroke();

    // Border
    ctx.strokeStyle = CONST.COLOR_INK;
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, CONST.MAP_WIDTH, CONST.MAP_HEIGHT);

    ctx.fillStyle = 'rgba(26,26,26,0.05)';
    ctx.fillRect(-1000, -1000, CONST.MAP_WIDTH + 2000, 1000);
    ctx.fillRect(-1000, CONST.MAP_HEIGHT, CONST.MAP_WIDTH + 2000, 1000);
    ctx.fillRect(-1000, 0, 1000, CONST.MAP_HEIGHT);
    ctx.fillRect(CONST.MAP_WIDTH, 0, 1000, CONST.MAP_HEIGHT);

    // Center zone
    ctx.strokeStyle = 'rgba(26,26,26,0.08)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(CONST.MAP_WIDTH / 2, CONST.MAP_HEIGHT / 2, CONST.BIG_PENTAGON_ZONE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Shapes
    for (var si = 0; si < this.shapes.length; si++) {
        var shape = this.shapes[si];
        if (shape.alive && cam.isVisible(shape.x, shape.y, shape.radius + 15)) {
            shape.render(ctx);
        }
    }

        // Bot speech bubbles
    this.botBubbles.render(ctx, cam);

    // Projectiles
    var pr = this.projectilePool.getActive();
    for (var pi = 0; pi < pr.length; pi++) {
        if (pr[pi].alive && cam.isVisible(pr[pi].x, pr[pi].y, pr[pi].radius + 15)) {
            pr[pi].render(ctx);
        }
    }

    // Ability entities
    for (var ai = 0; ai < this.abilityEntities.length; ai++) {
        var ae = this.abilityEntities[ai];
        if (ae.alive && ae.render) ae.render(ctx, cam);
    }

    // Bots
    for (var bi = 0; bi < this.bots.length; bi++) {
        var bot = this.bots[bi];
        if (bot.alive && cam.isVisible(bot.x, bot.y, bot.radius + 80)) {
            bot.render(ctx, cam);
        }
    }

    // Player
    if (this.player && this.player.alive) {
        this.player.render(ctx, cam);
    }

    // VFX
    this.vfx.render(ctx, cam);
    // Impact lines (world space, before camera reset)
    this.impactLines.render(ctx, cam);

    cam.resetTransform(ctx);
    this.vfx.renderScreenEffects(ctx, this.canvas.width, this.canvas.height);
        // Damage vignette
    this.damageVignette.render(ctx, this.canvas.width, this.canvas.height);

    // Map event banner
    this.mapEvents.render(ctx, this.canvas.width, this.canvas.height);

    // Combo counter
    this.combo.render(ctx, this.canvas.width, this.canvas.height);

    // Debug
    ctx.font = '11px "Patrick Hand", monospace';
    ctx.fillStyle = 'rgba(26,26,26,0.3)';
    ctx.textAlign = 'left';
    ctx.fillText('FPS: ' + this.fps, 10, this.canvas.height - 8);

    this.minimap.render();

        // Mobile joystick render
    if (this.mobile && this.mobile.active) {
        this.mobile.render();
    }
};
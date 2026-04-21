function MapEvents(game) {
    this.game = game;
    this.currentEvent = null;
    this.eventTimer = 0;
    this.nextEventIn = 90000 + Math.random() * 60000; // 90-150s first event
    this.eventDuration = 0;
    this.bannerTimer = 0;
    this.bannerText = '';
    this.bannerSubtext = '';

    this.events = [
        {
            id: 'shape_storm',
            name: 'SHAPE STORM',
            description: 'Triple shape spawns!',
            duration: 30000,
            color: '#c9a84c',
            onStart: function (game) {
                // Spawn tons of shapes immediately
                for (var i = 0; i < 100; i++) game.spawnShape();
            },
            onTick: function (game, dt) {
                // Keep spawning
                if (Math.random() < 0.1) game.spawnShape();
            },
            onEnd: function (game) {}
        },
        {
            id: 'blood_moon',
            name: 'BLOOD MOON',
            description: 'All damage doubled!',
            duration: 25000,
            color: '#922b21',
            _savedDamages: [],
            onStart: function (game) {
                this._savedDamages = [];
                var all = game.getAllCombatants();
                for (var i = 0; i < all.length; i++) {
                    this._savedDamages.push({ entity: all[i], dmg: all[i].projDamage });
                    all[i].projDamage *= 2;
                }
            },
            onTick: function (game, dt) {
                // Apply to new bots that spawned during event
            },
            onEnd: function (game) {
                for (var i = 0; i < this._savedDamages.length; i++) {
                    var s = this._savedDamages[i];
                    if (s.entity.alive) {
                        s.entity.projDamage = s.dmg;
                        s.entity.upgradeSystem._applyToOwner();
                    }
                }
                this._savedDamages = [];
            }
        },
        {
            id: 'sanctuary',
            name: 'SANCTUARY',
            description: 'No damage for 15 seconds — farm freely!',
            duration: 15000,
            color: '#27ae60',
            onStart: function (game) {
                var all = game.getAllCombatants();
                for (var i = 0; i < all.length; i++) {
                    all[i].invulnTimer = Math.max(all[i].invulnTimer, 15000);
                }
            },
            onTick: function (game, dt) {
                // Keep invuln refreshed for newcomers
                var all = game.getAllCombatants();
                for (var i = 0; i < all.length; i++) {
                    all[i].invulnTimer = Math.max(all[i].invulnTimer, 1000);
                }
            },
            onEnd: function (game) {
                var all = game.getAllCombatants();
                for (var i = 0; i < all.length; i++) {
                    all[i].invulnTimer = 0;
                }
            }
        },
        {
            id: 'boss_spawn',
            name: 'BOSS SPAWN',
            description: 'A massive shape appeared in the center!',
            duration: 60000,
            color: '#641e16',
            _boss: null,
            onStart: function (game) {
                // Create a mega shape
                var boss = new Shape();
                boss.shapeType = 'BOSS';
                boss.sides = 6;
                boss.radius = 70;
                boss.hp = 3000;
                boss.maxHp = 3000;
                boss.xpValue = 2000;
                boss.color = '#641e16';
                boss.strokeColor = '#1a1a1a';
                boss.rotSpeed = 0.002;
                boss.x = CONST.MAP_WIDTH / 2;
                boss.y = CONST.MAP_HEIGHT / 2;
                boss.rotation = 0;
                boss.alive = true;
                boss.isBig = true;
                boss.knockbackVx = 0;
                boss.knockbackVy = 0;
                game.shapes.push(boss);
                this._boss = boss;
            },
            onTick: function (game, dt) {
                if (this._boss && !this._boss.alive) {
                    // Boss was killed — announce it
                    game.vfx.floatingText(this._boss.x, this._boss.y - 40,
                        'BOSS DEFEATED!', '#c9a84c', { fontSize: 28, life: 2000 });
                    game.vfx.shockwave(this._boss.x, this._boss.y, 200, 800, CONST.COLOR_INK, 5);
                    this._boss = null;
                }
            },
            onEnd: function (game) {
                if (this._boss && this._boss.alive) {
                    this._boss.alive = false;
                    var idx = game.shapes.indexOf(this._boss);
                    if (idx !== -1) game.shapes.splice(idx, 1);
                }
                this._boss = null;
            }
        },
        {
            id: 'speed_surge',
            name: 'SPEED SURGE',
            description: 'Everyone moves 50% faster!',
            duration: 20000,
            color: '#5dade2',
            _saved: [],
            onStart: function (game) {
                this._saved = [];
                var all = game.getAllCombatants();
                for (var i = 0; i < all.length; i++) {
                    this._saved.push({ entity: all[i], spd: all[i].moveSpeed });
                    all[i].moveSpeed *= 1.5;
                }
            },
            onTick: function (game, dt) {},
            onEnd: function (game) {
                for (var i = 0; i < this._saved.length; i++) {
                    var s = this._saved[i];
                    if (s.entity.alive) {
                        s.entity.moveSpeed = s.spd;
                        s.entity.upgradeSystem._applyToOwner();
                    }
                }
                this._saved = [];
            }
        }
    ];
}

MapEvents.prototype.update = function (dt) {
    var game = this.game;

    // Banner fade
    if (this.bannerTimer > 0) this.bannerTimer -= dt;

    // Active event tick
    if (this.currentEvent) {
        this.eventDuration -= dt;
        this.currentEvent.onTick(game, dt);

        if (this.eventDuration <= 0) {
            this.currentEvent.onEnd(game);
            this.currentEvent = null;
            this.nextEventIn = 120000 + Math.random() * 60000;
        }
        return;
    }

    // Timer to next event
    this.nextEventIn -= dt;
    if (this.nextEventIn <= 0) {
        this.triggerRandomEvent();
    }
};

MapEvents.prototype.triggerRandomEvent = function () {
    var evt = this.events[Math.floor(Math.random() * this.events.length)];
    this.currentEvent = evt;
    this.eventDuration = evt.duration;
    this.bannerText = evt.name;
    this.bannerSubtext = evt.description;
    this.bannerTimer = 4000;

    evt.onStart(this.game);

    this.game.vfx.screenFlashEffect(CONST.COLOR_PAPER, 300, 0.2);
    this.game.camera.shake(4, 200);
};

MapEvents.prototype.render = function (ctx, canvasWidth, canvasHeight) {
    if (this.bannerTimer <= 0) return;

    var t = this.bannerTimer / 4000;
    var alpha = t > 0.8 ? (1 - t) / 0.2 : (t < 0.3 ? t / 0.3 : 1);

    ctx.globalAlpha = alpha * 0.95;

    // Banner background
    var bannerH = 80;
    var bannerY = canvasHeight / 2 - bannerH / 2 - 30;

    ctx.fillStyle = CONST.COLOR_PAPER;
    ctx.fillRect(0, bannerY, canvasWidth, bannerH);

    // Top and bottom ink lines
    ctx.strokeStyle = CONST.COLOR_INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, bannerY);
    ctx.lineTo(canvasWidth, bannerY);
    ctx.moveTo(0, bannerY + bannerH);
    ctx.lineTo(canvasWidth, bannerY + bannerH);
    ctx.stroke();

    // Speed lines behind text
    ctx.strokeStyle = 'rgba(26,26,26,0.06)';
    ctx.lineWidth = 1;
    for (var i = 0; i < 20; i++) {
        var ly = bannerY + Math.random() * bannerH;
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(canvasWidth, ly);
        ctx.stroke();
    }

    // Title
    ctx.font = '36px "Bangers", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = CONST.COLOR_PAPER;
    ctx.lineWidth = 4;
    ctx.strokeText(this.bannerText, canvasWidth / 2, bannerY + 30);
    ctx.fillStyle = this.currentEvent ? this.currentEvent.color : CONST.COLOR_INK;
    ctx.fillText(this.bannerText, canvasWidth / 2, bannerY + 30);

    // Subtitle
    ctx.font = '16px "Patrick Hand", cursive';
    ctx.fillStyle = CONST.COLOR_INK;
    ctx.strokeStyle = CONST.COLOR_PAPER;
    ctx.lineWidth = 3;
    ctx.strokeText(this.bannerSubtext, canvasWidth / 2, bannerY + 58);
    ctx.fillText(this.bannerSubtext, canvasWidth / 2, bannerY + 58);

    ctx.globalAlpha = 1;

    // Active event indicator (small bar at top)
    if (this.currentEvent && this.eventDuration > 0) {
        var pct = this.eventDuration / this.currentEvent.duration;
        var barW = 200;
        var barH = 6;
        var barX = canvasWidth / 2 - barW / 2;
        var barY2 = 55;

        ctx.fillStyle = CONST.COLOR_PAPER;
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 1;
        ctx.fillRect(barX, barY2, barW, barH);
        ctx.strokeRect(barX, barY2, barW, barH);
        ctx.fillStyle = this.currentEvent.color;
        ctx.fillRect(barX, barY2, barW * pct, barH);

        ctx.font = '11px "Patrick Hand", cursive';
        ctx.textAlign = 'center';
        ctx.fillStyle = CONST.COLOR_INK;
        ctx.fillText(this.currentEvent.name + ' — ' + Math.ceil(this.eventDuration / 1000) + 's', canvasWidth / 2, barY2 - 6);
    }
};
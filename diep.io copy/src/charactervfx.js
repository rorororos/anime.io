var CharacterVFX = {

    // Helper to spawn a particle that follows a path and fades
    _pathParticle: function (game, points, duration, opts) {
        var p = game.vfx.spawnParticle({
            x: points[0].x, y: points[0].y,
            maxLife: duration,
            vx: 0, vy: 0,
            radius: opts.radius || 3,
            endRadius: 0,
            color: opts.color,
            alpha: opts.alpha || 0.7
        });
        p._pathPoints = points;
        p._pathDuration = duration;
        p._pathStartTime = game.lastTime;
        p._origUpdate = p.update;
        p.update = function (dt) {
            var t = (game.lastTime - this._pathStartTime) / this._pathDuration;
            if (t >= 1) {
                this.alive = false;
                return;
            }
            var segment = Math.floor(t * (this._pathPoints.length - 1));
            var segmentT = (t * (this._pathPoints.length - 1)) - segment;
            var p1 = this._pathPoints[segment];
            var p2 = this._pathPoints[segment + 1];
            if (p1 && p2) {
                this.x = Utils.lerp(p1.x, p2.x, segmentT);
                this.y = Utils.lerp(p1.y, p2.y, segmentT);
            }
            this.alpha = (1 - t) * (opts.alpha || 0.7);
            this.radius = Utils.lerp(opts.radius || 3, 0, t);
        };
    },

    // =============================================================
    // JOJO'S BIZARRE ADVENTURE
    // =============================================================

    jotaroOraBarrage: function (game, owner, targetPos) {
        var numFists = 12;
        var radius = 70;
        var duration = 720; // 12 fists * 60ms

        for (var i = 0; i < numFists; i++) {
            (function (index) {
                setTimeout(function () {
                    if (!owner.alive) return;

                    var angleOffset = (Math.random() - 0.5) * 0.8;
                    var distOffset = Math.random() * radius;
                    var angle = owner.angle + angleOffset;

                    var hx = targetPos.x + Math.cos(angle) * distOffset;
                    var hy = targetPos.y + Math.sin(angle) * distOffset;

                    // Fist impact
                    SlashVFX.createSlash(game, hx, hy, angle, {
                        length: 40, width: 25, color: '#2c3e8c', duration: 150, curve: 0, fadeStyle: 'flash'
                    });

                    // Damage and particles
                    game.applyAOE(hx, hy, 35, owner.projDamage * 0.7, owner.id, '#2c3e8c');
                    game.vfx.burst(hx, hy, 3, '#6c7eb7', { speed: 3, life: 150, radius: 2 });
                    game.vfx.floatingText(
                        hx, hy - 10,
                        'ORA!', '#2c3e8c', { fontSize: 10 + Math.random() * 8, life: 300 }
                    );

                }, index * 60);
            })(i);
        }
    },

    // =============================================================
    // NARUTO
    // =============================================================

    narutoShadowClones: function (game, owner) {
        for (var i = -1; i <= 1; i++) {
            var angle = owner.angle + i * 0.25;

            // Spawn a temporary clone entity that looks like Naruto
            var clone = {
                x: owner.x + Math.cos(angle) * 30,
                y: owner.y + Math.sin(angle) * 30,
                angle: angle,
                vx: Math.cos(angle) * 8,
                vy: Math.sin(angle) * 8,
                radius: owner.radius,
                alive: true,
                life: 0,
                duration: 1200,
                ownerId: owner.id,
                color: owner.color,
                barrelColor: owner.barrelColor,
                outlineColor: owner.outlineColor,

                update: function (dt) {
                    this.life += dt;
                    if (this.life > this.duration) { this.alive = false; return; }
                    this.x += this.vx;
                    this.y += this.vy;
                    // Poof effect when expiring
                    if (!this.alive) {
                        game.vfx.burst(this.x, this.y, 10, '#ffffff', { speed: 2, life: 250 });
                        game.vfx.burst(this.x, this.y, 5, '#d35400', { speed: 1.5, life: 200 });
                    }
                },
                render: function (ctx, camera) {
                    if (!this.alive || !camera.isVisible(this.x, this.y, this.radius + 10)) return;
                    var t = this.life / this.duration;
                    ctx.globalAlpha = 1 - t;
                    // Simplified render of player
                    ctx.fillStyle = this.color;
                    ctx.strokeStyle = this.outlineColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            };
            game.abilityEntities.push(clone);
        }
    },

    // =============================================================
    // DRAGON BALL
    // =============================================================

    gokuInstantTransmission: function (game, owner) {
        var startX = owner.x;
        var startY = owner.y;

        // Find a target or a distant point
        var enemies = game.getEnemiesInRadius(owner.x, owner.y, 600, owner.id);
        var targetX, targetY;
        if (enemies.length > 0) {
            var target = enemies[0];
            var behindAngle = Utils.angleBetween(owner.x, owner.y, target.x, target.y);
            targetX = target.x + Math.cos(behindAngle + Math.PI) * 80;
            targetY = target.y + Math.sin(behindAngle + Math.PI) * 80;
        } else {
            targetX = owner.x + Math.cos(owner.angle) * 350;
            targetY = owner.y + Math.sin(owner.angle) * 350;
        }

        // Teleport effect
        game.vfx.burst(startX, startY, 15, '#c9a84c', { speed: 5, life: 200 });
        game.vfx.ring(startX, startY, 1, '#ffffff', { speed: 0, radius: owner.radius, endRadius: 0, life: 100, alpha: 1 });
        owner.x = targetX;
        owner.y = targetY;
        owner.clampToMap();
        game.vfx.burst(owner.x, owner.y, 15, '#c9a84c', { speed: 5, life: 200 });
        game.vfx.ring(owner.x, owner.y, 1, '#ffffff', { speed: 0, radius: 0, endRadius: owner.radius + 10, life: 150, alpha: 1 });
    },

    // =============================================================
    // MY HERO ACADEMIA
    // =============================================================

    dekuFullCowl: function (game, owner, duration) {
        var intervalId = setInterval(function () {
            if (!owner.alive) { clearInterval(intervalId); return; }
            var points = [];
            var numPoints = 8;
            for (var i = 0; i < numPoints + 1; i++) {
                var angle = (Math.PI * 2 / numPoints) * i;
                var randDist = owner.radius + Math.random() * 20;
                points.push({
                    x: owner.x + Math.cos(angle) * randDist,
                    y: owner.y + Math.sin(angle) * randDist
                });
            }
            // Create a path particle for the lightning effect
            CharacterVFX._pathParticle(game, points, 300, { radius: 2.5, color: '#82e0aa', alpha: 0.8 });
        }, 120);

        setTimeout(function () { clearInterval(intervalId); }, duration);
    },

    // =============================================================
    // BLEACH
    // =============================================================

    byakuyaPetalStorm: function (game, owner) {
        var duration = 4000;
        var intervalId = setInterval(function () {
            if (!owner.alive) { clearInterval(intervalId); return; }
            var radius = 130;
            game.applyAOE(owner.x, owner.y, radius, owner.projDamage * 0.5, owner.id, '#7d3c98');

            // Spawn petal particles
            for (var i = 0; i < 5; i++) {
                var angle = Math.random() * Math.PI * 2;
                var dist = Math.random() * radius;
                game.vfx.spawnParticle({
                    x: owner.x + Math.cos(angle) * dist,
                    y: owner.y + Math.sin(angle) * dist,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    radius: 3 + Math.random() * 2,
                    endRadius: 0,
                    color: '#d2b4de',
                    maxLife: 500,
                    shape: 'square',
                    rotationSpeed: 0.1
                });
            }
        }, 200);

        setTimeout(function () { clearInterval(intervalId); }, duration);
    },

};
var AbilityData = {
    registry: {},

    init: function () {
        this._registerAll();
    },

    applyAbilitiesForLevel: function (entity) {
        if (!entity.characterId) return;
        var charAb = this.registry[entity.characterId];
        if (!charAb) return;
        entity.abilitySystem.clear();
        for (var i = 0; i < charAb.length; i++) {
            if (entity.level >= charAb[i].level) {
                entity.abilitySystem.addAbility(charAb[i].abilityDef);
            }
        }
    },

    checkNewAbility: function (entity, game) {
        if (!entity.characterId) return;
        var charAb = this.registry[entity.characterId];
        if (!charAb) return;
        for (var i = 0; i < charAb.length; i++) {
            if (entity.level === charAb[i].level) {
                entity.abilitySystem.addAbility(charAb[i].abilityDef);
                game.vfx.floatingText(
                    entity.x, entity.y - 50,
                    'NEW: ' + charAb[i].abilityDef.name + '!',
                    entity.characterData ? entity.characterData.color : '#1a1a1a',
                    { fontSize: 18, life: 1500 }
                );
                game.vfx.ring(entity.x, entity.y, 14, CONST.COLOR_INK, { speed: 4, radius: 3, life: 400 });
            }
        }
    },

    _aimedAOE: function (owner, game, range, radius, damage, color) {
        var hx = owner.x + Math.cos(owner.angle) * range;
        var hy = owner.y + Math.sin(owner.angle) * range;
        game.applyAOE(hx, hy, radius, damage, owner.id, color);
        game.vfx.shockwave(hx, hy, radius, 300, CONST.COLOR_INK);
        game.vfx.burst(hx, hy, 12, color, { speed: 4, life: 300, radius: 3 });
    },

    _dash: function (owner, game, dist, color, dmgPerStep) {
        var sx = owner.x, sy = owner.y;
        owner.x += Math.cos(owner.angle) * dist;
        owner.y += Math.sin(owner.angle) * dist;
        owner.clampToMap();
        game.vfx.beamFlash(sx, sy, owner.x, owner.y, color, 4, 250);
        for (var i = 0; i < 5; i++) {
            var t = i / 5;
            var px = Utils.lerp(sx, owner.x, t);
            var py = Utils.lerp(sy, owner.y, t);
            game.vfx.afterimage(px, py, owner.radius, color, owner.angle);
            if (dmgPerStep > 0) {
                game.applyAOE(px, py, 35, dmgPerStep, owner.id, color);
            }
        }
    },

    _buff: function (owner, game, props, duration, color, label) {
        var saved = {};
        for (var k in props) {
            if (props.hasOwnProperty(k)) {
                saved[k] = owner[k];
                if (typeof props[k] === 'function') {
                    owner[k] = props[k](owner[k]);
                } else {
                    owner[k] = props[k];
                }
            }
        }
        if (color) game.vfx.aura(owner, color, owner.radius + 22, duration);
        if (label) game.vfx.floatingText(owner.x, owner.y - 50, label, color || '#1a1a1a', { fontSize: 18, life: 1000 });
        var buffOwner = owner;
        setTimeout(function () {
            if (!buffOwner.alive) return;
            for (var k2 in saved) {
                if (saved.hasOwnProperty(k2)) {
                    buffOwner[k2] = saved[k2];
                }
            }
            buffOwner.upgradeSystem._applyToOwner();
        }, duration);
    },

    _bigProj: function (owner, game, opts) {
        var proj = game.projectilePool.get();
        proj.init({
            x: owner.x + Math.cos(owner.angle) * 35,
            y: owner.y + Math.sin(owner.angle) * 35,
            vx: Math.cos(owner.angle) * (opts.speed || 10),
            vy: Math.sin(owner.angle) * (opts.speed || 10),
            radius: opts.radius || 14,
            damage: opts.damage || owner.projDamage * 3,
            penetration: opts.pen || 3,
            ownerId: owner.id,
            ownerType: owner.type,
            color: opts.color || '#1a1a1a',
            glowColor: 'rgba(0,0,0,0)',
            lifetime: opts.lifetime || 2000
        });
        return proj;
    },

    _beam: function (owner, game, range, width, damage, color, steps) {
        var ex = owner.x + Math.cos(owner.angle) * range;
        var ey = owner.y + Math.sin(owner.angle) * range;
        game.vfx.beamFlash(owner.x, owner.y, ex, ey, color, width, 400);
        steps = steps || 8;
        var dmgPer = damage / steps;
        for (var i = 0; i < steps; i++) {
            var t = (i + 1) / steps;
            game.applyAOE(
                Utils.lerp(owner.x, ex, t),
                Utils.lerp(owner.y, ey, t),
                30, dmgPer, owner.id, color
            );
        }
        game.vfx.burst(ex, ey, 12, color, { speed: 4, life: 300, radius: 3 });
    },

    _shield: function (owner, game, reduction, duration, color, label) {
        // Use the flag-based shield system instead of overriding takeDamage
        if (owner._shieldActive) return;
        owner._shieldActive = true;
        owner._shieldReduction = reduction;

        game.vfx.aura(owner, color, owner.radius + 18, duration);
        if (label) game.vfx.floatingText(owner.x, owner.y - 50, label, color, { fontSize: 18 });

        var shieldOwner = owner;
        setTimeout(function () {
            shieldOwner._shieldActive = false;
            shieldOwner._shieldReduction = 1;
        }, duration);
    },

    _registerAll: function () {
        var allChars = [
            'luffy', 'zoro', 'sanji', 'ace',
            'jotaro', 'dio', 'giorno',
            'gojo', 'yuji', 'megumi', 'sukuna',
            'naruto', 'sasuke', 'kakashi', 'madara',
            'deku', 'bakugo', 'todoroki',
            'goku', 'vegeta', 'gohan', 'frieza',
            'ichigo', 'byakuya', 'aizen'
        ];
        for (var i = 0; i < allChars.length; i++) {
            var cid = allChars[i];
            var configs = this._getCharConfig(cid);
            var levels = [15, 20, 25, 30, 35, 40];
            var entries = [];
            for (var j = 0; j < configs.length && j < 6; j++) {
                entries.push({
                    level: levels[j],
                    abilityDef: {
                        id: configs[j].id,
                        name: configs[j].name,
                        key: String(j + 1),
                        icon: configs[j].icon,
                        cooldown: configs[j].cd,
                        execute: configs[j].fn
                    }
                });
            }
            this.registry[cid] = entries;
        }
    },

    _getCharConfig: function (cid) {
        var self = this;

        var all = {

            // =============================================================
            // ONE PIECE — LUFFY
            // =============================================================
            luffy: [
                { id: 'gum_pistol', name: 'Gum-Gum Pistol', icon: 'fist', cd: 3000, fn: function (o, g) {
                    // Stretching fist beam with rubber stretch particles
                    var ex = o.x + Math.cos(o.angle) * 350;
                    var ey = o.y + Math.sin(o.angle) * 350;
                    g.vfx.beamFlash(o.x, o.y, ex, ey, '#c0392b', 8, 300);
                    // Rubber stretch wobble particles along arm
                    for (var i = 0; i < 6; i++) {
                        var t = (i + 1) / 7;
                        var px = Utils.lerp(o.x, ex, t);
                        var py = Utils.lerp(o.y, ey, t);
                        g.vfx.spawnParticle({ x: px + (Math.random() - 0.5) * 15, y: py + (Math.random() - 0.5) * 15, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, radius: 3, endRadius: 0, color: '#c9a84c', maxLife: 200, friction: 0.95 });
                    }
                    // Impact fist at end
                    g.vfx.burst(ex, ey, 15, '#c0392b', { speed: 5, life: 250, radius: 4 });
                    g.vfx.shockwave(ex, ey, 50, 250, CONST.COLOR_INK);
                    self._beam(o, g, 350, 8, o.projDamage * 2.5, '#c0392b', 8);
                    g.vfx.floatingText(o.x, o.y - 50, 'PISTOL!', '#c0392b', { fontSize: 16 });
                }},
                { id: 'gatling', name: 'Gum-Gum Gatling', icon: 'rapid', cd: 8000, fn: function (o, g) {
                    // Multiple fist impacts with rubber lines
                    for (var i = 0; i < 8; i++) {
                        (function (idx) {
                            setTimeout(function () {
                                if (!o.alive) return;
                                var a = o.angle + (Math.random() - 0.5) * 0.6;
                                var dist = 120 + Math.random() * 80;
                                var hx = o.x + Math.cos(a) * dist;
                                var hy = o.y + Math.sin(a) * dist;
                                g.vfx.beamFlash(o.x, o.y, hx, hy, '#c0392b', 4, 120);
                                g.vfx.burst(hx, hy, 5, '#c9a84c', { speed: 3, life: 150, radius: 2 });
                                g.applyAOE(hx, hy, 35, o.projDamage * 1.2, o.id, '#c0392b');
                            }, idx * 90);
                        })(i);
                    }
                    g.vfx.floatingText(o.x, o.y - 50, 'GATLING!', '#c0392b', { fontSize: 16 });
                }},
                { id: 'gear2', name: 'Gear Second', icon: 'speed', cd: 20000, fn: function (o, g) {
                    self._buff(o, g, {
                        moveSpeed: function (v) { return v * 1.6; },
                        projDamage: function (v) { return v * 1.5; },
                        reloadTime: function (v) { return v * 0.5; }
                    }, 5000, '#c0392b', 'GEAR SECOND!');
                    // Steam particles during buff
                    var steamOwner = o;
                    var steamIv = setInterval(function () {
                        if (!steamOwner.alive) { clearInterval(steamIv); return; }
                        for (var i = 0; i < 2; i++) {
                            g.vfx.spawnParticle({ x: steamOwner.x + (Math.random() - 0.5) * 25, y: steamOwner.y + (Math.random() - 0.5) * 25, vx: (Math.random() - 0.5), vy: -1.5 - Math.random(), radius: 3 + Math.random() * 2, endRadius: 0, color: '#c0392b', maxLife: 300, alpha: 0.3, friction: 0.97 });
                        }
                    }, 100);
                    setTimeout(function () { clearInterval(steamIv); }, 5000);
                }},
                { id: 'bazooka', name: 'Gum-Gum Bazooka', icon: 'impact', cd: 10000, fn: function (o, g) {
                    var hx = o.x + Math.cos(o.angle) * 200;
                    var hy = o.y + Math.sin(o.angle) * 200;
                    // Double palm strike beam
                    g.vfx.beamFlash(o.x, o.y, hx, hy, '#c9a84c', 14, 250);
                    g.vfx.shockwave(hx, hy, 100, 400, CONST.COLOR_INK, 4);
                    g.vfx.burst(hx, hy, 25, '#c9a84c', { speed: 6, life: 400, radius: 5 });
                    // Knockback enemies
                    var en = g.getEnemiesInRadius(hx, hy, 80, o.id);
                    for (var i = 0; i < en.length; i++) {
                        var kb = Utils.angleBetween(o.x, o.y, en[i].x, en[i].y);
                        en[i].vx += Math.cos(kb) * 12;
                        en[i].vy += Math.sin(kb) * 12;
                        en[i].takeDamage(o.projDamage * 4, o);
                        if (!en[i].alive) g.handleKill(o, en[i]);
                    }
                    g.camera.shake(4, 150);
                    g.vfx.floatingText(o.x, o.y - 50, 'BAZOOKA!', '#c9a84c', { fontSize: 20 });
                }},
                { id: 'haki', name: 'Armament Haki', icon: 'shield', cd: 25000, fn: function (o, g) {
                    self._shield(o, g, 0.4, 6000, '#1a1a1a', 'HAKI!');
                    // Dark coating particles
                    var hakiOwner = o;
                    var hakiIv = setInterval(function () {
                        if (!hakiOwner.alive) { clearInterval(hakiIv); return; }
                        g.vfx.spawnParticle({ x: hakiOwner.x + (Math.random() - 0.5) * hakiOwner.radius * 2, y: hakiOwner.y + (Math.random() - 0.5) * hakiOwner.radius * 2, vx: 0, vy: -0.4, radius: 2, endRadius: 0, color: '#1a1a1a', maxLife: 250, alpha: 0.35, friction: 0.99 });
                    }, 80);
                    setTimeout(function () { clearInterval(hakiIv); }, 6000);
                }},
                { id: 'gear3', name: 'Gear Third', icon: 'explosion', cd: 30000, fn: function (o, g) {
                    var hx = o.x + Math.cos(o.angle) * 250;
                    var hy = o.y + Math.sin(o.angle) * 250;
                    // Giant fist expanding circle
                    g.vfx.shockwave(hx, hy, 180, 600, CONST.COLOR_INK, 5);
                    g.vfx.shockwave(hx, hy, 120, 400, CONST.COLOR_INK, 3);
                    g.vfx.burst(hx, hy, 40, '#c0392b', { speed: 7, life: 600, radius: 6 });
                    g.vfx.spiralBurst(hx, hy, 16, '#c9a84c', { speed: 5, life: 500 });
                    g.vfx.screenFlashEffect('#f5f0e8', 200, 0.2);
                    g.camera.shake(5, 200);
                    g.applyAOE(hx, hy, 150, o.projDamage * 7, o.id, '#c0392b');
                    g.vfx.floatingText(o.x, o.y - 60, 'GEAR THIRD!', '#c0392b', { fontSize: 24, life: 1500 });
                }}
            ],

            // =============================================================
            // ONE PIECE — ZORO (with SlashVFX)
            // =============================================================
            zoro: [
                { id: 'oni', name: 'Oni Giri', icon: 'multi_slash', cd: 4000, fn: function (o, g) {
                    var tx = o.x + Math.cos(o.angle) * 60;
                    var ty = o.y + Math.sin(o.angle) * 60;
                    if (typeof SlashVFX !== 'undefined') {
                        SlashVFX.createSlashFan(g, tx, ty, o.angle, 3, { length: 100, width: 20, color: '#27ae60', duration: 300 });
                        SlashVFX.slashParticles(g, o.x, o.y, o.angle, 180, '#27ae60');
                    }
                    self._beam(o, g, 180, 6, o.projDamage * 2.8, '#27ae60', 6);
                }},
                { id: 'tatsumaki', name: 'Tatsumaki', icon: 'tornado', cd: 9000, fn: function (o, g) {
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlashRing(g, o.x, o.y, 6, { length: 80, width: 18, color: '#27ae60', duration: 350 });
                    g.applyAOE(o.x, o.y, 130, o.projDamage * 2, o.id, '#27ae60');
                    g.vfx.ring(o.x, o.y, 20, '#27ae60', { speed: 5, radius: 3, life: 400 });
                    g.vfx.shockwave(o.x, o.y, 130, 400, CONST.COLOR_INK);
                    g.vfx.floatingText(o.x, o.y - 50, 'TATSUMAKI!', '#27ae60', { fontSize: 16 });
                }},
                { id: 'shishi', name: 'Shishi Sonson', icon: 'dash', cd: 12000, fn: function (o, g) {
                    var sx = o.x, sy = o.y;
                    self._dash(o, g, 300, '#27ae60', o.projDamage * 0.7);
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, (sx + o.x) / 2, (sy + o.y) / 2, o.angle, { length: 200, width: 25, color: '#27ae60', curve: 0.2, duration: 350, fadeStyle: 'linger' });
                    g.vfx.floatingText(o.x, o.y - 50, 'SHISHI SONSON!', '#27ae60', { fontSize: 16 });
                }},
                { id: 'santoryu', name: 'Santoryu Ogi', icon: 'wave', cd: 15000, fn: function (o, g) {
                    for (var i = 0; i < 3; i++) self._bigProj(o, g, { speed: 12, radius: 12, damage: o.projDamage * 3, pen: 5, color: '#27ae60', lifetime: 1500 });
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlashFan(g, o.x, o.y, o.angle, 3, { length: 80, width: 15, color: '#27ae60' });
                    g.vfx.floatingText(o.x, o.y - 50, 'SANTORYU!', '#27ae60', { fontSize: 16 });
                }},
                { id: 'asura', name: 'Asura', icon: 'aura', cd: 25000, fn: function (o, g) {
                    self._buff(o, g, { projDamage: function (v) { return v * 3; }, moveSpeed: function (v) { return v * 1.4; } }, 4000, '#27ae60', 'ASURA!');
                    // Nine sword mirage
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlashRing(g, o.x, o.y, 9, { length: 50, width: 10, color: '#27ae60', duration: 500, fadeStyle: 'linger' });
                }},
                { id: 'sanzen', name: 'Sanzen Sekai', icon: 'star', cd: 35000, fn: function (o, g) {
                    var tx = o.x + Math.cos(o.angle) * 200;
                    var ty = o.y + Math.sin(o.angle) * 200;
                    if (typeof SlashVFX !== 'undefined') {
                        SlashVFX.createCrossSlash(g, tx, ty, o.angle, { length: 200, width: 35, color: '#27ae60', duration: 500, fadeStyle: 'linger' });
                        SlashVFX.createSlashFan(g, tx, ty, o.angle + Math.PI / 4, 3, { length: 150, width: 20, color: '#82e0aa', duration: 400, delay: 100 });
                        SlashVFX.slashParticles(g, o.x, o.y, o.angle, 500, '#27ae60');
                    }
                    self._beam(o, g, 500, 18, o.projDamage * 8, '#27ae60', 10);
                    g.vfx.screenFlashEffect('#f5f0e8', 200, 0.2);
                    g.camera.shake(5, 200);
                    g.vfx.floatingText(o.x, o.y - 60, 'SANZEN SEKAI!', '#27ae60', { fontSize: 24, life: 1500 });
                }}
            ],

            // =============================================================
            // ONE PIECE — SANJI
            // =============================================================
            sanji: [
                { id: 'collier', name: 'Collier Strike', icon: 'fist', cd: 3500, fn: function (o, g) {
                    // Kick arc VFX
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * 70, o.y + Math.sin(o.angle) * 70, o.angle + 0.3, { length: 70, width: 18, color: '#d4a843', duration: 200, curve: 0.6 });
                    self._aimedAOE(o, g, 120, 50, o.projDamage * 2.5, '#d4a843');
                }},
                { id: 'party', name: 'Party Table Kick', icon: 'tornado', cd: 7000, fn: function (o, g) {
                    // Spinning kick ring
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlashRing(g, o.x, o.y, 5, { length: 60, width: 14, color: '#d4a843', duration: 300, curve: 0.8 });
                    g.applyAOE(o.x, o.y, 110, o.projDamage * 2, o.id, '#d4a843');
                    g.vfx.ring(o.x, o.y, 16, '#d4a843', { speed: 5, radius: 3, life: 400 });
                    g.vfx.floatingText(o.x, o.y - 50, 'PARTY TABLE!', '#d4a843', { fontSize: 16 });
                }},
                { id: 'diable', name: 'Diable Jambe', icon: 'flame', cd: 18000, fn: function (o, g) {
                    self._buff(o, g, { projDamage: function (v) { return v * 1.8; } }, 6000, '#d35400', 'DIABLE JAMBE!');
                    // Fire leg particles
                    var djOwner = o;
                    var djIv = setInterval(function () {
                        if (!djOwner.alive) { clearInterval(djIv); return; }
                        for (var i = 0; i < 2; i++) {
                            g.vfx.spawnParticle({ x: djOwner.x + (Math.random() - 0.5) * 15, y: djOwner.y + djOwner.radius * 0.5, vx: (Math.random() - 0.5), vy: -1.5 - Math.random(), radius: 3 + Math.random() * 2, endRadius: 0, color: '#d35400', maxLife: 250, alpha: 0.5, friction: 0.97, startColor: { r: 211, g: 84, b: 0 }, endColor: { r: 192, g: 57, b: 43 } });
                        }
                    }, 80);
                    setTimeout(function () { clearInterval(djIv); }, 6000);
                }},
                { id: 'flambage', name: 'Flambage Shot', icon: 'beam', cd: 10000, fn: function (o, g) {
                    self._bigProj(o, g, { speed: 14, radius: 15, damage: o.projDamage * 4, pen: 3, color: '#d35400', lifetime: 1800 });
                    // Fire trail burst
                    g.vfx.directionalBurst(o.x, o.y, o.angle, 0.4, 10, '#d35400', { speed: 4, life: 300 });
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * 30, o.y + Math.sin(o.angle) * 30, o.angle, { length: 60, width: 12, color: '#d35400', duration: 200, curve: 0.3 });
                }},
                { id: 'skywalk', name: 'Sky Walk', icon: 'cloud', cd: 12000, fn: function (o, g) {
                    self._dash(o, g, 350, '#d35400', o.projDamage * 0.5);
                    g.vfx.floatingText(o.x, o.y - 50, 'SKY WALK!', '#d35400', { fontSize: 16 });
                }},
                { id: 'ifrit', name: 'Ifrit Jambe', icon: 'explosion', cd: 30000, fn: function (o, g) {
                    // Massive fire kick explosion
                    g.vfx.shockwave(o.x, o.y, 200, 500, CONST.COLOR_INK, 4);
                    g.vfx.shockwave(o.x, o.y, 140, 350, CONST.COLOR_INK, 3);
                    g.vfx.burst(o.x, o.y, 35, '#d35400', { speed: 7, life: 500, radius: 5 });
                    g.vfx.spiralBurst(o.x, o.y, 16, '#c9a84c', { speed: 5, life: 400 });
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlashRing(g, o.x, o.y, 6, { length: 100, width: 20, color: '#d35400', duration: 400, curve: 0.7 });
                    g.applyAOE(o.x, o.y, 180, o.projDamage * 6, o.id, '#d35400');
                    g.vfx.screenFlashEffect('#f5f0e8', 200, 0.2);
                    g.vfx.floatingText(o.x, o.y - 60, 'IFRIT JAMBE!', '#d35400', { fontSize: 24, life: 1500 });
                }}
            ],

            // =============================================================
            // ONE PIECE — ACE
            // =============================================================
            ace: [
                { id: 'hiken', name: 'Hiken', icon: 'flame', cd: 4000, fn: function (o, g) {
                    self._bigProj(o, g, { speed: 11, radius: 14, damage: o.projDamage * 2.5, pen: 4, color: '#d35400', lifetime: 2000 });
                    // Fire burst at launch
                    g.vfx.directionalBurst(o.x, o.y, o.angle, 0.6, 12, '#d35400', { speed: 4, life: 300 });
                    g.vfx.floatingText(o.x, o.y - 40, 'HIKEN!', '#d35400', { fontSize: 16 });
                }},
                { id: 'hotarubi', name: 'Hotarubi', icon: 'star', cd: 8000, fn: function (o, g) {
                    // Floating firefly orbs
                    for (var i = 0; i < 6; i++) {
                        (function (idx) {
                            var a = (Math.PI * 2 / 6) * idx;
                            var sp = 4 + Math.random() * 3;
                            var p = self._bigProj(o, g, { speed: sp, radius: 6, damage: o.projDamage * 1.5, pen: 1, color: '#d35400', lifetime: 1500 });
                            // Override angle for spread
                            p.vx = Math.cos(o.angle + (idx - 2.5) * 0.2) * sp;
                            p.vy = Math.sin(o.angle + (idx - 2.5) * 0.2) * sp;
                        })(i);
                    }
                    g.vfx.ring(o.x, o.y, 6, '#d35400', { speed: 2, radius: 3, life: 300 });
                }},
                { id: 'flame_body', name: 'Flame Body', icon: 'aura', cd: 20000, fn: function (o, g) {
                    o.invulnTimer = Math.max(o.invulnTimer, 3000);
                    g.vfx.aura(o, '#d35400', o.radius + 25, 3000);
                    g.vfx.ring(o.x, o.y, 12, '#d35400', { speed: 4, radius: 3, life: 400 });
                    g.vfx.floatingText(o.x, o.y - 50, 'FLAME BODY!', '#d35400', { fontSize: 18 });
                    // Burn aura
                    var fbOwner = o;
                    var fbIv = setInterval(function () {
                        if (!fbOwner.alive) { clearInterval(fbIv); return; }
                        g.applyAOE(fbOwner.x, fbOwner.y, 80, fbOwner.projDamage * 0.3, fbOwner.id, '#d35400');
                        g.vfx.ring(fbOwner.x, fbOwner.y, 6, '#d35400', { speed: 3, radius: 2, life: 200 });
                    }, 500);
                    setTimeout(function () { clearInterval(fbIv); }, 3000);
                }},
                { id: 'enjomo', name: 'Enjomo', icon: 'shield', cd: 14000, fn: function (o, g) {
                    self._aimedAOE(o, g, 150, 80, o.projDamage * 3, '#d35400');
                    // Fire wall particles
                    var hx = o.x + Math.cos(o.angle) * 150;
                    var hy = o.y + Math.sin(o.angle) * 150;
                    for (var i = 0; i < 10; i++) {
                        g.vfx.spawnParticle({ x: hx + (Math.random() - 0.5) * 60, y: hy + (Math.random() - 0.5) * 60, vx: 0, vy: -2 - Math.random(), radius: 4, endRadius: 0, color: '#d35400', maxLife: 400, alpha: 0.5, friction: 0.97 });
                    }
                }},
                { id: 'entei', name: 'Dai Enkai: Entei', icon: 'meteor', cd: 22000, fn: function (o, g) {
                    self._bigProj(o, g, { speed: 7, radius: 25, damage: o.projDamage * 5, pen: 1, color: '#d35400', lifetime: 3000 });
                    g.vfx.chargeGlow(o.x + Math.cos(o.angle) * 40, o.y + Math.sin(o.angle) * 40, 30, 400, '#d35400');
                    g.vfx.floatingText(o.x, o.y - 50, 'ENTEI!', '#d35400', { fontSize: 20 });
                }},
                { id: 'emperor', name: 'Flame Emperor', icon: 'crown', cd: 35000, fn: function (o, g) {
                    var hx = o.x + Math.cos(o.angle) * 200;
                    var hy = o.y + Math.sin(o.angle) * 200;
                    g.vfx.shockwave(hx, hy, 200, 600, CONST.COLOR_INK, 5);
                    g.vfx.burst(hx, hy, 40, '#d35400', { speed: 8, life: 600, radius: 6 });
                    g.vfx.spiralBurst(hx, hy, 20, '#c9a84c', { speed: 6, life: 500 });
                    g.applyAOE(hx, hy, 200, o.projDamage * 8, o.id, '#d35400');
                    g.vfx.screenFlashEffect('#f5f0e8', 300, 0.2);
                    g.camera.shake(5, 200);
                    g.vfx.floatingText(o.x, o.y - 60, 'FLAME EMPEROR!', '#d35400', { fontSize: 24, life: 1500 });
                }}
            ],

            // =============================================================
            // JOJO — JOTARO (with fist VFX)
            // =============================================================
            jotaro: [
                { id: 'ora_rush', name: 'ORA Rush', icon: 'rapid', cd: 3500, fn: function (o, g) {
                    for (var i = 0; i < 6; i++) {
                        (function (idx) {
                            setTimeout(function () {
                                if (!o.alive) return;
                                var a = o.angle + (Math.random() - 0.5) * 0.4;
                                var hx = o.x + Math.cos(a) * (120 + Math.random() * 40);
                                var hy = o.y + Math.sin(a) * (120 + Math.random() * 40);
                                // Fist slash mark
                                if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, hx, hy, a + (Math.random() - 0.5) * 0.5, { length: 30, width: 18, color: '#2c3e8c', duration: 120, curve: 0, fadeStyle: 'flash' });
                                g.applyAOE(hx, hy, 35, o.projDamage * 0.8, o.id, '#2c3e8c');
                                g.vfx.floatingText(hx, hy - 10, 'ORA!', '#2c3e8c', { fontSize: 10 + Math.random() * 8, life: 300 });
                            }, idx * 80);
                        })(i);
                    }
                }},
                { id: 'star_finger', name: 'Star Finger', icon: 'beam', cd: 7000, fn: function (o, g) {
                    self._beam(o, g, 400, 6, o.projDamage * 3, '#2c3e8c', 8);
                    g.vfx.floatingText(o.x, o.y - 50, 'STAR FINGER!', '#2c3e8c', { fontSize: 16 });
                }},
                { id: 'sp_guard', name: 'Star Platinum Guard', icon: 'shield', cd: 18000, fn: function (o, g) {
                    self._shield(o, g, 0.3, 4000, '#2c3e8c', 'STAR PLATINUM!');
                }},
                { id: 'ora_barrage', name: 'ORA ORA Barrage', icon: 'impact', cd: 12000, fn: function (o, g) {
                    // Massive fist barrage with impact marks
                    var hx = o.x + Math.cos(o.angle) * 120;
                    var hy = o.y + Math.sin(o.angle) * 120;
                    for (var i = 0; i < 14; i++) {
                        (function (idx) {
                            setTimeout(function () {
                                if (!o.alive) return;
                                var fx = hx + (Math.random() - 0.5) * 70;
                                var fy = hy + (Math.random() - 0.5) * 70;
                                if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, fx, fy, Math.random() * Math.PI * 2, { length: 25 + Math.random() * 15, width: 15 + Math.random() * 10, color: '#2c3e8c', duration: 100, curve: 0, fadeStyle: 'flash' });
                                g.applyAOE(fx, fy, 30, o.projDamage * 0.6, o.id, '#2c3e8c');
                                g.vfx.burst(fx, fy, 2, '#6c7eb7', { speed: 3, life: 100, radius: 2 });
                                g.vfx.floatingText(fx, fy - 10, 'ORA!', '#2c3e8c', { fontSize: 8 + Math.random() * 10, life: 250 });
                            }, idx * 50);
                        })(i);
                    }
                    g.vfx.floatingText(o.x, o.y - 50, 'ORA ORA ORA!', '#2c3e8c', { fontSize: 18 });
                }},
                { id: 'time_stop', name: 'The World', icon: 'eye', cd: 30000, fn: function (o, g) {
                    g.vfx.screenFlashEffect('#f5f0e8', 300, 0.3);
                    g.vfx.floatingText(o.x, o.y - 60, 'STAR PLATINUM: THE WORLD!', '#2c3e8c', { fontSize: 18, life: 1500 });
                    g.vfx.shockwave(o.x, o.y, 300, 800, CONST.COLOR_INK, 4);
                    var en = g.getEnemiesInRadius(o.x, o.y, 350, o.id);
                    for (var i = 0; i < en.length; i++) {
                        (function (e) {
                            var sv = { vx: e.vx, vy: e.vy }; e.vx = 0; e.vy = 0;
                            e.takeDamage(o.projDamage * 3, o);
                            setTimeout(function () { if (e.alive) { e.vx = sv.vx; e.vy = sv.vy; } }, 2000);
                            if (!e.alive) g.handleKill(o, e);
                        })(en[i]);
                    }
                    g.vfx.triggerSlowMo(0.15, 2000);
                }},
                { id: 'final_ora', name: 'Final ORA', icon: 'explosion', cd: 35000, fn: function (o, g) {
                    var hx = o.x + Math.cos(o.angle) * 180;
                    var hy = o.y + Math.sin(o.angle) * 180;
                    g.vfx.shockwave(hx, hy, 200, 600, CONST.COLOR_INK, 5);
                    g.vfx.burst(hx, hy, 40, '#2c3e8c', { speed: 8, life: 600, radius: 5 });
                    g.vfx.spiralBurst(hx, hy, 20, '#6c7eb7', { speed: 6, life: 500 });
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createCrossSlash(g, hx, hy, o.angle, { length: 120, width: 30, color: '#2c3e8c', duration: 400, fadeStyle: 'linger' });
                    g.camera.shake(5, 200);
                    g.applyAOE(hx, hy, 160, o.projDamage * 9, o.id, '#2c3e8c');
                    g.vfx.floatingText(o.x, o.y - 60, 'ORAAAAAA!', '#2c3e8c', { fontSize: 28, life: 1500 });
                }}
            ],

            // =============================================================
            // JOJO — DIO
            // =============================================================
            dio: [
                { id: 'muda', name: 'MUDA Rush', icon: 'rapid', cd: 3500, fn: function (o, g) {
                    for (var i = 0; i < 6; i++) {
                        (function (idx) { setTimeout(function () { if (!o.alive) return; self._aimedAOE(o, g, 140, 40, o.projDamage * 0.8, '#c9a84c'); g.vfx.floatingText(o.x + (Math.random() - 0.5) * 60, o.y + Math.sin(o.angle) * 80, 'MUDA!', '#c9a84c', { fontSize: 10 + Math.random() * 6, life: 300 }); }, idx * 80); })(i);
                    }
                }},
                { id: 'knives', name: 'Knife Barrage', icon: 'knife', cd: 6000, fn: function (o, g) {
                    for (var i = 0; i < 7; i++) {
                        var a = o.angle + (i - 3) * 0.12;
                        var p = self._bigProj(o, g, { speed: 13, radius: 5, damage: o.projDamage * 1.2, pen: 2, color: '#c9a84c', lifetime: 1500 });
                        p.vx = Math.cos(a) * 13; p.vy = Math.sin(a) * 13;
                    }
                    g.vfx.directionalBurst(o.x, o.y, o.angle, 0.5, 10, '#c9a84c', { speed: 4, life: 250 });
                }},
                { id: 'za_warudo', name: 'ZA WARUDO', icon: 'eye', cd: 25000, fn: function (o, g) {
                    g.vfx.screenFlashEffect('#f5f0e8', 400, 0.35);
                    g.vfx.floatingText(o.x, o.y - 60, 'ZA WARUDO!', '#c9a84c', { fontSize: 24, life: 2000 });
                    g.vfx.shockwave(o.x, o.y, 400, 1000, CONST.COLOR_INK, 5);
                    var en = g.getEnemiesInRadius(o.x, o.y, 400, o.id);
                    for (var i = 0; i < en.length; i++) { (function (e) { var sv = { vx: e.vx, vy: e.vy }; e.vx = 0; e.vy = 0; setTimeout(function () { if (e.alive) { e.vx = sv.vx; e.vy = sv.vy; } }, 3000); })(en[i]); }
                    g.vfx.triggerSlowMo(0.1, 3000);
                    self._buff(o, g, { moveSpeed: function (v) { return v * 2; }, projDamage: function (v) { return v * 2; } }, 3000, null, null);
                }},
                { id: 'road_roller', name: 'Road Roller', icon: 'impact', cd: 18000, fn: function (o, g) {
                    var hx = o.x + Math.cos(o.angle) * 200, hy = o.y + Math.sin(o.angle) * 200;
                    g.vfx.shockwave(hx, hy, 150, 500, CONST.COLOR_INK, 5);
                    g.vfx.burst(hx, hy, 35, '#c9a84c', { speed: 7, life: 500, radius: 5 });
                    g.camera.shake(5, 200);
                    g.applyAOE(hx, hy, 130, o.projDamage * 6, o.id, '#c9a84c');
                    g.vfx.floatingText(o.x, o.y - 60, 'ROAD ROLLER DA!', '#c9a84c', { fontSize: 22, life: 1500 });
                }},
                { id: 'vampiric', name: 'Vampiric Drain', icon: 'skull', cd: 20000, fn: function (o, g) {
                    var en = g.getEnemiesInRadius(o.x, o.y, 150, o.id), td = 0;
                    for (var i = 0; i < en.length; i++) { var d = o.projDamage * 2; en[i].takeDamage(d, o); td += d; g.vfx.beamFlash(en[i].x, en[i].y, o.x, o.y, '#c0392b', 3, 300); if (!en[i].alive) g.handleKill(o, en[i]); }
                    o.hp = Math.min(o.hp + td, o.maxHp);
                    if (td > 0) g.vfx.floatingText(o.x, o.y - 50, '+' + Math.floor(td) + ' HP', '#27ae60', { fontSize: 16 });
                }},
                { id: 'world_final', name: 'The World: Final', icon: 'domain', cd: 40000, fn: function (o, g) {
                    g.vfx.screenFlashEffect('#f5f0e8', 500, 0.4);
                    g.vfx.floatingText(o.x, o.y - 70, 'TOKI WO TOMARE!', '#c9a84c', { fontSize: 26, life: 2000 });
                    g.vfx.shockwave(o.x, o.y, 500, 1200, CONST.COLOR_INK, 6);
                    g.vfx.triggerSlowMo(0.05, 4000);
                    var wOwner = o;
                    setTimeout(function () { if (!wOwner.alive) return; g.applyAOE(wOwner.x, wOwner.y, 400, wOwner.projDamage * 10, wOwner.id, '#c9a84c'); g.vfx.burst(wOwner.x, wOwner.y, 50, '#c9a84c', { speed: 10, life: 700, radius: 6 }); }, 2000);
                }}
            ],

            // =============================================================
            // JOJO — GIORNO
            // =============================================================
            giorno: [
                { id: 'gold_punch', name: 'Gold Experience Punch', icon: 'fist', cd: 3500, fn: function (o, g) { self._aimedAOE(o, g, 140, 50, o.projDamage * 2.5, '#b03060'); if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * 80, o.y + Math.sin(o.angle) * 80, o.angle, { length: 50, width: 20, color: '#b03060', duration: 150, curve: 0, fadeStyle: 'flash' }); } },
                { id: 'life_shot', name: 'Life Shot', icon: 'beam', cd: 8000, fn: function (o, g) { self._bigProj(o, g, { speed: 10, radius: 12, damage: o.projDamage * 3, pen: 3, color: '#b03060', lifetime: 2000 }); g.vfx.burst(o.x, o.y, 8, '#c9a84c', { speed: 3, life: 250, radius: 2 }); } },
                { id: 'life_giver', name: 'Life Giver', icon: 'heal', cd: 20000, fn: function (o, g) { o.hp = Math.min(o.hp + o.maxHp * 0.4, o.maxHp); g.vfx.ring(o.x, o.y, 20, '#27ae60', { speed: 4, radius: 3, life: 400 }); g.vfx.floatingText(o.x, o.y - 50, '+' + Math.floor(o.maxHp * 0.4) + ' HP', '#27ae60', { fontSize: 18 }); g.vfx.burst(o.x, o.y, 10, '#27ae60', { speed: 3, life: 300, radius: 3 }); } },
                { id: 'muda_barrage', name: 'MUDA Barrage', icon: 'rapid', cd: 12000, fn: function (o, g) { for (var i = 0; i < 10; i++) { (function (idx) { setTimeout(function () { if (!o.alive) return; var a = o.angle + (Math.random() - 0.5) * 0.5; var fx = o.x + Math.cos(a) * 130, fy = o.y + Math.sin(a) * 130; g.applyAOE(fx, fy, 35, o.projDamage * 0.6, o.id, '#b03060'); if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, fx, fy, a, { length: 25, width: 15, color: '#b03060', duration: 100, fadeStyle: 'flash' }); }, idx * 70); })(i); } g.vfx.floatingText(o.x, o.y - 50, 'MUDA MUDA!', '#b03060', { fontSize: 18 }); } },
                { id: 'return_zero', name: 'Return to Zero', icon: 'spiral', cd: 30000, fn: function (o, g) { o.invulnTimer = Math.max(o.invulnTimer, 4000); o.hp = o.maxHp; g.vfx.shockwave(o.x, o.y, 250, 600, CONST.COLOR_INK, 5); g.vfx.spiralBurst(o.x, o.y, 20, '#c9a84c', { speed: 4, life: 500 }); g.vfx.floatingText(o.x, o.y - 60, 'RETURN TO ZERO!', '#c9a84c', { fontSize: 22, life: 1500 }); self._buff(o, g, { projDamage: function (v) { return v * 2; } }, 4000, '#c9a84c', null); } },
                { id: 'requiem', name: 'Gold Experience Requiem', icon: 'domain', cd: 40000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 400, 0.35); g.vfx.floatingText(o.x, o.y - 70, 'REQUIEM!', '#b03060', { fontSize: 28, life: 2000 }); g.vfx.shockwave(o.x, o.y, 350, 800, CONST.COLOR_INK, 6); g.vfx.spiralBurst(o.x, o.y, 30, '#b03060', { speed: 7, life: 600 }); g.applyAOE(o.x, o.y, 300, o.projDamage * 8, o.id, '#b03060'); self._buff(o, g, { moveSpeed: function (v) { return v * 1.8; }, projDamage: function (v) { return v * 2.5; }, reloadTime: function (v) { return v * 0.3; } }, 6000, '#c9a84c', 'INFINITE POWER!'); } }
            ],

            // =============================================================
            // JJK — GOJO
            // =============================================================
            gojo: [
                { id: 'blue', name: 'Cursed: Blue', icon: 'spiral', cd: 4000, fn: function (o, g) { var hx = o.x + Math.cos(o.angle) * 250, hy = o.y + Math.sin(o.angle) * 250; g.vfx.shockwave(hx, hy, 80, 400, CONST.COLOR_INK); g.vfx.spiralBurst(hx, hy, 10, '#5dade2', { speed: 2, life: 300 }); var en = g.getEnemiesInRadius(hx, hy, 120, o.id); for (var i = 0; i < en.length; i++) { var a = Utils.angleBetween(en[i].x, en[i].y, hx, hy); en[i].vx += Math.cos(a) * 6; en[i].vy += Math.sin(a) * 6; en[i].takeDamage(o.projDamage * 1.5, o); if (!en[i].alive) g.handleKill(o, en[i]); } g.vfx.burst(hx, hy, 15, '#5dade2', { speed: 2, life: 300, radius: 3 }); g.vfx.floatingText(o.x, o.y - 50, 'BLUE!', '#5dade2', { fontSize: 16 }); } },
                { id: 'red', name: 'Cursed: Red', icon: 'impact', cd: 5000, fn: function (o, g) { var hx = o.x + Math.cos(o.angle) * 200, hy = o.y + Math.sin(o.angle) * 200; var en = g.getEnemiesInRadius(hx, hy, 100, o.id); for (var i = 0; i < en.length; i++) { var a = Utils.angleBetween(hx, hy, en[i].x, en[i].y); en[i].vx += Math.cos(a) * 10; en[i].vy += Math.sin(a) * 10; en[i].takeDamage(o.projDamage * 2, o); if (!en[i].alive) g.handleKill(o, en[i]); } g.vfx.shockwave(hx, hy, 100, 350, CONST.COLOR_INK); g.vfx.burst(hx, hy, 20, '#c0392b', { speed: 6, life: 300, radius: 4 }); g.vfx.floatingText(o.x, o.y - 50, 'RED!', '#c0392b', { fontSize: 16 }); } },
                { id: 'infinity', name: 'Infinity', icon: 'shield', cd: 22000, fn: function (o, g) { self._shield(o, g, 0.1, 5000, '#5dade2', 'INFINITY!'); } },
                { id: 'hollow_purple', name: 'Hollow Purple', icon: 'beam', cd: 15000, fn: function (o, g) { self._beam(o, g, 500, 16, o.projDamage * 6, '#8e44ad', 12); g.vfx.spiralBurst(o.x, o.y, 12, '#8e44ad', { speed: 3, life: 400 }); g.camera.shake(4, 150); g.vfx.floatingText(o.x, o.y - 50, 'HOLLOW PURPLE!', '#8e44ad', { fontSize: 20, life: 1200 }); } },
                { id: 'amplify', name: 'Domain Amplification', icon: 'aura', cd: 25000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2.5; }, moveSpeed: function (v) { return v * 1.5; } }, 5000, '#8e44ad', 'AMPLIFIED!'); } },
                { id: 'unlimited_void', name: 'Unlimited Void', icon: 'domain', cd: 40000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 400, 0.4); g.vfx.floatingText(o.x, o.y - 70, 'DOMAIN EXPANSION!', '#5dade2', { fontSize: 22, life: 2000 }); g.vfx.floatingText(o.x, o.y - 45, 'UNLIMITED VOID!', '#8e44ad', { fontSize: 16, life: 2000 }); g.vfx.shockwave(o.x, o.y, 400, 1000, CONST.COLOR_INK, 6); g.vfx.spiralBurst(o.x, o.y, 30, '#5dade2', { speed: 8, life: 700 }); var en = g.getEnemiesInRadius(o.x, o.y, 350, o.id); for (var i = 0; i < en.length; i++) { (function (e) { e.takeDamage(o.projDamage * 8, o); var sv = { vx: e.vx, vy: e.vy }; e.vx = 0; e.vy = 0; setTimeout(function () { if (e.alive) { e.vx = sv.vx; e.vy = sv.vy; } }, 3000); if (!e.alive) g.handleKill(o, e); })(en[i]); } g.vfx.triggerSlowMo(0.1, 3000); } }
            ],

            // =============================================================
            // JJK — YUJI
            // =============================================================
            yuji: [
                { id: 'div_fist', name: 'Divergent Fist', icon: 'fist', cd: 3000, fn: function (o, g) { self._aimedAOE(o, g, 130, 55, o.projDamage * 2.5, '#c0392b'); if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * 80, o.y + Math.sin(o.angle) * 80, o.angle, { length: 40, width: 22, color: '#c0392b', duration: 150, curve: 0, fadeStyle: 'flash' }); } },
                { id: 'black_flash', name: 'Black Flash', icon: 'lightning', cd: 10000, fn: function (o, g) { var hx = o.x + Math.cos(o.angle) * 150, hy = o.y + Math.sin(o.angle) * 150; g.vfx.screenFlashEffect('#f5f0e8', 100, 0.2); g.applyAOE(hx, hy, 80, o.projDamage * 4.5, o.id, '#1a1a1a'); g.vfx.shockwave(hx, hy, 100, 300, CONST.COLOR_INK); g.vfx.burst(hx, hy, 20, '#c0392b', { speed: 6, life: 300, radius: 4 }); if (typeof SlashVFX !== 'undefined') SlashVFX.createCrossSlash(g, hx, hy, o.angle, { length: 80, width: 20, color: '#1a1a1a', duration: 250, fadeStyle: 'flash' }); g.camera.shake(4, 150); g.vfx.floatingText(o.x, o.y - 50, 'BLACK FLASH!', '#1a1a1a', { fontSize: 20, life: 1200 }); } },
                { id: 'cursed_strike', name: 'Cursed Strike', icon: 'dash', cd: 8000, fn: function (o, g) { self._dash(o, g, 250, '#c0392b', o.projDamage * 0.8); if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x, o.y, o.angle, { length: 60, width: 18, color: '#c0392b', duration: 200, fadeStyle: 'flash' }); } },
                { id: 'combo', name: 'Combo Rush', icon: 'rapid', cd: 12000, fn: function (o, g) { for (var i = 0; i < 8; i++) { (function (idx) { setTimeout(function () { if (!o.alive) return; self._aimedAOE(o, g, 120 + idx * 15, 40, o.projDamage * 0.7, '#c0392b'); if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * (120 + idx * 15), o.y + Math.sin(o.angle) * (120 + idx * 15), o.angle + (Math.random() - 0.5) * 0.3, { length: 30, width: 15, color: '#c0392b', duration: 100, fadeStyle: 'flash' }); }, idx * 100); })(i); } g.vfx.floatingText(o.x, o.y - 50, 'COMBO!', '#c0392b', { fontSize: 16 }); } },
                { id: 'sukuna_power', name: "Sukuna's Power", icon: 'aura', cd: 22000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2.5; }, moveSpeed: function (v) { return v * 1.3; } }, 5000, '#922b21', "SUKUNA'S POWER!"); if (typeof SlashVFX !== 'undefined') SlashVFX.createSlashRing(g, o.x, o.y, 4, { length: 50, width: 12, color: '#922b21', duration: 300, fadeStyle: 'flash' }); } },
                { id: 'max_flash', name: 'Max Black Flash', icon: 'explosion', cd: 35000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 200, 0.3); g.vfx.shockwave(o.x, o.y, 250, 600, CONST.COLOR_INK, 5); g.vfx.burst(o.x, o.y, 40, '#1a1a1a', { speed: 8, life: 600, radius: 5 }); if (typeof SlashVFX !== 'undefined') { SlashVFX.createCrossSlash(g, o.x, o.y, 0, { length: 150, width: 25, color: '#1a1a1a', duration: 400 }); SlashVFX.createCrossSlash(g, o.x, o.y, Math.PI / 4, { length: 150, width: 25, color: '#922b21', duration: 400, delay: 80 }); } g.applyAOE(o.x, o.y, 200, o.projDamage * 9, o.id, '#1a1a1a'); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 60, 'MAX BLACK FLASH!', '#1a1a1a', { fontSize: 24, life: 1500 }); } }
            ],

            // =============================================================
            // JJK — MEGUMI
            // =============================================================
            megumi: [
                { id: 'divine_dogs', name: 'Divine Dogs', icon: 'clone', cd: 5000, fn: function (o, g) { self._bigProj(o, g, { speed: 9, radius: 10, damage: o.projDamage * 2, pen: 2, color: '#2c3e50', lifetime: 1800 }); self._bigProj(o, g, { speed: 9, radius: 10, damage: o.projDamage * 2, pen: 2, color: '#5d6d7e', lifetime: 1800 }); g.vfx.floatingText(o.x, o.y - 50, 'DIVINE DOGS!', '#2c3e50', { fontSize: 14 }); } },
                { id: 'nue', name: 'Nue', icon: 'lightning', cd: 8000, fn: function (o, g) { self._beam(o, g, 250, 8, o.projDamage * 3, '#5d6d7e', 6); g.vfx.spiralBurst(o.x + Math.cos(o.angle) * 125, o.y + Math.sin(o.angle) * 125, 8, '#5d6d7e', { speed: 3, life: 300 }); } },
                { id: 'toad', name: 'Toad', icon: 'spiral', cd: 12000, fn: function (o, g) { var hx = o.x + Math.cos(o.angle) * 150, hy = o.y + Math.sin(o.angle) * 150; var en = g.getEnemiesInRadius(hx, hy, 120, o.id); for (var i = 0; i < en.length; i++) { var a = Utils.angleBetween(en[i].x, en[i].y, o.x, o.y); en[i].vx += Math.cos(a) * 8; en[i].vy += Math.sin(a) * 8; en[i].takeDamage(o.projDamage, o); if (!en[i].alive) g.handleKill(o, en[i]); } g.vfx.beamFlash(o.x, o.y, hx, hy, '#2c3e50', 10, 300); } },
                { id: 'rabbit', name: 'Rabbit Escape', icon: 'rapid', cd: 14000, fn: function (o, g) { for (var i = 0; i < 12; i++) self._bigProj(o, g, { speed: 5 + Math.random() * 4, radius: 5, damage: o.projDamage, pen: 1, color: '#5d6d7e', lifetime: 1200 }); g.vfx.burst(o.x, o.y, 15, '#5d6d7e', { speed: 4, life: 200, radius: 2 }); } },
                { id: 'elephant', name: 'Max Elephant', icon: 'wave', cd: 20000, fn: function (o, g) { self._aimedAOE(o, g, 180, 120, o.projDamage * 4, '#2c3e50'); g.vfx.floatingText(o.x, o.y - 50, 'MAX ELEPHANT!', '#2c3e50', { fontSize: 18 }); } },
                { id: 'chimera', name: 'Chimera Shadow Garden', icon: 'domain', cd: 35000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 400, 0.3); g.vfx.floatingText(o.x, o.y - 70, 'DOMAIN EXPANSION!', '#2c3e50', { fontSize: 22, life: 2000 }); g.applyAOE(o.x, o.y, 250, o.projDamage * 7, o.id, '#2c3e50'); self._buff(o, g, { projDamage: function (v) { return v * 2; }, moveSpeed: function (v) { return v * 1.5; } }, 4000, '#2c3e50', null); g.vfx.shockwave(o.x, o.y, 250, 800, CONST.COLOR_INK, 5); } }
            ],

            // =============================================================
            // JJK — SUKUNA (full slash VFX)
            // =============================================================
            sukuna: [
                { id: 'dismantle', name: 'Dismantle', icon: 'slash', cd: 3000, fn: function (o, g) {
                    var ex = o.x + Math.cos(o.angle) * 300, ey = o.y + Math.sin(o.angle) * 300;
                    if (typeof SlashVFX !== 'undefined') { for (var i = 0; i < 3; i++) { var t = (i + 1) / 4; var sx2 = Utils.lerp(o.x, ex, t), sy2 = Utils.lerp(o.y, ey, t); SlashVFX.createSlash(g, sx2, sy2, o.angle + (i % 2 === 0 ? 0.3 : -0.3), { length: 60 + i * 15, width: 12 + i * 3, color: '#922b21', duration: 200, delay: i * 50, curve: i % 2 === 0 ? 0.5 : -0.5, fadeStyle: 'flash' }); } SlashVFX.slashParticles(g, o.x, o.y, o.angle, 300, '#922b21'); }
                    self._beam(o, g, 300, 4, o.projDamage * 2.5, '#922b21', 6); g.vfx.floatingText(o.x, o.y - 50, 'DISMANTLE!', '#922b21', { fontSize: 16 });
                }},
                { id: 'cleave', name: 'Cleave', icon: 'cross_slash', cd: 6000, fn: function (o, g) {
                    var hx = o.x + Math.cos(o.angle) * 160, hy = o.y + Math.sin(o.angle) * 160;
                    if (typeof SlashVFX !== 'undefined') { SlashVFX.createCrossSlash(g, hx, hy, o.angle, { length: 140, width: 28, color: '#922b21', duration: 350, fadeStyle: 'linger' }); SlashVFX.slashParticles(g, hx, hy, o.angle, 140, '#922b21'); SlashVFX.slashParticles(g, hx, hy, o.angle + Math.PI / 2, 140, '#922b21'); }
                    g.applyAOE(hx, hy, 70, o.projDamage * 3, o.id, '#922b21'); g.vfx.shockwave(hx, hy, 70, 300, CONST.COLOR_INK); g.vfx.floatingText(o.x, o.y - 50, 'CLEAVE!', '#922b21', { fontSize: 18 });
                }},
                { id: 'reverse_ct', name: 'Reverse Cursed', icon: 'heal', cd: 18000, fn: function (o, g) { o.hp = Math.min(o.hp + o.maxHp * 0.5, o.maxHp); g.vfx.ring(o.x, o.y, 16, '#922b21', { speed: 4, radius: 3, life: 400 }); g.vfx.floatingText(o.x, o.y - 50, '+' + Math.floor(o.maxHp * 0.5) + ' HP', '#27ae60', { fontSize: 18, life: 1000 }); g.vfx.aura(o, '#922b21', o.radius + 20, 2000); } },
                { id: 'flame_arrow', name: 'Flame Arrow', icon: 'arrow', cd: 10000, fn: function (o, g) {
                    self._bigProj(o, g, { speed: 15, radius: 14, damage: o.projDamage * 4, pen: 4, color: '#922b21', lifetime: 2000 });
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * 40, o.y + Math.sin(o.angle) * 40, o.angle, { length: 100, width: 15, color: '#c0392b', duration: 300, curve: 0.2 });
                    g.vfx.directionalBurst(o.x, o.y, o.angle, 0.3, 8, '#922b21', { speed: 5, life: 250 }); g.vfx.floatingText(o.x, o.y - 50, 'FLAME ARROW!', '#922b21', { fontSize: 18 });
                }},
                { id: 'king_of_curses', name: 'King of Curses', icon: 'crown', cd: 25000, fn: function (o, g) {
                    self._buff(o, g, { projDamage: function (v) { return v * 3; }, moveSpeed: function (v) { return v * 1.5; }, reloadTime: function (v) { return v * 0.4; } }, 5000, '#922b21', 'KING OF CURSES!');
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlashRing(g, o.x, o.y, 8, { length: 70, width: 14, color: '#922b21', duration: 400, fadeStyle: 'flash' });
                }},
                { id: 'malevolent_shrine', name: 'Malevolent Shrine', icon: 'domain', cd: 40000, fn: function (o, g) {
                    g.vfx.screenFlashEffect('#f5f0e8', 500, 0.35); g.vfx.floatingText(o.x, o.y - 70, 'DOMAIN EXPANSION!', '#922b21', { fontSize: 22, life: 2000 }); g.vfx.floatingText(o.x, o.y - 45, 'MALEVOLENT SHRINE!', '#c0392b', { fontSize: 16, life: 2000 });
                    if (typeof SlashVFX !== 'undefined') { SlashVFX.createSlashRing(g, o.x, o.y, 16, { length: 120, width: 22, color: '#922b21', duration: 600, fadeStyle: 'linger' }); var msOwner = o; setTimeout(function () { if (!msOwner.alive) return; SlashVFX.createCrossSlash(g, msOwner.x, msOwner.y, 0, { length: 200, width: 30, color: '#c0392b', duration: 500 }); SlashVFX.createCrossSlash(g, msOwner.x, msOwner.y, Math.PI / 4, { length: 200, width: 30, color: '#922b21', duration: 500, delay: 100 }); }, 300); for (var i = 0; i < 12; i++) { var a = (Math.PI * 2 / 12) * i; SlashVFX.slashParticles(g, o.x, o.y, a, 250, '#922b21'); } }
                    g.vfx.shockwave(o.x, o.y, 300, 800, CONST.COLOR_INK, 4); g.applyAOE(o.x, o.y, 300, o.projDamage * 8, o.id, '#922b21'); g.camera.shake(5, 200);
                }}
            ],

            // =============================================================
            // NARUTO
            // =============================================================
            naruto: [
                { id: 'rasengan', name: 'Rasengan', icon: 'spiral', cd: 4000, fn: function (o, g) { var hx = o.x + Math.cos(o.angle) * 130, hy = o.y + Math.sin(o.angle) * 130; g.vfx.spiralBurst(hx, hy, 12, '#5dade2', { speed: 4, life: 400 }); g.vfx.shockwave(hx, hy, 60, 300, CONST.COLOR_INK); g.applyAOE(hx, hy, 60, o.projDamage * 3, o.id, '#5dade2'); g.vfx.floatingText(o.x, o.y - 50, 'RASENGAN!', '#d35400', { fontSize: 18 }); } },
                { id: 'shadow_clone', name: 'Shadow Clone', icon: 'clone', cd: 10000, fn: function (o, g) {
                    // Visual clones + projectiles
                    for (var i = -1; i <= 1; i++) self._bigProj(o, g, { speed: 8, radius: 10, damage: o.projDamage * 1.5, pen: 2, color: '#d35400', lifetime: 2000 });
                    // Clone afterimages
                    for (var j = -1; j <= 1; j += 2) g.vfx.afterimage(o.x + j * 30, o.y, o.radius, '#d35400', o.angle);
                    g.vfx.burst(o.x, o.y, 10, '#f5f0e8', { speed: 3, life: 200, radius: 3 });
                    g.vfx.floatingText(o.x, o.y - 50, 'SHADOW CLONE!', '#d35400', { fontSize: 16 });
                }},
                { id: 'sage', name: 'Sage Mode', icon: 'aura', cd: 22000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 1.8; }, moveSpeed: function (v) { return v * 1.4; } }, 6000, '#d35400', 'SAGE MODE!'); g.vfx.ring(o.x, o.y, 16, '#d35400', { speed: 3, radius: 4, life: 500 }); } },
                { id: 'rasenshuriken', name: 'Rasenshuriken', icon: 'star', cd: 14000, fn: function (o, g) { self._bigProj(o, g, { speed: 9, radius: 20, damage: o.projDamage * 5, pen: 2, color: '#5dade2', lifetime: 2500 }); g.vfx.spiralBurst(o.x + Math.cos(o.angle) * 35, o.y + Math.sin(o.angle) * 35, 8, '#5dade2', { speed: 3, life: 300 }); g.vfx.floatingText(o.x, o.y - 50, 'RASENSHURIKEN!', '#5dade2', { fontSize: 20, life: 1200 }); } },
                { id: 'kcm', name: 'Kurama Mode', icon: 'flame', cd: 28000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2.5; }, moveSpeed: function (v) { return v * 1.8; }, reloadTime: function (v) { return v * 0.4; } }, 6000, '#c9a84c', 'KURAMA MODE!'); o.hp = o.maxHp; g.vfx.shockwave(o.x, o.y, 200, 600, CONST.COLOR_INK, 5); g.vfx.burst(o.x, o.y, 20, '#c9a84c', { speed: 5, life: 400, radius: 4 }); } },
                { id: 'baryon', name: 'Baryon Mode', icon: 'explosion', cd: 45000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 500, 0.35); g.vfx.floatingText(o.x, o.y - 70, 'BARYON MODE!', '#d35400', { fontSize: 26, life: 2000 }); self._buff(o, g, { projDamage: function (v) { return v * 4; }, moveSpeed: function (v) { return v * 2; }, reloadTime: function (v) { return v * 0.2; } }, 5000, '#d35400', null); g.vfx.shockwave(o.x, o.y, 300, 800, CONST.COLOR_INK, 6); g.vfx.spiralBurst(o.x, o.y, 30, '#c9a84c', { speed: 8, life: 700 }); var bOwner = o; var bIv = setInterval(function () { if (!bOwner.alive) { clearInterval(bIv); return; } g.applyAOE(bOwner.x, bOwner.y, 150, bOwner.projDamage * 0.5, bOwner.id, '#d35400'); g.vfx.ring(bOwner.x, bOwner.y, 6, '#d35400', { speed: 3, radius: 2, life: 200 }); }, 300); setTimeout(function () { clearInterval(bIv); }, 5000); } }
            ],

            sasuke: [
                { id: 'chidori', name: 'Chidori', icon: 'lightning', cd: 4000, fn: function (o, g) { self._dash(o, g, 200, '#7d3c98', o.projDamage * 0.6); g.vfx.spiralBurst(o.x, o.y, 8, '#7d3c98', { speed: 3, life: 200 }); g.vfx.floatingText(o.x, o.y - 50, 'CHIDORI!', '#7d3c98', { fontSize: 18 }); } },
                { id: 'fireball', name: 'Fire Ball Jutsu', icon: 'flame', cd: 7000, fn: function (o, g) { self._bigProj(o, g, { speed: 10, radius: 18, damage: o.projDamage * 3, pen: 3, color: '#c0392b', lifetime: 2000 }); g.vfx.directionalBurst(o.x, o.y, o.angle, 0.4, 8, '#c0392b', { speed: 3, life: 250 }); } },
                { id: 'sharingan', name: 'Sharingan', icon: 'eye', cd: 20000, fn: function (o, g) { self._buff(o, g, { moveSpeed: function (v) { return v * 1.5; }, projDamage: function (v) { return v * 1.6; } }, 6000, '#c0392b', 'SHARINGAN!'); } },
                { id: 'kirin', name: 'Kirin', icon: 'lightning', cd: 16000, fn: function (o, g) { var hx = o.x + Math.cos(o.angle) * 250, hy = o.y + Math.sin(o.angle) * 250; g.vfx.beamFlash(hx, hy - 300, hx, hy, '#7d3c98', 20, 400); g.vfx.shockwave(hx, hy, 120, 500, CONST.COLOR_INK, 5); g.vfx.burst(hx, hy, 30, '#7d3c98', { speed: 7, life: 500, radius: 5 }); g.applyAOE(hx, hy, 120, o.projDamage * 5, o.id, '#7d3c98'); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 50, 'KIRIN!', '#7d3c98', { fontSize: 22, life: 1200 }); } },
                { id: 'susanoo', name: 'Susanoo', icon: 'shield', cd: 25000, fn: function (o, g) { self._shield(o, g, 0.2, 5000, '#7d3c98', 'SUSANOO!'); self._buff(o, g, { projDamage: function (v) { return v * 1.5; } }, 5000, null, null); } },
                { id: 'indra', name: "Indra's Arrow", icon: 'arrow', cd: 40000, fn: function (o, g) { self._beam(o, g, 600, 25, o.projDamage * 10, '#7d3c98', 14); g.vfx.screenFlashEffect('#f5f0e8', 300, 0.3); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 60, "INDRA'S ARROW!", '#7d3c98', { fontSize: 24, life: 1500 }); } }
            ],

            kakashi: [
                { id: 'raikiri', name: 'Lightning Blade', icon: 'lightning', cd: 4000, fn: function (o, g) { self._dash(o, g, 180, '#5dade2', o.projDamage * 0.7); g.vfx.spiralBurst(o.x, o.y, 6, '#5dade2', { speed: 2, life: 200 }); g.vfx.floatingText(o.x, o.y - 50, 'RAIKIRI!', '#5dade2', { fontSize: 16 }); } },
                { id: 'copy', name: 'Copy Jutsu', icon: 'eye', cd: 12000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2; }, projSpeed: function (v) { return v * 1.5; } }, 4000, '#7f8c8d', 'COPY!'); } },
                { id: 'water_dragon', name: 'Water Dragon', icon: 'wave', cd: 10000, fn: function (o, g) { self._bigProj(o, g, { speed: 10, radius: 18, damage: o.projDamage * 3.5, pen: 4, color: '#5dade2', lifetime: 2200 }); g.vfx.directionalBurst(o.x, o.y, o.angle, 0.5, 10, '#5dade2', { speed: 4, life: 300 }); } },
                { id: 'earth_wall', name: 'Earth Wall', icon: 'shield', cd: 15000, fn: function (o, g) { self._shield(o, g, 0.25, 4000, '#7f8c8d', 'EARTH WALL!'); } },
                { id: 'kamui', name: 'Kamui', icon: 'spiral', cd: 22000, fn: function (o, g) { var hx = o.x + Math.cos(o.angle) * 250, hy = o.y + Math.sin(o.angle) * 250; g.vfx.spiralBurst(hx, hy, 20, '#5dade2', { speed: 3, life: 600 }); g.vfx.shockwave(hx, hy, 100, 500, CONST.COLOR_INK); g.applyAOE(hx, hy, 100, o.projDamage * 5, o.id, '#5dade2'); g.camera.shake(4, 150); g.vfx.floatingText(o.x, o.y - 50, 'KAMUI!', '#5dade2', { fontSize: 20, life: 1200 }); } },
                { id: 'perfect_sus_k', name: 'Perfect Susanoo', icon: 'domain', cd: 40000, fn: function (o, g) { self._shield(o, g, 0.15, 6000, '#5dade2', 'PERFECT SUSANOO!'); self._buff(o, g, { projDamage: function (v) { return v * 3; }, moveSpeed: function (v) { return v * 1.5; } }, 6000, null, null); g.vfx.shockwave(o.x, o.y, 250, 800, CONST.COLOR_INK, 5); } }
            ],

            madara: [
                { id: 'fire_annihilation', name: 'Fire Annihilation', icon: 'flame', cd: 4500, fn: function (o, g) { for (var i = -2; i <= 2; i++) { var p = self._bigProj(o, g, { speed: 9, radius: 10, damage: o.projDamage * 1.5, pen: 3, color: '#641e16', lifetime: 1800 }); p.vx = Math.cos(o.angle + i * 0.12) * 9; p.vy = Math.sin(o.angle + i * 0.12) * 9; } g.vfx.directionalBurst(o.x, o.y, o.angle, 0.8, 15, '#641e16', { speed: 5, life: 300 }); } },
                { id: 'wood_clone', name: 'Wood Clone', icon: 'clone', cd: 10000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 1.5; }, moveSpeed: function (v) { return v * 1.3; } }, 5000, '#6e4b1e', 'WOOD CLONE!'); g.vfx.afterimage(o.x - 30, o.y, o.radius, '#6e4b1e', o.angle); g.vfx.afterimage(o.x + 30, o.y, o.radius, '#6e4b1e', o.angle); } },
                { id: 'shinra_tensei', name: 'Almighty Push', icon: 'impact', cd: 14000, fn: function (o, g) { g.vfx.shockwave(o.x, o.y, 200, 500, CONST.COLOR_INK, 5); var en = g.getEnemiesInRadius(o.x, o.y, 200, o.id); for (var i = 0; i < en.length; i++) { var a = Utils.angleBetween(o.x, o.y, en[i].x, en[i].y); en[i].vx += Math.cos(a) * 15; en[i].vy += Math.sin(a) * 15; en[i].takeDamage(o.projDamage * 2.5, o); if (!en[i].alive) g.handleKill(o, en[i]); } g.vfx.burst(o.x, o.y, 25, '#641e16', { speed: 7, life: 400, radius: 4 }); g.camera.shake(4, 150); g.vfx.floatingText(o.x, o.y - 50, 'SHINRA TENSEI!', '#641e16', { fontSize: 20, life: 1200 }); } },
                { id: 'meteor', name: 'Tengai Shinsei', icon: 'meteor', cd: 20000, fn: function (o, g) { var hx = o.x + Math.cos(o.angle) * 200, hy = o.y + Math.sin(o.angle) * 200; g.vfx.beamFlash(hx, hy - 400, hx, hy, '#641e16', 30, 500); var mOwner = o; setTimeout(function () { g.vfx.shockwave(hx, hy, 180, 600, CONST.COLOR_INK, 6); g.vfx.burst(hx, hy, 40, '#641e16', { speed: 8, life: 600, radius: 6 }); g.applyAOE(hx, hy, 160, mOwner.projDamage * 6, mOwner.id, '#641e16'); g.camera.shake(5, 200); }, 500); g.vfx.floatingText(o.x, o.y - 60, 'TENGAI SHINSEI!', '#641e16', { fontSize: 22, life: 1500 }); } },
                { id: 'perfect_sus_m', name: 'Perfect Susanoo', icon: 'shield', cd: 28000, fn: function (o, g) { self._shield(o, g, 0.2, 6000, '#641e16', 'PERFECT SUSANOO!'); self._buff(o, g, { projDamage: function (v) { return v * 2.5; }, moveSpeed: function (v) { return v * 1.3; } }, 6000, null, null); g.vfx.shockwave(o.x, o.y, 200, 600, CONST.COLOR_INK, 5); } },
                { id: 'tsukuyomi', name: 'Infinite Tsukuyomi', icon: 'domain', cd: 45000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 600, 0.5); g.vfx.floatingText(o.x, o.y - 70, 'INFINITE TSUKUYOMI!', '#641e16', { fontSize: 24, life: 2500 }); g.vfx.shockwave(o.x, o.y, 500, 1200, CONST.COLOR_INK, 6); var en = g.getEnemiesInRadius(o.x, o.y, 500, o.id); for (var i = 0; i < en.length; i++) { (function (e) { e.takeDamage(o.projDamage * 7, o); var sv = { vx: e.vx, vy: e.vy }; e.vx = 0; e.vy = 0; setTimeout(function () { if (e.alive) { e.vx = sv.vx; e.vy = sv.vy; } }, 3500); if (!e.alive) g.handleKill(o, e); })(en[i]); } g.vfx.triggerSlowMo(0.1, 3500); } }
            ],

            // =============================================================
            // MY HERO ACADEMIA
            // =============================================================
            deku: [
                { id: 'smash5', name: '5% Smash', icon: 'fist', cd: 3000, fn: function (o, g) { self._aimedAOE(o, g, 140, 55, o.projDamage * 2.5, '#27ae60'); if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * 80, o.y + Math.sin(o.angle) * 80, o.angle, { length: 45, width: 22, color: '#27ae60', duration: 150, curve: 0, fadeStyle: 'flash' }); } },
                { id: 'shoot_style', name: 'Shoot Style', icon: 'dash', cd: 10000, fn: function (o, g) { self._dash(o, g, 220, '#27ae60', o.projDamage * 0.6); if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x, o.y, o.angle + 0.4, { length: 60, width: 16, color: '#82e0aa', duration: 200, curve: 0.6 }); } },
                { id: 'full_cowl', name: 'Full Cowling', icon: 'speed', cd: 20000, fn: function (o, g) {
                    self._buff(o, g, { moveSpeed: function (v) { return v * 1.7; }, projDamage: function (v) { return v * 1.5; }, reloadTime: function (v) { return v * 0.6; } }, 6000, '#27ae60', 'FULL COWLING!');
                    // Lightning crackling effect
                    var fcOwner = o;
                    var fcIv = setInterval(function () {
                        if (!fcOwner.alive) { clearInterval(fcIv); return; }
                        for (var i = 0; i < 2; i++) {
                            var a = Math.random() * Math.PI * 2;
                            var d = fcOwner.radius + Math.random() * 15;
                            g.vfx.spawnParticle({ x: fcOwner.x + Math.cos(a) * d, y: fcOwner.y + Math.sin(a) * d, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, radius: 2, endRadius: 0, color: '#82e0aa', maxLife: 150, alpha: 0.6, friction: 0.95 });
                        }
                    }, 100);
                    setTimeout(function () { clearInterval(fcIv); }, 6000);
                }},
                { id: 'manchester', name: 'Manchester Smash', icon: 'impact', cd: 12000, fn: function (o, g) { self._dash(o, g, 180, '#82e0aa', 0); self._aimedAOE(o, g, 60, 90, o.projDamage * 4, '#27ae60'); if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * 60, o.y + Math.sin(o.angle) * 60, o.angle - 0.5, { length: 80, width: 25, color: '#27ae60', duration: 250, curve: 0.8, fadeStyle: 'linger' }); g.camera.shake(4, 150); g.vfx.floatingText(o.x, o.y - 50, 'MANCHESTER SMASH!', '#27ae60', { fontSize: 18 }); } },
                { id: 'faux100', name: 'Faux 100%', icon: 'aura', cd: 25000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 3; } }, 5000, '#27ae60', 'FAUX 100%!'); g.vfx.shockwave(o.x, o.y, 150, 500, CONST.COLOR_INK, 4); g.vfx.burst(o.x, o.y, 20, '#82e0aa', { speed: 6, life: 400, radius: 3 }); } },
                { id: 'us_smash', name: 'United States of Smash', icon: 'explosion', cd: 40000, fn: function (o, g) { var hx = o.x + Math.cos(o.angle) * 200, hy = o.y + Math.sin(o.angle) * 200; g.vfx.screenFlashEffect('#f5f0e8', 400, 0.4); g.vfx.shockwave(hx, hy, 250, 700, CONST.COLOR_INK, 6); g.vfx.burst(hx, hy, 50, '#27ae60', { speed: 10, life: 700, radius: 6 }); if (typeof SlashVFX !== 'undefined') SlashVFX.createCrossSlash(g, hx, hy, o.angle, { length: 180, width: 35, color: '#27ae60', duration: 500, fadeStyle: 'linger' }); g.applyAOE(hx, hy, 200, o.projDamage * 10, o.id, '#27ae60'); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 60, 'US OF SMASH!', '#27ae60', { fontSize: 22, life: 1500 }); } }
            ],

            bakugo: [
                { id: 'explosion', name: 'Explosion', icon: 'explosion', cd: 3000, fn: function (o, g) { self._aimedAOE(o, g, 130, 60, o.projDamage * 2.5, '#d35400'); g.vfx.burst(o.x + Math.cos(o.angle) * 130, o.y + Math.sin(o.angle) * 130, 18, '#c9a84c', { speed: 5, life: 300, radius: 4 }); } },
                { id: 'ap_shot', name: 'AP Shot', icon: 'beam', cd: 6000, fn: function (o, g) { self._bigProj(o, g, { speed: 16, radius: 8, damage: o.projDamage * 4, pen: 6, color: '#d35400', lifetime: 1500 }); g.vfx.directionalBurst(o.x, o.y, o.angle, 0.2, 6, '#c9a84c', { speed: 5, life: 200 }); g.vfx.floatingText(o.x, o.y - 50, 'AP SHOT!', '#d35400', { fontSize: 16 }); } },
                { id: 'stun', name: 'Stun Grenade', icon: 'star', cd: 12000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 150, 0.2); g.vfx.shockwave(o.x, o.y, 150, 400, CONST.COLOR_INK); g.vfx.burst(o.x, o.y, 25, '#c9a84c', { speed: 6, life: 300, radius: 3 }); var en = g.getEnemiesInRadius(o.x, o.y, 150, o.id); for (var i = 0; i < en.length; i++) { (function (e) { var sv = { vx: e.vx, vy: e.vy }; e.vx = 0; e.vy = 0; e.takeDamage(o.projDamage, o); setTimeout(function () { if (e.alive) { e.vx = sv.vx; e.vy = sv.vy; } }, 1500); if (!e.alive) g.handleKill(o, e); })(en[i]); } g.vfx.floatingText(o.x, o.y - 50, 'STUN GRENADE!', '#c9a84c', { fontSize: 16 }); } },
                { id: 'howitzer', name: 'Howitzer Impact', icon: 'impact', cd: 15000, fn: function (o, g) { self._dash(o, g, 150, '#d35400', 0); g.vfx.shockwave(o.x, o.y, 120, 500, CONST.COLOR_INK, 5); g.vfx.burst(o.x, o.y, 30, '#c9a84c', { speed: 7, life: 500, radius: 5 }); g.applyAOE(o.x, o.y, 120, o.projDamage * 5, o.id, '#d35400'); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 50, 'HOWITZER IMPACT!', '#d35400', { fontSize: 20, life: 1200 }); } },
                { id: 'cluster', name: 'Explode-A-Pult', icon: 'rapid', cd: 18000, fn: function (o, g) { for (var i = 0; i < 8; i++) { (function (idx) { var a = o.angle + (Math.random() - 0.5) * 1.2, dist = 150 + Math.random() * 150; var hx = o.x + Math.cos(a) * dist, hy = o.y + Math.sin(a) * dist; setTimeout(function () { g.applyAOE(hx, hy, 50, o.projDamage * 1.5, o.id, '#d35400'); g.vfx.burst(hx, hy, 8, '#c9a84c', { speed: 4, life: 250, radius: 3 }); g.vfx.shockwave(hx, hy, 50, 200, CONST.COLOR_INK); }, idx * 150); })(i); } } },
                { id: 'max_explosion', name: 'Max Explosion', icon: 'explosion', cd: 35000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 500, 0.4); g.vfx.shockwave(o.x, o.y, 300, 800, CONST.COLOR_INK, 6); g.vfx.shockwave(o.x, o.y, 200, 500, CONST.COLOR_INK, 4); g.vfx.burst(o.x, o.y, 60, '#d35400', { speed: 10, life: 700, radius: 6 }); g.vfx.spiralBurst(o.x, o.y, 20, '#c9a84c', { speed: 7, life: 500 }); g.applyAOE(o.x, o.y, 250, o.projDamage * 9, o.id, '#d35400'); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 60, 'MAX EXPLOSION!', '#d35400', { fontSize: 24, life: 1500 }); } }
            ],

            todoroki: [
                { id: 'ice_wall', name: 'Ice Wall', icon: 'ice', cd: 4000, fn: function (o, g) { self._aimedAOE(o, g, 180, 60, o.projDamage * 2, '#2c3e8c'); var hx = o.x + Math.cos(o.angle) * 180, hy = o.y + Math.sin(o.angle) * 180; var en = g.getEnemiesInRadius(hx, hy, 80, o.id); for (var i = 0; i < en.length; i++) { var a = Utils.angleBetween(hx, hy, en[i].x, en[i].y); en[i].vx += Math.cos(a) * 6; en[i].vy += Math.sin(a) * 6; } // Ice crystal particles
                    for (var j = 0; j < 8; j++) g.vfx.spawnParticle({ x: hx + (Math.random() - 0.5) * 60, y: hy + (Math.random() - 0.5) * 60, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2, radius: 3, endRadius: 0, color: '#aed6f1', maxLife: 400, shape: 'square', rotationSpeed: 0.1, friction: 0.96 });
                }},
                { id: 'fire_blast', name: 'Fire Blast', icon: 'flame', cd: 5000, fn: function (o, g) { self._bigProj(o, g, { speed: 11, radius: 14, damage: o.projDamage * 2.5, pen: 3, color: '#c0392b', lifetime: 1800 }); g.vfx.directionalBurst(o.x, o.y, o.angle, 0.4, 8, '#c0392b', { speed: 3, life: 250 }); } },
                { id: 'flash_freeze', name: 'Flash Freeze', icon: 'ice', cd: 12000, fn: function (o, g) { for (var i = 0; i < 3; i++) { self._bigProj(o, g, { speed: 10, radius: 8, damage: o.projDamage * 1.5, pen: 2, color: '#2c3e8c', lifetime: 1500 }); self._bigProj(o, g, { speed: 10, radius: 8, damage: o.projDamage * 1.5, pen: 2, color: '#c0392b', lifetime: 1500 }); } g.vfx.floatingText(o.x, o.y - 50, 'FLASH FREEZE!', '#2c3e8c', { fontSize: 16 }); } },
                { id: 'heaven_ice', name: 'Heaven-Piercing Ice', icon: 'beam', cd: 15000, fn: function (o, g) { self._beam(o, g, 350, 15, o.projDamage * 5, '#2c3e8c', 8); g.camera.shake(4, 150); // Ice shards along beam
                    for (var i = 0; i < 6; i++) { var t = (i + 1) / 7; var px = Utils.lerp(o.x, o.x + Math.cos(o.angle) * 350, t); var py = Utils.lerp(o.y, o.y + Math.sin(o.angle) * 350, t); g.vfx.spawnParticle({ x: px, y: py, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random(), radius: 4, endRadius: 0, color: '#aed6f1', maxLife: 400, shape: 'square', rotationSpeed: 0.15, friction: 0.95 }); }
                }},
                { id: 'flashfire', name: 'Flashfire Fist', icon: 'aura', cd: 20000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2.5; }, moveSpeed: function (v) { return v * 1.3; } }, 5000, '#c0392b', 'FLASHFIRE!'); } },
                { id: 'phosphor', name: 'Phosphor', icon: 'explosion', cd: 35000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 400, 0.4); g.vfx.shockwave(o.x, o.y, 250, 700, CONST.COLOR_INK, 5); g.vfx.burst(o.x, o.y, 30, '#2c3e8c', { speed: 7, life: 500, radius: 5 }); g.vfx.burst(o.x, o.y, 30, '#c0392b', { speed: 7, life: 500, radius: 5 }); g.vfx.spiralBurst(o.x, o.y, 20, '#f5f0e8', { speed: 5, life: 400 }); g.applyAOE(o.x, o.y, 220, o.projDamage * 9, o.id, '#2c3e8c'); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 60, 'PHOSPHOR!', '#2c3e8c', { fontSize: 26, life: 1500 }); } }
            ],

            // =============================================================
            // DRAGON BALL
            // =============================================================
            goku: [
                { id: 'kamehameha', name: 'Kamehameha', icon: 'beam', cd: 5000, fn: function (o, g) { self._beam(o, g, 450, 14, o.projDamage * 4, '#5dade2', 10); g.vfx.spiralBurst(o.x, o.y, 8, '#5dade2', { speed: 3, life: 300 }); g.camera.shake(3, 150); g.vfx.floatingText(o.x, o.y - 50, 'KAMEHAMEHA!', '#5dade2', { fontSize: 20, life: 1200 }); } },
                { id: 'instant', name: 'Instant Transmission', icon: 'dash', cd: 8000, fn: function (o, g) {
                    // Vanish + appear effect
                    g.vfx.burst(o.x, o.y, 15, '#c9a84c', { speed: 5, life: 200 });
                    g.vfx.afterimage(o.x, o.y, o.radius, '#d35400', o.angle);
                    var en = g.getEnemiesInRadius(o.x, o.y, 600, o.id);
                    if (en.length > 0) { o.x = en[0].x - Math.cos(o.angle) * 80; o.y = en[0].y - Math.sin(o.angle) * 80; } else { o.x += Math.cos(o.angle) * 350; o.y += Math.sin(o.angle) * 350; }
                    o.clampToMap();
                    g.vfx.burst(o.x, o.y, 15, '#c9a84c', { speed: 5, life: 200 });
                    g.vfx.ring(o.x, o.y, 8, '#c9a84c', { speed: 3, radius: 3, life: 200 });
                }},
                { id: 'ssj', name: 'Super Saiyan', icon: 'aura', cd: 22000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2; }, moveSpeed: function (v) { return v * 1.5; }, reloadTime: function (v) { return v * 0.6; } }, 6000, '#c9a84c', 'SUPER SAIYAN!'); g.vfx.shockwave(o.x, o.y, 150, 500, CONST.COLOR_INK, 4); g.vfx.burst(o.x, o.y, 20, '#c9a84c', { speed: 5, life: 400, radius: 4 }); } },
                { id: 'spirit_bomb', name: 'Spirit Bomb', icon: 'meteor', cd: 20000, fn: function (o, g) { var hx = o.x + Math.cos(o.angle) * 250, hy = o.y + Math.sin(o.angle) * 250; g.vfx.chargeGlow(hx, hy, 100, 800, '#5dade2'); var sbOwner = o; setTimeout(function () { g.vfx.shockwave(hx, hy, 150, 600, CONST.COLOR_INK, 5); g.vfx.burst(hx, hy, 35, '#5dade2', { speed: 7, life: 600, radius: 5 }); g.vfx.spiralBurst(hx, hy, 16, '#5dade2', { speed: 4, life: 400 }); g.applyAOE(hx, hy, 140, sbOwner.projDamage * 6, sbOwner.id, '#5dade2'); g.camera.shake(5, 200); }, 800); g.vfx.floatingText(o.x, o.y - 50, 'SPIRIT BOMB!', '#5dade2', { fontSize: 20, life: 1500 }); } },
                { id: 'ssb', name: 'Super Saiyan Blue', icon: 'aura', cd: 30000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2.5; }, moveSpeed: function (v) { return v * 1.7; }, reloadTime: function (v) { return v * 0.4; } }, 6000, '#5dade2', 'SSJ BLUE!'); o.hp = o.maxHp; g.vfx.shockwave(o.x, o.y, 200, 600, CONST.COLOR_INK, 5); } },
                { id: 'ultra_instinct', name: 'Ultra Instinct', icon: 'eye', cd: 45000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 500, 0.5); g.vfx.floatingText(o.x, o.y - 70, 'ULTRA INSTINCT!', '#7f8c8d', { fontSize: 26, life: 2500 }); self._buff(o, g, { moveSpeed: function (v) { return v * 2.2; }, projDamage: function (v) { return v * 3; }, reloadTime: function (v) { return v * 0.25; } }, 7000, '#7f8c8d', null); o.invulnTimer = Math.max(o.invulnTimer, 3000); g.vfx.shockwave(o.x, o.y, 300, 1000, CONST.COLOR_INK, 6); g.vfx.spiralBurst(o.x, o.y, 24, '#7f8c8d', { speed: 6, life: 600 }); } }
            ],

            vegeta: [
                { id: 'galick', name: 'Galick Gun', icon: 'beam', cd: 4500, fn: function (o, g) { self._beam(o, g, 400, 12, o.projDamage * 3.5, '#8e44ad', 8); g.vfx.floatingText(o.x, o.y - 50, 'GALICK GUN!', '#8e44ad', { fontSize: 18 }); } },
                { id: 'big_bang', name: 'Big Bang Attack', icon: 'meteor', cd: 8000, fn: function (o, g) { self._bigProj(o, g, { speed: 12, radius: 16, damage: o.projDamage * 4, pen: 1, color: '#c9a84c', lifetime: 2000 }); g.vfx.ring(o.x + Math.cos(o.angle) * 35, o.y + Math.sin(o.angle) * 35, 6, '#c9a84c', { speed: 2, radius: 3, life: 200 }); g.vfx.floatingText(o.x, o.y - 50, 'BIG BANG!', '#c9a84c', { fontSize: 18 }); } },
                { id: 'ssj_v', name: 'Super Saiyan', icon: 'aura', cd: 22000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2; }, moveSpeed: function (v) { return v * 1.4; } }, 6000, '#c9a84c', 'SUPER SAIYAN!'); g.vfx.shockwave(o.x, o.y, 150, 500, CONST.COLOR_INK, 4); } },
                { id: 'final_flash', name: 'Final Flash', icon: 'beam', cd: 16000, fn: function (o, g) { self._beam(o, g, 550, 20, o.projDamage * 7, '#c9a84c', 12); g.vfx.screenFlashEffect('#f5f0e8', 200, 0.2); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 50, 'FINAL FLASH!', '#c9a84c', { fontSize: 22, life: 1500 }); } },
                { id: 'ultra_ego', name: 'Ultra Ego', icon: 'aura', cd: 28000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 3; }, moveSpeed: function (v) { return v * 1.3; } }, 6000, '#8e44ad', 'ULTRA EGO!'); o.hp = o.maxHp; g.vfx.shockwave(o.x, o.y, 200, 600, CONST.COLOR_INK, 5); } },
                { id: 'hakai', name: 'Hakai', icon: 'skull', cd: 40000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 500, 0.4); g.vfx.floatingText(o.x, o.y - 70, 'HAKAI!', '#8e44ad', { fontSize: 28, life: 2000 }); g.vfx.shockwave(o.x, o.y, 350, 1000, CONST.COLOR_INK, 6); g.vfx.spiralBurst(o.x, o.y, 20, '#8e44ad', { speed: 7, life: 600 }); g.applyAOE(o.x, o.y, 300, o.projDamage * 10, o.id, '#8e44ad'); g.camera.shake(5, 200); } }
            ],

            gohan: [
                { id: 'masenko', name: 'Masenko', icon: 'beam', cd: 4000, fn: function (o, g) { self._beam(o, g, 350, 10, o.projDamage * 3, '#7d3c98', 7); g.vfx.floatingText(o.x, o.y - 50, 'MASENKO!', '#7d3c98', { fontSize: 16 }); } },
                { id: 'ssj2', name: 'SSJ2 Rage', icon: 'aura', cd: 12000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2; }, moveSpeed: function (v) { return v * 1.4; } }, 5000, '#c9a84c', 'SSJ2!'); g.vfx.shockwave(o.x, o.y, 120, 400, CONST.COLOR_INK); g.vfx.burst(o.x, o.y, 15, '#c9a84c', { speed: 5, life: 300, radius: 3 }); } },
                { id: 'father_son', name: 'Father-Son Kame', icon: 'beam', cd: 16000, fn: function (o, g) { self._beam(o, g, 500, 18, o.projDamage * 6, '#5dade2', 10); g.vfx.screenFlashEffect('#f5f0e8', 200, 0.2); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 50, 'FATHER-SON KAME!', '#5dade2', { fontSize: 18, life: 1200 }); } },
                { id: 'ultimate_form', name: 'Ultimate Form', icon: 'aura', cd: 22000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2.5; }, moveSpeed: function (v) { return v * 1.5; }, reloadTime: function (v) { return v * 0.5; } }, 6000, '#7d3c98', 'ULTIMATE!'); o.hp = o.maxHp; } },
                { id: 'beast', name: 'Beast Gohan', icon: 'aura', cd: 30000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 3; }, moveSpeed: function (v) { return v * 1.8; }, reloadTime: function (v) { return v * 0.3; } }, 6000, '#c0392b', 'BEAST!'); o.hp = o.maxHp; g.vfx.shockwave(o.x, o.y, 250, 700, CONST.COLOR_INK, 5); g.vfx.burst(o.x, o.y, 25, '#c0392b', { speed: 6, life: 500, radius: 4 }); } },
                { id: 'orange_kame', name: 'Orange Kamehameha', icon: 'beam', cd: 40000, fn: function (o, g) { self._beam(o, g, 600, 25, o.projDamage * 10, '#d35400', 14); g.vfx.screenFlashEffect('#f5f0e8', 400, 0.35); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 60, 'ORANGE KAME!', '#d35400', { fontSize: 22, life: 1500 }); } }
            ],

            frieza: [
                { id: 'death_beam', name: 'Death Beam', icon: 'beam', cd: 3000, fn: function (o, g) { self._beam(o, g, 400, 4, o.projDamage * 2.5, '#8e44ad', 8); } },
                { id: 'death_ball', name: 'Death Ball', icon: 'meteor', cd: 10000, fn: function (o, g) { self._bigProj(o, g, { speed: 7, radius: 22, damage: o.projDamage * 5, pen: 1, color: '#8e44ad', lifetime: 3000 }); g.vfx.chargeGlow(o.x + Math.cos(o.angle) * 35, o.y + Math.sin(o.angle) * 35, 25, 300, '#8e44ad'); g.vfx.floatingText(o.x, o.y - 50, 'DEATH BALL!', '#8e44ad', { fontSize: 18 }); } },
                { id: 'golden', name: 'Golden Frieza', icon: 'aura', cd: 22000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2.2; }, moveSpeed: function (v) { return v * 1.5; }, reloadTime: function (v) { return v * 0.5; } }, 6000, '#c9a84c', 'GOLDEN FORM!'); g.vfx.shockwave(o.x, o.y, 180, 600, CONST.COLOR_INK, 5); } },
                { id: 'death_saucer', name: 'Death Saucer', icon: 'spiral', cd: 12000, fn: function (o, g) { self._bigProj(o, g, { speed: 11, radius: 10, damage: o.projDamage * 2.5, pen: 5, color: '#8e44ad', lifetime: 2000 }); self._bigProj(o, g, { speed: 11, radius: 10, damage: o.projDamage * 2.5, pen: 5, color: '#d2b4de', lifetime: 2000 }); } },
                { id: 'cage', name: 'Cage of Light', icon: 'domain', cd: 20000, fn: function (o, g) { self._aimedAOE(o, g, 180, 100, o.projDamage * 3.5, '#8e44ad'); g.vfx.ring(o.x + Math.cos(o.angle) * 180, o.y + Math.sin(o.angle) * 180, 12, '#8e44ad', { speed: 3, radius: 2, life: 500 }); } },
                { id: 'black_frieza', name: 'Black Frieza', icon: 'skull', cd: 40000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 500, 0.4); g.vfx.floatingText(o.x, o.y - 70, 'BLACK FRIEZA!', '#1a1a1a', { fontSize: 26, life: 2000 }); self._buff(o, g, { projDamage: function (v) { return v * 4; }, moveSpeed: function (v) { return v * 2; }, reloadTime: function (v) { return v * 0.2; } }, 5000, '#1a1a1a', null); o.hp = o.maxHp; g.vfx.shockwave(o.x, o.y, 300, 1000, CONST.COLOR_INK, 6); var sh = g.getShapesInRadius(o.x, o.y, 300); for (var i = 0; i < sh.length; i++) { sh[i].takeDamage(9999, o); if (!sh[i].alive) { o.addXp(sh[i].xpValue); g.vfx.shapeDestroy(sh[i].x, sh[i].y, sh[i].color); } } } }
            ],

            // =============================================================
            // BLEACH
            // =============================================================
            ichigo: [
                { id: 'getsuga', name: 'Getsuga Tensho', icon: 'moon', cd: 4000, fn: function (o, g) {
                    self._bigProj(o, g, { speed: 12, radius: 12, damage: o.projDamage * 3, pen: 4, color: '#5dade2', lifetime: 1800 });
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * 30, o.y + Math.sin(o.angle) * 30, o.angle, { length: 80, width: 18, color: '#5dade2', duration: 250, curve: 0.3 });
                    g.vfx.floatingText(o.x, o.y - 50, 'GETSUGA TENSHO!', '#5dade2', { fontSize: 16 });
                }},
                { id: 'flash_step', name: 'Flash Step', icon: 'dash', cd: 6000, fn: function (o, g) { self._dash(o, g, 280, '#d35400', o.projDamage * 0.4); g.vfx.floatingText(o.x, o.y - 50, 'SHUNPO!', '#d35400', { fontSize: 14 }); } },
                { id: 'bankai_i', name: 'Bankai: Tensa Zangetsu', icon: 'aura', cd: 22000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2; }, moveSpeed: function (v) { return v * 1.8; }, reloadTime: function (v) { return v * 0.4; } }, 6000, '#1a1a1a', 'BANKAI!'); g.vfx.shockwave(o.x, o.y, 150, 500, CONST.COLOR_INK, 4); } },
                { id: 'black_getsuga', name: 'Black Getsuga', icon: 'slash', cd: 12000, fn: function (o, g) {
                    self._bigProj(o, g, { speed: 14, radius: 18, damage: o.projDamage * 5, pen: 5, color: '#1a1a1a', lifetime: 2000 });
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * 30, o.y + Math.sin(o.angle) * 30, o.angle, { length: 120, width: 25, color: '#c0392b', duration: 300, fadeStyle: 'linger', curve: 0.4 });
                    g.vfx.directionalBurst(o.x, o.y, o.angle, 0.3, 12, '#1a1a1a', { speed: 5, life: 300 });
                    g.vfx.floatingText(o.x, o.y - 50, 'BLACK GETSUGA!', '#c0392b', { fontSize: 18 });
                }},
                { id: 'hollow_mask', name: 'Hollow Mask', icon: 'skull', cd: 25000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2.5; }, moveSpeed: function (v) { return v * 1.3; } }, 5000, '#d35400', 'HOLLOW MASK!'); } },
                { id: 'mugetsu', name: 'Mugetsu', icon: 'moon', cd: 45000, fn: function (o, g) {
                    self._beam(o, g, 600, 30, o.projDamage * 12, '#1a1a1a', 14);
                    if (typeof SlashVFX !== 'undefined') {
                        SlashVFX.createSlash(g, o.x, o.y, o.angle, { length: 300, width: 40, color: '#1a1a1a', duration: 700, fadeStyle: 'linger' });
                        SlashVFX.createSlash(g, o.x + Math.cos(o.angle) * 200, o.y + Math.sin(o.angle) * 200, o.angle, { length: 250, width: 35, color: '#c0392b', duration: 600, delay: 100, fadeStyle: 'linger' });
                    }
                    g.vfx.screenFlashEffect('#f5f0e8', 500, 0.5);
                    g.vfx.shockwave(o.x, o.y, 300, 800, CONST.COLOR_INK, 6);
                    g.camera.shake(5, 200);
                    g.vfx.floatingText(o.x, o.y - 70, 'MUGETSU!', '#1a1a1a', { fontSize: 28, life: 2000 });
                }}
            ],

            byakuya: [
                { id: 'scatter', name: 'Senbonzakura', icon: 'petal', cd: 4000, fn: function (o, g) {
                    for (var i = 0; i < 10; i++) self._bigProj(o, g, { speed: 7 + Math.random() * 4, radius: 4, damage: o.projDamage * 0.5, pen: 1, color: '#7d3c98', lifetime: 1200 });
                    // Petal particles
                    for (var j = 0; j < 8; j++) g.vfx.spawnParticle({ x: o.x + (Math.random() - 0.5) * 30, y: o.y + (Math.random() - 0.5) * 30, vx: Math.cos(o.angle) * (3 + Math.random() * 3) + (Math.random() - 0.5) * 2, vy: Math.sin(o.angle) * (3 + Math.random() * 3) + (Math.random() - 0.5) * 2, radius: 3, endRadius: 0, color: '#d2b4de', maxLife: 500, shape: 'square', rotationSpeed: 0.1 + Math.random() * 0.1, friction: 0.97 });
                    g.vfx.floatingText(o.x, o.y - 50, 'SENBONZAKURA!', '#7d3c98', { fontSize: 16 });
                }},
                { id: 'petal_storm', name: 'Petal Storm', icon: 'tornado', cd: 8000, fn: function (o, g) {
                    g.vfx.ring(o.x, o.y, 30, '#d2b4de', { speed: 5, radius: 3, life: 500 });
                    g.applyAOE(o.x, o.y, 120, o.projDamage * 2.5, o.id, '#7d3c98');
                    g.vfx.spiralBurst(o.x, o.y, 20, '#d2b4de', { speed: 4, life: 400 });
                    // Extra petal swirl
                    for (var i = 0; i < 12; i++) { var a = (Math.PI * 2 / 12) * i; g.vfx.spawnParticle({ x: o.x + Math.cos(a) * 60, y: o.y + Math.sin(a) * 60, vx: Math.cos(a + 1) * 3, vy: Math.sin(a + 1) * 3, radius: 3, endRadius: 0, color: '#d2b4de', maxLife: 600, shape: 'square', rotationSpeed: 0.12, friction: 0.97 }); }
                    g.vfx.floatingText(o.x, o.y - 50, 'PETAL STORM!', '#7d3c98', { fontSize: 16 });
                }},
                { id: 'bankai_b', name: 'Bankai: Kageyoshi', icon: 'aura', cd: 22000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2.2; }, moveSpeed: function (v) { return v * 1.3; } }, 6000, '#7d3c98', 'BANKAI!'); g.vfx.shockwave(o.x, o.y, 180, 600, CONST.COLOR_INK, 4); g.vfx.burst(o.x, o.y, 20, '#d2b4de', { speed: 4, life: 400, radius: 3 }); } },
                { id: 'gokei', name: 'Gokei', icon: 'impact', cd: 15000, fn: function (o, g) { g.vfx.shockwave(o.x, o.y, 180, 500, CONST.COLOR_INK, 5); g.vfx.spiralBurst(o.x, o.y, 30, '#d2b4de', { speed: 6, life: 500 }); g.applyAOE(o.x, o.y, 160, o.projDamage * 4, o.id, '#7d3c98'); g.camera.shake(4, 150); g.vfx.floatingText(o.x, o.y - 50, 'GOKEI!', '#7d3c98', { fontSize: 20, life: 1200 }); } },
                { id: 'senkei', name: 'Senkei', icon: 'aura', cd: 25000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 3; }, moveSpeed: function (v) { return v * 1.5; } }, 5000, '#7d3c98', 'SENKEI!'); if (typeof SlashVFX !== 'undefined') SlashVFX.createSlashRing(g, o.x, o.y, 8, { length: 60, width: 10, color: '#d2b4de', duration: 500, fadeStyle: 'linger' }); } },
                { id: 'hakuteiken', name: 'Hakuteiken', icon: 'star', cd: 40000, fn: function (o, g) {
                    self._beam(o, g, 500, 20, o.projDamage * 10, '#d2b4de', 12);
                    if (typeof SlashVFX !== 'undefined') SlashVFX.createSlash(g, o.x, o.y, o.angle, { length: 250, width: 30, color: '#d2b4de', duration: 500, fadeStyle: 'linger' });
                    g.vfx.screenFlashEffect('#f5f0e8', 400, 0.3);
                    g.camera.shake(5, 200);
                    g.vfx.floatingText(o.x, o.y - 60, 'HAKUTEIKEN!', '#7d3c98', { fontSize: 24, life: 1500 });
                }}
            ],

            aizen: [
                { id: 'kurohitsugi', name: 'Kurohitsugi', icon: 'domain', cd: 5000, fn: function (o, g) { self._aimedAOE(o, g, 200, 60, o.projDamage * 2.5, '#1a1a1a'); g.vfx.burst(o.x + Math.cos(o.angle) * 200, o.y + Math.sin(o.angle) * 200, 12, '#1a1a1a', { speed: 2, life: 400, radius: 3 }); g.vfx.floatingText(o.x, o.y - 50, 'KUROHITSUGI!', '#6e4b1e', { fontSize: 16 }); } },
                { id: 'kyoka', name: 'Kyoka Suigetsu', icon: 'eye', cd: 15000, fn: function (o, g) {
                    var en = g.getEnemiesInRadius(o.x, o.y, 400, o.id);
                    if (en.length > 0) {
                        g.vfx.afterimage(o.x, o.y, o.radius, '#6e4b1e', o.angle);
                        g.vfx.burst(o.x, o.y, 8, '#c9a84c', { speed: 3, life: 200, radius: 2 });
                        var t2 = en[0]; var behind = Utils.angleBetween(o.x, o.y, t2.x, t2.y);
                        o.x = t2.x + Math.cos(behind + Math.PI) * 80; o.y = t2.y + Math.sin(behind + Math.PI) * 80;
                        o.clampToMap(); o.angle = Utils.angleBetween(o.x, o.y, t2.x, t2.y);
                        t2.takeDamage(o.projDamage * 3, o); if (!t2.alive) g.handleKill(o, t2);
                    }
                    g.vfx.floatingText(o.x, o.y - 50, 'ILLUSION!', '#6e4b1e', { fontSize: 16 });
                }},
                { id: 'reiatsu', name: 'Reiatsu Crush', icon: 'impact', cd: 14000, fn: function (o, g) { g.vfx.shockwave(o.x, o.y, 180, 500, CONST.COLOR_INK, 5); var en = g.getEnemiesInRadius(o.x, o.y, 180, o.id); for (var i = 0; i < en.length; i++) { en[i].takeDamage(o.projDamage * 2.5, o); en[i].vx *= 0.2; en[i].vy *= 0.2; if (!en[i].alive) g.handleKill(o, en[i]); } g.vfx.burst(o.x, o.y, 20, '#6e4b1e', { speed: 5, life: 400, radius: 4 }); g.vfx.floatingText(o.x, o.y - 50, 'REIATSU!', '#6e4b1e', { fontSize: 18 }); } },
                { id: 'hado99', name: 'Hado #99', icon: 'beam', cd: 18000, fn: function (o, g) { self._beam(o, g, 450, 16, o.projDamage * 6, '#6e4b1e', 10); g.camera.shake(4, 150); g.vfx.floatingText(o.x, o.y - 50, 'HADO #99!', '#6e4b1e', { fontSize: 18 }); } },
                { id: 'chrysalis', name: 'Chrysalis Form', icon: 'aura', cd: 28000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2.5; }, moveSpeed: function (v) { return v * 1.5; } }, 6000, '#6e4b1e', 'EVOLUTION!'); self._shield(o, g, 0.3, 6000, '#6e4b1e', null); } },
                { id: 'hogyoku', name: 'Hogyoku: Final Form', icon: 'gem', cd: 45000, fn: function (o, g) { g.vfx.screenFlashEffect('#f5f0e8', 600, 0.5); g.vfx.floatingText(o.x, o.y - 70, 'HOGYOKU!', '#6e4b1e', { fontSize: 26, life: 2500 }); self._buff(o, g, { projDamage: function (v) { return v * 4; }, moveSpeed: function (v) { return v * 2; }, reloadTime: function (v) { return v * 0.2; } }, 7000, null, null); o.hp = o.maxHp; o.invulnTimer = Math.max(o.invulnTimer, 3000); g.vfx.shockwave(o.x, o.y, 400, 1200, CONST.COLOR_INK, 6); g.vfx.spiralBurst(o.x, o.y, 30, '#c9a84c', { speed: 9, life: 800 }); g.applyAOE(o.x, o.y, 300, o.projDamage * 6, o.id, '#6e4b1e'); g.camera.shake(5, 200); } }
            ]
        };

        if (all[cid]) return all[cid];

        // Generic fallback
        var colorMap = {
            luffy: '#c0392b', zoro: '#27ae60', sanji: '#d4a843', ace: '#d35400',
            jotaro: '#2c3e8c', dio: '#c9a84c', giorno: '#b03060',
            gojo: '#5dade2', yuji: '#c0392b', megumi: '#2c3e50', sukuna: '#922b21',
            naruto: '#d35400', sasuke: '#2c3e50', kakashi: '#7f8c8d', madara: '#641e16',
            deku: '#27ae60', bakugo: '#d35400', todoroki: '#2c3e8c',
            goku: '#d35400', vegeta: '#2c3e8c', gohan: '#7d3c98', frieza: '#8e44ad',
            ichigo: '#d35400', byakuya: '#7d3c98', aizen: '#6e4b1e'
        };
        var cc = colorMap[cid] || '#1a1a1a';
        return [
            { id: 'strike', name: 'Power Strike', icon: 'fist', cd: 3000, fn: function (o, g) { self._aimedAOE(o, g, 140, 55, o.projDamage * 2.5, cc); } },
            { id: 'dash', name: 'Quick Dash', icon: 'dash', cd: 7000, fn: function (o, g) { self._dash(o, g, 250, cc, o.projDamage * 0.5); } },
            { id: 'power', name: 'Power Up', icon: 'aura', cd: 18000, fn: function (o, g) { self._buff(o, g, { projDamage: function (v) { return v * 2; }, moveSpeed: function (v) { return v * 1.5; } }, 5000, cc, 'POWER UP!'); } },
            { id: 'blast', name: 'Energy Blast', icon: 'beam', cd: 12000, fn: function (o, g) { self._beam(o, g, 400, 12, o.projDamage * 4, cc, 8); g.camera.shake(3, 150); } },
            { id: 'guard', name: 'Guard', icon: 'shield', cd: 22000, fn: function (o, g) { self._shield(o, g, 0.3, 5000, cc, 'GUARD!'); } },
            { id: 'ult', name: 'Ultimate', icon: 'explosion', cd: 35000, fn: function (o, g) { g.applyAOE(o.x, o.y, 250, o.projDamage * 8, o.id, cc); g.vfx.shockwave(o.x, o.y, 250, 700, CONST.COLOR_INK, 5); g.vfx.burst(o.x, o.y, 35, cc, { speed: 7, life: 600, radius: 5 }); g.vfx.screenFlashEffect('#f5f0e8', 300, 0.25); g.camera.shake(5, 200); g.vfx.floatingText(o.x, o.y - 60, 'ULTIMATE!', cc, { fontSize: 24, life: 1500 }); } }
        ];
    }
};

AbilityData.init();
var WeaponTypes = {
    RANGED: 'ranged',
    FIST: 'fist',
    SWORD: 'sword'
};

// Map each character to their weapon type
var CharacterWeapons = {
    // FIST fighters
    luffy: WeaponTypes.FIST,
    jotaro: WeaponTypes.FIST,
    dio: WeaponTypes.FIST,
    giorno: WeaponTypes.FIST,
    yuji: WeaponTypes.FIST,
    deku: WeaponTypes.FIST,
    bakugo: WeaponTypes.FIST,
    goku: WeaponTypes.FIST,
    vegeta: WeaponTypes.FIST,
    gohan: WeaponTypes.FIST,
    sukuna: WeaponTypes.FIST,
    gojo: WeaponTypes.FIST,

    // SWORD fighters
    zoro: WeaponTypes.SWORD,
    ichigo: WeaponTypes.SWORD,
    byakuya: WeaponTypes.SWORD,
    sasuke: WeaponTypes.SWORD,
    madara: WeaponTypes.SWORD,
    aizen: WeaponTypes.SWORD,
    kakashi: WeaponTypes.SWORD,

    // RANGED fighters (keep barrel)
    sanji: WeaponTypes.FIST,  // kicks but fist-style
    ace: WeaponTypes.RANGED,
    megumi: WeaponTypes.RANGED,
    naruto: WeaponTypes.RANGED,
    todoroki: WeaponTypes.RANGED,
    frieza: WeaponTypes.RANGED
};

var WeaponSystem = {

    getWeaponType: function (characterId) {
        return CharacterWeapons[characterId] || WeaponTypes.RANGED;
    },

    // =========================================================
    // FIST ATTACK — short range punch with impact
    // =========================================================
    fistAttack: function (owner, game) {
        var now = Utils.now();
        if (now - owner.lastShotTime < owner.reloadTime) return;
        owner.lastShotTime = now;
        owner.barrelRecoil = 8;

        var range = 65 + owner.radius;
        var damage = owner.projDamage * 1.4;
        var hx = owner.x + Math.cos(owner.angle) * range;
        var hy = owner.y + Math.sin(owner.angle) * range;
        var color = owner.characterData ? owner.characterData.color : owner.color;

        // Damage in front
        var enemies = game.getEnemiesInRadius(hx, hy, 45, owner.id);
        for (var i = 0; i < enemies.length; i++) {
            enemies[i].takeDamage(damage, owner);
            // Knockback
            var kb = Utils.angleBetween(owner.x, owner.y, enemies[i].x, enemies[i].y);
            enemies[i].vx += Math.cos(kb) * 3;
            enemies[i].vy += Math.sin(kb) * 3;
            game.vfx.floatingText(enemies[i].x, enemies[i].y - enemies[i].radius - 10,
                '-' + Math.floor(damage), '#c0392b', { fontSize: 14 });
            if (!enemies[i].alive) game.handleKill(owner, enemies[i]);
        }

        // Damage shapes in front
        var shapes = game.getShapesInRadius(hx, hy, 45);
        for (var j = 0; j < shapes.length; j++) {
            shapes[j].takeDamage(damage, owner);
            var kba = Utils.angleBetween(owner.x, owner.y, shapes[j].x, shapes[j].y);
            shapes[j].applyKnockback(kba, 4);
            if (!shapes[j].alive) {
                owner.addXp(shapes[j].xpValue);
                game.vfx.floatingText(shapes[j].x, shapes[j].y - 20, '+' + shapes[j].xpValue + ' XP', '#c9a84c', { fontSize: 12 });
                game.vfx.shapeDestroy(shapes[j].x, shapes[j].y, shapes[j].color);
            }
        }

        // Fist impact VFX
        game.vfx.burst(hx, hy, 4, color, { speed: 3, life: 120, radius: 2 });
            if (game.sound) game.sound.punch();

        // Impact mark if hit something
        if (enemies.length > 0 || shapes.length > 0) {
            game.vfx.impactSpark(hx, hy, color);
            game.camera.shake(1, 40);
            if (typeof SlashVFX !== 'undefined') {
                SlashVFX.createSlash(game, hx, hy, owner.angle + (Math.random() - 0.5) * 0.4, {
                    length: 30 + Math.random() * 15, width: 16 + Math.random() * 8,
                    color: color, duration: 100, curve: 0, fadeStyle: 'flash'
                });
            }
        }

        // Punch lunge
        owner.vx += Math.cos(owner.angle) * 1.5;
        owner.vy += Math.sin(owner.angle) * 1.5;
    },

    // =========================================================
    // SWORD ATTACK — forward arc slash
    // =========================================================
    swordAttack: function (owner, game) {
        var now = Utils.now();
        if (now - owner.lastShotTime < owner.reloadTime) return;
        owner.lastShotTime = now;
        owner.barrelRecoil = 6;
        owner._swordSwing = 1; // trigger swing animation

        var range = 80 + owner.radius;
        var arcWidth = 0.8; // radians of arc coverage
        var damage = owner.projDamage * 1.3;
        var color = owner.characterData ? owner.characterData.color : owner.color;

        // Check everything in arc
        var checkRadius = range + 20;
        var enemies = game.getEnemiesInRadius(owner.x, owner.y, checkRadius, owner.id);
        var hitSomething = false;

        for (var i = 0; i < enemies.length; i++) {
            var eAngle = Utils.angleBetween(owner.x, owner.y, enemies[i].x, enemies[i].y);
            var diff = Math.abs(Utils.normalizeAngle(eAngle - owner.angle));
            var dist = Utils.dist(owner.x, owner.y, enemies[i].x, enemies[i].y);
            if (diff < arcWidth / 2 && dist < range) {
                enemies[i].takeDamage(damage, owner);
                var kb = Utils.angleBetween(owner.x, owner.y, enemies[i].x, enemies[i].y);
                enemies[i].vx += Math.cos(kb) * 4;
                enemies[i].vy += Math.sin(kb) * 4;
                game.vfx.floatingText(enemies[i].x, enemies[i].y - enemies[i].radius - 10,
                    '-' + Math.floor(damage), '#c0392b', { fontSize: 14 });
                if (!enemies[i].alive) game.handleKill(owner, enemies[i]);
                hitSomething = true;
            }
        }

        // Shapes in arc
        var shapes = game.getShapesInRadius(owner.x, owner.y, checkRadius);
        for (var j = 0; j < shapes.length; j++) {
            var sAngle = Utils.angleBetween(owner.x, owner.y, shapes[j].x, shapes[j].y);
            var sDiff = Math.abs(Utils.normalizeAngle(sAngle - owner.angle));
            var sDist = Utils.dist(owner.x, owner.y, shapes[j].x, shapes[j].y);
            if (sDiff < arcWidth / 2 && sDist < range) {
                shapes[j].takeDamage(damage, owner);
                shapes[j].applyKnockback(Utils.angleBetween(owner.x, owner.y, shapes[j].x, shapes[j].y), 5);
                if (!shapes[j].alive) {
                    owner.addXp(shapes[j].xpValue);
                    game.vfx.floatingText(shapes[j].x, shapes[j].y - 20, '+' + shapes[j].xpValue + ' XP', '#c9a84c', { fontSize: 12 });
                    game.vfx.shapeDestroy(shapes[j].x, shapes[j].y, shapes[j].color);
                }
                hitSomething = true;
            }
        }

        // Slash arc VFX
        var slashX = owner.x + Math.cos(owner.angle) * (owner.radius + 20);
        var slashY = owner.y + Math.sin(owner.angle) * (owner.radius + 20);
        if (typeof SlashVFX !== 'undefined') {
            var curve = (owner._swordAlt || 0) % 2 === 0 ? 0.5 : -0.5;
            SlashVFX.createSlash(game, slashX, slashY, owner.angle, {
                length: range * 0.8, width: 16, color: color,
                duration: 180, curve: curve, fadeStyle: 'normal'
            });
            owner._swordAlt = (owner._swordAlt || 0) + 1;
        }

        // Slash particles
        if (hitSomething) {
            game.vfx.impactSpark(slashX, slashY, color);
            game.camera.shake(1, 40);
        }

        // Small lunge
        owner.vx += Math.cos(owner.angle) * 1;
        owner.vy += Math.sin(owner.angle) * 1;
    },

    // =========================================================
    // RENDER WEAPON (replaces barrel rendering)
    // =========================================================
    renderWeapon: function (ctx, owner, weaponType) {
        var flash = owner.damageFlashTimer > 0;
        var color = owner.characterData ? owner.characterData.color : owner.color;
        var barrelColor = flash ? CONST.COLOR_PAPER : (owner.barrelColor || color);

        if (weaponType === WeaponTypes.FIST) {
            WeaponSystem._renderFists(ctx, owner, barrelColor);
        } else if (weaponType === WeaponTypes.SWORD) {
            WeaponSystem._renderSword(ctx, owner, barrelColor, color);
        } else {
            WeaponSystem._renderBarrel(ctx, owner, barrelColor);
        }
    },

    // =========================================================
    // RENDER: Fists
    // =========================================================
    _renderFists: function (ctx, owner, color) {
        var recoil = Math.max(0, owner.barrelRecoil);
        var punchExtend = recoil * 2;
        var r = owner.radius;
        var fistSize = 9;

        ctx.save();
        ctx.translate(owner.x, owner.y);
        ctx.rotate(owner.angle);

        // Left fist
        var leftX = r + 8 + punchExtend * 0.7;
        var leftY = -12;
        // Right fist (main punch)
        var rightX = r + 12 + punchExtend;
        var rightY = 8;

        // Arm lines
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        // Left arm
        ctx.beginPath();
        ctx.moveTo(r * 0.3, -r * 0.5);
        ctx.lineTo(leftX - fistSize, leftY);
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(r * 0.3, r * 0.5);
        ctx.lineTo(rightX - fistSize, rightY);
        ctx.stroke();

        // Left fist shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(leftX + 2, leftY + 2, fistSize, 0, Math.PI * 2);
        ctx.fill();

        // Left fist
        ctx.fillStyle = color;
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(leftX, leftY, fistSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right fist shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(rightX + 2, rightY + 2, fistSize + 1, 0, Math.PI * 2);
        ctx.fill();

        // Right fist
        ctx.fillStyle = color;
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rightX, rightY, fistSize + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Knuckle lines on right fist
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        for (var i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(rightX + fistSize * 0.5, rightY + i * 3, 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Highlight on fists
        ctx.fillStyle = 'rgba(245,240,232,0.3)';
        ctx.beginPath();
        ctx.arc(leftX - 2, leftY - 2, fistSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightX - 2, rightY - 2, fistSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // =========================================================
    // RENDER: Sword / Katana
    // =========================================================
    _renderSword: function (ctx, owner, barrelColor, bladeColor) {
        var recoil = Math.max(0, owner.barrelRecoil);
        var r = owner.radius;
        var bladeLength = 45 + r * 0.3;
        var handleLength = 14;
        var bladeWidth = 5;
        var swingOffset = 0;

        // Swing animation
        if (owner._swordSwing && owner._swordSwing > 0) {
            swingOffset = Math.sin(owner._swordSwing * Math.PI) * 0.4;
            owner._swordSwing -= 0.08;
            if (owner._swordSwing <= 0) owner._swordSwing = 0;
        }

        ctx.save();
        ctx.translate(owner.x, owner.y);
        ctx.rotate(owner.angle + swingOffset);

        var startX = r - 2;

        // Handle shadow
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(startX + 2, -3 + 2, handleLength, 6);

        // Handle (tsuka)
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 1.5;
        ctx.fillRect(startX, -3, handleLength, 6);
        ctx.strokeRect(startX, -3, handleLength, 6);

        // Handle wrap pattern
        ctx.strokeStyle = '#c9c9c9';
        ctx.lineWidth = 1;
        for (var i = 0; i < 4; i++) {
            var wx = startX + 2 + i * 3.5;
            ctx.beginPath();
            ctx.moveTo(wx, -3);
            ctx.lineTo(wx + 2, 3);
            ctx.stroke();
        }

        // Tsuba (guard) — oval
        var guardX = startX + handleLength;
        ctx.fillStyle = '#111111';
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(guardX, 0, 3, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Blade shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.beginPath();
        ctx.moveTo(guardX + 2 + 2, -bladeWidth / 2 + 2);
        ctx.lineTo(guardX + bladeLength - recoil + 2, -1 + 2);
        ctx.lineTo(guardX + bladeLength + 4 - recoil + 2, 0 + 2);
        ctx.lineTo(guardX + bladeLength - recoil + 2, 1 + 2);
        ctx.lineTo(guardX + 2 + 2, bladeWidth / 2 + 2);
        ctx.closePath();
        ctx.fill();

        // Blade
        ctx.fillStyle = '#030303';
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(guardX + 2, -bladeWidth / 2);
        ctx.lineTo(guardX + bladeLength - recoil, -1);
        ctx.lineTo(guardX + bladeLength + 4 - recoil, 0); // tip
        ctx.lineTo(guardX + bladeLength - recoil, 1);
        ctx.lineTo(guardX + 2, bladeWidth / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Hamon line (temper line on blade)
        ctx.strokeStyle = 'rgba(26,26,26,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(guardX + 6, 0);
        var hamonLen = bladeLength - recoil - 8;
        for (var h = 0; h < hamonLen; h += 4) {
            var hy2 = Math.sin(h * 0.3) * 1.5;
            ctx.lineTo(guardX + 6 + h, hy2 - bladeWidth * 0.15);
        }
        ctx.stroke();

        // Blade edge highlight
        ctx.strokeStyle = 'rgba(231, 231, 231, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(guardX + 4, -bladeWidth / 2 + 0.5);
        ctx.lineTo(guardX + bladeLength - recoil - 4, -0.5);
        ctx.stroke();

        // Blade color tint (subtle character color)
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = bladeColor;
        ctx.beginPath();
        ctx.moveTo(guardX + 2, -bladeWidth / 2);
        ctx.lineTo(guardX + bladeLength - recoil, -1);
        ctx.lineTo(guardX + bladeLength + 4 - recoil, 0);
        ctx.lineTo(guardX + bladeLength - recoil, 1);
        ctx.lineTo(guardX + 2, bladeWidth / 2);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();
    },

    // =========================================================
    // RENDER: Standard Barrel (ranged)
    // =========================================================
    _renderBarrel: function (ctx, owner, color) {
        var ro = Math.max(0, owner.barrelRecoil);
        var bl = CONST.BARREL_LENGTH - ro;

        ctx.save();
        ctx.translate(owner.x, owner.y);
        ctx.rotate(owner.angle);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(owner.radius - 4 + 2, -CONST.BARREL_WIDTH / 2 + 2, bl + 4, CONST.BARREL_WIDTH);

        // Barrel
        ctx.fillStyle = color;
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 2;
        ctx.fillRect(owner.radius - 4, -CONST.BARREL_WIDTH / 2, bl + 4, CONST.BARREL_WIDTH);
        ctx.strokeRect(owner.radius - 4, -CONST.BARREL_WIDTH / 2, bl + 4, CONST.BARREL_WIDTH);

        ctx.restore();
    }
};
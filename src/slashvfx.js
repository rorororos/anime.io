var SlashVFX = {
    // Create a slash entity that animates
    createSlash: function (game, x, y, angle, opts) {
        opts = opts || {};
        var length = opts.length || 120;
        var width = opts.width || 30;
        var duration = opts.duration || 250;
        var color = opts.color || '#1a1a1a';
        var curve = opts.curve || 0.4; // arc curvature
        var delay = opts.delay || 0;
        var fadeStyle = opts.fadeStyle || 'normal'; // 'normal', 'linger', 'flash'

        game.abilityEntities.push({
            x: x, y: y, angle: angle,
            length: length, width: width,
            color: color, curve: curve,
            life: -delay, duration: duration,
            fadeStyle: fadeStyle,
            alive: true,

            update: function (dt) {
                this.life += dt;
                if (this.life >= this.duration) this.alive = false;
            },

            render: function (ctx, camera) {
                if (this.life < 0) return; // still in delay
                if (!camera.isVisible(this.x, this.y, this.length + 50)) return;

                var t = this.life / this.duration;
                var drawT = Math.min(1, t * 3); // slash draws quickly
                var alpha;

                if (this.fadeStyle === 'linger') {
                    alpha = t < 0.3 ? 1 : (1 - (t - 0.3) / 0.7) * 0.8;
                } else if (this.fadeStyle === 'flash') {
                    alpha = t < 0.15 ? t / 0.15 : (1 - t) * 0.9;
                } else {
                    alpha = (1 - t);
                }

                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.globalAlpha = alpha;

                // Main slash arc
                var halfLen = this.length * drawT / 2;
                var w = this.width * (1 - t * 0.5);

                // Draw curved slash using bezier
                ctx.beginPath();
                ctx.moveTo(-halfLen, -w / 2);

                // Top curve
                ctx.bezierCurveTo(
                    -halfLen * 0.3, -w / 2 - this.curve * w * 2,
                    halfLen * 0.3, -w / 2 - this.curve * w * 2,
                    halfLen, -w * 0.1
                );

                // Tip
                ctx.lineTo(halfLen + w * 0.3, 0);

                // Bottom curve (mirror)
                ctx.lineTo(halfLen, w * 0.1);
                ctx.bezierCurveTo(
                    halfLen * 0.3, w / 2 + this.curve * w,
                    -halfLen * 0.3, w / 2 + this.curve * w,
                    -halfLen, w / 2
                );

                ctx.closePath();

                // Fill with gradient
                ctx.fillStyle = this.color;
                ctx.fill();

                // Sharp edge line on top curve
                ctx.strokeStyle = CONST.COLOR_INK;
                ctx.lineWidth = 1.5 * (1 - t);
                ctx.beginPath();
                ctx.moveTo(-halfLen * 0.8, -w / 2);
                ctx.bezierCurveTo(
                    -halfLen * 0.2, -w / 2 - this.curve * w * 2.2,
                    halfLen * 0.2, -w / 2 - this.curve * w * 2.2,
                    halfLen * 0.9, -w * 0.15
                );
                ctx.stroke();

                // Speed lines inside slash
                ctx.strokeStyle = 'rgba(245,240,232,' + (0.4 * (1 - t)) + ')';
                ctx.lineWidth = 1;
                for (var i = 0; i < 4; i++) {
                    var py = -w / 3 + (w / 2) * (i / 3);
                    ctx.beginPath();
                    ctx.moveTo(-halfLen * 0.5 + i * 10, py);
                    ctx.lineTo(halfLen * 0.7 - i * 5, py * 0.5);
                    ctx.stroke();
                }

                ctx.globalAlpha = 1;
                ctx.restore();
            }
        });
    },

    // Cross slash (X pattern)
    createCrossSlash: function (game, x, y, angle, opts) {
        opts = opts || {};
        var o1 = {};
        for (var k in opts) o1[k] = opts[k];
        o1.delay = 0;
        var o2 = {};
        for (var k2 in opts) o2[k2] = opts[k2];
        o2.delay = 80;
        o2.curve = -(opts.curve || 0.4);

        SlashVFX.createSlash(game, x, y, angle - 0.4, o1);
        SlashVFX.createSlash(game, x, y, angle + 0.4, o2);
    },

    // Multi-slash fan
    createSlashFan: function (game, x, y, angle, count, opts) {
        opts = opts || {};
        var spread = opts.spread || 0.8;
        for (var i = 0; i < count; i++) {
            var a = angle + (i - (count - 1) / 2) * (spread / count);
            var o = {};
            for (var k in opts) o[k] = opts[k];
            o.delay = i * 60;
            o.curve = 0.3 + Math.random() * 0.3;
            if (i % 2 === 1) o.curve = -o.curve;
            SlashVFX.createSlash(game, x, y, a, o);
        }
    },

    // Circular slash ring
    createSlashRing: function (game, x, y, count, opts) {
        opts = opts || {};
        for (var i = 0; i < count; i++) {
            var a = (Math.PI * 2 / count) * i;
            var o = {};
            for (var k in opts) o[k] = opts[k];
            o.delay = i * 30;
            o.length = opts.length || 80;
            SlashVFX.createSlash(game, x + Math.cos(a) * 30, y + Math.sin(a) * 30, a, o);
        }
    },

    // Spawn slash particles (ink splatter along slash)
    slashParticles: function (game, x, y, angle, length, color) {
        color = color || '#1a1a1a';
        for (var i = 0; i < 8; i++) {
            var t = Math.random();
            var px = x + Math.cos(angle) * length * (t - 0.5);
            var py = y + Math.sin(angle) * length * (t - 0.5);
            var perpAngle = angle + Math.PI / 2;
            game.vfx.spawnParticle({
                x: px, y: py,
                vx: Math.cos(perpAngle) * (Math.random() - 0.5) * 3,
                vy: Math.sin(perpAngle) * (Math.random() - 0.5) * 3,
                radius: 1.5 + Math.random() * 2,
                endRadius: 0,
                color: color,
                maxLife: 200 + Math.random() * 150,
                alpha: 0.6,
                friction: 0.94
            });
        }
    }
};
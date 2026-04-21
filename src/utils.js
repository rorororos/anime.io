var Utils = {
    dist: function (x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    distSq: function (x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1;
        return dx * dx + dy * dy;
    },
    angleBetween: function (x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    lerp: function (a, b, t) {
        return a + (b - a) * t;
    },
    clamp: function (v, min, max) {
        return Math.max(min, Math.min(max, v));
    },
    randRange: function (min, max) {
        return min + Math.random() * (max - min);
    },
    randInt: function (min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    },
    circleCollision: function (x1, y1, r1, x2, y2, r2) {
        var dx = x2 - x1, dy = y2 - y1, s = r1 + r2;
        return dx * dx + dy * dy <= s * s;
    },
    normalizeAngle: function (a) {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
    },
    xpForLevel: function (l) {
        return Math.floor(CONST.XP_BASE * Math.pow(CONST.XP_SCALE, l - 1));
    },
    weightedRandom: function (w) {
        var t = 0, i;
        for (i = 0; i < w.length; i++) t += w[i];
        var r = Math.random() * t;
        for (i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
        return w.length - 1;
    },
    drawPolygon: function (ctx, x, y, radius, sides, rotation) {
        ctx.beginPath();
        for (var i = 0; i < sides; i++) {
            var a = rotation + (Math.PI * 2 / sides) * i - Math.PI / 2;
            var px = x + radius * Math.cos(a), py = y + radius * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    },
    randomSpawnPos: function () {
        return { x: Utils.randRange(200, CONST.MAP_WIDTH - 200), y: Utils.randRange(200, CONST.MAP_HEIGHT - 200) };
    },
    centerSpawnPos: function (radius) {
        var cx = CONST.MAP_WIDTH / 2, cy = CONST.MAP_HEIGHT / 2;
        var a = Math.random() * Math.PI * 2, d = Math.random() * radius;
        return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d };
    },
    now: function () {
        return performance.now();
    },
    easeOutCubic: function (t) {
        return 1 - Math.pow(1 - t, 3);
    },
    easeOutQuad: function (t) {
        return t * (2 - t);
    },
    pickRandom: function (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    hexToRgb: function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 26, g: 26, b: 26 };
    },
    colorWithAlpha: function (hex, alpha) {
        var rgb = Utils.hexToRgb(hex);
        return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
    }
};
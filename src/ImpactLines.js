function ImpactLines() {
    this.active = [];
}

ImpactLines.prototype.spawn = function (x, y, opts) {
    opts = opts || {};
    this.active.push({
        x: x, y: y,
        life: 0,
        duration: opts.duration || 250,
        numLines: opts.numLines || 16,
        innerRadius: opts.innerRadius || 30,
        outerRadius: opts.outerRadius || 150,
        lineWidth: opts.lineWidth || 2,
        color: opts.color || CONST.COLOR_INK,
        angles: null
    });

    var entry = this.active[this.active.length - 1];
    entry.angles = [];
    for (var i = 0; i < entry.numLines; i++) {
        entry.angles.push({
            angle: (Math.PI * 2 / entry.numLines) * i + (Math.random() - 0.5) * 0.3,
            lengthMult: 0.6 + Math.random() * 0.4,
            widthMult: 0.5 + Math.random() * 0.5
        });
    }
};

ImpactLines.prototype.update = function (dt) {
    for (var i = this.active.length - 1; i >= 0; i--) {
        this.active[i].life += dt;
        if (this.active[i].life >= this.active[i].duration) {
            this.active.splice(i, 1);
        }
    }
};

ImpactLines.prototype.render = function (ctx, camera) {
    for (var i = 0; i < this.active.length; i++) {
        var il = this.active[i];
        if (!camera.isVisible(il.x, il.y, il.outerRadius + 20)) continue;

        var t = il.life / il.duration;
        var alpha = (1 - t) * 0.5;

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = il.color;

        for (var j = 0; j < il.angles.length; j++) {
            var la = il.angles[j];
            var inner = il.innerRadius + il.innerRadius * t * 0.5;
            var outer = inner + (il.outerRadius - il.innerRadius) * la.lengthMult * (1 - t * 0.3);

            ctx.lineWidth = il.lineWidth * la.widthMult * (1 - t * 0.5);
            ctx.beginPath();
            ctx.moveTo(
                il.x + Math.cos(la.angle) * inner,
                il.y + Math.sin(la.angle) * inner
            );
            ctx.lineTo(
                il.x + Math.cos(la.angle) * outer,
                il.y + Math.sin(la.angle) * outer
            );
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }
};
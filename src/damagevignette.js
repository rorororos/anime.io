function DamageVignette() {
    this.intensity = 0;
    this.timer = 0;
    this.duration = 300;
    this.directionAngle = 0;
}

DamageVignette.prototype.trigger = function (angle) {
    this.intensity = 0.4;
    this.timer = this.duration;
    this.directionAngle = angle || 0;
};

DamageVignette.prototype.update = function (dt) {
    if (this.timer > 0) {
        this.timer -= dt;
        this.intensity = Math.max(0, (this.timer / this.duration) * 0.4);
    }
};

DamageVignette.prototype.render = function (ctx, canvasWidth, canvasHeight) {
    if (this.intensity <= 0.01) return;

    // Full-screen vignette
    var cx = canvasWidth / 2;
    var cy = canvasHeight / 2;
    var maxR = Math.sqrt(cx * cx + cy * cy);

    var grad = ctx.createRadialGradient(cx, cy, maxR * 0.5, cx, cy, maxR);
    grad.addColorStop(0, 'rgba(192, 57, 43, 0)');
    grad.addColorStop(0.7, 'rgba(192, 57, 43, 0)');
    grad.addColorStop(1, 'rgba(192, 57, 43, ' + this.intensity + ')');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Directional indicator — brighter on the side damage came from
    if (this.intensity > 0.1) {
        var dirX = cx - Math.cos(this.directionAngle) * maxR * 0.3;
        var dirY = cy - Math.sin(this.directionAngle) * maxR * 0.3;

        var dirGrad = ctx.createRadialGradient(dirX, dirY, 0, dirX, dirY, maxR * 0.6);
        dirGrad.addColorStop(0, 'rgba(192, 57, 43, ' + (this.intensity * 0.5) + ')');
        dirGrad.addColorStop(1, 'rgba(192, 57, 43, 0)');

        ctx.fillStyle = dirGrad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
};
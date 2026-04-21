function Camera(canvas) {
    this.canvas = canvas;
    this.x = 0; this.y = 0;
    this.targetX = 0; this.targetY = 0;
    this.shakeX = 0; this.shakeY = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.zoom = 1;
    this.maxShake = 6;
}

Camera.prototype.follow = function (x, y) {
    this.targetX = x; this.targetY = y;
};

Camera.prototype.shake = function (intensity, duration) {
    intensity = Math.min(intensity, this.maxShake);
    if (intensity > this.shakeIntensity * 0.5) {
        this.shakeIntensity = intensity;
        this.shakeDuration = Math.min(duration, 300);
        this.shakeTimer = 0;
    }
};

Camera.prototype.update = function (dt) {
    this.x = Utils.lerp(this.x, this.targetX, CONST.CAMERA_LERP);
    this.y = Utils.lerp(this.y, this.targetY, CONST.CAMERA_LERP);
    if (this.shakeTimer < this.shakeDuration) {
        this.shakeTimer += dt;
        var p = this.shakeTimer / this.shakeDuration;
        var ci = this.shakeIntensity * Math.pow(1 - p, 2);
        this.shakeX = (Math.random() - 0.5) * 2 * ci;
        this.shakeY = (Math.random() - 0.5) * 2 * ci;
    } else {
        this.shakeX = 0; this.shakeY = 0;
        this.shakeIntensity = 0; this.shakeDuration = 0; this.shakeTimer = 0;
    }
};

Camera.prototype.applyTransform = function (ctx) {
    var hw = this.canvas.width / 2, hh = this.canvas.height / 2;
    ctx.setTransform(this.zoom, 0, 0, this.zoom,
        hw - (this.x + this.shakeX) * this.zoom,
        hh - (this.y + this.shakeY) * this.zoom);
};

Camera.prototype.resetTransform = function (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
};

Camera.prototype.screenToWorld = function (sx, sy) {
    var hw = this.canvas.width / 2, hh = this.canvas.height / 2;
    return { x: (sx - hw) / this.zoom + this.x, y: (sy - hh) / this.zoom + this.y };
};

Camera.prototype.getViewRect = function () {
    var hw = this.canvas.width / (2 * this.zoom), hh = this.canvas.height / (2 * this.zoom);
    return { x1: this.x - hw - 50, y1: this.y - hh - 50, x2: this.x + hw + 50, y2: this.y + hh + 50 };
};

Camera.prototype.isVisible = function (x, y, r) {
    var v = this.getViewRect();
    return x + r > v.x1 && x - r < v.x2 && y + r > v.y1 && y - r < v.y2;
};
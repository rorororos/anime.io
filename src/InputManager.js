function InputManager(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouseX = 0; this.mouseY = 0;
    this.mouseWorldX = 0; this.mouseWorldY = 0;
    this.mouseDown = false;
    this.autoFire = false;

    var self = this;

    this.autoFireIndicator = document.createElement('div');
    this.autoFireIndicator.className = 'auto-fire-indicator hidden';
    this.autoFireIndicator.textContent = '— AUTO-FIRE —';
    var hud = document.getElementById('hud');
    if (hud) hud.appendChild(this.autoFireIndicator);

    window.addEventListener('keydown', function (e) {
        self.keys[e.key.toLowerCase()] = true;
        if (e.key.toLowerCase() === 'e') {
            self.autoFire = !self.autoFire;
            if (self.autoFire) self.autoFireIndicator.classList.remove('hidden');
            else self.autoFireIndicator.classList.add('hidden');
        }
    });

    window.addEventListener('keyup', function (e) {
        self.keys[e.key.toLowerCase()] = false;
    });

    canvas.addEventListener('mousemove', function (e) {
        self.mouseX = e.clientX; self.mouseY = e.clientY;
    });

    canvas.addEventListener('mousedown', function (e) {
        if (e.button === 0) self.mouseDown = true;
    });

    canvas.addEventListener('mouseup', function (e) {
        if (e.button === 0) self.mouseDown = false;
    });

    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}

InputManager.prototype.isKeyDown = function (k) { return !!this.keys[k]; };
InputManager.prototype.isShooting = function () { return this.mouseDown || this.autoFire; };
InputManager.prototype.updateWorldMouse = function (camera) {
    var w = camera.screenToWorld(this.mouseX, this.mouseY);
    this.mouseWorldX = w.x; this.mouseWorldY = w.y;
};
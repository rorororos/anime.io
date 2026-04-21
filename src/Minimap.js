function Minimap(game) {
    this.game = game;
    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width; this.height = this.canvas.height;
    this.scaleX = this.width / CONST.MAP_WIDTH;
    this.scaleY = this.height / CONST.MAP_HEIGHT;
}

Minimap.prototype.render = function () {
    var ctx = this.ctx, g = this.game;
    ctx.fillStyle = CONST.COLOR_PAPER; ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = CONST.COLOR_INK; ctx.lineWidth = 2; ctx.strokeRect(0, 0, this.width, this.height);
    for (var i = 0; i < g.shapes.length; i++) {
        var s = g.shapes[i]; if (!s.alive) continue;
        ctx.fillStyle = s.isBig ? CONST.COLOR_INK : 'rgba(26,26,26,0.2)';
        var sz = s.isBig ? 3 : 1.5;
        ctx.fillRect(s.x * this.scaleX - sz / 2, s.y * this.scaleY - sz / 2, sz, sz);
    }
    for (var j = 0; j < g.bots.length; j++) {
        var b = g.bots[j]; if (!b.alive) continue;
        ctx.fillStyle = 'rgba(26,26,26,0.4)';
        ctx.beginPath(); ctx.arc(b.x * this.scaleX, b.y * this.scaleY, 2, 0, Math.PI * 2); ctx.fill();
    }
    if (g.player && g.player.alive) {
        ctx.fillStyle = CONST.COLOR_INK;
        ctx.beginPath(); ctx.arc(g.player.x * this.scaleX, g.player.y * this.scaleY, 3.5, 0, Math.PI * 2); ctx.fill();
        var vr = g.camera.getViewRect();
        var rx = Math.max(0, vr.x1 * this.scaleX), ry = Math.max(0, vr.y1 * this.scaleY);
        var rw = Math.min(this.width, vr.x2 * this.scaleX) - rx, rh = Math.min(this.height, vr.y2 * this.scaleY) - ry;
        ctx.strokeStyle = 'rgba(26,26,26,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(rx, ry, rw, rh);
    }
};
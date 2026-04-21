function ComboSystem(game) {
    this.game = game;
    this.count = 0;
    this.timer = 0;
    this.maxTime = 3000; // 3s to keep combo alive
    this.displayTimer = 0;
    this.bestCombo = 0;
    this.xpMultiplier = 1;
}

ComboSystem.prototype.addHit = function () {
    this.count++;
    this.timer = this.maxTime;
    this.displayTimer = 800;

    if (this.count > this.bestCombo) this.bestCombo = this.count;

    // XP multiplier based on combo
    if (this.count >= 50) this.xpMultiplier = 3.0;
    else if (this.count >= 30) this.xpMultiplier = 2.5;
    else if (this.count >= 20) this.xpMultiplier = 2.0;
    else if (this.count >= 10) this.xpMultiplier = 1.5;
    else if (this.count >= 5) this.xpMultiplier = 1.2;
    else this.xpMultiplier = 1.0;
};

ComboSystem.prototype.break2 = function () {
    if (this.count >= 5) {
        this.game.vfx.floatingText(
            this.game.player.x, this.game.player.y - 60,
            'COMBO BREAK!', '#c0392b', { fontSize: 16, life: 1000 }
        );
    }
    this.count = 0;
    this.xpMultiplier = 1;
};

ComboSystem.prototype.update = function (dt) {
    if (this.timer > 0) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.break2();
        }
    }
    if (this.displayTimer > 0) this.displayTimer -= dt;
};

ComboSystem.prototype.render = function (ctx, canvasWidth, canvasHeight) {
    if (this.count < 2) return;

    var x = canvasWidth / 2;
    var y = canvasHeight / 2 - 120;

    // Combo count
    var scale = 1;
    if (this.displayTimer > 0) {
        var t = this.displayTimer / 800;
        scale = 1 + t * 0.3;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Combo number
    ctx.font = '42px "Bangers", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = CONST.COLOR_PAPER;
    ctx.lineWidth = 4;
    ctx.strokeText(this.count + ' HITS', 0, 0);

    var comboColor = '#1a1a1a';
    if (this.count >= 50) comboColor = '#c9a84c';
    else if (this.count >= 30) comboColor = '#922b21';
    else if (this.count >= 10) comboColor = '#c0392b';

    ctx.fillStyle = comboColor;
    ctx.fillText(this.count + ' HITS', 0, 0);

    // Multiplier
    if (this.xpMultiplier > 1) {
        ctx.font = '18px "Bangers", Impact, sans-serif';
        ctx.fillStyle = '#c9a84c';
        ctx.strokeStyle = CONST.COLOR_PAPER;
        ctx.lineWidth = 3;
        ctx.strokeText('x' + this.xpMultiplier.toFixed(1) + ' XP', 0, 26);
        ctx.fillText('x' + this.xpMultiplier.toFixed(1) + ' XP', 0, 26);
    }

    ctx.restore();

    // Combo timer bar
    if (this.timer > 0) {
        var pct = this.timer / this.maxTime;
        var barW = 100;
        var barH = 4;
        var barX = x - barW / 2;
        var barY = y + 40;

        ctx.fillStyle = 'rgba(26,26,26,0.15)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = comboColor;
        ctx.fillRect(barX, barY, barW * pct, barH);
    }
};
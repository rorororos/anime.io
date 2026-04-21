function BotBubbles(game) {
    this.game = game;
    this.activeBubbles = [];

    this.taunts = {
        aggressive: [
            "You're mine!",
            "Too easy!",
            "Fight me!",
            "Over here!",
            "Come on!",
            "Weakling!",
            "Hah!",
            "Let's go!"
        ],
        flee: [
            "Gotta run!",
            "Not today!",
            "Retreat!",
            "Too strong...",
            "Nope!",
            "Later!"
        ],
        kill: [
            "Got you!",
            "Down!",
            "Too slow!",
            "Next!",
            "Easy!",
            "One down!"
        ],
        levelup: [
            "Level up!",
            "Stronger!",
            "Power!",
            "Nice!",
            "Growing!"
        ],
        route: [
            "This power...",
            "My destiny!",
            "Chosen!",
            "Awakened!"
        ]
    };
}

BotBubbles.prototype.say = function (bot, category) {
    // Don't spam — only 1 bubble per bot at a time
    for (var i = 0; i < this.activeBubbles.length; i++) {
        if (this.activeBubbles[i].bot === bot) return;
    }

    // Random chance to actually say something
    if (Math.random() > 0.3) return;

    var list = this.taunts[category];
    if (!list || list.length === 0) return;

    var text = list[Math.floor(Math.random() * list.length)];

    this.activeBubbles.push({
        bot: bot,
        text: text,
        life: 0,
        duration: 2000
    });
};

BotBubbles.prototype.update = function (dt) {
    for (var i = this.activeBubbles.length - 1; i >= 0; i--) {
        var b = this.activeBubbles[i];
        b.life += dt;
        if (b.life >= b.duration || !b.bot.alive) {
            this.activeBubbles.splice(i, 1);
        }
    }
};

BotBubbles.prototype.render = function (ctx, camera) {
    for (var i = 0; i < this.activeBubbles.length; i++) {
        var b = this.activeBubbles[i];
        if (!b.bot.alive) continue;
        if (!camera.isVisible(b.bot.x, b.bot.y, b.bot.radius + 60)) continue;

        var t = b.life / b.duration;
        var alpha = t < 0.1 ? t / 0.1 : (t > 0.8 ? (1 - t) / 0.2 : 1);

        var bx = b.bot.x;
        var by = b.bot.y - b.bot.radius - 38;

        ctx.globalAlpha = alpha * 0.9;

        // Bubble background
        ctx.font = '11px "Patrick Hand", cursive';
        var textW = ctx.measureText(b.text).width;
        var padX = 6;
        var padY = 4;
        var bubW = textW + padX * 2;
        var bubH = 16 + padY * 2;
        var bubX = bx - bubW / 2;
        var bubY = by - bubH / 2;

        // Bubble shape
        ctx.fillStyle = CONST.COLOR_PAPER;
        ctx.strokeStyle = CONST.COLOR_INK;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bubX + 3, bubY);
        ctx.lineTo(bubX + bubW - 3, bubY);
        ctx.quadraticCurveTo(bubX + bubW, bubY, bubX + bubW, bubY + 3);
        ctx.lineTo(bubX + bubW, bubY + bubH - 3);
        ctx.quadraticCurveTo(bubX + bubW, bubY + bubH, bubX + bubW - 3, bubY + bubH);
        // Tail
        ctx.lineTo(bx + 5, bubY + bubH);
        ctx.lineTo(bx, bubY + bubH + 6);
        ctx.lineTo(bx - 3, bubY + bubH);
        ctx.lineTo(bubX + 3, bubY + bubH);
        ctx.quadraticCurveTo(bubX, bubY + bubH, bubX, bubY + bubH - 3);
        ctx.lineTo(bubX, bubY + 3);
        ctx.quadraticCurveTo(bubX, bubY, bubX + 3, bubY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = CONST.COLOR_INK;
        ctx.fillText(b.text, bx, by);

        ctx.globalAlpha = 1;
    }
};
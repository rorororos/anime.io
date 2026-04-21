function LeaderboardManager(game) {
    this.game = game;
    this.listEl = document.getElementById('leaderboard-list');
    this.updateInterval = 500; this.lastUpdate = 0;
}

LeaderboardManager.prototype.update = function () {
    var now = Utils.now();
    if (now - this.lastUpdate < this.updateInterval) return;
    this.lastUpdate = now;
    var g = this.game, entries = [];
    if (g.player && g.player.alive) entries.push({ name: g.player.name, score: g.player.score, level: g.player.level, isPlayer: true });
    for (var i = 0; i < g.bots.length; i++) { var b = g.bots[i]; if (b.alive) entries.push({ name: b.name, score: b.score, level: b.level, isPlayer: false }); }
    entries.sort(function (a, b) { return b.score - a.score; });
    var top = entries.slice(0, 10);
    this.listEl.innerHTML = '';
    for (var j = 0; j < top.length; j++) {
        var e = top[j], d = document.createElement('div');
        d.className = 'lb-entry' + (e.isPlayer ? ' is-player' : '');
        d.innerHTML = '<span class="lb-rank">' + (j + 1) + '.</span><span class="lb-name">' + e.name + ' [' + e.level + ']</span><span class="lb-score">' + e.score + '</span>';
        this.listEl.appendChild(d);
    }
};
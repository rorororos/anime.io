function UIManager(game) {
    this.game = game;
    this.hud = document.getElementById('hud');
    this.mainMenu = document.getElementById('main-menu');
    this.levelText = document.getElementById('player-level');
    this.routeInfo = document.getElementById('player-route-info');
    this.hpBarFill = document.getElementById('hp-bar-fill');
    this.hpBarText = document.getElementById('hp-bar-text');
    this.xpBarFill = document.getElementById('xp-bar-fill');
    this.xpBarText = document.getElementById('xp-bar-text');
    this.scoreText = document.getElementById('score-text');
    this.killsText = document.getElementById('kills-text');
    this.statsPanel = document.getElementById('stats-panel');
    this.statsList = document.getElementById('stats-list');
    this.statPointsDisplay = document.getElementById('stat-points-display');
    this.killFeed = document.getElementById('kill-feed');
    this.routeOverlay = document.getElementById('route-overlay');
    this.routeCardsContainer = document.getElementById('route-cards-container');
    this.characterReveal = document.getElementById('character-reveal');
    this.revealRouteName = document.getElementById('reveal-route-name');
    this.revealCharName = document.getElementById('reveal-character-name');
    this.gameOver = document.getElementById('game-over');
    this.goStats = document.getElementById('go-stats');
    this.abilityBar = document.getElementById('ability-bar');
    this.killFeedEntries = [];
    this.killFeedMax = 6;
    this.statRows = [];
    this._buildStatsPanel();
}

UIManager.prototype._buildStatsPanel = function () {
    var self = this;
    this.statsList.innerHTML = '';
    this.statRows = [];

    for (var i = 0; i < CONST.STAT_NAMES.length; i++) {
        (function (statIndex) {
            var statKey = CONST.STAT_KEYS[statIndex];
            var statName = CONST.STAT_NAMES[statIndex];

            var row = document.createElement('div');
            row.className = 'stat-row';

            var nameEl = document.createElement('span');
            nameEl.className = 'stat-name';
            nameEl.textContent = statName;

            var barC = document.createElement('div');
            barC.className = 'stat-bar-container';

            var pips = [];
            for (var j = 0; j < CONST.STAT_MAX_LEVEL; j++) {
                var pip = document.createElement('div');
                pip.className = 'stat-bar-pip';
                barC.appendChild(pip);
                pips.push(pip);
            }

            var btn = document.createElement('div');
            btn.className = 'stat-upgrade-btn';
            btn.textContent = '+';
            btn.addEventListener('click', function () {
                if (!self.game.player) return;
                var success = self.game.player.upgradeSystem.upgradeStat(statKey);
                if (success) {
                    self.updateStats();
                    btn.style.transform = 'scale(1.3)';
                    setTimeout(function () { btn.style.transform = ''; }, 120);
                }
            });

            row.appendChild(nameEl);
            row.appendChild(barC);
            row.appendChild(btn);
            self.statsList.appendChild(row);
            self.statRows.push({ pips: pips, btn: btn });
        })(i);
    }
};

UIManager.prototype.showMainMenu = function () { this.mainMenu.classList.remove('hidden'); this.hud.classList.add('hidden'); };
UIManager.prototype.hideMainMenu = function () { this.mainMenu.classList.add('hidden'); this.hud.classList.remove('hidden'); };

UIManager.prototype.update = function () {
    var p = this.game.player; if (!p) return;
    this.levelText.textContent = 'Level ' + p.level;
    if (p.characterData) { this.routeInfo.textContent = p.routeData.name + ' · ' + p.characterData.name; this.routeInfo.style.color = p.characterData.color; }
    else if (p.level >= CONST.ROUTE_SELECTION_LEVEL) { this.routeInfo.textContent = 'Choose your path!'; this.routeInfo.style.color = '#c0392b'; }
    else { this.routeInfo.textContent = 'Route in ' + (CONST.ROUTE_SELECTION_LEVEL - p.level) + ' levels'; this.routeInfo.style.color = '#999'; }
    var hpp = (p.hp / p.maxHp) * 100;
    this.hpBarFill.style.width = hpp + '%';
    this.hpBarText.textContent = Math.ceil(p.hp) + ' / ' + Math.ceil(p.maxHp);
    var xpp = p.level >= CONST.MAX_LEVEL ? 100 : (p.xp / p.xpToNext) * 100;
    this.xpBarFill.style.width = xpp + '%';
    this.xpBarText.textContent = p.level >= CONST.MAX_LEVEL ? 'MAX LEVEL (' + p.level + ')' : 'Level ' + p.level + ' — ' + Math.floor(xpp) + '%';
    this.scoreText.textContent = 'Score: ' + p.score;
    this.killsText.textContent = 'Kills: ' + p.kills;
    this.updateStats();
    this.updateAbilityBar();
};

UIManager.prototype.updateStats = function () {
    var p = this.game.player; if (!p) return;
    var us = p.upgradeSystem;
    this.statsPanel.classList.remove('hidden');
    this.statPointsDisplay.textContent = us.statPoints;
    for (var i = 0; i < CONST.STAT_KEYS.length; i++) {
        var k = CONST.STAT_KEYS[i], l = us.stats[k], r = this.statRows[i];
        if (!r) continue;
        for (var j = 0; j < CONST.STAT_MAX_LEVEL; j++) {
            if (j < l) r.pips[j].classList.add('filled');
            else r.pips[j].classList.remove('filled');
        }
        if (us.statPoints > 0 && l < CONST.STAT_MAX_LEVEL) r.btn.classList.remove('disabled');
        else r.btn.classList.add('disabled');
    }
};

UIManager.prototype.updateAbilityBar = function () {
    var p = this.game.player; if (!p) return;
    var ab = p.abilitySystem.getAbilities();
    if (!ab.length) { this.abilityBar.classList.add('hidden'); return; }
    this.abilityBar.classList.remove('hidden');
    while (this.abilityBar.children.length < ab.length) {
        var s = document.createElement('div'); s.className = 'ability-slot';
        s.innerHTML = '<span class="ability-key"></span><span class="ability-icon"></span><div class="ability-cooldown-overlay"></div>';
        this.abilityBar.appendChild(s);
    }
    while (this.abilityBar.children.length > ab.length) this.abilityBar.removeChild(this.abilityBar.lastChild);
    for (var i = 0; i < ab.length; i++) {
        var a = ab[i], sl = this.abilityBar.children[i];
        sl.querySelector('.ability-key').textContent = a.key;
        var iconEl = sl.querySelector('.ability-icon');
        var iconId = a.icon || 'default';
        if (iconEl.getAttribute('data-icon') !== iconId) {
            iconEl.setAttribute('data-icon', iconId);
            if (typeof AbilityIcons !== 'undefined' && AbilityIcons._svgs && AbilityIcons._svgs[iconId]) {
                iconEl.innerHTML = AbilityIcons._svgs[iconId];
            } else {
                iconEl.textContent = '⚡';
            }
        }
        var ov = sl.querySelector('.ability-cooldown-overlay');
        if (a.currentCooldown > 0) { ov.style.height = (a.currentCooldown / a.cooldown * 100) + '%'; sl.style.borderColor = '#c0392b'; }
        else { ov.style.height = '0%'; sl.style.borderColor = '#1a1a1a'; }
    }
};

// ... (rest of UIManager.js is the same as the previous response)

UIManager.prototype.addKillFeedEntry = function (killerName, victimName) {
    var e = document.createElement('div'); e.className = 'kill-feed-entry';
    e.innerHTML = '<span class="killer">' + killerName + '</span> ✕ <span class="victim">' + victimName + '</span>';
    this.killFeed.prepend(e);
    this.killFeedEntries.push(e);
    if (this.killFeedEntries.length > this.killFeedMax) { var old = this.killFeedEntries.shift(); if (old.parentNode) old.parentNode.removeChild(old); }
    setTimeout(function () { e.style.opacity = '0'; e.style.transition = 'opacity 0.5s'; setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 500); }, 5000);
};

UIManager.prototype.showRouteSelection = function () {
    var self = this;
    this.routeOverlay.classList.remove('hidden');
    this.routeCardsContainer.innerHTML = '';
    var routes = this.game.routeSystem.getAllRoutes();
    for (var idx = 0; idx < routes.length; idx++) {
        (function (route, cardIdx) {
            var card = document.createElement('div'); card.className = 'route-card';
            card.style.animationDelay = (cardIdx * 0.06) + 's';
            card.innerHTML = '<div class="route-emoji">' + route.emoji + '</div>' +
                '<div class="route-name">' + route.name + '</div>' +
                '<div class="route-description">' + (route.description || '') + '</div>' +
                '<div class="route-char-count">' + route.characters.length + ' characters</div>';
            card.addEventListener('click', function () { self._onRouteCardClicked(card, route.id); });
            self.routeCardsContainer.appendChild(card);
        })(routes[idx], idx);
    }
};

UIManager.prototype._onRouteCardClicked = function (cardEl, routeId) {
    var self = this;
    var cards = this.routeCardsContainer.querySelectorAll('.route-card');
    for (var i = 0; i < cards.length; i++) {
        cards[i].style.pointerEvents = 'none';
        if (cards[i] !== cardEl) { cards[i].style.opacity = '0.2'; cards[i].style.transform = 'scale(0.9)'; cards[i].style.transition = 'all 0.4s'; }
    }
    cardEl.style.transform = 'scale(1.15)'; cardEl.style.transition = 'all 0.4s';
    setTimeout(function () { self.hideRouteSelection(); self.onRouteSelected(routeId); }, 800);
};

UIManager.prototype.hideRouteSelection = function () { this.routeOverlay.classList.add('hidden'); };

UIManager.prototype.onRouteSelected = function (routeId) {
    var p = this.game.player;
    p.selectRoute(routeId, this.game.routeSystem);
    this.showCharacterReveal(p.routeData, p.characterData);
        if (this.game.mobile && this.game.mobile.active) {
        var mob = this.game.mobile;
        setTimeout(function () { mob.updateAbilityButtons(); }, 3500);
    }
};

UIManager.prototype.showCharacterReveal = function (route, character) {
    var self = this;
    this.characterReveal.classList.remove('hidden');
    this.revealRouteName.textContent = route.name.toUpperCase();
    this.revealCharName.textContent = character.name;

    var titleEl = document.getElementById('reveal-character-title');
    if (!titleEl) {
        titleEl = document.createElement('div');
        titleEl.id = 'reveal-character-title';
        this.characterReveal.querySelector('.reveal-content').appendChild(titleEl);
    }
    titleEl.textContent = character.title || '';
    titleEl.style.opacity = '0';
    setTimeout(function () {
        titleEl.style.opacity = '1';
        titleEl.style.transition = 'opacity 0.5s';
    }, 600);

    var player = this.game.player;
    this.game.vfx.ring(player.x, player.y, 20, CONST.COLOR_INK, { speed: 4, radius: 3, life: 400 });
    this.game.vfx.burst(player.x, player.y, 20, CONST.COLOR_INK, { speed: 4, life: 400, radius: 3 });
    this.game.vfx.shockwave(player.x, player.y, 120, 500, CONST.COLOR_INK, 3);
    this.game.camera.shake(4, 200);

    setTimeout(function () {
        self.characterReveal.classList.add('hidden');
        self.game.paused = false;
        // Reset invuln to normal after reveal
        self.game.player.invulnTimer = 2500;
        self.game.player._routeSelecting = false;
    }, 3000);
};

UIManager.prototype.showGameOver = function (player) {
    this.gameOver.classList.remove('hidden');
    var kp = Math.floor(CONST.DEATH_LEVEL_KEEP * 100);
    this.goStats.innerHTML =
        '<div>Level: <strong>' + player.level + '</strong></div>' +
        '<div>Score: <strong>' + player.score + '</strong></div>' +
        '<div>Kills: <strong>' + player.kills + '</strong></div>' +
        (player.characterData ? '<div>Character: <strong>' + player.characterData.name + '</strong></div>' : '') +
        '<div style="color:#999;margin-top:10px;">You keep ' + kp + '% of your level</div>';
};

UIManager.prototype.hideGameOver = function () { this.gameOver.classList.add('hidden'); };
function SandboxUI(game) {
    this.game = game;
    this._build();
}

SandboxUI.prototype._build = function () {
    var self = this;

    var sandboxBtn = document.getElementById('sandbox-button');
    if (sandboxBtn) {
        sandboxBtn.addEventListener('click', function () {
            self.show();
        });
    }

    this.overlay = document.createElement('div');
    this.overlay.id = 'sandbox-overlay';
    this.overlay.className = 'hidden';
    this.overlay.innerHTML = this._getHTML();
    document.body.appendChild(this.overlay);

    setTimeout(function () { self._wireEvents(); }, 50);
};

SandboxUI.prototype._getHTML = function () {
    var routeOptions = '';
    var allRoutes = Object.keys(ROUTES);
    for (var i = 0; i < allRoutes.length; i++) {
        var r = ROUTES[allRoutes[i]];
        routeOptions += '<option value="' + r.id + '">' + r.emoji + ' ' + r.name + '</option>';
    }

    return '' +
    '<div class="sandbox-panel">' +
        '<h2 class="sandbox-title">SANDBOX MODE</h2>' +
        '<div class="sandbox-scroll">' +
            '<div class="sandbox-section">' +
                '<label class="sandbox-label">Route</label>' +
                '<select id="sb-route">' + routeOptions + '</select>' +
            '</div>' +
            '<div class="sandbox-section">' +
                '<label class="sandbox-label">Character</label>' +
                '<select id="sb-character"></select>' +
            '</div>' +
            '<div class="sandbox-section">' +
                '<label class="sandbox-label">Level</label>' +
                '<div class="sandbox-slider-row">' +
                    '<input type="range" id="sb-level" min="1" max="45" value="40">' +
                    '<span id="sb-level-val">40</span>' +
                '</div>' +
            '</div>' +
            '<div class="sandbox-section">' +
                '<label class="sandbox-label">All Stats Level</label>' +
                '<div class="sandbox-slider-row">' +
                    '<input type="range" id="sb-stats" min="0" max="7" value="7">' +
                    '<span id="sb-stats-val">7</span>' +
                '</div>' +
            '</div>' +
            '<div class="sandbox-section">' +
                '<label class="sandbox-label">Bot Count</label>' +
                '<div class="sandbox-slider-row">' +
                    '<input type="range" id="sb-bots" min="0" max="30" value="5">' +
                    '<span id="sb-bots-val">5</span>' +
                '</div>' +
            '</div>' +
            '<div class="sandbox-section">' +
                '<label class="sandbox-label">Bot Level</label>' +
                '<div class="sandbox-slider-row">' +
                    '<input type="range" id="sb-bot-level" min="1" max="45" value="15">' +
                    '<span id="sb-bot-level-val">15</span>' +
                '</div>' +
            '</div>' +
            '<div class="sandbox-section sandbox-check-row">' +
                '<label class="sandbox-label">Invincible</label>' +
                '<input type="checkbox" id="sb-invincible">' +
            '</div>' +
            '<div class="sandbox-section sandbox-check-row">' +
                '<label class="sandbox-label">No Cooldowns</label>' +
                '<input type="checkbox" id="sb-nocooldown">' +
            '</div>' +
        '</div>' +
        '<div class="sandbox-buttons">' +
            '<button id="sb-start" class="sb-btn sb-btn-primary">START</button>' +
            '<button id="sb-back" class="sb-btn">BACK</button>' +
        '</div>' +
    '</div>';
};

SandboxUI.prototype._wireEvents = function () {
    var self = this;
    var routeSelect = document.getElementById('sb-route');
    var startBtn = document.getElementById('sb-start');
    var backBtn = document.getElementById('sb-back');

    if (!routeSelect || !startBtn) {
        setTimeout(function () { self._wireEvents(); }, 100);
        return;
    }

    this._populateChars(routeSelect.value);

    routeSelect.addEventListener('change', function () {
        self._populateChars(this.value);
    });

    var sliders = [
        { id: 'sb-level', valId: 'sb-level-val' },
        { id: 'sb-stats', valId: 'sb-stats-val' },
        { id: 'sb-bots', valId: 'sb-bots-val' },
        { id: 'sb-bot-level', valId: 'sb-bot-level-val' }
    ];

    for (var i = 0; i < sliders.length; i++) {
        (function (s) {
            var slider = document.getElementById(s.id);
            var val = document.getElementById(s.valId);
            if (slider && val) {
                slider.addEventListener('input', function () {
                    val.textContent = this.value;
                });
            }
        })(sliders[i]);
    }

    startBtn.addEventListener('click', function () { self.startSandbox(); });
    backBtn.addEventListener('click', function () { self.hide(); });
};

SandboxUI.prototype._populateChars = function (routeId) {
    var charSelect = document.getElementById('sb-character');
    if (!charSelect) return;
    charSelect.innerHTML = '';
    var route = ROUTES[routeId];
    if (!route) return;
    for (var i = 0; i < route.characters.length; i++) {
        var c = route.characters[i];
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name + (c.title ? ' — ' + c.title : '');
        charSelect.appendChild(opt);
    }
};

SandboxUI.prototype.show = function () {
    this.overlay.classList.remove('hidden');
};

SandboxUI.prototype.hide = function () {
    this.overlay.classList.add('hidden');
};

SandboxUI.prototype.startSandbox = function () {
    var game = this.game;
    var routeId = document.getElementById('sb-route').value;
    var charId = document.getElementById('sb-character').value;
    var level = parseInt(document.getElementById('sb-level').value) || 40;
    var statLevel = parseInt(document.getElementById('sb-stats').value) || 7;
    var botCount = parseInt(document.getElementById('sb-bots').value) || 5;
    var botLevel = parseInt(document.getElementById('sb-bot-level').value) || 15;
    var invincible = document.getElementById('sb-invincible').checked;
    var noCooldown = document.getElementById('sb-nocooldown').checked;

    this.hide();

    var nameInput = document.getElementById('player-name-input');
    var playerName = (nameInput && nameInput.value.trim()) || 'Player';

    // Create fresh player
    game.player = new Player(playerName);
    var sp = Utils.randomSpawnPos();
    game.player.x = sp.x;
    game.player.y = sp.y;

    // Manually set route and character
    var route = game.routeSystem.getRoute(routeId);
    if (route) {
        game.player.routeId = routeId;
        game.player.routeData = route;
        game.player.routeLocked = true;

        var charData = null;
        for (var ci = 0; ci < route.characters.length; ci++) {
            if (route.characters[ci].id === charId) {
                charData = route.characters[ci];
                break;
            }
        }
        if (charData) {
            game.player.characterId = charData.id;
            game.player.characterData = charData;
            game.player.color = charData.color;
            game.player.barrelColor = charData.secondaryColor || charData.color;
        }
    }

    // Level up properly through levelUp() so xpToNext is correct
    // But suppress VFX during mass level-up
    var origGame = game.player._game;
    game.player._game = null; // prevent ability notifications during setup
    for (var l = 1; l < level; l++) {
        game.player.level++;
        game.player.xpToNext = Utils.xpForLevel(game.player.level);
    }
    game.player._game = origGame;

    // Set stats manually
    game.player.upgradeSystem.statPoints = 0;
    for (var si = 0; si < CONST.STAT_KEYS.length; si++) {
        game.player.upgradeSystem.stats[CONST.STAT_KEYS[si]] = Math.min(statLevel, CONST.STAT_MAX_LEVEL);
    }
    game.player.upgradeSystem._applyToOwner();
    game.player.hp = game.player.maxHp;
    game.player.score = game.player.getScore();

    // Now apply abilities for current level
    AbilityData.applyAbilitiesForLevel(game.player);

    // Invincibility
    if (invincible) {
        game.player.takeDamage = function () {};
    }

    // No cooldowns — override the ability system
    if (noCooldown) {
        var abSys = game.player.abilitySystem;
        abSys.useAbility = function (index, g) {
            if (index < 0 || index >= this.abilities.length) return false;
            var ab = this.abilities[index];
            if (ab.execute) ab.execute(this.owner, g);
            // Don't set cooldown
            ab.currentCooldown = 0;
            ab.ready = true;
            return true;
        };
    }

    // Bots
    game.bots = [];
    for (var bi = 0; bi < botCount; bi++) {
        game.spawnBot();
        var bot = game.bots[game.bots.length - 1];
        // Level up bots
        for (var bl = 1; bl < botLevel; bl++) {
            bot.addXp(bot.xpToNext);
        }
        while (bot.upgradeSystem.statPoints > 0) {
            bot.upgradeSystem.autoDistribute();
        }
    }

    // Shapes
    game.shapes = [];
    game.bigPentagons = [];
    for (var shi = 0; shi < CONST.SHAPE_MAX; shi++) game.spawnShape();
    for (var bpi = 0; bpi < CONST.BIG_PENTAGON_MAX; bpi++) game.spawnBigPentagon();

    game.abilityEntities = [];
    game.routePromptShown = true;
    game.paused = false;
    game.sandboxMode = true;
    game.sandboxBotCount = botCount;

    game.ui.hideMainMenu();
    game.ui.hideGameOver();

    game.running = true;
    game.lastTime = performance.now();
    requestAnimationFrame(function (t) { game.loop(t); });
};
function MobileControls(game) {
    this.game = game;
    this.active = false;
    this.joystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, dx: 0, dy: 0, touchId: null };
    this.shootButton = { active: false, touchId: null };
    this.dashButton = { active: false, touchId: null };
    this.abilityTouches = {};
    this.autoAim = true;
    this.autoFire = false;

    // Joystick visual config
    this.joyRadius = 55;
    this.joyKnobRadius = 22;
    this.joyX = 0;
    this.joyY = 0;

    // Button positions (calculated on resize)
    this.buttons = [];

    this._detectMobile();
    if (this.active) {
        this._createUI();
        this._bindEvents();
    }
}

MobileControls.prototype._detectMobile = function () {
    this.active = ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (window.innerWidth < 800);
};

MobileControls.prototype._createUI = function () {
    // Add mobile CSS
    var style = document.createElement('style');
    style.textContent = '' +
        '#mobile-controls { position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:15; pointer-events:none; }' +
        '#mobile-controls * { pointer-events:auto; }' +
        '.mobile-btn { position:absolute; border:2px solid var(--ink); background:var(--paper); display:flex; align-items:center; justify-content:center; font-family:var(--font-title); font-size:14px; color:var(--ink); box-shadow:2px 2px 0px rgba(0,0,0,0.1); user-select:none; -webkit-user-select:none; touch-action:none; }' +
        '.mobile-btn.active { background:var(--ink); color:var(--paper); }' +
        '.mobile-btn-round { border-radius:50%; }' +
        '.mobile-btn-rect { border-radius:6px; }' +
        '#mobile-joystick-zone { position:absolute; left:0; bottom:0; width:45vw; height:50vh; touch-action:none; }' +
        '#mobile-shoot-zone { position:absolute; right:0; bottom:0; width:45vw; height:50vh; touch-action:none; }' +
        '#mobile-autofire-btn { position:absolute; right:15px; bottom:200px; width:50px; height:50px; }' +
        '#mobile-dash-btn { position:absolute; right:80px; bottom:200px; width:50px; height:50px; }' +
        '.mobile-ability-btn { width:44px; height:44px; position:absolute; }' +
        '.mobile-ability-btn .ab-cd { position:absolute; bottom:0; left:0; width:100%; background:rgba(26,26,26,0.5); }' +
        '.mobile-ability-btn .ab-key { position:absolute; top:2px; left:4px; font-size:10px; color:var(--ink-faint); }' +
        '.mobile-ability-btn .ab-icon { font-size:16px; }' +
        '#mobile-controls .mobile-top-btns { position:absolute; top:10px; right:10px; display:flex; gap:6px; }' +
        '#mobile-controls .mobile-top-btns .mobile-btn { width:36px; height:36px; font-size:11px; }' +
        '@media (min-width:800px) { #mobile-controls { display:none; } }';
    document.head.appendChild(style);

    // Container
    this.container = document.createElement('div');
    this.container.id = 'mobile-controls';
    this.container.innerHTML = '' +
        '<div id="mobile-joystick-zone"></div>' +
        '<div id="mobile-shoot-zone"></div>' +
        '<div id="mobile-dash-btn" class="mobile-btn mobile-btn-round">DASH</div>' +
        '<div id="mobile-autofire-btn" class="mobile-btn mobile-btn-round">AUTO</div>' +
        '<div id="mobile-ability-container"></div>';

    document.body.appendChild(this.container);

    this.joystickZone = document.getElementById('mobile-joystick-zone');
    this.shootZone = document.getElementById('mobile-shoot-zone');
    this.dashBtn = document.getElementById('mobile-dash-btn');
    this.autoFireBtn = document.getElementById('mobile-autofire-btn');
    this.abilityContainer = document.getElementById('mobile-ability-container');

    // Joystick canvas overlay
    this.joyCanvas = document.createElement('canvas');
    this.joyCanvas.width = 200;
    this.joyCanvas.height = 200;
    this.joyCanvas.style.cssText = 'position:absolute;bottom:20px;left:20px;width:160px;height:160px;pointer-events:none;z-index:16;';
    document.body.appendChild(this.joyCanvas);
    this.joyCtx = this.joyCanvas.getContext('2d');

    // Hide desktop HUD elements that overlap
    var statsPanel = document.getElementById('stats-panel');
    if (statsPanel) statsPanel.style.fontSize = '10px';
};

MobileControls.prototype._bindEvents = function () {
    var self = this;

    // Joystick
    this.joystickZone.addEventListener('touchstart', function (e) {
        e.preventDefault();
        var touch = e.changedTouches[0];
        self.joystick.active = true;
        self.joystick.touchId = touch.identifier;
        self.joystick.startX = touch.clientX;
        self.joystick.startY = touch.clientY;
        self.joystick.currentX = touch.clientX;
        self.joystick.currentY = touch.clientY;
    }, { passive: false });

    this.joystickZone.addEventListener('touchmove', function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            if (touch.identifier === self.joystick.touchId) {
                self.joystick.currentX = touch.clientX;
                self.joystick.currentY = touch.clientY;
            }
        }
    }, { passive: false });

    this.joystickZone.addEventListener('touchend', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === self.joystick.touchId) {
                self.joystick.active = false;
                self.joystick.touchId = null;
                self.joystick.dx = 0;
                self.joystick.dy = 0;
            }
        }
    });

    this.joystickZone.addEventListener('touchcancel', function () {
        self.joystick.active = false;
        self.joystick.touchId = null;
        self.joystick.dx = 0;
        self.joystick.dy = 0;
    });

    // Shoot zone — tap to shoot / hold to auto-aim-shoot
    this.shootZone.addEventListener('touchstart', function (e) {
        e.preventDefault();
        self.shootButton.active = true;
        self.shootButton.touchId = e.changedTouches[0].identifier;

        // Aim toward touch position
        var touch = e.changedTouches[0];
        if (self.game.player && self.game.player.alive && self.game.camera) {
            var world = self.game.camera.screenToWorld(touch.clientX, touch.clientY);
            self.game.player.angle = Utils.angleBetween(self.game.player.x, self.game.player.y, world.x, world.y);
        }
    }, { passive: false });

    this.shootZone.addEventListener('touchmove', function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === self.shootButton.touchId) {
                var touch = e.changedTouches[i];
                if (self.game.player && self.game.player.alive && self.game.camera) {
                    var world = self.game.camera.screenToWorld(touch.clientX, touch.clientY);
                    self.game.player.angle = Utils.angleBetween(self.game.player.x, self.game.player.y, world.x, world.y);
                }
            }
        }
    }, { passive: false });

    this.shootZone.addEventListener('touchend', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === self.shootButton.touchId) {
                self.shootButton.active = false;
                self.shootButton.touchId = null;
            }
        }
    });

    // Dash button
    this.dashBtn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        self.dashButton.active = true;
        self.dashBtn.classList.add('active');
    }, { passive: false });

    this.dashBtn.addEventListener('touchend', function (e) {
        e.preventDefault();
        self.dashButton.active = false;
        self.dashBtn.classList.remove('active');
    }, { passive: false });

    // Auto-fire toggle
    this.autoFireBtn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        self.autoFire = !self.autoFire;
        if (self.autoFire) {
            self.autoFireBtn.classList.add('active');
            self.autoFireBtn.textContent = 'AUTO\nON';
        } else {
            self.autoFireBtn.classList.remove('active');
            self.autoFireBtn.textContent = 'AUTO';
        }
    }, { passive: false });

    // Prevent default on the whole document to stop mobile scroll/zoom
    document.addEventListener('touchmove', function (e) {
        if (e.target.closest('#mobile-controls') || e.target === self.game.canvas) {
            e.preventDefault();
        }
    }, { passive: false });
};

MobileControls.prototype.updateAbilityButtons = function () {
    if (!this.active || !this.game.player) return;
    var abilities = this.game.player.abilitySystem.getAbilities();

    // Clear old
    this.abilityContainer.innerHTML = '';
    this.buttons = [];

    var startX = window.innerWidth - 60;
    var startY = window.innerHeight - 280;
    var spacing = 52;

    for (var i = 0; i < abilities.length; i++) {
        var ab = abilities[i];
        var btn = document.createElement('div');
        btn.className = 'mobile-btn mobile-btn-round mobile-ability-btn';
        btn.style.right = '15px';
        btn.style.bottom = (280 + i * spacing) + 'px';

        var iconId = ab.icon || 'default';
        var iconHTML = '';
        if (typeof AbilityIcons !== 'undefined' && AbilityIcons._svgs && AbilityIcons._svgs[iconId]) {
            iconHTML = '<span class="ab-icon" style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;">' + AbilityIcons._svgs[iconId] + '</span>';
        } else {
            iconHTML = '<span class="ab-icon">⚡</span>';
        }

        btn.innerHTML = '<span class="ab-key">' + ab.key + '</span>' + iconHTML + '<div class="ab-cd" style="height:0%"></div>';

        var self = this;
        (function (index) {
            btn.addEventListener('touchstart', function (e) {
                e.preventDefault();
                if (self.game.player) {
                    self.game.player.abilitySystem.useAbility(index, self.game);
                }
                btn.classList.add('active');
                setTimeout(function () { btn.classList.remove('active'); }, 200);
            }, { passive: false });
        })(i);

        this.abilityContainer.appendChild(btn);
        this.buttons.push({ element: btn, index: i });
    }
};

MobileControls.prototype.update = function (dt) {
    if (!this.active || !this.game.player || !this.game.player.alive) return;

    var player = this.game.player;

    // Process joystick
    if (this.joystick.active) {
        var dx = this.joystick.currentX - this.joystick.startX;
        var dy = this.joystick.currentY - this.joystick.startY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var maxDist = this.joyRadius;

        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        this.joystick.dx = dx / maxDist;
        this.joystick.dy = dy / maxDist;

        // Apply movement
        if (dist > 10) {
            player.vx += this.joystick.dx * player.moveSpeed * 0.28;
            player.vy += this.joystick.dy * player.moveSpeed * 0.28;
        }
    }

    // Auto-aim: find nearest enemy and aim at them
    if (this.autoAim && !this.shootButton.active) {
        var nearest = null;
        var nearestDist = 500;
        var enemies = this.game.getEnemiesInRadius(player.x, player.y, 500, player.id);
        for (var i = 0; i < enemies.length; i++) {
            var d = Utils.dist(player.x, player.y, enemies[i].x, enemies[i].y);
            if (d < nearestDist) {
                nearestDist = d;
                nearest = enemies[i];
            }
        }
        // Also check shapes
        if (!nearest) {
            var shapes = this.game.getShapesInRadius(player.x, player.y, 300);
            for (var j = 0; j < shapes.length; j++) {
                var sd = Utils.dist(player.x, player.y, shapes[j].x, shapes[j].y);
                if (sd < nearestDist) {
                    nearestDist = sd;
                    nearest = shapes[j];
                }
            }
        }
        if (nearest) {
            player.angle = Utils.angleBetween(player.x, player.y, nearest.x, nearest.y);
        }
    }

    // Shoot
    if (this.shootButton.active || this.autoFire) {
        player.shoot(this.game);
    }

    // Dash
    if (this.dashButton.active) {
        if (player.dashCooldownTimer <= 0 && player.performDash) {
            player.performDash(this.game);
        }
        this.dashButton.active = false;
    }

    // Update ability button cooldowns
    for (var k = 0; k < this.buttons.length; k++) {
        var btn = this.buttons[k];
        var ab = player.abilitySystem.getAbilities()[btn.index];
        if (ab) {
            var cd = btn.element.querySelector('.ab-cd');
            if (cd) {
                if (ab.currentCooldown > 0) {
                    cd.style.height = (ab.currentCooldown / ab.cooldown * 100) + '%';
                } else {
                    cd.style.height = '0%';
                }
            }
        }
    }
};

MobileControls.prototype.render = function () {
    if (!this.active) return;

    var ctx = this.joyCtx;
    var w = this.joyCanvas.width;
    var h = this.joyCanvas.height;
    var cx = w / 2;
    var cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    if (!this.game.player || !this.game.player.alive) return;

    // Draw joystick base
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, this.joyRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw crosshairs
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();

    // Draw knob
    if (this.joystick.active) {
        var knobX = cx + this.joystick.dx * this.joyRadius;
        var knobY = cy + this.joystick.dy * this.joyRadius;

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(knobX, knobY, this.joyKnobRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(knobX, knobY);
        ctx.stroke();
    } else {
        // Idle knob at center
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(cx, cy, this.joyKnobRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Dash cooldown indicator
    if (this.game.player.dashCooldownTimer > 0) {
        this.dashBtn.style.opacity = '0.4';
    } else {
        this.dashBtn.style.opacity = '1';
    }
};
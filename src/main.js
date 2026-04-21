(function () {
    'use strict';
    var canvas = document.getElementById('game-canvas');
    var game = new Game(canvas);
    var sandbox = new SandboxUI(game);
    var mobile = new MobileControls(game);

    // Store mobile ref on game for access
    game.mobile = mobile;

    // Resume audio on first interaction
    document.addEventListener('click', function () {
        if (game.sound) game.sound.resume();
    }, { once: true });

    document.addEventListener('touchstart', function () {
        if (game.sound) game.sound.resume();
    }, { once: true });

    var playBtn = document.getElementById('play-button');
    var nameInput = document.getElementById('player-name-input');

    playBtn.addEventListener('click', function () {
        if (game.sound) game.sound.resume();
        try {
            game.start(nameInput.value.trim() || 'Player');
            // Setup mobile ability buttons after start
            if (mobile.active) {
                setTimeout(function () { mobile.updateAbilityButtons(); }, 500);
            }
        } catch (e) {
            console.error('Start failed:', e);
        }
    });

    nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') playBtn.click();
    });

    nameInput.focus();

    window.addEventListener('keydown', function (e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });
})();
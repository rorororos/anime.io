function Bot(name) {
    Player.call(this, name, true);
    this.ai = new AIController(this);
    this._deathTimer = 0;
}
Bot.prototype = Object.create(Player.prototype);
Bot.prototype.constructor = Bot;

Bot.prototype.update = function (dt, game) {
    if (!this.alive) return;
    this.ai.update(dt, game);
    Player.prototype.update.call(this, dt, game);
};
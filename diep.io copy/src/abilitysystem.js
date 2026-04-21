function AbilitySystem(owner) {
    this.owner = owner;
    this.abilities = [];
}

AbilitySystem.prototype.addAbility = function (abilityDef) {
    // Don't add duplicates
    for (var i = 0; i < this.abilities.length; i++) {
        if (this.abilities[i].id === abilityDef.id) return;
    }
    if (this.abilities.length >= 6) return;

    this.abilities.push({
        id: abilityDef.id,
        name: abilityDef.name,
        key: abilityDef.key,
        icon: abilityDef.icon,
        cooldown: abilityDef.cooldown,
        execute: abilityDef.execute,
        currentCooldown: 0,
        ready: true
    });
};

AbilitySystem.prototype.update = function (dt) {
    for (var i = 0; i < this.abilities.length; i++) {
        var ab = this.abilities[i];
        if (ab.currentCooldown > 0) {
            ab.currentCooldown -= dt;
            if (ab.currentCooldown <= 0) {
                ab.currentCooldown = 0;
                ab.ready = true;
            }
        }
    }
};

AbilitySystem.prototype.useAbility = function (index, game) {
    if (index < 0 || index >= this.abilities.length) return false;
    var ab = this.abilities[index];
    if (!ab.ready || ab.currentCooldown > 0) return false;
    if (ab.execute) {
        try {
            ab.execute(this.owner, game);
                if (game && game.sound) game.sound.ability();
        } catch (e) {
            console.error('Ability error:', ab.name, e);
        }
    }
    ab.currentCooldown = ab.cooldown;
    ab.ready = false;
    return true;
};

AbilitySystem.prototype.useAbilityByKey = function (key, game) {
    for (var i = 0; i < this.abilities.length; i++) {
        if (this.abilities[i].key === key) {
            return this.useAbility(i, game);
        }
    }
    return false;
};

AbilitySystem.prototype.getAbilities = function () {
    return this.abilities;
};

AbilitySystem.prototype.clear = function () {
    this.abilities = [];
};
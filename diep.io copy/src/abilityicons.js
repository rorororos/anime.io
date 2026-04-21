var AbilityIcons = {
    _cache: {},

    get: function (iconId) {
        if (this._cache[iconId]) return this._cache[iconId];
        var svg = this._svgs[iconId];
        if (!svg) svg = this._svgs['default'];
        // Create image from SVG string
        var img = new Image();
        var blob = new Blob([svg], { type: 'image/svg+xml' });
        img.src = URL.createObjectURL(blob);
        this._cache[iconId] = img;
        return img;
    },

    // Returns inline SVG string for use in DOM
    getInline: function (iconId) {
        return this._svgs[iconId] || this._svgs['default'];
    },

    _svgs: {
        'default': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="none" stroke="#1a1a1a" stroke-width="2"/><line x1="16" y1="8" x2="16" y2="24" stroke="#1a1a1a" stroke-width="2"/><line x1="8" y1="16" x2="24" y2="16" stroke="#1a1a1a" stroke-width="2"/></svg>',

        // FIST / PUNCH
        'fist': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M8 20 L14 8 L18 8 L20 12 L22 8 L25 10 L22 18 L24 24 L8 24Z" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/><line x1="14" y1="12" x2="14" y2="18" stroke="#1a1a1a" stroke-width="1.5"/><line x1="18" y1="12" x2="18" y2="18" stroke="#1a1a1a" stroke-width="1.5"/></svg>',

        // RAPID STRIKES
        'rapid': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><line x1="4" y1="10" x2="20" y2="10" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="16" x2="24" y2="16" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="22" x2="22" y2="22" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/><polygon points="22,8 28,10 22,12" fill="#1a1a1a"/><polygon points="26,14 32,16 26,18" fill="#1a1a1a"/><polygon points="24,20 30,22 24,24" fill="#1a1a1a"/></svg>',

        // FLAME / FIRE
        'flame': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 4 C16 4 22 10 22 18 C22 22 19 26 16 28 C13 26 10 22 10 18 C10 10 16 4 16 4Z" fill="none" stroke="#1a1a1a" stroke-width="2"/><path d="M16 12 C16 12 19 15 19 19 C19 21 17.5 23 16 24 C14.5 23 13 21 13 19 C13 15 16 12 16 12Z" fill="#1a1a1a" opacity="0.3"/></svg>',

        // SPEED / BOOST
        'speed': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 16 L12 6 L14 14 L20 4 L18 16 L24 10 L20 20 L28 16" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>',

        // SHIELD
        'shield': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 4 L26 8 L26 18 C26 24 16 28 16 28 C16 28 6 24 6 18 L6 8Z" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/><line x1="16" y1="12" x2="16" y2="22" stroke="#1a1a1a" stroke-width="1.5"/><line x1="11" y1="16" x2="21" y2="16" stroke="#1a1a1a" stroke-width="1.5"/></svg>',

        // BIG IMPACT
        'impact': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="none" stroke="#1a1a1a" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="#1a1a1a" stroke-width="2"/><line x1="16" y1="26" x2="16" y2="30" stroke="#1a1a1a" stroke-width="2"/><line x1="2" y1="16" x2="6" y2="16" stroke="#1a1a1a" stroke-width="2"/><line x1="26" y1="16" x2="30" y2="16" stroke="#1a1a1a" stroke-width="2"/><line x1="6" y1="6" x2="9" y2="9" stroke="#1a1a1a" stroke-width="1.5"/><line x1="23" y1="23" x2="26" y2="26" stroke="#1a1a1a" stroke-width="1.5"/><line x1="26" y1="6" x2="23" y2="9" stroke="#1a1a1a" stroke-width="1.5"/><line x1="9" y1="23" x2="6" y2="26" stroke="#1a1a1a" stroke-width="1.5"/></svg>',

        // SWORD / SLASH
        'slash': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><line x1="6" y1="26" x2="26" y2="6" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/><line x1="22" y1="6" x2="26" y2="10" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="24" r="2" fill="none" stroke="#1a1a1a" stroke-width="1.5"/></svg>',

        // MULTI SLASH
        'multi_slash': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><line x1="4" y1="24" x2="28" y2="4" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="28" x2="28" y2="8" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/><line x1="2" y1="20" x2="24" y2="2" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/></svg>',

        // TORNADO / SPIN
        'tornado': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M8 8 Q16 4 24 8" fill="none" stroke="#1a1a1a" stroke-width="2"/><path d="M6 14 Q16 10 26 14" fill="none" stroke="#1a1a1a" stroke-width="2"/><path d="M10 20 Q16 16 22 20" fill="none" stroke="#1a1a1a" stroke-width="2"/><path d="M12 26 Q16 22 20 26" fill="none" stroke="#1a1a1a" stroke-width="1.5"/></svg>',

        // DASH
        'dash': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><polygon points="20,16 8,10 10,16 8,22" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/><line x1="20" y1="16" x2="28" y2="16" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="12" x2="28" y2="12" stroke="#1a1a1a" stroke-width="1" stroke-linecap="round" opacity="0.5"/><line x1="22" y1="20" x2="28" y2="20" stroke="#1a1a1a" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>',

        // PROJECTILE / BEAM
        'beam': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><line x1="4" y1="16" x2="28" y2="16" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/><circle cx="28" cy="16" r="3" fill="none" stroke="#1a1a1a" stroke-width="1.5"/><line x1="4" y1="10" x2="12" y2="14" stroke="#1a1a1a" stroke-width="1" opacity="0.4"/><line x1="4" y1="22" x2="12" y2="18" stroke="#1a1a1a" stroke-width="1" opacity="0.4"/></svg>',

        // EXPLOSION
        'explosion': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><polygon points="16,2 19,12 28,8 22,16 30,20 20,20 22,30 16,22 10,30 12,20 2,20 10,16 4,8 13,12" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linejoin="round"/></svg>',

        // HEAL
        'heal': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="13" y="6" width="6" height="20" rx="1" fill="none" stroke="#1a1a1a" stroke-width="2"/><rect x="6" y="13" width="20" height="6" rx="1" fill="none" stroke="#1a1a1a" stroke-width="2"/></svg>',

        // EYE
        'eye': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M4 16 Q16 6 28 16 Q16 26 4 16Z" fill="none" stroke="#1a1a1a" stroke-width="2"/><circle cx="16" cy="16" r="4" fill="#1a1a1a"/><circle cx="16" cy="16" r="2" fill="#f5f0e8"/></svg>',

        // SKULL / CURSE
        'skull': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="14" r="9" fill="none" stroke="#1a1a1a" stroke-width="2"/><circle cx="12" cy="13" r="2.5" fill="#1a1a1a"/><circle cx="20" cy="13" r="2.5" fill="#1a1a1a"/><path d="M12 22 L12 28" stroke="#1a1a1a" stroke-width="2"/><path d="M16 22 L16 28" stroke="#1a1a1a" stroke-width="2"/><path d="M20 22 L20 28" stroke="#1a1a1a" stroke-width="2"/></svg>',

        // CROWN
        'crown': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M4 22 L4 12 L10 18 L16 8 L22 18 L28 12 L28 22Z" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/><line x1="4" y1="24" x2="28" y2="24" stroke="#1a1a1a" stroke-width="2"/></svg>',

        // SPIRAL / VORTEX
        'spiral': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 16 Q20 16 20 12 Q20 8 16 8 Q10 8 10 14 Q10 22 18 22 Q26 22 26 14 Q26 4 16 4" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/></svg>',

        // ARROW
        'arrow': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><line x1="4" y1="28" x2="26" y2="6" stroke="#1a1a1a" stroke-width="2"/><polygon points="28,4 20,6 26,12" fill="#1a1a1a"/><line x1="4" y1="28" x2="10" y2="26" stroke="#1a1a1a" stroke-width="2"/><line x1="4" y1="28" x2="6" y2="22" stroke="#1a1a1a" stroke-width="2"/></svg>',

        // WAVE
        'wave': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M4 16 Q8 8 12 16 Q16 24 20 16 Q24 8 28 16" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/></svg>',

        // STAR
        'star': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><polygon points="16,4 19,12 28,13 21,19 23,28 16,23 9,28 11,19 4,13 13,12" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/></svg>',

        // GATE / DOMAIN
        'domain': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="6" y="6" width="20" height="20" rx="2" fill="none" stroke="#1a1a1a" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="none" stroke="#1a1a1a" stroke-width="1.5"/><circle cx="16" cy="16" r="2" fill="#1a1a1a"/></svg>',

        // CLONE / DOUBLE
        'clone': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="12" cy="14" r="6" fill="none" stroke="#1a1a1a" stroke-width="2"/><circle cx="20" cy="14" r="6" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-dasharray="2 2"/><line x1="12" y1="22" x2="12" y2="28" stroke="#1a1a1a" stroke-width="2"/><line x1="20" y1="22" x2="20" y2="28" stroke="#1a1a1a" stroke-width="2" stroke-dasharray="2 2"/></svg>',

        // ICE / CRYSTAL
        'ice': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><line x1="16" y1="4" x2="16" y2="28" stroke="#1a1a1a" stroke-width="2"/><line x1="6" y1="10" x2="26" y2="22" stroke="#1a1a1a" stroke-width="2"/><line x1="6" y1="22" x2="26" y2="10" stroke="#1a1a1a" stroke-width="2"/><line x1="12" y1="6" x2="16" y2="10" stroke="#1a1a1a" stroke-width="1.5"/><line x1="20" y1="6" x2="16" y2="10" stroke="#1a1a1a" stroke-width="1.5"/></svg>',

        // AURA / POWER UP
        'aura': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="none" stroke="#1a1a1a" stroke-width="2"/><path d="M16 4 L18 10 L16 8 L14 10Z" fill="#1a1a1a"/><path d="M16 28 L18 22 L16 24 L14 22Z" fill="#1a1a1a"/><path d="M4 16 L10 14 L8 16 L10 18Z" fill="#1a1a1a"/><path d="M28 16 L22 14 L24 16 L22 18Z" fill="#1a1a1a"/></svg>',

        // MOON / CRESCENT
        'moon': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M18 4 A12 12 0 1 0 18 28 A8 8 0 1 1 18 4Z" fill="none" stroke="#1a1a1a" stroke-width="2"/></svg>',

        // LIGHTNING
        'lightning': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><polygon points="18,2 10,16 16,16 12,30 24,14 18,14 22,2" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/></svg>',

        // METEOR
        'meteor': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="20" cy="20" r="8" fill="none" stroke="#1a1a1a" stroke-width="2"/><line x1="14" y1="14" x2="4" y2="4" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="4" y2="10" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/><line x1="17" y1="12" x2="10" y2="4" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/></svg>',

        // PETAL / FLOWER
        'petal': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><ellipse cx="16" cy="10" rx="4" ry="7" fill="none" stroke="#1a1a1a" stroke-width="1.5" transform="rotate(0 16 16)"/><ellipse cx="16" cy="10" rx="4" ry="7" fill="none" stroke="#1a1a1a" stroke-width="1.5" transform="rotate(72 16 16)"/><ellipse cx="16" cy="10" rx="4" ry="7" fill="none" stroke="#1a1a1a" stroke-width="1.5" transform="rotate(144 16 16)"/><ellipse cx="16" cy="10" rx="4" ry="7" fill="none" stroke="#1a1a1a" stroke-width="1.5" transform="rotate(216 16 16)"/><ellipse cx="16" cy="10" rx="4" ry="7" fill="none" stroke="#1a1a1a" stroke-width="1.5" transform="rotate(288 16 16)"/><circle cx="16" cy="16" r="2" fill="#1a1a1a"/></svg>',

        // DIAMOND / GEM
        'gem': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><polygon points="16,4 26,14 16,28 6,14" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/><line x1="6" y1="14" x2="26" y2="14" stroke="#1a1a1a" stroke-width="1.5"/><line x1="16" y1="4" x2="12" y2="14" stroke="#1a1a1a" stroke-width="1"/><line x1="16" y1="4" x2="20" y2="14" stroke="#1a1a1a" stroke-width="1"/></svg>',

        // KNIFE
        'knife': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M24 4 L28 8 L10 26 L6 26 L4 24 L4 22Z" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/><line x1="8" y1="20" x2="12" y2="24" stroke="#1a1a1a" stroke-width="1.5"/></svg>',

        // CLOUD
        'cloud': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M8 22 Q4 22 4 18 Q4 14 8 14 Q8 10 12 10 Q14 6 18 8 Q22 6 24 10 Q28 10 28 14 Q28 18 24 18 Q28 22 24 22Z" fill="none" stroke="#1a1a1a" stroke-width="2"/></svg>',

        // CROSS SLASH (X)
        'cross_slash': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><line x1="6" y1="6" x2="26" y2="26" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/><line x1="26" y1="6" x2="6" y2="26" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/></svg>'
    }
};
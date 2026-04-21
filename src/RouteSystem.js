var ROUTES = {
    'one-piece': { id: 'one-piece', name: 'One Piece', emoji: '🏴‍☠️', color: '#c0392b', description: 'Elastic power, Haki, Fire', characters: [
        { id: 'luffy', name: 'Luffy', color: '#c0392b', secondaryColor: '#c9a84c', title: 'Rubber Captain' },
        { id: 'zoro', name: 'Zoro', color: '#27ae60', secondaryColor: '#82e0aa', title: 'Three-Sword Style' },
        { id: 'sanji', name: 'Sanji', color: '#d4a843', secondaryColor: '#b8860b', title: 'Black Leg' },
        { id: 'ace', name: 'Ace', color: '#d35400', secondaryColor: '#c9a84c', title: 'Fire Fist' }
    ]},
    'jojo': { id: 'jojo', name: "JoJo's Bizarre Adventure", emoji: '⭐', color: '#8e44ad', description: 'Stand Power, Time', characters: [
        { id: 'jotaro', name: 'Jotaro', color: '#2c3e8c', secondaryColor: '#6c7eb7', title: 'Star Platinum' },
        { id: 'dio', name: 'Dio', color: '#c9a84c', secondaryColor: '#b8860b', title: 'The World' },
        { id: 'giorno', name: 'Giorno', color: '#b03060', secondaryColor: '#c9a84c', title: 'Gold Experience' }
    ]},
    'jjk': { id: 'jjk', name: 'Jujutsu Kaisen', emoji: '👁️', color: '#2c3e8c', description: 'Cursed Energy, Domains', characters: [
        { id: 'gojo', name: 'Gojo', color: '#5dade2', secondaryColor: '#aed6f1', title: 'Infinity' },
        { id: 'yuji', name: 'Yuji', color: '#c0392b', secondaryColor: '#d98880', title: 'Divergent Fist' },
        { id: 'megumi', name: 'Megumi', color: '#2c3e50', secondaryColor: '#5d6d7e', title: 'Ten Shadows' },
        { id: 'sukuna', name: 'Sukuna', color: '#922b21', secondaryColor: '#c0392b', title: 'King of Curses' }
    ]},
    'naruto': { id: 'naruto', name: 'Naruto', emoji: '🍥', color: '#d35400', description: 'Chakra, Jutsu, Clones', characters: [
        { id: 'naruto', name: 'Naruto', color: '#d35400', secondaryColor: '#c9a84c', title: 'Rasengan' },
        { id: 'sasuke', name: 'Sasuke', color: '#2c3e50', secondaryColor: '#7d3c98', title: 'Sharingan' },
        { id: 'kakashi', name: 'Kakashi', color: '#7f8c8d', secondaryColor: '#5dade2', title: 'Copy Ninja' },
        { id: 'madara', name: 'Madara', color: '#641e16', secondaryColor: '#c0392b', title: 'Uchiha Legend' }
    ]},
    'mha': { id: 'mha', name: 'My Hero Academia', emoji: '💥', color: '#27ae60', description: 'Quirks, Plus Ultra', characters: [
        { id: 'deku', name: 'Deku', color: '#27ae60', secondaryColor: '#82e0aa', title: 'One For All' },
        { id: 'bakugo', name: 'Bakugo', color: '#d35400', secondaryColor: '#c9a84c', title: 'Explosion' },
        { id: 'todoroki', name: 'Todoroki', color: '#2c3e8c', secondaryColor: '#c0392b', title: 'Half-Cold Half-Hot' }
    ]},
    'dragonball': { id: 'dragonball', name: 'Dragon Ball', emoji: '🟠', color: '#c9a84c', description: 'Ki, Beams, Transformations', characters: [
        { id: 'goku', name: 'Goku', color: '#d35400', secondaryColor: '#5dade2', title: 'Super Saiyan' },
        { id: 'vegeta', name: 'Vegeta', color: '#2c3e8c', secondaryColor: '#c9a84c', title: 'Prince of Saiyans' },
        { id: 'gohan', name: 'Gohan', color: '#7d3c98', secondaryColor: '#d2b4de', title: 'Ultimate Form' },
        { id: 'frieza', name: 'Frieza', color: '#8e44ad', secondaryColor: '#d5d8dc', title: 'Emperor' }
    ]},
    'bleach': { id: 'bleach', name: 'Bleach', emoji: '⚔️', color: '#7f8c8d', description: 'Zanpakuto, Bankai', characters: [
        { id: 'ichigo', name: 'Ichigo', color: '#d35400', secondaryColor: '#1a1a1a', title: 'Getsuga Tensho' },
        { id: 'byakuya', name: 'Byakuya', color: '#7d3c98', secondaryColor: '#d2b4de', title: 'Senbonzakura' },
        { id: 'aizen', name: 'Aizen', color: '#6e4b1e', secondaryColor: '#c9a84c', title: 'Complete Hypnosis' }
    ]}
};

function RouteSystem() { this.routes = ROUTES; }
RouteSystem.prototype.getRoute = function (id) { return this.routes[id] || null; };
RouteSystem.prototype.getAllRoutes = function () { return Object.values(this.routes); };
RouteSystem.prototype.getRandomCharacter = function (routeId) {
    var r = this.routes[routeId]; if (!r) return null;
    return Utils.pickRandom(r.characters);
};
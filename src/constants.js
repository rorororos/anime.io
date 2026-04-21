const CONST = {
    MAP_WIDTH: 6000, MAP_HEIGHT: 6000, GRID_SIZE: 60,
    PLAYER_RADIUS: 22, PLAYER_BASE_SPEED: 3.2, PLAYER_BASE_HP: 120,
    PLAYER_BASE_HP_REGEN: 0.5, PLAYER_BASE_DAMAGE: 12, PLAYER_BASE_PROJ_SPEED: 9,
    PLAYER_BASE_RELOAD: 420, PLAYER_BASE_PROJ_PEN: 1, PLAYER_BASE_PROJ_SIZE: 7,
    BARREL_LENGTH: 30, BARREL_WIDTH: 12,     FIST_RANGE: 65,
    FIST_DAMAGE_MULT: 1.4,
    SWORD_RANGE: 80,
    SWORD_ARC: 0.8,
    SWORD_DAMAGE_MULT: 1.3,
    STAT_MAX_LEVEL: 7,
    STAT_NAMES: ['HP Max','HP Regen','Move Speed','Proj Damage','Proj Speed','Reload','Proj Penetration','Proj Size'],
    STAT_KEYS: ['maxHp','hpRegen','moveSpeed','projDamage','projSpeed','reload','projPen','projSize'],
    STAT_MULTIPLIERS: {maxHp:25,hpRegen:0.35,moveSpeed:0.25,projDamage:5,projSpeed:1.0,reload:-45,projPen:1,projSize:1.8},
    XP_BASE: 12, XP_SCALE: 1.1, MAX_LEVEL: 45, ROUTE_SELECTION_LEVEL: 15,
    ABILITY_LEVELS: [15,20,25,30,35,40],
    STAT_POINTS_PER_LEVEL: 1, BONUS_STAT_LEVELS: [5,10,15,20,25,30,35,40],
    SHAPE_MAX: 300,
    SHAPE_TYPES: {
        SQUARE: {sides:4,radius:14,hp:8,xp:15,color:'#c9a84c',strokeColor:'#1a1a1a',glowColor:'rgba(0,0,0,0)',rotSpeed:0.01},
        TRIANGLE: {sides:3,radius:16,hp:18,xp:40,color:'#c0392b',strokeColor:'#1a1a1a',glowColor:'rgba(0,0,0,0)',rotSpeed:0.015},
        PENTAGON: {sides:5,radius:26,hp:60,xp:130,color:'#2c3e8c',strokeColor:'#1a1a1a',glowColor:'rgba(0,0,0,0)',rotSpeed:0.005}
    },
    SHAPE_SPAWN_WEIGHTS: [0.55,0.30,0.15],
    BIG_PENTAGON: {sides:5,radius:40,hp:200,xp:500,color:'#555',strokeColor:'#1a1a1a',glowColor:'rgba(0,0,0,0)',rotSpeed:0.003},
    BIG_PENTAGON_MAX: 5, BIG_PENTAGON_ZONE: 800,
    BOT_COUNT: 15,
    BOT_NAMES: ['Akira','Hiro','Yuki','Rin','Kai','Sora','Mika','Ryu','Hana','Kento','Aoi','Shin','Mei','Taro','Nao','Jun','Sakura','Daisuke','Haruka','Takumi','Ayumi','Kenji','Yuna','Tetsu','Mio','Riku','Ami','Goro','Chika','Soma'],
    SPATIAL_CELL_SIZE: 200, PROJ_LIFETIME: 2200, PROJ_POOL_SIZE: 500,
    PARTICLE_POOL_SIZE: 2000, CAMERA_LERP: 0.09, COLLISION_DAMAGE_COOLDOWN: 600,
    SCORE_LEVEL_MULT: 100, SCORE_KILL_MULT: 50, KILL_XP_MULTIPLIER: 20,
    SHAPE_XP_BONUS_PER_LEVEL: 0.05, PASSIVE_XP_RATE: 0.8, PASSIVE_XP_INTERVAL: 1000,
    DEATH_LEVEL_KEEP: 0.65,
    COLOR_PLAYER: '#2c3e8c', COLOR_BOT: '#8c2c2c',
    COLOR_PLAYER_BARREL: '#1a2a5c', COLOR_BOT_BARREL: '#5c1a1a',
    COLOR_GRID: 'rgba(26,26,26,0.06)', COLOR_BG: '#f5f0e8',
    COLOR_INK: '#1a1a1a', COLOR_PAPER: '#f5f0e8', COLOR_PAPER_DARK: '#e8e0d0'
};
Object.freeze(CONST.SHAPE_TYPES);
Object.freeze(CONST.BIG_PENTAGON);

// Add to your existing CONST object
CONST.DASH_COOLDOWN = 1500;
CONST.DASH_DISTANCE = 180;
CONST.XP_ORB_SPEED = 0.15;
CONST.XP_MAGNET_RADIUS = 250;
CONST.FREEZE_FRAME_DURATION = 40; // ms
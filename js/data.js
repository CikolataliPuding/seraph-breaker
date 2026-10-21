// Seraph Breaker · data.js: Game data: units, weapons, gadgets, skill tree, run skills, stages, bosses and room layouts. Most content changes start here.
/* ================= DATA ================= */
const UNITS = {
  azure:  {key:'azure',  name:'Azure',  role:'Type-00 · Rapid rifle', c1:0x2f62d8, c2:0xeeeef4, c3:0x1d2233, eye:0x6ad8ff, shot:0x7fe0ff, hp:100, speed:8.6},
  crimson:{key:'crimson',name:'Crimson',role:'Type-02 · Scatter cannon', c1:0xd5352a, c2:0xf2a51e, c3:0x2a1b20, eye:0x9effa0, shot:0xffa060, hp:90, speed:10.4},
  verdant:{key:'verdant',name:'Verdant',role:'Type-01 · Pierce lance', c1:0x6b3fb8, c2:0x5fd04a, c3:0x1d1a26, eye:0xfff070, shot:0xb8ff5a, hp:140, speed:7.6},
};
const SPECIALS = {
  azure:{name:'Overdrive',d:'5 s of 2.5× fire rate, +30% damage and +20% speed.'},
  crimson:{name:'Crimson Nova',d:'Leap to the target and detonate on landing. Invulnerable in the air.'},
  verdant:{name:'Judgement Lance',d:'Channel a huge beam for 2.4 s. It burns through enemies and erases shots.'},
};
const PAINT1=[0x2f62d8,0xd5352a,0x6b3fb8,0x3aa048,0xe8e8ee,0x3a3d48,0xd9a520,0xf07a1a,0x1e1c24,0xe0508a];
const PAINT2=[0xeeeef4,0xf2a51e,0x5fd04a,0x3ad0ff,0xd5352a,0xff7ad0,0x24202c,0xffd36a];
const IC={
  sig:'M3 14h12l3-2h3v3h-3l-2 2H8l-1 3H5l1-3H3z', rail:'M2 12h15M17 8l5 4-5 4M6 8v8M10 8v8',
  torch:'M12 3c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-3-1-5 0-7z', arc:'M13 2L4 14h7l-1 8 9-12h-7z',
  blade:'M4 20L18 6l3-3v4L8 20zM3 21l3-3', swarm:'M4 20l4-4M8 16l8-8 4-4-1 5-8 8zM5 12l3 1M12 19l-1-3',
  grav:'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M2 12c4-6 16-6 20 0M2 12c4 6 16 6 20 0', hook:'M12 3v10a4 4 0 1 1-4-4M12 3l-3 3M12 3l3 3',
  mines:'M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0M12 2v3M12 19v3M2 12h3M19 12h3', jets:'M8 3h8l1 9H7zM9 12l-1 6M15 12l1 6M12 14v7',
  decoy:'M9 7a3 3 0 1 0 6 0a3 3 0 1 0-6 0M6 21v-4a6 6 0 0 1 12 0v4', emp:'M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  drone:'M4 8h16M7 8v3h10V8M12 11v3M9 18h6M12 14l-3 4M12 14l3 4', chrono:'M4 13a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 9v4l3 2M9 2h6',
  sp:'M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z', dash:'M3 12h10M3 7h6M3 17h6M13 6l7 6-7 6z',
  twin:'M8 4v16M16 4v16M5 7l3-3 3 3M13 7l3-3 3 3', diag:'M12 20V5M12 12L5 5M12 12l7-7', rear:'M12 4v16M8 16l4 4 4-4M8 8l4-4 4 4',
  pierce:'M3 12h18M15 6l6 6-6 6M9 8v8', ricochet:'M3 18l6-12 5 9 7-11', cryo:'M12 2v20M3 7l18 10M21 7L3 17',
  atk:'M14 4l6 6-10 10H4v-6z', armor:'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z', vamp:'M12 21s-8-5-8-11a5 5 0 0 1 8-3 5 5 0 0 1 8 3c0 6-8 11-8 11z',
  orbit:'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2a10 10 0 0 1 10 10M12 22A10 10 0 0 1 2 12', regen:'M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5M18 3v4h-4M6 21v-4h4',
  crit:'M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 7v10M7 12h10', heal:'M12 5v14M5 12h14',
};
const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${IC[k]}"/></svg>`;
const WEAPONS={
  sig:  {name:'Signature',price:0,tag:'Frame weapon',d:'Your frame\'s built-in gun: rapid rifle, scatter cannon or pierce lance.'},
  torch:{name:'Plasma Torch',price:90,tag:'Stream · short range',d:'A cone of plasma that burns everything in front of you.'},
  blade:{name:'Vibro Blade',price:100,tag:'Melee · lunge',d:'Lunging slashes that hit hard and cut enemy shots out of the air.'},
  rail: {name:'Rail Lance',price:120,tag:'Charge · pierce',d:'Hold to charge, release to fire. A full charge pierces the whole line for huge damage.'},
  arc:  {name:'Arc Caster',price:160,tag:'Chain lightning',d:'Locks onto the nearest target and jumps to three more. No aiming needed.'},
  swarm:{name:'Swarm Pod',price:220,tag:'Homing',d:'Volleys of micro-missiles that hunt their own targets.'},
  grav: {name:'Singularity Cannon',price:380,tag:'Control',d:'A slow orb that collapses into a black hole, dragging in enemies and their shots.'},
};
const GADGETS={
  hook:  {name:'Grapple Hook',price:60,cd:5,tag:'Mobility',d:'Fire a hook. It reels you to the first enemy it hits and stuns it.'},
  mines: {name:'Proximity Mines',price:80,cd:8,tag:'Trap',d:'Drop three mines around you that blow up when enemies come close.'},
  jets:  {name:'Jump Jets',price:90,cd:6,tag:'Mobility',d:'Leap over everything. Invulnerable in the air, shockwave on landing.'},
  decoy: {name:'Holo Decoy',price:110,cd:16,tag:'Trick',d:'Project a hologram for 5 s. Enemies and bosses aim at it instead of you.'},
  emp:   {name:'EMP Burst',price:130,cd:14,tag:'Control',d:'Erase nearby shots and stun enemies for 2.5 s. Interrupts boss attacks.'},
  drone: {name:'Combat Drone',price:150,cd:20,tag:'Support',d:'Deploy a drone that orbits you and fires at enemies for 12 s.'},
  chrono:{name:'Chrono Field',price:300,cd:25,tag:'Time',d:'Slow every enemy and enemy shot to a crawl for 4 s.'},
};
const TREE=[
  {branch:'Offense',c:'#ff6a1a',nodes:[
    {id:'dmg',name:'Overclocked rounds',max:3,cost:[150,300,500],d:'+10% damage per rank'},
    {id:'rate',name:'Faster cycling',max:2,cost:[250,500],d:'+8% fire rate per rank'},
    {id:'crit',name:'Weak-point optics',max:3,cost:[300,500,800],d:'+7% chance to deal double damage'},
    {id:'sp',name:'Sync amplifier',max:2,cost:[400,800],d:'+25% special charge rate'},
    {id:'exec',name:'Executioner',max:1,cost:[1500],d:'+30% damage to bosses'}]},
  {branch:'Defense',c:'#5fe0ff',nodes:[
    {id:'hp',name:'Reinforced plating',max:3,cost:[150,300,500],d:'+15 max armor per rank'},
    {id:'repair',name:'Field repair',max:2,cost:[250,500],d:'+40% healing from pickups and angels'},
    {id:'hex',name:'Hex efficiency',max:2,cost:[300,600],d:'-20% barrier power drain'},
    {id:'plate',name:'Ablative core',max:2,cost:[500,900],d:'-8% damage taken per rank'},
    {id:'second',name:'Second wind',max:1,cost:[1800],d:'Once per level, survive a fatal hit with 30% armor'}]},
  {branch:'Mobility',c:'#7dff9a',nodes:[
    {id:'spd',name:'Servo tuning',max:2,cost:[150,350],d:'+6% move speed per rank'},
    {id:'regen',name:'Cell recharge',max:3,cost:[200,400,650],d:'+15% power regeneration'},
    {id:'dashcd',name:'Thruster vents',max:2,cost:[300,600],d:'-15% dash cooldown'},
    {id:'magnet',name:'Salvage magnet',max:2,cost:[250,500],d:'+60% pickup reach, +10% gold'},
    {id:'gadget',name:'Quick deploy',max:2,cost:[600,1100],d:'-12% gadget cooldowns'}]},
];
/* run skills: picked on level-up, from angels and devils; they last for one level */
const RSK={
  twin:{name:'Twin Shot',d:'+1 parallel projectile.',max:2},
  diag:{name:'Diagonal Fire',d:'+2 projectiles at 40°.',max:1},
  rear:{name:'Rear Guard',d:'+1 projectile behind you.',max:1},
  pierce:{name:'Piercing Rounds',d:'Projectiles pass through enemies.',max:1},
  ricochet:{name:'Ricochet',d:'Projectiles bounce to a nearby enemy.',max:2},
  torch:{name:'Burn Rounds',d:'Hits set enemies on fire for 2.5 s.',max:1},
  cryo:{name:'Cryo Rounds',d:'Hits slow enemies by 45%.',max:1},
  arc:{name:'Chain Spark',d:'Hits can arc to a second enemy.',max:2},
  atk:{name:'Attack Boost',d:'+18% damage.',max:3},
  sig:{name:'Rapid Cycle',d:'+15% fire rate.',max:3},
  armor:{name:'Armor Up',d:'+20% max armor and repair 20%.',max:3},
  vamp:{name:'Vampiric Core',d:'Repair 2% armor per kill.',max:2},
  orbit:{name:'Orbit Blades',d:'Two blades circle you and cut enemies.',max:2},
  regen:{name:'Hex Regen',d:'+40% power regeneration.',max:2},
  dash:{name:'Swift Servos',d:'+12% move speed.',max:2},
  crit:{name:'Crit Lens',d:'+10% critical chance.',max:2},
};
const RSK_IC={twin:'twin',diag:'diag',rear:'rear',pierce:'pierce',ricochet:'ricochet',torch:'torch',cryo:'cryo',arc:'arc',atk:'atk',sig:'arc',armor:'armor',vamp:'vamp',orbit:'orbit',regen:'regen',dash:'dash',crit:'crit'};

/* stages + levels */
const D='drone',S='seraph',H='heavy',W='warden';
const ARENAS=[
  {name:'Outer City', boss:'colossus', hpMul:1, levels:['First Contact','Steel Rain','Wings Over the City'],
   pools:[[D],[D,D,H],[D,D,S,H]],
   theme:{bg:0x1d1424,hemiS:0xffd6b8,hemiG:0x2a1d3a,ground:0x5a4c64,city:0xffffff,edge:0xff6a1a,rim:0xff7a40,win:0xffc47a,floor:0xa898b0,wall:0x3a3346,block:0x5e5468,water:0xff7a2a},
   colorCss:'#ff6a1a'},
  {name:'Night Harbor', boss:'prism', hpMul:1.35, levels:['Low Tide','Watchers','Glass Storm'],
   pools:[[S,S,D],[W,D,S,D],[W,S,H,D]],
   theme:{bg:0x0b1726,hemiS:0xb8d4ff,hemiG:0x10203a,ground:0x3e5470,city:0x9ab4e0,edge:0x3ad0ff,rim:0x3a8aff,win:0x9ae4ff,floor:0x86a2c4,wall:0x22344a,block:0x2f5f9a,water:0x1a74e0},
   colorCss:'#3ad0ff'},
  {name:"Heaven's Gate", boss:'seraph', hpMul:1.75, levels:['The Choir','Iron Faith','Last Light'],
   pools:[[S,W,S,D],[H,W,S,H],[H,W,S,S,W,D]],
   theme:{bg:0x2b1a26,hemiS:0xfff0d0,hemiG:0x3a2638,ground:0x7a6670,city:0xe2c8d8,edge:0xffd36a,rim:0xffb060,win:0xfff0b0,floor:0xd8c6cc,wall:0x8a7480,block:0xf0e8f2,water:0xffd36a},
   colorCss:'#ffd36a'},
];
const BOSSES={
  colossus:{name:'Iron Colossus',cls:'Class · War machine · Siege frame',epi:'Built to level cities. It walks straight through gunfire and shakes the ground apart.',threat:3,warn:'HOSTILE WAR MACHINE INBOUND',hp:470,r:3.2,fly:0,barrier:false,minion:'drone',gold:220,gems:25,angel:false,
    pool:[['burst','missiles','slam'],['burst','missiles','slam','summon'],['missiles','slam','burst','summon','slam']]},
  prism:{name:'Prism Angel',cls:'Class · Angel · Crystalline lattice',epi:'A floating crystal that bends light into a beam able to cut a harbor in half.',threat:4,warn:'HIGH-ENERGY SIGNAL APPROACHING',hp:640,r:3.0,fly:5,barrier:true,minion:'mini',gold:380,gems:40,angel:true,
    pool:[['beam','shards','ring'],['beam','sweep','shards','ring'],['sweep','beam','shards','ring','summon']]},
  seraph:{name:'The Last Seraph',cls:'Class · Angel · Seraph',epi:'The source of every signal. Six wings, one core, and nothing left to lose.',threat:5,warn:'HIGH-ENERGY SIGNAL DESCENDING',hp:860,r:3.0,fly:4.2,barrier:true,minion:'mini',gold:600,gems:60,angel:true,
    pool:[['ring','beam','spiral','aimed'],['ring','beam','spiral','summon','aimed','sweep'],['ring','sweep','spiral','summon','aimed','beam','shards']]},
};
const LEVEL_ROOMS=['combat','combat','angel','combat','elite'], BOSS_ROOMS=['combat','angel','boss'];
function levelInfo(n){
  const s=Math.floor(n/4), k=n%4, Sx=ARENAS[s], boss=k===3;
  return {n,s,k,boss,stage:Sx,name:boss?BOSSES[Sx.boss].name:Sx.levels[k],rooms:boss?BOSS_ROOMS:LEVEL_ROOMS,pool:boss?Sx.pools[2]:Sx.pools[k]};
}
/* hand-built room layouts: 9 columns × 15 rows of 2-unit cells (a tall rectangle). Row 0 is the door side, the last row the entry.
   # block (stops movement and most shots) · ~ hazard canal (stops movement only) · . open floor. Keep row 0 and the last two rows open in the middle. */
const ROOMS=[
  ['.........','.........','.#.....#.','.........','.........','...#.#...','.........','.........','.........','...#.#...','.........','.........','.#.....#.','.........','.........'],
  ['.........','.........','..#...#..','.........','~~~...~~~','.........','.........','....#....','.........','.........','..##.##..','.........','.........','.........','.........'],
  ['.........','....#....','.#..#..#.','.........','.........','.##...##.','.........','....#....','.........','.##...##.','.........','.#..#..#.','.........','.........','.........'],
  ['.........','.~~...~~.','.~.....~.','.........','...#.#...','....#....','...#.#...','.........','.~.....~.','.~~...~~.','.........','...#.#...','.........','.........','.........'],
  ['.........','.........','###...###','.........','.........','....#....','..#...#..','....#....','.........','.........','~~.....~~','.........','.#.....#.','.........','.........'],
  ['.........','.#...#...','.....~~..','.........','.#.......','....#..#.','.........','..~~.....','.......#.','.........','..#......','.....~~..','.........','.........','.........'],
  ['.........','.........','..#####..','..#...#..','.........','.........','..#...#..','..##.##..','.........','.........','.#.....#.','.........','.........','.........','.........'],
  ['.........','.~~.#.~~.','.~~...~~.','.........','.........','.#.~~~.#.','.........','.........','.~~...~~.','.~~...~~.','.........','....#....','.........','.........','.........'],
  ['.........','.........','#.......#','#..#.#..#','.........','.........','...~~~...','.........','.........','#..#.#..#','#.......#','.........','.........','.........','.........'],
  ['.........','..#...#..','.........','....~....','.#..~..#.','....~....','.........','..#...#..','.........','....~....','.#..~..#.','....~....','.........','.........','.........'],
  ['.........','.........','.##.....#','.........','.....##..','.........','#.......#','.........','..##.....','.........','#.....##.','.........','.........','.........','.........'],
  ['.........','.........','.~~~.~~~.','.........','.........','..#...#..','...#.#...','....#....','.........','.........','.~~~.~~~.','.........','.........','.........','.........'],
];
const SANCTUM=['.........','.........','.#.....#.','.........','.........','.........','.........','.........','.........','.........','.........','.........','.#.....#.','.........','.........'];

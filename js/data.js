// Seraph Breaker · data.js: Game data: units, weapons, gadgets, skill tree, run skills, stages, bosses and room layouts. Most content changes start here.
/* ================= DATA ================= */
const UNITS = {
  azure:  {key:'azure',  name:'Azure',  role:'Type-00 · Rapid rifle', c1:0x2f62d8, c2:0xeeeef4, c3:0x1d2233, eye:0x6ad8ff, shot:0x7fe0ff, hp:100, speed:8.6, price:0},
  crimson:{key:'crimson',name:'Crimson',role:'Type-02 · Scatter cannon', c1:0xd5352a, c2:0xf2a51e, c3:0x2a1b20, eye:0x9effa0, shot:0xffa060, hp:100, speed:10.4, price:500},
  verdant:{key:'verdant',name:'Verdant',role:'Type-01 · Pierce lance', c1:0x6b3fb8, c2:0x5fd04a, c3:0x1d1a26, eye:0xfff070, shot:0xb8ff5a, hp:140, speed:7.6, price:500},
};
// specials recharge on a fixed cooldown (cd, seconds, counted from the moment the special ends), not from damage dealt
// the story (Autocrat): an intro shown once on the first boot (System > Replay story), and the pilot's inner voice on each arena's
// title card the first time you enter it. A bullied nobody fights for his kind; the stronger he gets, the more he wants the throne.
const STORY={intro:[
  'The far future. Robot-humans, humans, and minds that think beyond both share one world.',
  'Among my own kind I am the one who fails at everything. They say it to my face. They say it behind my back.',
  'Alone, I sometimes think: if I were perfect, if I were strong, I would rule them all better than anyone ever has.',
  'Then the sky opened. Machines. Angels. Things that are not us. And still nobody believes in me.',
  'Fine. At least I will be useful. For my kind.'],
  voice:['Nobody expects anything from me. Good. Then nobody sees me fail.','They are cheering. For me. I could get used to this.',
    'Angels kneel when they break. I like the sound of it.','Who am I fighting for again? It does not matter. I am winning.','They chant his name. Not mine. Not yet.']};
const SPECIALS = {
  azure:{name:'Overdrive',cd:25,d:'5 s of 2.5× fire rate, +30% damage and +20% speed.'},
  crimson:{name:'Crimson Nova',cd:10,d:'Leap to the target and detonate on landing. Invulnerable in the air.'},
  verdant:{name:'Judgement Lance',cd:28,d:'Channel a huge beam for 2.4 s. It burns through enemies and erases shots.'},
};
const PAINT1=[0x2f62d8,0xd5352a,0x6b3fb8,0x3aa048,0xe8e8ee,0x3a3d48,0xd9a520,0xf07a1a,0x1e1c24,0xe0508a];
const PAINT2=[0xeeeef4,0xf2a51e,0x5fd04a,0x3ad0ff,0xd5352a,0xff7ad0,0x24202c,0xffd36a];
// repaint: a color outside the frame's own two costs gold once (gold is the cosmetics currency) and then works in both slots
const PAINT_PRICE=400;
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
  side:'M12 4v16M4 12h4M16 12h4M6 9l-3 3 3 3M18 9l3 3-3 3', wall:'M20 3v18M3 18l9-12 8 6', poison:'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11zM10 13h.01M14 16h.01',
  freeze:'M12 2v20M3 7l18 10M21 7L3 17M9 4l3 2 3-2M9 20l3-2 3 2', headshot:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 1v5M12 18v5M1 12h5M18 12h5',
  nova:'M12 2l2 6 6-2-4 5 5 4-6 1 1 6-4-4-4 4 1-6-6-1 5-4-4-5 6 2z', shardb:'M12 12L5 5M12 12l7-7M12 12l-7 7M12 12l7 7M12 12V2M12 12v10M2 12h10M12 12h10',
  goldrush:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 6v12M15 9c0-1.4-1.3-2-3-2s-3 .8-3 2 1.3 1.8 3 2.2 3 .8 3 2.3-1.3 2-3 2-3-.6-3-2',
  forb:'M12 2a10 10 0 0 1 10 10M2 12A10 10 0 0 1 12 2M12 8c1.5 2 3 3 3 5a3 3 0 0 1-6 0c0-1.3.8-2 1.4-2.6.4.8.8 1 1.3 1 0-1.2-.4-2.2.3-3.4z',
  iorb:'M12 2a10 10 0 0 1 10 10M2 12A10 10 0 0 1 12 2M12 8v8M8.5 10l7 4M15.5 10l-7 4', borb:'M12 2a10 10 0 0 1 10 10M2 12A10 10 0 0 1 12 2M13 7l-3 5h4l-3 5',
  sorb:'M12 2a10 10 0 0 1 10 10M2 12A10 10 0 0 1 12 2M12 8l4 1.5v3c0 2.5-2 4-4 4.5-2-.5-4-2-4-4.5v-3z', wing:'M4 10h16M7 10v3h10v-3M12 13v3M5 6l3 4M19 6l-3 4M9 20h6',
  meteor:'M20 4L11 13M17 4l-8 8M20 7l-8 8M8 12a4 4 0 1 0 4 4', maxarmor:'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM12 8v8M8 12h8',
  rage:'M4 20l4-8 3 4 3-9 3 6 3-3', dodge:'M6 20V10a6 6 0 0 1 12 0v10l-3-2-3 2-3-2zM10 10h.01M14 10h.01', life:'M12 21s-8-5-8-11a5 5 0 0 1 8-3 5 5 0 0 1 8 3c0 6-8 11-8 11zM12 9v6M9 12h6',
  grace:'M8 4a4 1.4 0 1 0 8 0a4 1.4 0 1 0-8 0M12 8v9M6 11l6 2 6-2M9 21l3-4 3 4', trail:'M2 16h6M2 12h4M2 8h6M14 4c2 4 6 6 6 10a5 5 0 0 1-10 0c0-2 1-4 2-5 1 2 2 2 2 2 0-3-1-5 0-7z',
  dreset:'M3 12h8M3 7h5M3 17h5M20 12a6 6 0 1 1-2-4.5M20 4v4h-4', reflect:'M12 3l8 4v5c0 4-3 7-8 9-5-2-8-5-8-9V7zM7 14l5-5 5 5',
  hexnova:'M12 2l8.66 5v10L12 22l-8.66-5V7zM12 7v3M12 14v3M7 12h3M14 12h3', sync:'M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1zM2 2l4 4',
  overload:'M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1zM12 8v4M12 15h.01', echo:'M8 6a6 6 0 1 0 0 12M14 6a6 6 0 1 1 0 12M11 9l3 3-3 3',
  storm:'M4 4v16M10 4v16M16 4v16M2 8l2-4 2 4M8 8l2-4 2 4M14 8l2-4 2 4M20 6l2 2-2 2', inferno:'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M12 6c2 3 4 4 4 7a4 4 0 0 1-8 0c0-2 1-3 2-4 .5 1 1 1.5 2 1.5 0-2-1-3 0-4.5z',
  halo:'M4 8a8 3 0 1 0 16 0a8 3 0 1 0-16 0M13 12l-3 5h4l-3 5', blood:'M12 21s-8-5-8-11a5 5 0 0 1 8-3 5 5 0 0 1 8 3c0 6-8 11-8 11zM8 11h2l1-3 2 6 1-3h2',
  glass:'M8 3h8l-1 8a3 3 0 0 1-6 0zM12 14v6M8 21h8M10 6l3 3', berserk:'M6 4l6 8 6-8M12 12v8M8 20h8M4 10l3 1M20 10l-3 1',
  greed:'M9 4h6l-2 3h-2zM6 14a6 6 0 0 0 12 0c0-3-3-7-6-7s-6 4-6 7zM12 10v7', brittle:'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM12 3l-2 6 4 3-2 5',
  i_core:'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 8l4 2.2v4.6L12 17l-4-2.2v-4.6z', i_boot:'M7 3h5v9l7 3v5H5V3zM5 16h14', i_cap:'M6 7h11v10H6zM17 10h2v4h-2M11 9l-2 3h3l-2 3',
  i_thorn:'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM2 9l3 1M22 9l-3 1M12 1v2M4 19l2-2M20 19l-2-2', i_halo:'M4 8a8 3 0 1 0 16 0a8 3 0 1 0-16 0M12 13l-2 8h4z',
  i_chip:'M7 7h10v10H7zM10 10h4v4h-4M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4', i_coin:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7l1.5 3 3.5.5-2.5 2.5.6 3.5-3.1-1.6-3.1 1.6.6-3.5L7 10.5l3.5-.5z',
  i_coil:'M4 12c0-3 2-5 4-5s4 2 4 5-2 5-4 5-4-2-4-5zM12 12c0-3 2-5 4-5s4 2 4 5-2 5-4 5', i_reactor:'M12 2v4M12 18v4M5 5l3 3M16 16l3 3M2 12h4M18 12h4M5 19l3-3M16 8l3-3M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  i_scope:'M12 2v6M12 16v6M2 12h6M16 12h6M5 12a7 7 0 1 0 14 0a7 7 0 1 0-14 0', i_aegis:'M12 2l9 4-2 11-7 5-7-5-2-11zM12 7v10M7 10h10', i_cool:'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11zM9 14h6M12 11v6',
};
const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${IC[k]}"/></svg>`;
// armory prices are diamonds
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
// run skills that do nothing with a weapon are not offered with it (measured: x1.00 DPS). sig = the frame's own gun, listed by frame.
// Torch hits are damage over time, which never crit or proc; Rail, Singularity, Blade and Arc fire no projectiles.
const WEAPON_DEAD={sig:{verdant:['ricochet','pierce']},
  torch:['sig','crit','twin','diag','side','rear','pierce','ricochet','wall','poison','arc','meteor','freeze','headshot','storm'],
  blade:['diag','side','rear','pierce','ricochet','wall'], rail:['twin','diag','side','rear','pierce','ricochet','wall'],
  arc:['diag','side','rear','pierce','ricochet','wall'], swarm:['diag','side','rear','pierce','ricochet','wall'], grav:['twin','diag','side','rear','pierce','ricochet','wall']};
// cosmetics shop (gold, looks only, never power): only these coming-soon teasers for now
const COSMETICS_SOON=[{n:'Frame paint',t:'Character',ic:'armor'},{n:'Shot colors',t:'Character',ic:'twin'},{n:'Special effects',t:'Character',ic:'storm'},{n:'Arena themes',t:'Arena',ic:'i_halo'}];
// skill tree ranks cost diamonds (the Core and cosmetics take gold); the whole tree is ~520, sized so it fills late in a ~2.5 h campaign
const TREE=[
  {branch:'Offense',c:'#ff6a1a',nodes:[
    {id:'dmg',name:'Overclocked rounds',max:3,cost:[6,9,15],d:'+10% damage per rank'},
    {id:'rate',name:'Faster cycling',max:2,cost:[9,15],d:'+8% fire rate per rank'},
    {id:'crit',name:'Weak-point optics',max:3,cost:[9,15,24],d:'+7% chance to deal double damage'},
    {id:'sp',name:'Sync amplifier',max:2,cost:[12,24],d:'Special recharges 25% faster per rank'},
    {id:'exec',name:'Executioner',max:1,cost:[45],d:'+30% damage to bosses'}]},
  {branch:'Defense',c:'#5fe0ff',nodes:[
    {id:'hp',name:'Reinforced plating',max:3,cost:[6,9,15],d:'+15 max armor per rank'},
    {id:'repair',name:'Field repair',max:2,cost:[9,15],d:'+40% healing from pickups and angels'},
    {id:'hex',name:'Hex efficiency',max:2,cost:[9,18],d:'-20% barrier power drain'},
    {id:'plate',name:'Ablative core',max:2,cost:[15,27],d:'-8% damage taken per rank'},
    {id:'second',name:'Second wind',max:1,cost:[54],d:'Once per level, survive a fatal hit with 30% armor'}]},
  {branch:'Mobility',c:'#7dff9a',nodes:[
    {id:'spd',name:'Servo tuning',max:2,cost:[6,12],d:'+6% move speed per rank'},
    {id:'regen',name:'Cell recharge',max:3,cost:[6,12,21],d:'+15% power regeneration'},
    {id:'dashcd',name:'Thruster vents',max:2,cost:[9,18],d:'-15% dash cooldown'},
    {id:'magnet',name:'Salvage magnet',max:2,cost:[9,15],d:'+60% pickup reach, +10% gold'},
    {id:'gadget',name:'Quick deploy',max:2,cost:[18,33],d:'-12% gadget cooldowns'}]},
];
/* core stats: the gold sink next to the diamond-priced skill tree (patch.md 39). Every level multiplies (k per level, compounding), so each
   tier of 4 levels is the same step of power in Arena 2 and in Arena 8. The tier gate: you can raise each stat to CURVE.tier levels per arena
   opened (coreCap); levels a save already has above it wait until the next arena opens. Cost ×1.107 per level: one tier costs ×1.5 the last.
   CORE_MAX: a sanity cap for the save, ten arenas' worth. */
const CORE={
  armor:{name:'Armor',d:'+9% max armor per level, compounding',icon:'armor',k:1.09},
  dmg:{name:'Damage',d:'+9% damage per level, compounding',icon:'atk',k:1.09},
  regen:{name:'Power regen',d:'+3% power regeneration per level, compounding',icon:'regen',k:1.03},
};
const CORE_MAX=40, coreCost=lv=>Math.round(100*Math.pow(1.107,lv)/5)*5, coreCap=(prof=P)=>CURVE.tier*Math.max(1,prof.arenas|0);
/* run skills: picked on level-up (skill roulette), from angels and devils. They last for the whole arena run.
   rarity: common (pure stats) · rare (projectile modifiers, on-kill triggers) · epic (orbits, mechanic-specific) · legendary (evolutions).
   bonus:{stat:value} is added per rank to that stat's bucket (see BAL and balance.js): bonuses add inside a bucket, buckets multiply.
   Bucket stats: dmg, rate (fire rate), hp (% max armor), hpFlat, regen, spd, crit, dodge, gold, sp (special recharge speed), spPow, taken (+% damage taken), magnet, gcd (gadget cooldown), en (power).
   apply(p,rank) is only for side effects (orbits, lives). proj / orb = extra projectiles / orbiting hitters per rank (hard capped).
   req(rs) gates a skill (evolutions need both parents maxed). Most combat effects read player.rs[id]
   directly (bullets.js, enemies.js, player.js), so a new skill is: an entry here, an IC icon, and a few lines where it acts. */
const RARITY={common:{w:60,c:'#d6cfdc',n:'Common'},rare:{w:28,c:'#3ad0ff',n:'Rare'},epic:{w:10,c:'#b070ff',n:'Epic'},legendary:{w:2,c:'#ffc83a',n:'Legendary'}};
const RSK={
  // common: pure stats. Every card stops at rank 3 (patch.md 34): a run spreads over more cards instead of maxing a few early
  atk:{name:'Attack Boost',d:'+20% damage.',rarity:'common',max:3,icon:'atk',bonus:{dmg:.2}},
  sig:{name:'Rapid Cycle',d:'+13% fire rate.',rarity:'common',max:3,icon:'arc',bonus:{rate:.13}},
  armor:{name:'Armor Up',d:'+15% max armor and repair 15%.',rarity:'common',max:3,icon:'armor',bonus:{hp:.15},apply:p=>{ p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.15*p.st.heal); }},
  maxarmor:{name:'Max Armor+',d:'+35 max armor.',rarity:'common',max:3,icon:'maxarmor',bonus:{hpFlat:35}},
  regen:{name:'Hex Regen',d:'+35% power regeneration.',rarity:'common',max:3,icon:'regen',bonus:{regen:.35}},
  dash:{name:'Swift Servos',d:'+8% move speed.',rarity:'common',max:3,icon:'dash',bonus:{spd:.08}},
  crit:{name:'Crit Lens',d:'+8% critical chance.',rarity:'common',max:3,icon:'crit',bonus:{crit:.08}},
  dodge:{name:'Dodge',d:'6% chance to ignore a hit.',rarity:'common',max:3,icon:'dodge',bonus:{dodge:.06}},
  goldrush:{name:'Gold Rush',d:'+25% gold.',rarity:'common',max:3,icon:'goldrush',bonus:{gold:.25}},
  sync:{name:'Sync Surge',d:'Special recharges 20% faster.',rarity:'common',max:3,icon:'sync',bonus:{sp:.2}},
  // rare: projectile modifiers and on-kill triggers
  twin:{name:'Twin Shot',d:'+1 parallel projectile. Each shot deals 75% (60% at rank 2).',rarity:'rare',max:2,icon:'twin',proj:1},
  diag:{name:'Diagonal Fire',d:'+2 projectiles at 40°.',rarity:'rare',max:1,icon:'diag',proj:2},
  side:{name:'Side Fire',d:'+1 projectile to each side.',rarity:'rare',max:1,icon:'side',proj:2},
  rear:{name:'Rear Guard',d:'+1 projectile behind you.',rarity:'rare',max:1,icon:'rear',proj:1},
  pierce:{name:'Piercing Rounds',d:'Projectiles pass through enemies.',rarity:'rare',max:1,icon:'pierce'},
  ricochet:{name:'Ricochet',d:'Projectiles bounce to a nearby enemy (-25% damage per bounce).',rarity:'rare',max:3,icon:'ricochet'},
  wall:{name:'Wall Bounce',d:'Projectiles bounce off walls and blocks once per rank.',rarity:'rare',max:2,icon:'wall'},
  torch:{name:'Burn Rounds',d:'Hits set enemies on fire for 2.5 s.',rarity:'rare',max:1,icon:'torch'},
  cryo:{name:'Cryo Rounds',d:'Hits slow enemies by 45%.',rarity:'rare',max:1,icon:'cryo'},
  poison:{name:'Poison',d:'Hits stack poison that ticks for 3 s.',rarity:'rare',max:3,icon:'poison'},
  arc:{name:'Chain Spark',d:'Hits can arc to a second enemy.',rarity:'rare',max:3,icon:'arc'},
  vamp:{name:'Vampiric Core',d:'Repair 2% armor per kill.',rarity:'rare',max:3,icon:'vamp'},
  nova:{name:'Death Nova',d:'Enemies explode when they die: 25% of their max armor around them (40% at rank 2).',rarity:'rare',max:2,icon:'nova'},
  shard:{name:'Shard Burst',d:'Dead enemies spray shards: 12% of their max armor each (18% at rank 2).',rarity:'rare',max:2,icon:'shardb'},
  rage:{name:'Rage',d:'Up to +25% damage per rank as your armor drops.',rarity:'rare',max:2,icon:'rage'},
  trail:{name:'Dash Trail',d:'Dashing leaves a trail of fire.',rarity:'rare',max:2,icon:'trail'},
  dreset:{name:'Dash Reset',d:'Kills can reset your dash (phone: refill a charge).',rarity:'rare',max:2,icon:'dreset'},
  overload:{name:'Overload Special',d:'Your special hits 30% harder and lasts longer.',rarity:'rare',max:2,icon:'overload',bonus:{spPow:.3}},
  grace:{name:"Angel's Grace",d:'Angels fully repair you and offer one more skill.',rarity:'rare',max:1,icon:'grace'},
  // epic: elemental orbits and mechanic-specific
  orbit:{name:'Orbit Blades',d:'Two blades circle you and cut enemies.',rarity:'epic',max:3,icon:'orbit',orb:2,apply:()=>buildOrbit()},
  forb:{name:'Fire Orbit',d:'A fire orb circles you and burns what it touches.',rarity:'epic',max:2,icon:'forb',orb:1,apply:()=>buildOrbit()},
  iorb:{name:'Ice Orbit',d:'An ice orb circles you and chills what it touches.',rarity:'epic',max:2,icon:'iorb',orb:1,apply:()=>buildOrbit()},
  borb:{name:'Bolt Orbit',d:'A bolt orb circles you and zaps nearby enemies.',rarity:'epic',max:2,icon:'borb',orb:1,apply:()=>buildOrbit()},
  sorb:{name:'Shield Orbit',d:'Two plates circle you and block enemy shots.',rarity:'epic',max:2,icon:'sorb',apply:()=>buildOrbit()},
  wing:{name:'Wingman Drone',d:'A drone flies with you for the whole run.',rarity:'epic',max:2,icon:'wing',apply:()=>buildWingman()},
  meteor:{name:'Meteor',d:'Hits can call down a meteor strike.',rarity:'epic',max:2,icon:'meteor'},
  freeze:{name:'Freeze',d:'Cryo hits can freeze enemies solid for a moment.',rarity:'epic',max:2,icon:'freeze',req:rs=>rs.cryo>0},
  headshot:{name:'Headshot',d:'Small chance to instantly destroy a normal enemy.',rarity:'epic',max:2,icon:'headshot'},
  life:{name:'Extra Life',d:'Come back once with half your armor.',rarity:'epic',max:1,icon:'life',apply:p=>{p.lives++;}},
  reflect:{name:'Reflect Hex',d:'Shots your hex shield or barrier blocks fly back. Beams cannot be reflected.',rarity:'epic',max:1,icon:'reflect'},
  hexnova:{name:'Hex Nova',d:'Overheating the hex shield or breaking the barrier blasts everything near you.',rarity:'epic',max:2,icon:'hexnova'},
  echo:{name:'Gadget Echo',d:'Gadgets trigger twice.',rarity:'epic',max:1,icon:'echo'},
  // legendary: evolutions, offered only when both parents are maxed
  storm:{name:'Bullet Storm',d:'Evolution of Twin Shot + Rapid Cycle: +25% fire rate and every shot fans out.',rarity:'legendary',max:1,icon:'storm',evo:['twin','sig'],proj:2,bonus:{rate:.25}},
  inferno:{name:'Inferno Ring',d:'Evolution of Burn Rounds + Orbit Blades: blades become a wide ring of fire.',rarity:'legendary',max:1,icon:'inferno',evo:['torch','orbit'],orb:2,apply:()=>buildOrbit()},
  halo:{name:'Storm Halo',d:'Evolution of Chain Spark + Bolt Orbit: lightning strikes 2 enemies every 1.25 seconds.',rarity:'legendary',max:1,icon:'halo',evo:['arc','borb']},
  blood:{name:'Blood Engine',d:'Evolution of Vampiric Core + Rage: kills repair 6% and Rage counts 2.5 times.',rarity:'legendary',max:1,icon:'blood',evo:['vamp','rage']},
};
// the angel's second card comes from these (patch.md 34): damage, fire rate and kill cards, never armor or utility
const RSK_AGGRO=['atk','sig','crit','twin','diag','side','rear','pierce','ricochet','torch','poison','arc','nova','shard','rage','overload','orbit','forb','borb','meteor','headshot','storm','inferno','halo'];
for(const id in RSK){ const s=RSK[id]; if(s.evo&&!s.req) s.req=rs=>s.evo.every(k=>(rs[k]||0)>=RSK[k].max); }
/* on-kill procs: damage is a share of the dying enemy's max armor (by rank), capped at cap × the room's enemy armor scale.
   It ignores your damage multipliers, and kills made by any proc never trigger on-kill procs again (proc depth 1). */
const PROC_KILL={nova:{pct:[.25,.4],rad:[3.4,4],cap:8},shard:{pct:[.12,.18],n:[6,8],cap:4}};
// Shardling splits and boss summons are worth this share of a normal kill (gold, xp, drop chances)
const SPLIT_REWARD=.3;
/* balance (applied in balance.js). In-run power has a ceiling; long-term growth comes from Core and the skill tree.
   soft: bucket bonus above +100% only counts softRate (50%). cap: hard caps (crit/dodge are totals, rate/spd are bucket bonuses,
   proj = extra projectiles, orbit = orbiting hitters, headshot = chance). proc: rate = procs per second (token bucket, burst = how many can fire at once). */
const BAL={
  soft:1, softRate:.5,
  cap:{crit:.5,dodge:.3,rate:1,spd:.4,proj:6,orbit:6,headshot:.03},
  // desktop: moving while the trigger is held costs this share of move speed (patch.md 34: holding fire and walking was free).
  // The phone already stops firing while you move.
  fireSlow:.35,
  thornCap:.3,
  // Twin Shot: damage of each parallel shot by rank (1 / 1.5 / 1.8 total), so multishot does not multiply everything else
  twin:[1,.75,.6],
  proc:{arc:{rate:6,burst:3},meteor:{rate:.8,burst:1},nova:{rate:4,burst:4},shard:{rate:3,burst:3},poison:{stacks:[5,7,9]},ricochet:{falloff:.75}},
};
/* enemy scaling inside an arena: armor and damage grow exponentially with the room index (on top of the arena's hpMul / dmgMul),
   the room budget (how many enemies) grows slowly. Bosses use the same curve, normalized so the room 10 boss keeps its listed armor and damage;
   the arena's final boss gets finalHp / finalDmg on top. mob: extra armor for every room mob (not bosses), so enemies live long enough to attack.
   bossDmgK: every boss hits harder by this much. A tougher start and a gentler climb (mob 2.2, hp .058, dmg .04) keep the late rooms from
   running away, and a full campaign (all arenas + Main Stage) takes a strong pilot about 2.5 h (measured with the autopilot campaign). */
const SCALE={mob:2.2,hp:.058,dmg:.04,bossDmgK:1.4,bossRef:9,finalHp:1.5,finalDmg:1.25,budget:{base:4.6,arena:1.1,room:.07,elite:.55,cap:12}};
/* patch notes: shown once on the first boot after a big update (ui-hangar.js newsBoot), newest first; System > Patch notes shows them again.
   Plain player words: what got weaker (nerf), stronger (buff), what is new, what changed and what was fixed. A new pilot skips them. */
const NEWS=[
  {id:'balance-1',title:'The Balance Update',items:[
    {k:'nerf',t:'Run cards stop at rank 3, and cards you already own show up less often.'},
    {k:'change',t:'Angels offer two choices: one repair and one attack card.'},
    {k:'nerf',t:'Desktop: holding fire while moving slows you by 35%. You can no longer shoot non-stop at full speed for free.'},
    {k:'new',t:'Angel bosses have two new attacks that break cover: golden judgment circles and a shockwave you must dash through. Hiding behind a box is no longer safe.'},
    {k:'nerf',t:"Thorns deal at most 30% of an enemy's armor per hit."},
    {k:'change',t:'Some enemies hit harder (Hopper, Dominion, Spark, Sentry, Ram and others); Heavy, Howitzer and Bulwark hit softer.'},
    {k:'nerf',t:'Storm Halo: lightning strikes 2 enemies every 1.25 s (was 3 every second).'},
    {k:'buff',t:'Inferno Ring: hotter, wider blades and a longer burn.'},
    {k:'buff',t:'Blood Engine: kills repair 6% (was 4%) and Rage counts 2.5 times (was 2).'},
    {k:'fix',t:'The same boss never comes twice in one arena.'},
    {k:'fix',t:'Crystal shards no longer spawn inside blocks.'},
    {k:'fix',t:"Phone: auto-aim no longer fires into corners, and Crimson's Nova lands on the crowd, not at the boss's feet."}]},
];
/* arena curve (patch.md 39, balance.js arenaCurve): every number an arena needs comes from its index a, so a new arena needs no table row.
   The reference pilot of arena a has the tree ranks open at tier a+1 and Core level tier*a + tier/2 (the last tier full, the new one half
   bought). His dps and ehp set the enemy armor and damage; press keeps each arena a little harder than the last at that power
   (difficulty ratio 1 + press × ln(1+a): skill grows fast first, then slower). bossT: the boss fight gets this much longer per arena.
   tempo: enemy shot speed per arena, capped for readability. treeFull: the tier where today's tree is complete; a tree node's rank k
   opens at tier ceil(k × treeFull / max), the same gate as the Core (a save's ranks above it wait).
   An ARENAS row or ECON table that lists its own value keeps it. */
const CURVE={tier:4,treeFull:3,press:.25,bossT:1.06,tempo:.04,tempoMax:1.25,runs:1.5};
// pilot xp per level: base + per × level (about one level every 1-2 rooms)
const XP_NEED={base:6,per:.35}, XP_BOSS=10;
/* economy: target earnings for one full run of each arena without gold bonuses (first-clear diamonds come on top, once).
   The per-kill, boss and clear numbers below are tuned so a full run lands near the targets (check with DBG.sim()). */
const ECON={
  // Main Stage: Arena 4's gold and diamonds per minute (≈125 gold, ≈2.4 diamonds) over its ≈29 min run (15 rooms × par 95 s + High-Co)
  target:{gold:[1200,2000,3000,4000,3600],gems:[30,45,60,80,70]},
  killGold:[.81,.72,.72,.9,.96],      // × ENEMY gold per arena (Main Stage: fewer, tougher kills in long wave rooms); ×0.9 in the gold/diamond split
  bossGold:[.5,.36,.23,.36,.45],      // × BOSSES gold per arena (×0.9 as above)
  bossGems:[.28,.25,.14,.22,.75],     // × BOSSES gems per arena, paid on the kill (the Main Stage has one boss, so he pays the run's share)
  clearGold:[6,9,12,15,35],           // per cleared combat/elite room (Main Stage rooms are long wave sets)
  healChance:[.12,.12,.12,.12,.05],   // a kill drops a repair pickup (+14% armor); Main Stage rooms have 15-30 kills each, so it is rarer there
  gemChance:{small:.008,big:.03,elite:.2},
  firstClear:a=>40+30*a, repeatClear:a=>5+5*a,
  // farm check (tester.js farmMul): gold and diamonds when replaying an arena 0 / 1 / 2+ below your highest unlocked one
  farm:[1,.6,.3],
};
/* run-only items: elites drop one 25% of the time, bosses always. 4 slots. Stat effects are a bonus:{} like run skills (same buckets and caps);
   add/rem only set flags and must be exact inverses so items can be swapped out. shape + color build the small pickup model (items.js).
   Flags such as p.thorn are read where they act. */
const ITEMS={
  plated:{name:'Plated Core',d:'+20% max armor.',rarity:'common',icon:'i_core',shape:'box',color:0x5f7aa8,bonus:{hp:.2}},
  servo:{name:'Servo Boots',d:'+10% move speed.',rarity:'common',icon:'i_boot',shape:'cyl',color:0x3a3d48,bonus:{spd:.1}},
  cap:{name:'Capacitor',d:'+25% power (125 max).',rarity:'common',icon:'i_cap',shape:'cyl',color:0xff6a1a,bonus:{en:25}},
  coil:{name:'Salvage Coil',d:'Double pickup reach, +15% gold.',rarity:'common',icon:'i_coil',shape:'torus',color:0xffc83a,bonus:{magnet:1,gold:.15}},
  coolant:{name:'Coolant Loop',d:'-25% gadget cooldowns.',rarity:'common',icon:'i_cool',shape:'sphere',color:0x5fe0ff,bonus:{gcd:.33}},
  minel:{name:'Mine Layer',d:'Every dash drops a proximity mine.',rarity:'rare',icon:'mines',shape:'cyl',color:0x2a2632,add:p=>{p.mineLayer=(p.mineLayer||0)+1;},rem:p=>{p.mineLayer--;}},
  thorn:{name:'Thorn Plating',d:'Enemies that ram you take 3x the damage back.',rarity:'rare',icon:'i_thorn',shape:'oct',color:0xd5352a,add:p=>{p.thorn=(p.thorn||0)+1;},rem:p=>{p.thorn--;}},
  halof:{name:'Halo Fragment',d:'Repair 5% armor after every cleared room.',rarity:'rare',icon:'i_halo',shape:'torus',color:0xffd36a,add:p=>{p.haloFrag=(p.haloFrag||0)+1;},rem:p=>{p.haloFrag--;}},
  overclock:{name:'Overclock Chip',d:'+15% fire rate, but you take 10% more damage.',rarity:'rare',icon:'i_chip',shape:'box',color:0x7dff9a,bonus:{rate:.15,taken:.1}},
  reactor:{name:'Sync Reactor',d:'Start every room with your special 30% recharged.',rarity:'rare',icon:'i_reactor',shape:'sphere',color:0xffe14a,add:p=>{p.reactor=(p.reactor||0)+1;},rem:p=>{p.reactor--;}},
  scope:{name:'Target Scope',d:'+6% crit chance and crits hit 2.5x.',rarity:'rare',icon:'i_scope',shape:'cone',color:0xe8e8ee,bonus:{crit:.06},add:p=>{p.critMul=2.5;},rem:p=>{p.critMul=2;}},
  lucky:{name:'Lucky Coin',d:'Skill roulette rolls one rarity tier higher more often.',rarity:'epic',icon:'i_coin',shape:'cyl',color:0xffc83a,add:p=>{p.luck++;},rem:p=>{p.luck--;}},
  aegis:{name:'Aegis Shard',d:'The first hit you take in each room is blocked.',rarity:'epic',icon:'i_aegis',shape:'oct',color:0xb070ff,add:p=>{ p.aegisN=(p.aegisN||0)+1; p.aegis=true; },rem:p=>{ p.aegisN--; p.aegis=p.aegisN>0&&p.aegis; }},
};
RARITY.common.drop=55; RARITY.rare.drop=32; RARITY.epic.drop=13;
/* devil curses: power now, a lasting cost for the rest of the run. bonus:{} uses the same buckets as skills (so Glass Cannon obeys the damage
   soft cap), rule:{} merges into the arena rule, cost is the price shown in the build panel. */
const CURSES={
  glass:{name:'Glass Cannon',d:'+40% damage, -25% max armor.',cost:'-25% max armor',icon:'glass',bonus:{dmg:.4,hp:-.25}},
  berserk:{name:'Berserk',d:'+30% fire rate. Your hex shield and barrier are gone.',cost:'No hex shield or barrier',icon:'berserk',bonus:{rate:.3},noHex:true},
  greed:{name:'Greed',d:'+50% gold. Enemies get +15% armor.',cost:'Enemies +15% armor',icon:'greed',bonus:{gold:.5},rule:{hpMul:1.15}},
  brittle:{name:'Brittle',d:'Take +20% damage. Gain a random epic skill.',cost:'+20% damage taken',icon:'brittle',bonus:{taken:.2},apply:(p,silent)=>{ if(!silent){ const o=skillOptions(1,'epic'); if(o[0]) applySkill(o[0]); } }},
};

/* arenas: one run each, a flat sequence of short rooms. hpMul/dmgMul/bossMul multiply the room curve (SCALE below). The room schedule follows PACING
   (see roomSpec in run.js): every 10-room block ends with a boss. mobs unlock in list order as the run goes on (3 at first, one more every 4 rooms,
   soft = rooms the first unlock waits on top; blockTypes = only that many unlocked types are active in each 10-room block, a window that moves on; pin = types always in it once unlocked); bosses are drawn from the pool, never twice in a row, and planned ahead so the rooms before a boss can
   teach it (firstBoss: the first block's boss). The arenas follow the story (patch.md 31): the pilot first fights what is far from his own form
   (angels invade the Low City), and his own kind, the machines, in Fallen Sky (with one corrupted angel boss, x_archon: patch.md 31). phase =
   the story beat shown beside the name. */
const ARENAS=[
  {name:'The Low City', phase:'Siege', rooms:30, hpMul:1, dmgMul:1, bossMul:1, mobs:['shardling','warden','censer','seraph','ophan','herald','cherub','beacon'], soft:1, bosses:['prism','seraph','throne'], firstBoss:'throne', rule:{}, trap:'saw', ruleTxt:'Training ground: no special rule',
   theme:{bg:0x1d1424,hemiS:0xffd6b8,hemiG:0x2a1d3a,ground:0x5a4c64,city:0xffffff,edge:0xff6a1a,rim:0xff7a40,win:0xffc47a,floor:0xa898b0,wall:0x3a3346,block:0x5e5468,water:0xff7a2a},
   colorCss:'#ff6a1a'},
  {name:'Night Harbor', phase:'Undertow', rooms:40, hpMul:1.3, dmgMul:1.15, bossMul:1.25, mobs:['seraph','shardling','warden','drone','ram','lancer','hopper','coil','sentry','bulwark','borer','mender'], bosses:['prism','arachne','hive'], rule:{shotSpd:1.15,hazards:.35}, trap:'spike', ruleTxt:'Enemy shots fly 15% faster',
   theme:{bg:0x0b1726,hemiS:0xb8d4ff,hemiG:0x10203a,ground:0x3e5470,city:0x9ab4e0,edge:0x3ad0ff,rim:0x3a8aff,win:0x9ae4ff,floor:0x86a2c4,wall:0x22344a,block:0x2f5f9a,water:0x1a74e0},
   colorCss:'#3ad0ff'},
  {name:"Heaven's Gate", phase:'Ascent', rooms:50, hpMul:1.6, dmgMul:1.3, bossMul:1.5, mobs:['seraph','cherub','warden','beacon','aureole','censer','dominion','emissary','ophan','cantor','herald'], bosses:['seraph','throne','archon'], rule:{elitePairs:true,hazards:.4}, trap:'pillar', ruleTxt:'Elites come in pairs',
   theme:{bg:0x2b1a26,hemiS:0xfff0d0,hemiG:0x3a2638,ground:0x7a6670,city:0xe2c8d8,edge:0xffd36a,rim:0xffb060,win:0xfff0b0,floor:0xd8c6cc,wall:0x8a7480,block:0xf0e8f2,water:0xffd36a},
   colorCss:'#ffd36a'},
  {name:'Fallen Sky', phase:'Hubris', rooms:50, hpMul:1.9, dmgMul:1.45, bossMul:1.8, mixed:true, mobs:['drone','lancer','warden','spark','ram','censer','crawler','hopper','heavy','coil','cherub','sentry','howitzer','borer','bulwark','mender'], blockTypes:10, pin:['warden','censer','cherub'], bosses:['colossus','hive','arachne','x_archon'], rule:{hazards:.45,corruptElites:true}, trap:'mix', ruleTxt:'Both factions, corrupted elites, 2 random modifiers',
   theme:{bg:0x170e22,hemiS:0xe0c8ff,hemiG:0x22123a,ground:0x4a3a64,city:0xb8a0e0,edge:0xb070ff,rim:0xff4ad0,win:0xd8a0ff,floor:0x9a8ab8,wall:0x2e2244,block:0x5a3a8a,water:0xb070ff},
   colorCss:'#b070ff'},
  /* Main Stage (High-Co's festival): unlocked by Arena 4's first clear, one notch above it. 15 wave rooms (STAGE) and High-Co after room 15
     (rooms counts the boss room, like the other arenas). roomK: the enemy curve runs roomK rooms per room (and per wave inside it, see
     enemyScale), so the 15 long rooms climb like Arena 4's 50 short ones; that curve is now only High-Co's. mobCurve: the wave mobs' own armor and
     damage curve, [start, growth per room up to knee, growth after] (balance.js kneeCurve): the knee is where the pilot hits the level cap, so the
     mobs stop outgrowing him there. Tuned with the autopilot (DBG.stageCheck): an average pilot loses 15-25% armor per room early,
     30-45% late. par: seconds per room for the run score's speed bonus. */
  {name:'Main Stage', phase:'Encore', rooms:16, roomsTxt:'15 ROOMS + BOSS', hpMul:2.2, dmgMul:1.6, bossMul:1.7, roomK:3.3, mobCurve:{hp:[4,1.12,1.04],dmg:[3.4,1.075,1.07],knee:11}, par:95, stage:true, mobs:['roadie','bass','spot','mosher','dancer','pyro','shredder','diver','drummer'], bosses:['highco'], rule:{beatSync:true}, trap:'spike', ruleTxt:'Beat sync: attacks lock to the music, a dash on the beat dodges twice as wide',
   theme:{bg:0x120a1c,hemiS:0xf0d0e4,hemiG:0x1c1028,ground:0x2a2032,city:0x5a3e68,edge:0xff3aa8,rim:0xffb84a,win:0xffb84a,floor:0x4a4054,wall:0x1e1826,block:0x1e1826,water:0xff3aa8},
   colorCss:'#ff3aa8'},
];
/* Arena 4 rolls two of these per run */
const MODS={
  swift:{name:'Swift shots',d:'Enemy shots +15% speed.',rule:{shotSpd:1.15}},
  frenzy:{name:'Frenzy',d:'Enemies move 20% faster.',rule:{moveSpd:1.2}},
  volatile:{name:'Volatile',d:'Enemies burst into slow shots when they die.',rule:{volatile:true}},
  armored:{name:'Armored',d:'Enemies +20% armor, +25% gold.',rule:{hpMul:1.2,goldMul:1.25}},
  unstable:{name:'Unstable ground',d:'Floor hazards in every room.',rule:{hazards:1}},
  twin:{name:'Twin elites',d:'Elites come in pairs.',rule:{elitePairs:true}},
};
/* mobs: stats and model. cost = room budget, xp = pilot xp, gold/score per kill. elite:false keeps a mob out of elite rolls. mass: inertia (see MOVE).
   role (enemy-ai.js): kiter (holds band [near,far] with line of sight) · sniper (long lanes) · tank (pushes in to hold, slams or fans) ·
   charger (predicts you and locks a telegraphed charge) · flanker (commits to an orbit, goes for your side and back, hides between bursts) ·
   artillery (lobbed shots, punishes standing still) · denial (area fire) · support (stays behind the others) · rusher (Spark: fuse when close).
   tag: 'move' = forces you to move (chargers, artillery, area denial, slams), 'focus' = demands attention (sniper, support). See COMPS.
   dmgK: damage multiplier for everything the mob does (shots, blasts queued by its AI, touches), set from the standing-bot measure. */
const ENEMY={
  drone:{name:'Drone',mass:.9,role:'kiter',band:[6,10.5],hp:5,r:1.15,speed:3.4,sc:.8,cost:1,xp:1,gold:6,score:100,dmgK:1.3,build:()=>buildDrone(),elite:false},
  seraph:{name:'Seraph',tag:'move',mass:.7,role:'charger',band:[5,8],hp:7,r:1.45,speed:5,sc:1,fly:true,angel:true,cost:1.3,xp:1.3,gold:8,score:150,build:()=>buildSeraph(1)},
  mini:{name:'Mini seraph',mass:.5,role:'charger',band:[4.5,7],hp:4,r:1.05,speed:6,sc:.7,fly:true,angel:true,cost:.8,xp:0,gold:3,score:60,build:()=>buildSeraph(.7),elite:false,ai:'seraph'},
  heavy:{name:'Heavy',tag:'move',mass:2.6,role:'tank',hold:4.2,slam:4.6,hp:20,r:1.7,speed:2.4,sc:1.25,cost:2.6,xp:3,gold:16,score:300,dmgK:0.85,build:()=>buildHeavy()},
  warden:{name:'Warden',tag:'move',mass:1.4,role:'denial',band:[8,12],hp:11,r:1.45,speed:3,sc:1,fly:true,angel:true,cost:1.9,xp:2,gold:12,score:250,build:()=>buildWarden()},
  // arena mobs (models from docs/bestiary.html, behavior in enemy-ai.js)
  spark:{name:'Spark',tag:'move',mass:.45,role:'rusher',fuse:.55,hp:3,r:.9,speed:7.5,sc:1,cost:.7,xp:.6,gold:4,score:80,dmgK:1.5,build:()=>buildSpark(),elite:false,init:e=>{ e.model.core.material=e.model.core.material.clone(); e.st='roll'; }},
  crawler:{name:'Crawler',tag:'move',mass:.55,role:'flanker',band:[5.5,8],hp:9,r:1.3,speed:5.5,sc:1,cost:1.4,xp:1.4,gold:9,score:160,dmgK:1.3,build:()=>buildCrawler(1),init:e=>{ e.cd=rand(1.5,2.5); }},
  howitzer:{name:'Howitzer',tag:'move',mass:3,role:'artillery',hp:12,r:1.4,speed:0,sc:1,cost:2.2,xp:2.2,gold:13,score:260,dmgK:0.85,build:()=>buildHowitzer(),init:e=>{ e.cd=rand(1.4,2.4); }},
  lancer:{name:'Lancer',tag:'focus',mass:1.1,role:'sniper',band:[11,17],hp:9,r:1.15,speed:3.2,sc:1.05,cost:2,xp:2,gold:12,score:240,build:()=>buildLancer(),init:e=>{ e.model.laser.material=e.model.laser.material.clone(); e.st='move'; e.stT=rand(1.2,2.2); }},
  bulwark:{name:'Bulwark',mass:2.8,role:'tank',hold:3.4,hp:24,r:1.6,speed:1.8,sc:1.15,cost:2.4,xp:2.6,gold:15,score:280,dmgK:0.85,build:()=>buildBulwark(),init:e=>{ e.cd=rand(2,3); }},
  // machine charger, denial and support (patch.md 25, docs/mob-designs.html): Ram rams a locked lane and stuns itself on walls, Coil drops
  // live ground fields that die with it, Mender ties a repair beam to the most hurt ally (repairs, -40% damage taken)
  ram:{name:'Ram',tag:'move',mass:2.4,role:'charger',band:[7,11],hp:14,r:1.5,speed:3,sc:1.2,cost:2.2,xp:2.2,gold:13,score:260,dmgK:1.3,build:()=>buildRam(),init:e=>{ e.st='walk'; e.cd=rand(1.2,2); }},
  coil:{name:'Coil',tag:'move',mass:1.2,role:'denial',band:[8,12],hp:9,r:1.2,speed:3,sc:.95,cost:1.9,xp:1.9,gold:12,score:250,dmgK:1.3,build:()=>buildCoil(),init:e=>{ e.cd=rand(1.5,2.5); }},
  mender:{name:'Mender',tag:'focus',mass:.5,role:'support',hp:7,r:1,speed:4.4,sc:.85,fly:true,cost:1.5,xp:1.5,gold:10,score:220,build:()=>buildMender(),elite:false,init:e=>{ e.st='rest'; e.stT=rand(1,2); }},
  // angel sniper, flanker and tank (patch.md 25, docs/mob-designs.html): Beacon's arrow passes through blocks (move, do not hide), Herald circles
  // to your side and dives, Dominion's three turning plates stop plain shots and drop for 1 s after its Judgement ring
  beacon:{name:'Beacon',tag:'focus',mass:.8,role:'sniper',band:[11,16],hp:8,r:1.1,speed:2.6,sc:1,fly:true,angel:true,cost:2,xp:2,gold:12,score:240,build:()=>buildBeacon(),init:e=>{ e.cd=rand(1.5,2.5); }},
  herald:{name:'Herald',tag:'move',mass:.45,role:'flanker',band:[6,9],hp:5,r:1,speed:6.5,sc:.8,fly:true,angel:true,cost:1,xp:1,gold:6,score:120,build:()=>buildHerald(),init:e=>{ e.cd=rand(1.5,2.5); e.st='orbit'; e.orb=Math.random()<.5?-1:1; }},
  dominion:{name:'Dominion',tag:'move',mass:2.8,role:'tank',hold:4,slam:4.4,hp:22,r:1.7,speed:2,sc:1.3,angel:true,cost:2.6,xp:2.8,gold:16,score:300,dmgK:1.4,build:()=>buildDominion(),init:e=>{ e.cd=rand(2,3); e.downT=0; }},
  // Archero roles (patch.md 25, docs/mob-designs.html): Sentry fires fixed + / x salvos down drawn lines, Borer moves under the floor (no hits) and
  // surfaces on a red ring to lob three shells, Hopper hops at random and shocks where it lands, Emissary blinks onto a gold ring and lunges,
  // Aureole throws a chakram that hangs and comes back, Cantor chants two Mini seraphs in (4 at most) and runs from you
  sentry:{name:'Sentry',tag:'move',mass:5,role:'turret',hp:12,r:1.1,speed:0,sc:1,still:true,seat:true,cost:1.6,xp:1.6,gold:10,score:200,dmgK:1.3,build:()=>buildSentry(),init:e=>{ e.cd=rand(1.2,2); e.pat=Math.random()<.5?0:1; }},
  borer:{name:'Borer',tag:'move',mass:1.6,role:'burrower',hp:10,r:1.2,speed:4.2,sc:1.1,cost:1.8,xp:1.8,gold:11,score:230,build:()=>buildBorer(),init:e=>{ e.st='under'; e.stT=rand(1.5,2.5); }},
  hopper:{name:'Hopper',tag:'move',mass:.9,role:'hopper',hp:8,r:1,speed:5,sc:.9,cost:1.2,xp:1.2,gold:8,score:150,dmgK:1.4,build:()=>buildHopper(),init:e=>{ e.st='wait'; e.stT=rand(.5,1); e.hops=0; }},
  emissary:{name:'Emissary',tag:'move',mass:1,role:'blinker',band:[5,9],hp:10,r:1.2,speed:3.4,sc:1.1,angel:true,cost:2.1,xp:2.1,gold:13,score:250,dmgK:1.3,build:()=>buildEmissary(),init:e=>{ e.cd=rand(1.5,2.5); e.st='walk'; }},
  aureole:{name:'Aureole',tag:'move',mass:.8,role:'boomerang',band:[7,11],hp:9,r:1,speed:3,sc:.95,fly:true,angel:true,cost:1.8,xp:1.8,gold:11,score:200,dmgK:1.3,build:()=>buildAureole(),init:e=>{ e.cd=rand(1.5,2.5); }},
  cantor:{name:'Cantor',tag:'focus',mass:.6,role:'summoner',band:[9,13],hp:8,r:1.1,speed:3.2,sc:1,fly:true,angel:true,cost:1.8,xp:1.8,gold:11,score:200,build:()=>buildCantor(),elite:false,init:e=>{ e.chantT=3; e.st='move'; }},
  shardling:{name:'Shardling',mass:.9,role:'kiter',band:[6,10],hp:8,r:1.2,speed:3,sc:1,fly:true,angel:true,cost:1.6,xp:1.4,gold:9,score:180,build:()=>buildShardling(),init:(e,o)=>{ e.gen=o.gen||0; e.sc=Math.pow(.72,e.gen); e.hp*=Math.pow(.45,e.gen); e.r*=e.sc; }},
  cherub:{name:'Cherub',tag:'focus',mass:.6,role:'support',hp:7,r:1,speed:4.6,sc:1,fly:true,angel:true,cost:1.5,xp:1.5,gold:10,score:220,build:()=>buildCherub(),elite:false,init:e=>{ e.cd=3; }},
  censer:{name:'Censer',tag:'move',mass:1.3,role:'artillery',band:[8,12],hp:10,r:1.1,speed:1.8,sc:1,fly:true,angel:true,cost:2,xp:2,gold:12,score:240,build:()=>buildCenser(),init:e=>{ e.cd=rand(1.5,2.5); }},
  ophan:{name:'Ophan',tag:'move',mass:2,role:'charger',band:[6,10],hp:16,r:1.8,speed:11,sc:1,angel:true,cost:2.8,xp:3,gold:16,score:320,build:()=>buildOphan(1),init:e=>{ e.st='pause'; e.stT=rand(1,2); }},
  /* Main Stage cast (docs/main-stage.html, Main Stage only; behavior in enemy-ai.js). group 'band': the four musicians (Encore = all of them),
     the rest is stage crew and crowd. Every attack lands on a beat of the live music (BEAT in audio.js). still: never moves (no body lean).
     seat: placed on an open spot instead of a gate (rooms.js seatSpot) · aura: Bass Brute slow radius · cone: Bass Brute headbang [reach, arc in rad, damage]
     amps: amps a Roadie keeps out at once · pulse: amp sound burst radius · rockets: Pyro Tech firework [speed, damage, per volley] · spot: follow spot [radius, burn per beat]
     meteors: Drummer sky drops [markers per volley, radius, damage] · leap: Stage Diver [seconds between leaps min, max].
     xp: about 0.9× a normal mob's (×1.48 for arena 5 on top), so the pilot hits the stage level cap (STAGE.lvCap) around rooms 12-13. */
  bass:{name:'Bass Brute',group:'band',tag:'focus',mass:3,role:'tank',hold:4.5,aura:6.5,cone:[6.5,1,14],hp:18,r:1.5,speed:1.9,sc:1.45,cost:2.4,xp:2.34,gold:15,score:300,build:()=>buildBassist(),init:e=>{ e.cd=2; }},
  dancer:{name:'Pulse Dancer',group:'band',tag:'move',mass:.6,role:'flanker',band:[4.5,6.5],hp:8,r:1.1,speed:6,sc:1.15,cost:1.8,xp:1.62,gold:11,score:220,build:()=>buildDancer(),init:e=>{ e.cd=rand(1,2); e.st='dance'; }},
  shredder:{name:'Shredder',group:'band',tag:'move',mass:1.2,role:'kiter',band:[6,10],hp:11,r:1.15,speed:3.4,sc:1.2,cost:2.6,xp:2.34,gold:15,score:300,build:()=>buildShredder(),init:e=>{ e.cd=rand(1.2,2); e.riffs=0; }},
  drummer:{name:'Drummer',group:'band',tag:'focus',mass:9,role:'artillery',slam:7.5,meteors:[3,1.7,16],hp:18,r:1.9,speed:0,sc:1.1,still:true,seat:true,cost:3,xp:2.7,gold:18,score:340,build:()=>buildDrummer()},
  roadie:{name:'Roadie',tag:'focus',mass:.9,role:'support',band:[8,12],amps:3,hp:6,r:1,speed:6,sc:1.1,cost:1.2,xp:0.99,gold:8,score:140,build:()=>buildHauler(),init:e=>{ e.cd=rand(.6,1.2); e.st='run'; }},
  amp:{name:'Amp',mass:9,role:'static',pulse:4.8,hp:1,r:.9,speed:0,sc:1,still:true,cost:0,xp:0,gold:0,score:20,build:()=>buildAmp(),elite:false,init:e=>{ e.life=10; e.noLoot=true; e.beatOff=(Math.random()*4)|0; }},
  mosher:{name:'Mosher',tag:'move',mass:.8,role:'rusher',hp:4,r:.95,speed:5.4,sc:1.05,cost:.45,xp:0.36,gold:3,score:60,build:()=>buildMosher(),elite:false,init:e=>{ e.cd=0; }},
  pyro:{name:'Pyro Tech',tag:'move',mass:1,role:'denial',band:[8,11],rockets:[12,11,2],hp:7,r:1,speed:4.2,sc:1.1,cost:1.5,xp:1.35,gold:10,score:200,build:()=>buildPyro(),init:e=>{ e.cd=rand(.8,1.5); }},
  spot:{name:'Lighting Tech',tag:'focus',mass:1,role:'support',band:[8,12],spot:[2.4,6],hp:3,r:1,speed:3,sc:1.1,cost:1.2,xp:1.08,gold:9,score:160,build:()=>buildSpot()},
  diver:{name:'Stage Diver',tag:'move',mass:1.3,role:'charger',leap:[1.4,2.2],hp:10,r:1.15,speed:4.8,sc:1.2,cost:2,xp:1.8,gold:12,score:240,build:()=>buildDiver(),init:e=>{ e.st='enter'; e.cd=rand(.6,1.2); }},
};
/* enemy AI by arena (index = arena). react: seconds an enemy must see you before it fires · lead: how much of your movement its aim and charges
   predict (0 = where you are, 1 = perfect intercept; arena 1 barely leads) · aggr: how often flankers go for your back and tanks push in · tokens: enemies that may attack at once
   (the rest reposition) · read: attacks come faster while your dash is recharging (arena 3+ read the player). */
const AI_LV=[
  {react:.45,lead:.2,aggr:.4,tokens:3,read:0},
  {react:.35,lead:.45,aggr:.6,tokens:4,read:0},
  {react:.27,lead:.7,aggr:.8,tokens:4,read:.4},
  {react:.2,lead:.9,aggr:1,tokens:5,read:.8},
  {react:.2,lead:.9,aggr:1,tokens:6,read:.8},
];
/* enemy movement feel (enemy-ai.js steer): accel = how fast a mass-1 enemy reaches the velocity it wants (units/s²), brake = stopping is this much
   faster, turn = how fast a mass-1 walker turns its body before it walks (rad/s). Every enemy divides both by its ENEMY mass (heavy = slow, light = agile).
   Flyers use an underdamped spring instead (fly.f stiffness, fly.z damping < 1), so they overshoot a little and settle. */
const MOVE={accel:30,brake:1.6,turn:10,fly:{f:6.5,z:.5}};
/* ================= LEVEL DESIGN ================= */
/* combat room compositions by arena (rooms.js composeRoom). Every combat room has at least one enemy that forces you to move (tag 'move') and one
   that demands attention (tag 'focus': sniper, support). A template is its core: enemy types, or 'move' / 'focus' for any unlocked one of that tag.
   The room budget then fills up from the unlocked arena pool. Templates whose core is not unlocked yet are skipped. */
const COMPS=[
  [{name:'Splinter',core:['shardling','shardling','move']},{name:'Rings',core:['warden','shardling','focus']},{name:'Censure',core:['censer','warden','shardling']},
   {name:'Strafe run',core:['seraph','seraph','shardling']},{name:'Wheel',core:['ophan','shardling','focus']},{name:'Flank',core:['herald','herald','focus']},{name:'Watch',core:['beacon','shardling','move']},{name:'Skirmish',core:['move','focus','shardling']}],
  [{name:'Strafe run',core:['seraph','seraph','lancer']},{name:'Shield wall',core:['bulwark','lancer','drone']},{name:'Rings',core:['warden','lancer','drone']},
   {name:'Splinter',core:['shardling','seraph','focus']},{name:'Halo',core:['warden','seraph','shardling']},{name:'Breach',core:['ram','drone','focus']},{name:'Grid',core:['coil','seraph','lancer']},{name:'Crossfire',core:['sentry','drone','focus']},{name:'Tunnels',core:['borer','seraph','lancer']},{name:'Skirmish',core:['move','focus','drone']}],
  [{name:'Choir',core:['cherub','seraph','seraph']},{name:'Censure',core:['censer','cherub','warden']},{name:'Wheel',core:['ophan','cherub','seraph']},
   {name:'Bastion',core:['dominion','cherub','warden']},{name:'Gaze',core:['beacon','warden','herald']},{name:'Hymn',core:['cantor','seraph','warden']},{name:'Halo throw',core:['aureole','ophan','focus']},{name:'Envoy',core:['emissary','beacon','cherub']},{name:'Skirmish',core:['move','focus','seraph']}],
  [{name:'Lanes',core:['lancer','crawler','drone']},{name:'Medics',core:['cherub','heavy','spark','spark']},{name:'Siege line',core:['howitzer','bulwark','lancer']},
   {name:'Hunters',core:['crawler','crawler','warden','censer']},{name:'Judgement',core:['warden','lancer','heavy']},{name:'Breach',core:['ram','crawler','lancer']},{name:'Grid',core:['coil','drone','lancer']},{name:'Field repair',core:['mender','heavy','drone','drone']},{name:'Turret line',core:['sentry','howitzer','crawler']},{name:'Dig',core:['borer','hopper','lancer']},{name:'Skirmish',core:['move','focus','move']}],
  // Main Stage rooms are composed wave by wave from STAGE (composeStage); these only cover a forced plain room there
  [{name:'Sound check',core:['bass','roadie','spot']},{name:'Moshpit',core:['mosher','mosher','mosher','mosher','mosher','mosher']},{name:'Encore',core:['bass','dancer','shredder','drummer']}],
];
/* the rooms right before a boss teach its patterns with smaller versions (core of the teaching room, see PACING) */
const BOSS_TEACH={
  colossus:['heavy','heavy','drone','drone'],          // slams with shockwaves, spread shots, gunfire
  hive:['spark','spark','spark','howitzer','drone'],    // swarms and bombs from above
  arachne:['crawler','crawler','lancer'],               // mines, flanking, a laser that tracks you
  prism:['shardling','shardling','warden'],             // shards and rings (angel side)
  seraph:['seraph','seraph','warden','cherub'],         // charges and rings
  throne:['ophan','warden','censer'],                   // rolls and bullet walls
  archon:['seraph','ophan','warden'],                   // lunges, a rolling line, waves (angel side)
  highco:['shredder','diver','pyro','bass'],           // cones and lightning (scream), a landing crush (slam stun), marked floor fire (pillars), slows
};
/* mob tiers (patch.md 25, the mob doc): T2 and T3 keep the silhouette, the telegraph and the armor, and add behavior (enemy-ai.js reads e.tier).
   max: the highest tier a mob has behavior for (missing = T1 only; a higher roll folds down). from: [first T2 room, first T3 room] per arena
   (0 = never); late: the T1/T2/T3 shares the arena ramps up to by its last quarter. Boss teaching rooms, elites and the Main Stage stay T1.
   cost/gold: a tiered mob takes more of the room budget and pays more. pal: the main / accent body color per side and tier; slot: a mob whose
   main or accent is not mats[0] / mats[1] (Ophan's white eyes are mats[1]). plates (1 or 2 bars above the model) mark the tier for colorblind
   players. Shot and telegraph colors never change with the tier. Palette and slots follow the mob design file (docs/mob-designs.html). */
const TIER={max:{drone:2,heavy:2,bulwark:2,warden:2,shardling:3,censer:2,crawler:2,seraph:3,spark:3,lancer:2,cherub:2,ophan:3,howitzer:2},
  from:[[16,0],[8,26],[6,20],[1,10],[0,0]], late:[[.5,.5,0],[.3,.45,.25],[.25,.45,.3],[.15,.4,.45],[1,0,0]], cost:[1,1.15,1.3], gold:[1,1.1,1.2],
  pal:{machine:{2:{accent:0x2fa890},3:{main:0x1c1a24,accent:0xd8d0b8}}, angel:{2:{main:0xe89ab8},3:{main:0x2a2232}}}, slot:{ophan:{main:1}}, plate:0xf2eef8};
/* room kinds. minRoom / minArena gate them early on. Ambush: they come from the sides and from behind. Reinforcements: waves arrive through gates.
   Survive: hold out for time seconds against endless spawns (spawns pay reward × the normal kill). Hunt: an elite flees and escapes after time
   seconds. Gauntlet: few enemies (budget × k), many traps. Dark: you only see what is within light units (light.m on phones). */
const ROOM_KINDS={
  normal:{name:'Hostiles'},
  ambush:{name:'Ambush',sub:'Out of the exit',minRoom:2},
  reinforce:{name:'Reinforcements',sub:'Waves through the gates',minRoom:3,waves:3},
  survive:{name:'Survive',sub:'Hold out',minRoom:8,time:20,reward:.4,cap:[5,6,7,7,7]},
  hunt:{name:'Hunt',sub:'The elite runs. Catch it.',minRoom:7,time:16},
  gauntlet:{name:'Trap gauntlet',sub:'Few enemies, many traps',minRoom:3,k:.55},
  dark:{name:'Dark room',sub:'Stay close to the light',minRoom:11,light:{d:8.5,m:9}},
  teach:{name:'Hostiles'},
  stage:{name:'Live set',sub:'Waves through the gates'},
};
/* Main Stage wave rooms (rooms.js composeStage, main.js roomKinds). Every room is a set of waves through the gates: clear a wave, take a
   breather (seconds, a range), the next one comes in; clear the last one and the door opens. waves: per room 1-15. A wave's budget (ENEMY cost)
   = base + room × (room - 1) + wave × (wave - 1), capped at cap enemies ([phone, desktop]).
   The bestiary's room types are wave compositions: Sound check (one band member + stage crew), Moshpit (a pack of Moshers, mosh.size, from
   room mosh.from on every mosh.every-th wave) and Encore (the full band on stage at once: the last wave of rooms encore.from+, one of them an
   elite from encore.elite). unlock: the first room each mob can show up in (band members one at a time, crew fills the budget). */
const STAGE={
  waves:[2,2,3,3,3,3,4,4,4,4,4,5,5,5,5],
  budget:{base:4.2,room:.3,wave:.4}, cap:[9,11], breather:[3,4],
  band:['bass','dancer','shredder','drummer'], crew:['roadie','spot','pyro','diver'],
  unlock:{bass:1,roadie:1,spot:2,dancer:3,pyro:4,mosher:5,shredder:6,diver:7,drummer:9},
  // encore.elite: the first room whose Encore has an elite band member (16 = none: the full band plus an elite at the level cap was the wall)
  mosh:{from:5,every:3,size:[6,10],sizeM:[6,8]}, encore:{from:11,elite:16},
  // Ritim senkronu: the beat counts as hit when the dash lands within win seconds of it; the drummer raises the band's tempo by drumTempo while he lives
  beatWin:.11, drumTempo:1.15, ampMax:6,
  // pilot level cap on the Main Stage (HUD: MAX LVL; xp past it is dropped, no more cards). With the xp above it is reached around rooms 12-13.
  lvCap:30,
  // armor repaired on entering High-Co's room (share of max armor, the tree's Repair applies): the stage has no Sanctuary rooms
  bossRepair:.5,
  // follow spot: seconds inside before the first burn · Drummer sky drop markers alive at once [phone, desktop]
  spotGrace:.25, meteorMax:[6,10],
  // room music (audio.js stageMusic): one part of a song loops through the wave rooms and gets louder room by room, vol [first room, last room
  // before the boss] on top of the music volume. Same fields as High-Co's tracks (src, bpm, offset, start, end); local only, empty src = synth.
  // owner's setup (2026-10-25): loop.mp3 0:49-2:44 loops through the wave rooms, full volume in the last room before High-Co. bpm 0: the beat
  // clock keeps the synth tempo until the track's real bpm and first downbeat are filled in (an automatic guess was not reliable)
  music:{src:'assets/audio/loop.mp3',bpm:0,offset:0,start:49,end:164,vol:[.45,1]},
};
/* pacing inside every 10-room block (index = position in the block, 10 = boss): the kinds it can roll and a budget multiplier.
   Tension comes in waves: a breather after the boss, a first spike, the angel, a climb, a hard room and a teaching room before the next boss. */
const PACING=[null,
  {kinds:['normal'],k:.8},
  {kinds:['normal','ambush'],k:1},
  {kinds:['reinforce','ambush','gauntlet'],k:1.1},
  {kinds:['normal','dark'],k:1},
  {angel:true},
  {kinds:['normal','reinforce','ambush'],k:1.05},
  {elite:true,kinds:['normal','hunt'],k:1},
  {kinds:['survive','dark','gauntlet','ambush'],k:1.15},
  {kinds:['teach'],k:1.2},
  {boss:true},
];
/* elite affixes: every elite rolls 1-2 (corrupted elites 1), shown on its nameplate. Effects live in enemies.js / enemy-ai.js. */
const AFFIX={
  swift:{name:'Swift',d:'Moves 40% faster and attacks more often.'},
  shielded:{name:'Shielded',d:'A barrier soaks most damage until it breaks, then comes back.'},
  volatile:{name:'Volatile',d:'Explodes when it dies. Do not stand close.'},
  blinker:{name:'Blinker',d:'Teleports every few seconds.'},
  summoner:{name:'Summoner',d:'Calls in small helpers.'},
};
const BOSSES={
  colossus:{name:'Iron Colossus',cls:'Class · War machine · Siege frame',epi:'Built to level cities. It walks straight through gunfire and shakes the ground apart.',threat:3,warn:'HOSTILE WAR MACHINE INBOUND',hp:470,r:3.2,fly:0,barrier:false,minion:'drone',gold:220,gems:25,angel:false,
    pool:[['burst','missiles','slam'],['burst','missiles','slam','summon'],['missiles','slam','burst','summon','slam']]},
  prism:{name:'Prism Angel',cls:'Class · Angel · Crystalline lattice',epi:'A floating crystal that bends light into a beam able to cut a harbor in half.',threat:4,warn:'HIGH-ENERGY SIGNAL APPROACHING',hp:640,r:3.0,fly:5,barrier:true,minion:'mini',gold:380,gems:40,angel:true,
    pool:[['beam','shards','ring','smite'],['beam','sweep','shards','ring','smite','pulse'],['sweep','beam','shards','ring','summon','smite','pulse']]},
  seraph:{name:'The Last Seraph',cls:'Class · Angel · Seraph',epi:'The source of every signal. Six wings, one core, and nothing left to lose.',threat:5,warn:'HIGH-ENERGY SIGNAL DESCENDING',hp:860,r:3.0,fly:4.2,barrier:true,minion:'mini',gold:600,gems:60,angel:true,
    pool:[['ring','beam','spiral','aimed','smite'],['ring','beam','spiral','summon','aimed','sweep','smite','pulse'],['ring','sweep','spiral','summon','aimed','beam','shards','smite','pulse']]},
  hive:{name:'Hive Carrier',cls:'Class · War machine · Rotor carrier',epi:'A flying hangar with four rotors. It seeds the room with drones and bombs it in straight lines.',threat:3,warn:'ROTOR NOISE OVERHEAD',hp:540,r:3.6,fly:.01,coreY:5,barrier:false,minion:'drone',gold:240,gems:28,angel:false,
    pool:[['drones','bombline','missiles'],['drones','bombline','missiles','bombline'],['sparks','bombline','drones','missiles','bombline']]},
  arachne:{name:'Siege Arachne',cls:'Class · War machine · Siege walker',epi:'A Crawler grown to the size of a building. Its head laser sweeps half the room; the space under its belly is the only blind spot.',threat:4,warn:'SEISMIC SIGNATURE CLOSING',hp:600,r:3.4,fly:0,coreY:3.2,barrier:false,minion:'crawler',gold:300,gems:34,angel:false,
    pool:[['sweep180','mines','burst2'],['sweep180','mines','stomp','burst2'],['sweep180','stomp','mines','burst2','stomp']]},
  throne:{name:'Ophanim Throne',cls:'Class · Angel · Throne',epi:'Three rings and twenty-four eyes. Every open eye is a gun; shoot them out.',threat:5,warn:'THE THRONE IS WATCHING',hp:880,r:3.4,fly:.01,coreY:3.5,barrier:false,minion:'mini',gold:560,gems:56,angel:true,
    pool:[['walls','eyes','smite'],['walls','eyes','walls2','smite','pulse'],['walls2','eyes','roll','walls','roll','smite','pulse']]},
  archon:{name:'Archon',cls:'Class · Angel · Judge',epi:'An armored knight with a sword of light. Stay out of the lunge, punish the recovery, and stop firing into the shield.',threat:5,warn:'JUDGEMENT DESCENDS',hp:820,r:2.6,fly:.01,coreY:4.6,barrier:false,minion:'seraph',gold:560,gems:56,angel:true,
    pool:[['wave','lunge','aimed'],['wave','lunge','shieldup','wave','smite'],['lunge','wave','shieldup','lunge','ring','smite','pulse']]},
  // High-Co (Main Stage headliner): three forms killed one after another, each with its own armor bar (bosses.js, highcoFormDown).
  // Form I the white frontman (parachute drop), form II the black-winged angel (descends in a light column), form III red-winged rage.
  // Only form III's death is the boss kill (score, rewards, room clear). b.phase is the form number, so pool[n-1] is form n's attack set.
  // His room is a concert stage (buildHighCoArena); the amp stacks on the mat are the only cover from the Metal Scream.
  // stageOnly: the Main Stage's boss and nobody else's (left out of Arena 4's 'all' pool, no corrupted variant). minion: his crowd.
  // encore: band members (Main Stage mobs) who come back on stage when a form begins ("Grup üyeleri formlar arasında sahneye dönebilir").
  highco:{name:'High-Co',cls:'Class · Frontman · Fallen angel',epi:'The headliner parachutes in, screams the room flat and comes back with wings. Hide behind the amps when he raises the mic.',threat:5,warn:'THE HEADLINER IS DROPPING IN',hp:900,r:1.8,fly:0,coreY:6.5,barrier:false,minion:'mosher',stageOnly:true,encore:{2:['bass','dancer'],3:['shredder','drummer']},gold:620,gems:62,angel:false,
    pool:[['beam','hcslam','scream','headbang','pole'],['sweep','scream','headbang','pole','headbang'],['sweep','hcslam','scream','headbang','pole','pillars','pillars']],
    /* forms: hp = share of the boss armor (hp above × the room curve), dmg = multiplier on every hit the pilot takes in his room, capped at hitCap
       (raw, before the room curve: 30 = the hardest existing boss hit, his own point-blank Metal Scream), breath = pause between attacks
       (other bosses: 0.9 / 0.7 / 0.5 s), spd = walk speed multiplier, regen = draws power from the crowd (regen below), bar/col = HUD bar and effects.
       Fight length at the stage level cap (lv 30, max Core + tree, DBG.hcSim with regen): average pilot (≈64 dps on him) I 2:00 · II 2:00 · III 2:15,
       skilled (≈110-150 dps) I 0:50-1:10 · II 0:50-1:15 · III 1:00-1:15. The music loops are sized on the average column.
       dmg is set for that pilot (≈690 armor at the cap): a beam or a Metal Scream takes ≈10-13% armor, the encore band ≈6%; the threat is ≈6
       minutes of it after 15 rooms (the stage curve and odds: DBG.stageCheck). */
    forms:[{name:'White',hp:.28,dmg:.29,breath:.42,spd:1.1,bar:'#ffb04a',col:0xffa040},
           {name:'Black Angel',hp:.23,dmg:.165,breath:.8,spd:.9,regen:true,bar:'#a58cff',col:0xd9c9ff},
           {name:'Red Rage',hp:.25,dmg:.32,breath:.36,spd:1.2,regen:true,bar:'#ff2a3a',col:0xff2030}],
    hitCap:30,
    /* stage fatigue (bosses.js hcFatigue, applied in enemies.js hitEnemy): your damage on him is averaged over tau s; per second past knee, cut of
       the excess is lost: Q, burns, procs and crits included. An average pilot (≈64 dps above) stays under the knee; the harder a build hits, the
       larger the share it loses (it tends to cut). The HUD shows the share lost next to his name. */
    fatigue:{knee:70,cut:.6,tau:3},
    passive:'Stage fatigue: the harder you hit him, the less of it lands.',
    /* crowd regen (forms II and III): every cd s (by form) he raises his arms (tele s), the three crowd sections light up and send light streams to
       him for dur s. Each live stream heals rate × form armor per second. Hitting him while he channels cuts the streams: every cut × form armor
       of damage breaks one (a big hit can break several), and with all three cut he staggers (stagger s, takes +60%). He never heals past
       cap × form armor per form in total, and never while immune. */
    regen:{cd:[0,10,8.5],tele:.9,dur:4,streams:3,rate:.012,cut:.025,cap:.25,stagger:1.4},
    /* music (audio.js hcMusic): one track per form. The files live in assets/audio/, which git ignores: they are only played when the game runs
       on localhost (MUSIC_LOCAL), the published game keeps the live synthesized music. Fill src (e.g. 'assets/audio/highco-1.mp3'), bpm (the track's
       tempo: the beat clock and his attack timing follow it), offset (seconds from the file start to the first downbeat), start (where the form's
       music starts, e.g. the drop; 0 = offset) and end (seconds where it loops back to start; 0 = the end of the file). Empty src = synth. */
    tracks:[{src:'assets/audio/loop.mp3',bpm:0,offset:0,start:164,end:0},{src:'assets/audio/faz2.mp4',bpm:0,offset:0,start:5,end:0},{src:'assets/audio/faz3.mp4',bpm:0,offset:0,start:8,end:0}]},
};
/* corrupted variants: any boss + purple tint, crystal spikes and a few attacks borrowed from another boss. Arena 4 draws from all of them.
   The bosses are put in the active language first (i18n.js) so the variants are built from translated lines; boss names stay English. */
if(LANG!=='en') langData(BOSSES);
const CORRUPT_DONOR={colossus:['shards','beam'],prism:['missiles','slam'],seraph:['walls','bombline'],hive:['mines','spiral'],arachne:['bombline','ring'],throne:['spiral','missiles'],archon:['slam','shards']};
for(const k of Object.keys(CORRUPT_DONOR)){ const b=BOSSES[k], dn=CORRUPT_DONOR[k];
  BOSSES['x_'+k]=Object.assign({},b,{name:'Corrupted '+b.name.replace(/^The /,''),cls:b.cls+' · '+t('Corrupted'),epi:t('The void got inside it. Same frame, new tricks, more armor.'),threat:Math.min(5,b.threat+1),warn:t('CORRUPTED SIGNAL')+' · '+b.warn,hp:Math.round(b.hp*1.35),form:k,corrupt:true,gold:Math.round(b.gold*1.3),gems:Math.round(b.gems*1.3),
    pool:b.pool.map((p,i)=>p.concat(dn.slice(0,i===0?1:2)))}); }
/* hand-built room layouts: 11 columns × 15 rows of cells (22 × 30 units on desktop, 20 × 30 on phones). Row 0 is the door side, the last row the entry.
   # block (stops movement and most shots) · ~ trap (walkable; a run of ~ is one trap: a saw rail, spike tiles or light pillars by arena, see TRAPS)
   · . open floor. Keep row 0 and the last two rows open in the middle. */
/* trap tiles (traps.js). dmg: to you (the room damage curve applies) · edmg: to enemies (× the room's enemy armor scale) · cd: seconds between hits
   on the same target. saw: speed along its rail, r: blade radius. spike / pillar: idle, warn (the telegraph) and act seconds. */
const TRAPS={saw:{dmg:12,edmg:3,cd:.5,speed:4.2,r:.75},spike:{dmg:12,edmg:3,cd:.6,idle:2.2,warn:.8,act:.9},pillar:{dmg:14,edmg:3.5,cd:.6,idle:2.6,warn:.95,act:1.1}};
const ROOMS=[
  ['...........','...........','..#.....#..','...........','...........','....#.#....','...........','...........','...........','....#.#....','...........','...........','..#.....#..','...........','...........'],
  ['...........','...........','...#...#...','...........','.~~~...~~~.','...........','...........','.....#.....','...........','...........','...##.##...','...........','...........','...........','...........'],
  ['...........','.....#.....','..#..#..#..','...........','...........','..##...##..','...........','.....#.....','...........','..##...##..','...........','..#..#..#..','...........','...........','...........'],
  ['...........','..~~...~~..','..~.....~..','...........','....#.#....','.....#.....','....#.#....','...........','..~.....~..','..~~...~~..','...........','....#.#....','...........','...........','...........'],
  ['...........','...........','.###...###.','...........','...........','.....#.....','...#...#...','.....#.....','...........','...........','.~~.....~~.','...........','..#.....#..','...........','...........'],
  ['...........','..#...#....','......~~...','...........','..#........','.....#..#..','...........','...~~......','........#..','...........','...#.......','......~~...','...........','...........','...........'],
  ['...........','...........','...#####...','...#...#...','...........','...........','...#...#...','...##.##...','...........','...........','..#.....#..','...........','...........','...........','...........'],
  ['...........','..~~.#.~~..','..~~...~~..','...........','...........','..#.~~~.#..','...........','...........','..~~...~~..','..~~...~~..','...........','.....#.....','...........','...........','...........'],
  ['...........','...........','.#.......#.','.#..#.#..#.','...........','...........','....~~~....','...........','...........','.#..#.#..#.','.#.......#.','...........','...........','...........','...........'],
  ['...........','...#...#...','...........','.....~.....','..#..~..#..','.....~.....','...........','...#...#...','...........','.....~.....','..#..~..#..','.....~.....','...........','...........','...........'],
  ['...........','...........','..##.....#.','...........','......##...','...........','.#.......#.','...........','...##......','...........','.#.....##..','...........','...........','...........','...........'],
  ['...........','...........','..~~~.~~~..','...........','...........','...#...#...','....#.#....','.....#.....','...........','...........','..~~~.~~~..','...........','...........','...........','...........'],
];
const SANCTUM=['...........','...........','..#.....#..','...........','...........','...........','...........','...........','...........','...........','...........','...........','..#.....#..','...........','...........'];
// the data tables in the active language (i18n.js); the story is plain lines. BOSSES went before the corrupted variants;
// ENEMY stays out: enemy names stay English and its tag / role strings are ids. COMPS names are never shown.
if(LANG!=='en'){ [UNITS,SPECIALS,WEAPONS,GADGETS,COSMETICS_SOON,TREE,CORE,RARITY,RSK,ITEMS,CURSES,ARENAS,MODS,ROOM_KINDS,AFFIX].forEach(o=>langData(o)); langData(STORY,true);
  // arena phases have their own keys: the Hubris stage beat is a word of its own in Turkish, the Hubris meter keeps its name
  ARENAS.forEach(A=>{ if(A.phase) A.phase=t('Phase: '+A.phase).replace(/^Phase: /,''); }); }

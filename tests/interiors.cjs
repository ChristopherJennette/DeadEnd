// Optional developer regression checks: node tests/interiors.cjs
// Uses only Node's standard library. Node is not needed to run the game.
// DOM/canvas stubs exercise logic and draw ordering, NOT visual/browser correctness.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const baseline = '6808f8f1d562e94e748ae1795e4895609f95c374';
const scriptPaths = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .matchAll(/<script src="\.\/(.*?)"/g)].map(m => m[1]);

function context(legacy = false) {
  const nodes = new Map(), listeners = new Map(), storage = new Map();
  const graphics = new Proxy({createLinearGradient: () => ({addColorStop() {}})}, {
    get: (obj, key) => obj[key] || (() => {}),
    set: (obj, key, value) => (obj[key] = value, true)
  });
  function listen(key, fn) {
    if (!listeners.has(key)) listeners.set(key, []);
    listeners.get(key).push(fn);
  }
  function element(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {
      style: {}, dataset: {}, hidden: false, innerHTML: '', textContent: '',
      getContext: () => graphics,
      getBoundingClientRect: () => ({width: 390, height: 844, left: 0, top: 0}),
      setAttribute() {}, setPointerCapture() {}, querySelector: element,
      addEventListener: (name, fn) => listen(selector + ':' + name, fn),
      insertAdjacentHTML(where, text) { this.innerHTML += text; }
    });
    return nodes.get(selector);
  }
  const math = Object.create(Math); math.random = () => .125;
  const sandbox = {
    console, Math: math, devicePixelRatio: 1,
    Date: class extends Date { static tick = 1700000000000; static now() { return this.tick++; } },
    Image: class { complete = true; naturalWidth = 1254; naturalHeight = 1254; },
    requestAnimationFrame() {},
    addEventListener: (name, fn) => listen('window:' + name, fn),
    document: {querySelector: element, querySelectorAll: () => [],
      addEventListener: (name, fn) => listen('document:' + name, fn)},
    localStorage: {getItem: k => storage.get(k) || null,
      setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k)},
    fire: (key, event) => (listeners.get(key) || []).forEach(fn => fn(event))
  };
  sandbox.window = sandbox;
  const c = vm.createContext(sandbox);
  for (const file of scriptPaths) {
    const source = legacy ? execFileSync('git', ['show', baseline + ':' + file], {cwd: root, encoding: 'utf8'}) :
      fs.readFileSync(path.join(root, file), 'utf8');
    vm.runInContext(source, c, {filename: file});
  }
  return code => vm.runInContext(code, c);
}

let passed = 0;
function check(name, test) { test(); passed++; console.log('PASS', name); }
const run = context();

check('Baseline map, initial zombies, player stats, and RNG are unchanged', () => {
  const snapshot = `JSON.stringify({player,buildings:buildings.map(({doorStates,...b})=>b),
    trees,cars,zombies,caches,seed,t,kills})`;
  assert.equal(run(snapshot), context(true)(snapshot));
});
check('Title and New Survival Run still open Character', () => {
  assert.equal(run(`mode==='title'&&overlay.innerHTML.includes('NEW SURVIVAL RUN')`), true);
  run(`$('#start').onclick()`);
  assert.equal(run(`mode==='character'&&overlay.innerHTML.includes('Eat (2)')`), true);
});

function fixture() {
  run(`reset('survival'); zombies=[]; spawnTimer=1e9;
    globalThis.testBuilding=buildings[0];
    globalThis.layout=interiorLayouts.get(testBuilding);
    globalThis.front=layout.doors.find(d=>d.id==='front');
    globalThis.rear=layout.doors.find(d=>d.id==='rear');
    globalThis.roomDoor=layout.doors.find(d=>d.id==='room');
    player.x=doorCenter(front).x; player.y=front.y+front.h+12;`);
}

check('Every building has two rooms, three doors, and a nonlocked main entrance', () => {
  assert.equal(run(`buildings.every(b=>{let l=interiorLayouts.get(b);return l.rooms.length===2&&
    l.doors.length===3&&b.doorStates.front==='closed'&&l.rooms.every(r=>r.w>0&&r.h>0)})`), true);
});
check('Every building permits entry, room traversal, and exit through open doors', () => {
  assert.equal(run(`(()=>{for(const b of buildings){const l=interiorLayouts.get(b);
    const front=l.doors.find(d=>d.id==='front'),rear=l.doors.find(d=>d.id==='rear');
    for(const d of l.doors)b.doorStates[d.id]='open';
    const actor={x:doorCenter(front).x,y:b.y+b.h+20};
    move(actor,0,-b.h-40,12);if(actor.y>b.y-18)return false;
    move(actor,0,b.h+40,12);if(actor.y<b.y+b.h+18)return false;
  }return true})()`), true);
});
check('Closed door blocks passage for 0.96s and opens at 1.00s of approach', () => {
  fixture();
  run(`input.x=.8;input.y=-.45;for(let i=0;i<24;i++)update(.04)`);
  assert.equal(run(`doorState(front)`), 'closed');
  assert.equal(run(`player.y>=front.y+front.h+12`), true);
  run(`update(.04)`);
  assert.equal(run(`doorState(front)`), 'open');
  run(`for(let i=0;i<12;i++)update(.04);resetInput()`);
  assert.equal(run(`player.y<front.y&&buildingAt(player)===testBuilding`), true);
});
check('Releasing approach cancels incomplete opening', () => {
  fixture();
  run(`input.x=.8;input.y=-.45;for(let i=0;i<10;i++)update(.04);resetInput();
    for(let i=0;i<30;i++)update(.04)`);
  assert.equal(run(`doorState(front)==='closed'&&doorAction===null`), true);
});
check('E starts a one-second opening; paused menus cancel it', () => {
  fixture();
  run(`fire('window:keydown',{key:'e',repeat:false,preventDefault(){}});tickDoors(.5)`);
  assert.equal(run(`doorState(front)`), 'closed');
  run(`tickDoors(.5)`);
  assert.equal(run(`doorState(front)`), 'open');
  run(`player.y=front.y+front.h+22;interactDoor();interactDoor();tickDoors(.5);pause();tickDoors(2)`);
  assert.equal(run(`doorState(front)==='closed'&&doorAction===null`), true);
});
check('Door button opens/closes; moving away cancels opening', () => {
  fixture();
  run(`$('#door').onclick();tickDoors(1);player.y=front.y+front.h+22;$('#door').onclick()`);
  assert.equal(run(`doorState(front)`), 'closed');
  run(`$('#door').onclick();player.y+=100;tickDoors(1)`);
  assert.equal(run(`doorState(front)==='closed'&&doorAction===null`), true);
});
check('Locked doors stay locked, show Locked, and stop normal movement and dodges', () => {
  fixture();
  run(`player.x=doorCenter(rear).x;player.y=rear.y-12;interactDoor();tickDoors(2);move(player,0,150,12)`);
  assert.equal(run(`doorState(rear)`), 'locked');
  assert.equal(run(`$('#toast').textContent`), 'Locked');
  assert.equal(run(`player.y<=rear.y-12`), true);
  run(`player.dodgeTime=.2;move(player,0,200,12)`);
  assert.equal(run(`player.y<=rear.y-12`), true);
});
check('Cannot close a door onto either the player or a zombie', () => {
  fixture();
  run(`front.building.doorStates.front='open';Object.assign(player,doorCenter(front));interactDoor()`);
  assert.equal(run(`doorState(front)==='open'&&$('#toast').textContent==='Doorway blocked'`), true);
  run(`player.y=front.y+front.h+22;zombies=[{...doorCenter(front),hp:100}];interactDoor()`);
  assert.equal(run(`doorState(front)`), 'open');
});
check('Solid walls and closed/locked doors block exact sight rays; open doors do not', () => {
  fixture();
  assert.equal(run(`los({x:doorCenter(front).x,y:front.y-20},{x:doorCenter(front).x,y:front.y+28})`), false);
  run(`testBuilding.doorStates.front='open'`);
  assert.equal(run(`los({x:doorCenter(front).x,y:front.y-20},{x:doorCenter(front).x,y:front.y+28})`), true);
  assert.equal(run(`los({x:testBuilding.x-1,y:testBuilding.y+40},{x:testBuilding.x+9,y:testBuilding.y+40})`), false);
  assert.equal(run(`los({x:doorCenter(rear).x,y:rear.y-20},{x:doorCenter(rear).x,y:rear.y+28})`), false);
});
check('Room partitions prevent walking through walls and allow the open doorway', () => {
  fixture();
  run(`player.x=testBuilding.x+35;player.y=roomDoor.y+roomDoor.h+15;move(player,0,-100,12)`);
  assert.equal(run(`player.y>=roomDoor.y+roomDoor.h+12`), true);
  run(`player.x=doorCenter(roomDoor).x;player.y=roomDoor.y+roomDoor.h+12;
    requestDoorOpen(roomDoor,true);tickDoors(1);move(player,0,-45,12)`);
  assert.equal(run(`player.y<roomDoor.y`), true);
});
check('Zombies can route through open entrances and room doors, but not locked ones', () => {
  fixture();
  run(`testBuilding.doorStates.front='open';testBuilding.doorStates.room='open';
    globalThis.target={x:testBuilding.x+40,y:testBuilding.y+40};
    globalThis.start={x:testBuilding.x+40,y:testBuilding.y+testBuilding.h+35};
    globalThis.route=interiorRoute(start,target);`);
  assert.equal(run(`route.length>0&&route.every((p,i)=>clearPath(i?route[i-1]:start,p,13))`), true);
  run(`testBuilding.doorStates.front='locked'`);
  assert.equal(run(`interiorRoute(start,target).length`), 0);
});
check('Zombies physically follow the open-door route into the target room', () => {
  fixture();
  run(`testBuilding.doorStates.front='open';testBuilding.doorStates.room='open';
    player.x=testBuilding.x+45;player.y=testBuilding.y+40;
    zombie(testBuilding.x+45,testBuilding.y+testBuilding.h+35);
    globalThis.pursuer=zombies[0];pursuer.state='search';pursuer.memory=60;
    pursuer.lastX=player.x;pursuer.lastY=player.y;
    for(let i=0;i<1200&&dist(pursuer,player)>20;i++)zombieBrain(pursuer,.04);`);
  assert.equal(run(`dist(pursuer,player)<21`), true);
});
check('Closed doors block automatic shots, melee, and zombie contact damage', () => {
  fixture();
  run(`player.x=doorCenter(front).x;player.y=front.y+front.h+12;
    zombies=[{id:500,x:player.x,y:front.y-12,hp:105,max:105,speed:40,heading:Math.PI/2,
      phase:0,state:'chase',suspicion:1,memory:5,lastX:player.x,lastY:player.y,roamTime:1,hit:0}];
    globalThis.ammoBefore=player.ammo;globalThis.hpBefore=player.hp;
    for(let i=0;i<25;i++)update(.04);`);
  assert.equal(run(`player.ammo===ammoBefore&&player.hp===hpBefore&&zombies[0].hp===105`), true);
});
check('Open-door ranged and melee combat still work', () => {
  fixture();
  run(`testBuilding.doorStates.front='open';zombies=[{id:501,x:player.x,y:front.y-30,
    hp:1000,max:1000,speed:40,heading:Math.PI/2,phase:0,state:'chase',suspicion:1,memory:5,
    lastX:player.x,lastY:player.y,roamTime:1,hit:0}];update(.04)`);
  assert.equal(run(`player.ammo===7&&zombies[0].hp<1000`), true);
  run(`player.sneaking=true;player.mc=0;seed=1;zombies[0].y=front.y-12;
    globalThis.meleeBefore=zombies[0].hp;update(.04)`);
  assert.equal(run(`zombies[0].hp<meleeBefore`), true);
});
check('Door states and an indoor player position survive a save/load', () => {
  fixture();
  run(`testBuilding.doorStates.front='open';player.y=front.y-25;saveRun();
    globalThis.savedY=player.y;player.y=640;loadRun()`);
  assert.equal(run(`player.y===savedY&&buildings[0].doorStates.front==='open'&&
    buildings[0].doorStates.rear==='locked'&&buildingAt(player)===buildings[0]`), true);
});
check('Pre-interiors saves migrate in place without changing progression or position', () => {
  fixture();
  run(`player.x=640;player.y=640;player.level=7;player.parts=11;
    for(const b of buildings)delete b.doorStates;saveRun();loadRun()`);
  assert.equal(run(`player.x===640&&player.y===640&&player.level===7&&player.parts===11&&
    buildings.every(b=>b.doorStates.front==='closed')&&hasSave()`), true);
});
check('Player rendering runs once, after all building and tree draws', () => {
  fixture();
  assert.equal(run(`(()=>{const calls=[],oldPerson=person,oldBuilding=building,oldTree=tree;
    person=(a,p)=>calls.push(p?'player':'zombie');building=b=>calls.push('building');tree=t=>calls.push('tree');
    try{draw()}finally{person=oldPerson;building=oldBuilding;tree=oldTree}
    return calls.at(-1)==='player'&&calls.filter(c=>c==='player').length===1;})()`), true);
});
check('Roof cutaway and external occlusion bounds include the full sprite', () => {
  fixture();
  assert.equal(run(`(()=>{let p=project(player.x,player.y);return playerOverlapsPolygon([
    [p.x-2,p.y-60],[p.x+2,p.y-60],[p.x+2,p.y-50],[p.x-2,p.y-50]])})()`), true);
  assert.equal(run(`(()=>{const original=poly;let roofs=0;
    poly=(points,color)=>{if(color==='#616e62')roofs++};
    try{player.y=front.y-25;building(testBuilding);if(roofs!==0)return false;
      player.y=front.y+front.h+30;building(testBuilding);return roofs===1;
    }finally{poly=original}})()`), true);
});
check('The door UI reflects all three states and hides while paused', () => {
  fixture();
  run(`updateDoorUI()`); assert.equal(run(`$('#door').textContent`), 'OPEN DOOR · 1s');
  run(`testBuilding.doorStates.front='open';updateDoorUI()`); assert.equal(run(`$('#door').textContent`), 'CLOSE DOOR · E');
  run(`testBuilding.doorStates.front='locked';updateDoorUI()`); assert.equal(run(`$('#door').textContent`), 'LOCKED · E');
  run(`pause();updateDoorUI()`); assert.equal(run(`$('#door').hidden`), true);
});
check('Full-population simulation and drawing execute without exceptions', () => {
  run(`reset('survival');for(let i=0;i<180;i++){if(mode==='play')update(1/60);if(i%30===0)draw()}`);
  assert.equal(run(`Number.isFinite(player.x)&&Number.isFinite(player.hp)&&zombies.length>0`), true);
});

console.log(`${passed} regression checks passed. Browser visual/touch QA still required.`);

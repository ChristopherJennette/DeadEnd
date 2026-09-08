'use strict';
// Equipment. Shared classic-script bindings; startup runs last in main.js.
const equipment=[
{id:'pistol',type:'weapon',name:'Service pistol',cost:0,desc:'23 damage · 8 rounds · reliable starter',values:{damage:23,mag:8,rate:.65,reach:230,reloadTime:1.5,noise:1}},
{id:'revolver',type:'weapon',name:'Heavy revolver',cost:140,desc:'44 damage · 6 rounds · slower, louder shots',values:{damage:44,mag:6,rate:.85,reach:260,reloadTime:1.8,noise:1.2}},
{id:'suppressed',type:'weapon',name:'Suppressed pistol',cost:220,desc:'25 damage · 10 rounds · 55% less gunshot noise',values:{damage:25,mag:10,rate:.58,reach:240,reloadTime:1.5,noise:.45}},
{id:'carbine',type:'weapon',name:'Patrol carbine',cost:320,desc:'30 damage · 16 rounds · rapid fire, longer reach',values:{damage:30,mag:16,rate:.38,reach:310,reloadTime:1.7,noise:1.15}},
{id:'clothes',type:'armor',name:'Everyday clothes',cost:0,desc:'No protection · no movement penalty',protection:0,speed:1},
{id:'scout',type:'armor',name:'Scout vest',cost:120,desc:'10% damage resistance · 4% faster movement',protection:.1,speed:1.04},
{id:'riot',type:'armor',name:'Riot armor',cost:280,desc:'25% damage resistance · 10% slower movement',protection:.25,speed:.9}
];

let meta={scrap:0,owned:['pistol','clothes'],weapon:'pistol',armor:'clothes',settled:{}};
try{let saved=JSON.parse(localStorage.getItem('dead-end-locker-v1'));if(saved&&Number.isFinite(saved.scrap)&&saved.scrap>=0&&Array.isArray(saved.owned)){meta={...meta,...saved};meta.settled=meta.settled||{};for(const type of ['weapon','armor'])if(!equipment.some(g=>g.id===meta[type]&&g.type===type&&meta.owned.includes(g.id)))meta[type]=type==='weapon'?'pistol':'clothes'}}catch(e){}

function newRunId(){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}

function saveMeta(){try{localStorage.setItem('dead-end-locker-v1',JSON.stringify(meta));return true}catch(e){return false}}

function bankRun(p){if(!p||!p.runId||p.banked||meta.settled[p.runId])return;meta.scrap+=Math.max(0,Math.floor(p.runScrap||0));meta.settled[p.runId]=true;p.banked=true;saveMeta()}

function endRunToMenu(){bankRun(player);if(isSurvival()){try{localStorage.removeItem('dead-end-survival-v1')}catch(e){}}mode='title';title()}

function gearName(id){return equipment.find(g=>g.id===id)?.name||'Starter gear'}

function applyLoadout(){let weapon=equipment.find(g=>g.id===meta.weapon),armor=equipment.find(g=>g.id===meta.armor);Object.assign(player,weapon.values);player.ammo=player.mag;player.weaponName=weapon.name;player.weaponId=weapon.id;player.armorId=armor.id;player.gearArmor=armor.protection;player.speed*=armor.speed}

function buyEquip(id){if(mode!=='locker')return;let g=equipment.find(g=>g.id===id);if(!g)return;if(!meta.owned.includes(id)){if(meta.scrap<g.cost)return;meta.scrap-=g.cost;meta.owned.push(id)}meta[g.type]=id;saveMeta();lockerMenu()}

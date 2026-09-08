'use strict';
// Progression. Shared classic-script bindings; startup runs last in main.js.
const upgrades=[{id:'power',name:'Stopping power',desc:'+25% pistol damage',apply:()=>player.damage*=1.25},{id:'quick',name:'Quick hands',desc:'Fire 15% faster; reload 15% faster',apply:()=>{player.rate*=.85;player.reloadTime*=.85}},{id:'bat',name:'Heavy hitter',desc:'+35% melee damage',apply:()=>player.melee*=1.35},{id:'speed',name:'Light feet',desc:'+12% movement speed',apply:()=>player.speed*=1.12},{id:'health',name:'Second wind',desc:'+25 maximum health; heal 40',apply:()=>{player.max+=25;player.hp=Math.min(player.max,player.hp+40)}},{id:'mag',name:'Extended magazine',desc:'+4 magazine capacity; refill pistol',apply:()=>{player.mag+=4;player.ammo=player.mag}},{id:'range',name:'Eagle eye',desc:'+20% firing range; +30 pickup radius',apply:()=>{player.reach*=1.2;player.magnet+=30}}];
upgrades.push({id:'profile',name:'Low profile',desc:'15% smaller zombie sight range (stacks)',apply:()=>player.visibility*=.85},{id:'quiet',name:'Quiet weapon',desc:'Gunshots carry 25% less distance',apply:()=>player.noise*=.75},{id:'stalker',name:'Stalker',desc:'Move faster while sneaking (+10 percentage points, max 90%)',apply:()=>player.sneakSpeed=Math.min(.9,player.sneakSpeed+.1)});

const talents=[{id:'ghost',name:'TALENT · Ghost',desc:'Zombies give up searching 50% sooner',apply:()=>player.forget=.5},{id:'ambush',name:'TALENT · Ambush',desc:'Double melee damage against zombies that haven’t spotted you',apply:()=>player.ambush=2},{id:'regen',name:'TALENT · Recovery',desc:'Regenerate 1 health per second',apply:()=>player.regen=1},{id:'armor',name:'TALENT · Tough skin',desc:'Take 30% less damage',apply:()=>player.armor=.3},{id:'cleave',name:'TALENT · Cleave',desc:'Melee hits every zombie within reach',apply:()=>{}},{id:'vamp',name:'TALENT · Blood rush',desc:'Each kill restores 1 health',apply:()=>{}}];

function gain(xp){if(isSurvival()){player.xp+=xp;let leveled=false;while(player.xp>=player.next){player.xp-=player.next;player.next+=16;player.level++;player.statPoints+=2;player.skillPoints++;leveled=true}if(leveled){toast('Level '+player.level+' · +2 stat points · +1 skill point',4);saveRun()}return}player.xp+=xp;while(player.xp>=player.next){player.xp-=player.next;player.next=Math.round(player.next*1.28);pending++}if(pending&&mode==='play'){player.level++;levelMenu()}}

const statDefs=[['strength','Strength','+4 melee damage; +1.2% melee hit chance',()=>player.melee+=4],['agility','Agility','+5% movement speed; +1.5% melee hit chance',()=>player.speed*=1.05],['endurance','Endurance','+15 health capacity, +10 stamina capacity',()=>{player.max+=15;player.hp+=15;player.maxStamina+=10;player.stamina+=10}],['perception','Perception','+15% firing range, +15 pickup range; +2% shot hit chance',()=>{player.reach*=1.15;player.magnet+=15}]];

const skillTree=[
{id:'aim',branch:'FIREARMS',name:'Sight picture',req:null},
{id:'reload',branch:'FIREARMS',name:'Magazine drills',req:'aim'},
{id:'deadeye',branch:'FIREARMS',name:'Deadeye',req:'reload'},
{id:'brawler',branch:'MELEE',name:'Close quarters',req:null},
{id:'stamina',branch:'MELEE',name:'Combat conditioning',req:'brawler'},
{id:'cleave',branch:'MELEE',name:'Sweeping strikes',req:'stamina'},
{id:'awareness',branch:'STEALTH',name:'Threat awareness',req:null},
{id:'conceal',branch:'STEALTH',name:'Low profile',req:'awareness'},
{id:'ghost',branch:'STEALTH',name:'Ghost',req:'conceal'},
{id:'scavenger',branch:'SURVIVAL',name:'Efficient scavenging',req:null},
{id:'rationing',branch:'SURVIVAL',name:'Ration management',req:'scavenger'},
{id:'fieldcraft',branch:'SURVIVAL',name:'Field medicine',req:'rationing'}
];

function spendStat(id){let def=statDefs.find(s=>s[0]===id);if(!isSurvival()||mode!=='character'||!def||player.statPoints<1||player.stats[id]>=10)return;player.statPoints--;player.stats[id]++;def[3]();rebuildSkills();saveRun();characterMenu()}

const rankEffects={
aim:['+4% shot hit chance','+8% shot hit chance','+12% shot hit chance'],
reload:['15% faster reload','30% faster reload','45% faster reload'],
deadeye:['+20% gun damage; +3% stationary accuracy','+40% gun damage; +6% stationary accuracy','+60% gun damage; +9% stationary accuracy'],
brawler:['+20% melee damage; +3% melee accuracy','+40% melee damage; +6% melee accuracy','+60% melee damage; +9% melee accuracy'],
stamina:['+20 stamina capacity; +20% recovery','+40 stamina capacity; +40% recovery','+60 stamina capacity; +60% recovery'],
cleave:['Melee hits up to 2 nearby targets','Melee hits up to 3 nearby targets','Melee hits up to 4 nearby targets'],
awareness:['Reveal sight cones and alert icons within 150 units','Reveal sight cones and alert icons within 250 units','Reveal sight cones and alert icons within 350 units'],
conceal:['15% less visible; sneak at 64% speed','30% less visible; sneak at 72% speed','45% less visible; sneak at 80% speed'],
ghost:['20% quieter shots; 20% shorter searches; 1.5× ambush','40% quieter shots; 40% shorter searches; 2× ambush','60% quieter shots; 60% shorter searches; 2.5× ambush'],
scavenger:['Collect in 3.5s; +6 rounds per crate','Collect in 3s; +12 rounds per crate','Collect in 2.5s; +18 rounds per crate'],
rationing:['15% slower food and water drain','30% slower food and water drain','45% slower food and water drain'],
fieldcraft:['Medkits heal 55; 5% damage resistance','Medkits heal 65; 10% damage resistance','Medkits heal 75; 15% damage resistance']};

function skillRank(id){return Number(player.skills?.[id])||0}

function rebuildSkills(){let st=player.stats||{strength:1,agility:1,endurance:1,perception:1},gun=equipment.find(g=>g.id===(player.weaponId||'pistol')).values,armor=equipment.find(g=>g.id===(player.armorId||'clothes'));let oldMax=player.max,oldStamina=player.maxStamina;
player.max=100+15*(st.endurance-1);player.maxStamina=100+10*(st.endurance-1)+20*skillRank('stamina');player.hp=clamp(player.hp+Math.max(0,player.max-oldMax),0,player.max);player.stamina=clamp(player.stamina+Math.max(0,player.maxStamina-oldStamina),0,player.maxStamina);
player.damage=gun.damage*(1+.2*skillRank('deadeye'));player.melee=(27+4*(st.strength-1))*(1+.2*skillRank('brawler'));player.speed=128*armor.speed*Math.pow(1.05,st.agility-1);player.reach=gun.reach*Math.pow(1.15,st.perception-1);player.magnet=65+15*(st.perception-1);player.rate=gun.rate;player.reloadTime=gun.reloadTime*(1-.15*skillRank('reload'));player.visibility=1-.15*skillRank('conceal');player.sneakSpeed=.56+.08*skillRank('conceal');player.noise=gun.noise*(1-.2*skillRank('ghost'));player.forget=1-.2*skillRank('ghost');player.ambush=1+.5*skillRank('ghost');player.staminaRegen=8*(1+.2*skillRank('stamina'));player.needRate=1-.15*skillRank('rationing');player.lootBonus=6*skillRank('scavenger');player.collectTime=4-.5*skillRank('scavenger');player.medHeal=45+10*skillRank('fieldcraft');player.armor=.05*skillRank('fieldcraft');player.gearArmor=armor.protection;player.regen=0;player.talents={};}

function applySkillRank(){rebuildSkills()}

function learnSkill(id){let sk=skillTree.find(s=>s.id===id);if(!isSurvival()||mode!=='character'||!sk||player.skillPoints<1||skillRank(id)>=3||(sk.req&&skillRank(sk.req)<1))return;let rank=skillRank(id)+1;player.skillPoints--;player.skills[id]=rank;applySkillRank(sk,rank);saveRun();characterMenu()}

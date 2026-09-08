'use strict';
// Combat. Shared classic-script bindings; startup runs last in main.js.
function hurt(z,d){if(z.hp<=0)return;z.hp-=d;z.hit=.15;effects.push({type:'text',x:z.x,y:z.y-20,text:Math.round(d),life:.55});if(z.hp<=0){kills++;player.runScrap=(player.runScrap||0)+2;drops.push({x:z.x,y:z.y,type:rand()<.06?'med':'xp'});if(player.talents.vamp)player.hp=Math.min(player.max,player.hp+1);effects.push({type:'blood',x:z.x,y:z.y,life:5})}}

function dodge(){if(mode!=='play'||player.stamina<30||player.dodgeCooldown>0)return;player.stamina-=30;player.dodgeCooldown=4;player.dodgeTime=.2;player.dodgeAngle=player.moveAngle;toast('Dodge · 30 stamina',1)}
$('#dodge').onclick=dodge;

function receiveDamage(amount){player.collectProgress=0;player.collectLock=.8;let actual=amount*(1-player.armor)*(1-(player.gearArmor||0));player.hp=Math.max(0,player.hp-actual);player.lastDamage=actual;player.damageFlash=.55}

function hitChance(target,melee){let distance=dist(player,target),moving=player.dodgeTime>0||Math.hypot(player.x-player.prevVisualX,player.y-player.prevVisualY)>.04;let stats=player.stats||{strength:1,agility:1,perception:1};if(melee)return clamp(.94-.20*distance/53+.012*(stats.strength-1)+.015*(stats.agility-1)+.03*skillRank('brawler')+(player.sneaking?.08:0)-(moving?.08:0)-(player.stamina<25?.18:0),.2,.98);return clamp(.90-.35*distance/player.reach+.02*(stats.perception-1)+.04*skillRank('aim')+(moving?0:.03*skillRank('deadeye'))-(moving?.20:0)+.08*(player.aim||0)/1.5,.12,.98)}

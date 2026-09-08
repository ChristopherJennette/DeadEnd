'use strict';
// Zombies. Shared classic-script bindings; startup runs last in main.js.
const zombieRoutes = new WeakMap();

function zombieWaypoint(z, dt) {
  const target = {x: z.lastX, y: z.lastY};
  if (clearPath(z, target, 13)) { zombieRoutes.delete(z); return target; }
  let route = zombieRoutes.get(z);
  if (!route || route.revision !== doorRevision || route.remaining <= 0 || dist(route.target, target) > 36) {
    route = {points: interiorRoute(z, target), target, remaining: 1, revision: doorRevision};
    zombieRoutes.set(z, route);
  }
  route.remaining -= dt;
  while (route.points.length && dist(z, route.points[0]) < 6) route.points.shift();
  return route.points[0] || target;
}

function zombie(x,y){if(!buildingAt({x,y})&&!blocked(x,y,13))zombies.push({id:uid++,x,y,hp:105+Math.min(t*.035,50),max:105+Math.min(t*.035,50),speed:range(36,48)+Math.min(t/35,isSurvival()?12:18),phase:range(0,7),heading:range(0,Math.PI*2),state:'roam',suspicion:0,memory:0,lastX:x,lastY:y,roamTime:range(1,4),hit:0})}

function sightRange(){return 205*player.visibility*(player.sneaking?.55:1)}

function seesPlayer(z){let d=dist(z,player);if(d>sightRange()||!los(z,player))return false;let a=Math.atan2(player.y-z.y,player.x-z.x);return d<Math.min(38,sightRange())||Math.cos(a-z.heading)>Math.cos(Math.PI*.39)}

function makeNoise(x,y,radius){for(const z of zombies){if(z.hp<=0||z.state==='chase'||Math.hypot(z.x-x,z.y-y)>radius)continue;z.state='investigate';z.lastX=x;z.lastY=y;z.memory=5*player.forget}}

function zombieBrain(z,dt){let seen=seesPlayer(z);if(seen){z.suspicion=Math.min(1,z.suspicion+dt*(dist(z,player)<45?5:1.3));if(z.suspicion>=1){z.state='chase';z.lastX=player.x;z.lastY=player.y;z.memory=5*player.forget}}else z.suspicion=Math.max(0,z.suspicion-dt*.55);
if(z.state==='chase'&&!seen)z.state='search';
if(z.state!=='roam'){if(!(seen&&z.state==='chase'))z.memory-=dt;if(z.memory<=0){z.state='roam';z.suspicion=0;z.roamTime=0}}
let speed=z.state==='chase'?z.speed:z.state==='roam'?9:z.speed*.72;
if(z.state==='roam'){z.roamTime-=dt;if(z.roamTime<=0){z.heading+=range(-1.8,1.8);z.roamTime=range(1.5,4)}}else{let targetDistance=Math.hypot(z.lastX-z.x,z.lastY-z.y);if(targetDistance>14){let goal=zombieWaypoint(z,dt);z.heading=Math.atan2(goal.y-z.y,goal.x-z.x);}else{z.heading+=dt*1.25;speed=0}}
let ox=z.x,oy=z.y;move(z,Math.cos(z.heading)*speed*dt,Math.sin(z.heading)*speed*dt,12);if(speed>0&&Math.hypot(z.x-ox,z.y-oy)<speed*dt*.25){let side=z.id%2?1:-1;z.heading+=side*dt*3;move(z,Math.cos(z.heading+side)*speed*dt,Math.sin(z.heading+side)*speed*dt,12);if(z.state==='roam')z.roamTime=0}}

function separateZombies(dt){for(let i=0;i<zombies.length;i++){let a=zombies[i];if(a.hp<=0)continue;for(let j=i+1;j<zombies.length;j++){let b=zombies[j];if(b.hp<=0)continue;let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2>=22*22)continue;let d=Math.sqrt(d2);if(d<.001){dx=Math.cos(a.id*2.4)*.01;dy=Math.sin(a.id*2.4)*.01;d=.01}let force=Math.min((22-d)*.5,dt*65);move(a,-dx/d*force,-dy/d*force,12);move(b,dx/d*force,dy/d*force,12)}}}

function canReadZombie(z){let rank=skillRank('awareness');return rank>0&&dist(z,player)<50+100*rank}

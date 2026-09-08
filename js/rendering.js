'use strict';
// Rendering. Shared classic-script bindings; startup runs last in main.js.
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}

const spriteAtlas=new Image();spriteAtlas.src='./assets/sprites/sprite-atlas.png';

function person(e,isPlayer){ctx.save();ctx.translate(e.x,e.y);ctx.transform(1/(2*ISOX),-1/(2*ISOX),1/(2*ISOY),1/(2*ISOY),0,0);let angle=isPlayer?player.angle:e.heading,f=project(Math.cos(angle),Math.sin(angle));let moving=e.visualMoving||false,frame=moving?Math.floor((e.animTime||0)*(isPlayer?(player.sneaking?6:10):7))%4:0,row=(isPlayer?0:2)+(f.y<0?1:0);ctx.fillStyle='#08121280';ctx.beginPath();ctx.ellipse(0,1,isPlayer?11:10,5,0,0,Math.PI*2);ctx.fill();if(isPlayer){ctx.strokeStyle=player.sneaking?'#8cc0b18a':'#d9c79f99';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,1,13,6,0,0,Math.PI*2);ctx.stroke()}
ctx.save();if(f.x<0)ctx.scale(-1,1);let recoil=isPlayer&&effects.some(e=>e.type==='shot'&&e.life>.04)?-2:0;ctx.translate(recoil,player.dodgeTime>0&&isPlayer?-4:0);if(isPlayer&&player.sneaking){ctx.translate(0,2);ctx.scale(1,.88)}if(spriteAtlas.complete&&spriteAtlas.naturalWidth){let cw=spriteAtlas.naturalWidth/4,ch=spriteAtlas.naturalHeight/4;ctx.imageSmoothingEnabled=true;ctx.drawImage(spriteAtlas,frame*cw,row*ch,cw,ch,-31,-57,62,62)}else{rect(-6,-24,12,22,isPlayer?'#83a29b':'#8a8768');circle(0,-29,6,'#c1b090')}
if((isPlayer&&player.inv>0&&!player.dodgeTime)||(!isPlayer&&e.hit>0)){ctx.globalAlpha=.4;ctx.fillStyle='#efc59b';ctx.beginPath();ctx.ellipse(0,-25,10,22,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}ctx.restore();if(!isPlayer&&canReadZombie(e)&&(e.state!=='roam'||e.suspicion>.05)){ctx.fillStyle=e.state==='chase'?'#f2a280':'#e0d28d';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(e.state==='chase'?'!':'?',0,-59)}if(!isPlayer&&e.hp<e.max){rect(-12,-54,24,3,'#162021');rect(-12,-54,24*Math.max(0,e.hp)/e.max,3,'#cf8d69')}ctx.restore()}

function poly(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();ctx.fill()}

function playerOverlapsPolygon(points) {
  // Conservative screen-space bounds include the complete animated sprite, not just its feet.
  const p = project(player.x, player.y);
  const xs = points.map(q => q[0]), ys = points.map(q => q[1]);
  return Math.max(...xs) >= p.x - 34 && Math.min(...xs) <= p.x + 34 &&
    Math.max(...ys) >= p.y - 65 && Math.min(...ys) <= p.y + 9;
}

function raisedCorners(box, height) {
  return [[box.x, box.y], [box.x + box.w, box.y],
    [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]].map(([x, y]) => {
      const p = project(x, y);
      return [p.x, p.y - height];
    });
}

function drawWall(box, color = '#786c56') {
  const feet = raisedCorners(box, 0), top = raisedCorners(box, box.height);
  ctx.save();
  ctx.transform(1 / (2 * ISOX), -1 / (2 * ISOX), 1 / (2 * ISOY), 1 / (2 * ISOY), 0, 0);
  if (playerOverlapsPolygon([...feet, ...top])) ctx.globalAlpha = .18;
  poly([feet[1], feet[2], top[2], top[1]], '#46534b');
  poly([feet[2], feet[3], top[3], top[2]], color);
  poly([feet[0], feet[1], top[1], top[0]], color);
  poly([feet[3], feet[0], top[0], top[3]], '#46534b');
  poly(top, '#a39e83');
  ctx.restore();
}

function drawDoor(door) {
  const state = doorState(door);
  if (state !== 'open') {
    drawWall(door, state === 'locked' ? '#80513e' : '#8f7652');
  } else {
    // Fold the leaf against the jamb, never visually across the walkable opening.
    drawWall({...door, x: door.x - 5, w: 5}, '#8f7652');
  }
  const center = doorCenter(door), p = project(center.x, center.y);
  ctx.save();
  ctx.transform(1 / (2 * ISOX), -1 / (2 * ISOX), 1 / (2 * ISOY), 1 / (2 * ISOY), 0, 0);
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillStyle = state === 'locked' ? '#ffc098' : state === 'open' ? '#c0dfae' : '#edd4a4';
  if (dist(player, center) < 95 && canReachDoor(door)) {
    ctx.fillText(doorAction?.door === door ? 'OPENING…' : state.toUpperCase(), p.x, p.y - 12);
  }
  ctx.restore();
}

function drawInteriorFloors() {
  for (const b of buildings) {
    const layout = interiorLayouts.get(b);
    if (!layout) continue;
    const center = project(b.x + b.w / 2, b.y + b.h / 2);
    if (Math.abs(center.x - camera.x - W / 2) > W / 2 + 350 ||
        Math.abs(center.y - camera.y - H / 2) > H / 2 + 300) continue;
    rect(b.x, b.y, b.w, b.h, '#817761');
    layout.rooms.forEach((room, i) => {
      rect(room.x, room.y, room.w, room.h, i ? '#716c59' : '#5b6560');
      for (let x = room.x; x < room.x + room.w; x += 26)
        rect(x, room.y, 1, room.h, '#202e2b33');
      for (let y = room.y; y < room.y + room.h; y += 26)
        rect(room.x, y, room.w, 1, '#202e2b33');
      if (buildingAt(player) === b) {
        const p = project(room.x + room.w / 2, room.y + room.h / 2);
        ctx.save();
        ctx.transform(1 / (2 * ISOX), -1 / (2 * ISOX), 1 / (2 * ISOY), 1 / (2 * ISOY), 0, 0);
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e6ddbb88';
        ctx.fillText(room.label, p.x, p.y);
        ctx.restore();
      }
    });
    for (const door of layout.doors)
      rect(door.x, door.y, door.w, door.h, doorState(door) === 'open' ? '#b5aa85' : '#62523d');
  }
}

function building(b) {
  const center = project(b.x + b.w / 2, b.y + b.h / 2);
  if (Math.abs(center.x - camera.x - W / 2) > W / 2 + 350 ||
      Math.abs(center.y - camera.y - H / 2) > H / 2 + 300) return;
  const layout = interiorLayouts.get(b);
  if (!layout) return;
  const pieces = [...layout.walls.map(w => ({box: w, door: false})),
    ...layout.doors.map(d => ({box: d, door: true}))];
  pieces.sort((a, c) => a.box.x + a.box.y + a.box.w + a.box.h -
    c.box.x - c.box.y - c.box.w - c.box.h);
  for (const piece of pieces) {
    if (piece.door) drawDoor(piece.box);
    else drawWall(piece.box);
  }
  // The occupied building is a full roof cutaway. Outside, fade any overlapping roof.
  if (buildingAt(player) === b) return;
  const height = b.name === 'WAREHOUSE' ? 52 : 40, roof = raisedCorners(b, height);
  ctx.save();
  ctx.transform(1 / (2 * ISOX), -1 / (2 * ISOX), 1 / (2 * ISOY), 1 / (2 * ISOY), 0, 0);
  if (playerOverlapsPolygon(roof)) ctx.globalAlpha = .12;
  poly(roof, '#616e62');
  ctx.strokeStyle = '#bec1a577';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(...roof[0]);
  for (let i = 1; i <= 4; i++) ctx.lineTo(...roof[i % 4]);
  ctx.stroke();
  const [p0, p1, , p3] = roof;
  for (let k = .15; k < 1; k += .13) {
    ctx.strokeStyle = '#24392d44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p0[0] + (p3[0] - p0[0]) * k, p0[1] + (p3[1] - p0[1]) * k);
    ctx.lineTo(p1[0] + (p3[0] - p0[0]) * k, p1[1] + (p3[1] - p0[1]) * k);
    ctx.stroke();
  }
  rect(center.x - 20, center.y - height - 20, 32, 20, '#899481');
  for (let k = 0; k < 4; k++) rect(center.x - 16, center.y - height - 16 + k * 4, 24, 2, '#415548');
  ctx.fillStyle = '#ecdfba';
  ctx.font = 'bold 9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(b.name, center.x, center.y - height + 17);
  ctx.restore();
}

function drawPlayerVisible() {
  // Intentional foreground pass: no roof, wall, tree or other world actor can hide the player.
  ctx.save();
  ctx.globalAlpha = 1;
  person(player, true);
  ctx.restore();
}

function updateDoorUI() {
  const button = $('#door'), door = mode === 'play' && player ? nearestDoor() : null;
  button.hidden = !door;
  if (!door) return;
  button.textContent = doorAction?.door === door ?
    'OPENING · ' + Math.max(0, doorAction.remaining).toFixed(1) + 's' :
    doorState(door) === 'open' ? 'CLOSE DOOR · E' :
    doorState(door) === 'locked' ? 'LOCKED · E' : 'OPEN DOOR · 1s';
}

function scenery(){for(let i=0;i<1800;i++){let x=(i*197.33)%WORLD,y=(i*379.17)%WORLD,p=project(x,y);if(p.x<camera.x-50||p.x>camera.x+W+50||p.y<camera.y-50||p.y>camera.y+H+50)continue;let road=Math.min(x%640,640-x%640)<53||Math.min(y%640,640-y%640)<53;rect(x,y,road?5:3,road?2:6,road?(i%3?'#b4b5a21a':'#121f2338'):(i%2?'#66806b44':'#162c2644'))}for(let x=0;x<=WORLD;x+=640)for(let y=0;y<=WORLD;y+=640){for(let k=-36;k<=36;k+=12){rect(x+k,y+76,7,23,'#c8c9ad66');rect(x+76,y+k,23,7,'#c8c9ad66')}ctx.strokeStyle='#17272677';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+20,y+130);ctx.lineTo(x+8,y+166);ctx.lineTo(x+24,y+180);ctx.lineTo(x+15,y+201);ctx.stroke()}}

function tree(tr){circle(tr.x+7,tr.y+9,tr.r+5,'#0a211b4d');rect(tr.x-2,tr.y-2,5,10,'#65593f');circle(tr.x-8,tr.y-8,tr.r,'#29473b');circle(tr.x-14,tr.y-14,tr.r*.8,'#3c5b47');circle(tr.x-18,tr.y-18,tr.r*.55,'#657754');for(let i=0;i<5;i++)circle(tr.x-16+i*4,tr.y-20+Math.sin(i*5)*8,3,'#7c8e5b44')}

function draw(){updateDoorUI();if(player){$('#damageFlash').style.opacity=String(mode==='title'?0:Math.min(1,player.damageFlash*2.5));$('#hitText').textContent='−'+Math.ceil(player.lastDamage);$('#hitText').style.opacity=String(mode==='title'?0:Math.min(1,player.damageFlash*2));let low=player.hp>0&&player.hp/player.max<=.25&&mode!=='title';$('#danger').textContent=low?'LOW HEALTH · FIND MEDICINE':'';$('#danger').style.top=isSurvival()?'143px':'126px';$('#vignette').style.boxShadow=low?'inset 0 0 70px #b32c2877':'inset 0 0 75px #0005';$('#dodge').textContent=player.dodgeCooldown>0?'DODGE · '+player.dodgeCooldown.toFixed(1)+'s':'DODGE';$('#dodge').disabled=mode!=='play'||player.dodgeCooldown>0||player.stamina<30;$('#dodgeMeter').textContent='SCRAP '+(player.runScrap||0)+' · STAMINA '+Math.floor(player.stamina)+'/'+player.maxStamina;}ctx.clearRect(0,0,W,H);if(!player)return;let pp=project(player.x,player.y);camera.x=pp.x-W/2;camera.y=pp.y-H*.48;ctx.save();ctx.translate(-camera.x,-camera.y);ctx.transform(ISOX,ISOY,-ISOX,ISOY,0,0);rect(0,0,WORLD,WORLD,'#344d40');for(let yy=0;yy<4;yy++)for(let xx=0;xx<4;xx++){let name=district(xx*1280,yy*1280);rect(xx*1280,yy*1280,1280,1280,/FARM/.test(name)?'#5d6047':/INDUSTRIAL|WAREHOUSE|RAIL/.test(name)?'#59615a':/PARK|WOODS|FOREST/.test(name)?'#294936':'#3a5145')} for(let k=0;k<=8;k++){let n=k*640;rect(n-66,0,132,WORLD,'#778276');rect(0,n-66,WORLD,132,'#778276');rect(n-53,0,106,WORLD,'#354246');rect(0,n-53,WORLD,106,'#354246');for(let q=80;q<WORLD;q+=64){rect(n-1,q,2,25,'#a3a38955');rect(q,n-1,25,2,'#a3a38955')}}for(const e of effects)if(e.type==='blood')circle(e.x,e.y,15,'#533d30');for(const c of cars){rect(c.x+5,c.y+7,55,26,'#0004');rect(c.x,c.y,55,25,c.color);rect(c.x+12,c.y+3,26,19,'#3a4948');rect(c.x+48,c.y+3,3,5,'#cbbf8c');rect(c.x+48,c.y+18,3,5,'#cbbf8c')}
scenery();drawInteriorFloors();
for(const r of routes){circle(r.x,r.y,42,r.id===player.track?'#80c8cf44':'#8faeae22');ctx.fillStyle='#d0dfc6';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(r.id.toUpperCase(),r.x,r.y-48)}for(const c of caches){if(c.taken){rect(c.x-12,c.y-9,24,18,'#555744');continue}circle(c.x,c.y,24+Math.sin(t*3)*3,'#e6c46a22');rect(c.x-13,c.y-11,26,22,'#d8b865');rect(c.x-9,c.y-7,18,14,'#7a683b');rect(c.x-2,c.y-11,4,22,'#e4cf8a');ctx.fillStyle='#eedda1';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText(player.collectIndex===caches.indexOf(c)?player.collectMessage:'SUPPLIES',c.x,c.y-24);if(player.collectIndex===caches.indexOf(c)){rect(c.x-23,c.y+18,46,4,'#142824');rect(c.x-23,c.y+18,46*Math.min(1,(player.collectProgress||0)/(player.collectTime||4)),4,'#e5c98b')}}
if(false){circle(640,640,40+Math.sin(t*4)*4,'#8cdae455');circle(640,640,27,'#81d6df');ctx.fillStyle='#142d30';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText('EXIT',640,644)}
for(const d of drops){if(d.type==='xp'){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(Math.PI/4);rect(-4,-4,8,8,'#c5e58e');ctx.restore()}else{rect(d.x-6,d.y-6,12,12,'#e5debf');rect(d.x-4,d.y-1,8,2,'#af5845');rect(d.x-1,d.y-4,2,8,'#af5845')}}
for(const z of zombies){if(!canReadZombie(z))continue;ctx.beginPath();ctx.moveTo(z.x,z.y);ctx.arc(z.x,z.y,sightRange(),z.heading-Math.PI*.39,z.heading+Math.PI*.39);ctx.closePath();ctx.fillStyle=z.state==='chase'?'#dc8d6710':'#d9d99e0a';ctx.fill();ctx.strokeStyle=z.state==='chase'?'#dc8d6733':'#d9d99e22';ctx.lineWidth=1;ctx.stroke()}
const actors=zombies.filter(z=>{let p=project(z.x,z.y);return p.x>camera.x-30&&p.x<camera.x+W+30&&p.y>camera.y-30&&p.y<camera.y+H+60}).sort((a,b)=>(a.x+a.y)-(b.x+b.y));let scene=actors.map(a=>({depth:a.x+a.y,paint:()=>person(a,a===player)})).concat(buildings.map(b=>({depth:b.x+b.y+b.w+b.h-25,paint:()=>building(b)})),trees.map(tr=>({depth:tr.x+tr.y,paint:()=>tree(tr)})));scene.sort((a,b)=>a.depth-b.depth);for(const item of scene)item.paint();
for(const e of effects){if(e.type==='shot'){ctx.strokeStyle='#f5e7af';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);ctx.stroke();circle(e.x+Math.cos(player.angle)*23,e.y+Math.sin(player.angle)*23,5,'#f9d781')}if(e.type==='swing'){ctx.strokeStyle='#e8e6c9aa';ctx.lineWidth=5;ctx.beginPath();ctx.arc(e.x,e.y,43,e.angle-1.2,e.angle+1.2);ctx.stroke()}if(e.type==='text'){ctx.fillStyle='#f3e8c6';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(e.text,e.x,e.y-(.6-e.life)*28)}}drawPlayerVisible();ctx.restore();
ctx.save();let atmosphere=ctx.createLinearGradient(0,0,W,H);atmosphere.addColorStop(0,'#91b3a409');atmosphere.addColorStop(1,'#06182326');ctx.fillStyle=atmosphere;ctx.fillRect(0,0,W,H);for(let i=0;i<14;i++){let px=(i*83+t*5)%W,py=(i*137-t*7+H*100)%H;circle(px,py,1,'#d2d6bb22')}ctx.restore();
let goal=player.track?routes.find(r=>r.id===player.track):caches.filter(c=>!c.taken).sort((a,b)=>dist(a,player)-dist(b,player))[0];if(goal){let gp=project(goal.x,goal.y),gx=gp.x-camera.x,gy=gp.y-camera.y;if(gx<30||gx>W-30||gy<160||gy>H-160){let pp=project(player.x,player.y),px=pp.x-camera.x,py=pp.y-camera.y,a=Math.atan2(gy-py,gx-px);let factor=Math.min((W/2-30)/Math.max(.01,Math.abs(Math.cos(a))),(H/2-160)/Math.max(.01,Math.abs(Math.sin(a))));let ax=clamp(px+Math.cos(a)*factor,28,W-28),ay=clamp(py+Math.sin(a)*factor,165,H-165);ctx.save();ctx.translate(ax,ay);ctx.rotate(a);ctx.fillStyle=ready()?'#8cdde5':'#e5c77e';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-7,-7);ctx.lineTo(-3,0);ctx.lineTo(-7,7);ctx.fill();ctx.restore();ctx.textAlign='center';ctx.font='10px system-ui';ctx.fillStyle='#eee2b8';ctx.fillText(Math.round(dist(goal,player)/10)+'m',ax,ay+21)}}
// Compact town map, with supply locations and player position.
let mx=W-83,my=isSurvival()?190:162,ms=66;rect(mx-4,my-4,ms+8,ms+8,'#101c1ac9');for(let i=0;i<=8;i++){rect(mx+i*ms/8-1,my,2,ms,'#57665a');rect(mx,my+i*ms/8-1,ms,2,'#57665a')}for(const c of caches)if(!c.taken)circle(mx+c.x/WORLD*ms,my+c.y/WORLD*ms,2.4,'#ebca7b');for(const r of routes)circle(mx+r.x/WORLD*ms,my+r.y/WORLD*ms,3,r.id===player.track?'#81d6df':'#a5b2b8');circle(mx+player.x/WORLD*ms,my+player.y/WORLD*ms,3,'#e5f4da');
$('#health').textContent=Math.ceil(player.hp)+' / '+player.max;$('#hp').style.width=player.hp/player.max*100+'%';$('#xp i').style.width=player.xp/player.next*100+'%';$('#level').textContent='LEVEL '+player.level+' · '+kills+' KILLS';$('#clock').textContent=time(t);$('#objective').textContent=ready()?'SUPPLIES SECURED · Return to evacuation':'Search the town · '+collected+' / '+(isSurvival()?'∞':5)+' supplies';if(isSurvival()){$('#objective').textContent=ready()?'OBJECTIVE READY · Reach marked site':district(player.x,player.y)+' · '+player.parts+' radio parts';$('#clock').textContent='DAY '+Math.min(4,1+Math.floor(t/DAY))+' · '+time(t%DAY);$('#needs').textContent='FOOD '+Math.ceil(player.food)+' · WATER '+Math.ceil(player.water)+' · STAMINA '+Math.ceil(player.stamina)+'/'+player.maxStamina;$('#character').textContent='CHARACTER'+(player.statPoints+player.skillPoints?' +'+(player.statPoints+player.skillPoints):'')}if(player.mission){let r=routes.find(r=>r.id===player.mission.id);$('#objective').textContent=r.name+' · '+Math.floor(player.mission.progress)+'/'+r.duration+'s'}$('#ammo').textContent=player.reload>0?'RELOADING…':(player.weaponName||'PISTOL').toUpperCase()+' · '+player.ammo+' / '+player.mag;$('#weapon').textContent=player.sneaking?'SNEAKING · AUTO MELEE ONLY':(isSurvival()?'AUTO FIRE · '+player.reserve+' RESERVE':'AUTO FIRE + MELEE · ∞ RESERVE');let aimTarget=zombies.filter(z=>z.hp>0&&dist(z,player)<player.reach&&los(z,player)).sort((a,b)=>dist(a,player)-dist(b,player))[0];if(aimTarget)$('#weapon').textContent+=' · HIT '+Math.round(hitChance(aimTarget,player.sneaking)*100)+'%';let chasers=zombies.filter(z=>z.state==='chase').length,searchers=zombies.filter(z=>z.state==='search'||z.state==='investigate').length,suspicious=zombies.some(z=>z.suspicion>.05);$('#awareness').textContent=chasers?'SPOTTED · '+chasers+' PURSUING':suspicious?'BEING NOTICED':searchers?'UNSEEN · ZOMBIES SEARCHING':'UNSEEN';if(!skillRank('awareness'))$('#awareness').textContent=player.sneaking?'SNEAKING':'AWARENESS LOCKED';$('#awareness').style.color=!skillRank('awareness')?'#bfd49c':chasers?'#f2a280':suspicious?'#e0d28d':'#bfd49c';}

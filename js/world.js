'use strict';
// World. Shared classic-script bindings; startup runs last in main.js.
const WALL_THICKNESS = 8, DOOR_WIDTH = 52, DOOR_OPEN_SECONDS = 1;
let interiorLayouts = new WeakMap(), doorAction = null, doorContact = null;
let doorNoticeTime = 0, doorRevision = 0;

function overlapsBox(x, y, r, box) {
  return x + r > box.x && x - r < box.x + box.w &&
    y + r > box.y && y - r < box.y + box.h;
}

function buildingAt(point) {
  return buildings.find(b => overlapsBox(point.x, point.y, 0, b)) || null;
}

function blocked(x, y, r = 12) {
  if (x < r || y < r || x > WORLD - r || y > WORLD - r) return true;
  for (const b of buildings) {
    if (!overlapsBox(x, y, r, b)) continue;
    const layout = interiorLayouts.get(b);
    // Town generation keeps its original solid footprints and random sequence.
    if (!layout) return true;
    if (layout.walls.some(w => overlapsBox(x, y, r, w)) ||
        layout.doors.some(d => doorState(d) !== 'open' && overlapsBox(x, y, r, d))) return true;
  }
  return false;
}

function move(e, dx, dy, r) {
  // Small swept steps prevent dodges and knockback tunnelling through thin walls.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
  for (let i = 0; i < steps; i++) {
    const nx = e.x + dx / steps, ny = e.y + dy / steps;
    if (!blocked(nx, e.y, r)) e.x = nx;
    else if (e === player) contactDoor(nx, e.y, r);
    if (!blocked(e.x, ny, r)) e.y = ny;
    else if (e === player) contactDoor(e.x, ny, r);
  }
}

function segmentHitsBox(a, b, box, radius = 0) {
  let enter = 0, leave = 1;
  for (const [axis, size] of [['x', 'w'], ['y', 'h']]) {
    const delta = b[axis] - a[axis], low = box[axis] - radius,
      high = box[axis] + box[size] + radius;
    if (Math.abs(delta) < 1e-9) {
      if (a[axis] < low || a[axis] > high) return false;
    } else {
      const t1 = (low - a[axis]) / delta, t2 = (high - a[axis]) / delta;
      enter = Math.max(enter, Math.min(t1, t2));
      leave = Math.min(leave, Math.max(t1, t2));
      if (enter > leave) return false;
    }
  }
  return true;
}

function clearPath(a, b, radius = 0, ignoredDoor = null) {
  for (const building of buildings) {
    if (!segmentHitsBox(a, b, building, radius)) continue;
    const layout = interiorLayouts.get(building);
    if (!layout) return false;
    if (layout.walls.some(w => segmentHitsBox(a, b, w, radius)) ||
        layout.doors.some(d => d !== ignoredDoor && doorState(d) !== 'open' &&
          segmentHitsBox(a, b, d, radius))) return false;
  }
  return true;
}

function los(a, b) { return clearPath(a, b); }

function prepareInteriors() {
  interiorLayouts = new WeakMap();
  doorAction = null;
  doorContact = null;
  doorNoticeTime = 0;
  doorRevision++;
  for (const b of buildings) {
    const w = WALL_THICKNESS, mid = b.x + b.w / 2;
    const partitionY = b.y + Math.round(b.h * .48);
    const isHome = b.name === 'RESIDENCE' || b.name === 'FARMHOUSE';
    const labels = isHome ? ['BEDROOM', 'LIVING ROOM'] :
      b.name === 'CLINIC' ? ['TREATMENT', 'RECEPTION'] :
      b.name === 'WAREHOUSE' ? ['STORAGE', 'LOADING BAY'] : ['STOCKROOM', 'SHOP'];
    const layout = {walls: [], doors: [], rooms: [
      {x: b.x + w, y: b.y + w, w: b.w - w * 2, h: partitionY - b.y - w, label: labels[0]},
      {x: b.x + w, y: partitionY + w, w: b.w - w * 2, h: b.y + b.h - partitionY - w * 2, label: labels[1]}
    ]};
    const addWall = (x, y, width, height, exterior) => layout.walls.push({
      x, y, w: width, h: height, exterior, height: exterior ? (b.name === 'WAREHOUSE' ? 52 : 40) : 32
    });
    addWall(b.x, b.y, w, b.h, true);
    addWall(b.x + b.w - w, b.y, w, b.h, true);
    for (const [id, y, exterior] of [
      ['rear', b.y, true], ['room', partitionY, false], ['front', b.y + b.h - w, true]
    ]) {
      const x = mid - DOOR_WIDTH / 2;
      addWall(b.x + w, y, x - b.x - w, w, exterior);
      addWall(x + DOOR_WIDTH, y, b.x + b.w - w - x - DOOR_WIDTH, w, exterior);
      layout.doors.push({building: b, id, x, y, w: DOOR_WIDTH, h: w,
        exterior, height: exterior ? (b.name === 'WAREHOUSE' ? 52 : 40) : 32});
    }
    // No RNG calls: opening interiors does not shift map, loot, or combat seeds.
    const rearLocked = (Math.floor(b.x / 640) + Math.floor(b.y / 640)) % 3 === 0;
    const defaults = {front: 'closed', room: 'closed', rear: rearLocked ? 'locked' : 'closed'};
    const saved = b.doorStates || {};
    b.doorStates = Object.fromEntries(Object.entries(defaults).map(([id, state]) =>
      [id, ['open', 'closed', 'locked'].includes(saved[id]) ? saved[id] : state]));
    interiorLayouts.set(b, layout);
  }
}

function doorState(door) { return door.building.doorStates[door.id]; }
function doorCenter(door) { return {x: door.x + door.w / 2, y: door.y + door.h / 2}; }

function canReachDoor(door) {
  const center = doorCenter(door);
  return dist(player, center) <= 46 && clearPath(player, center, 0, door);
}

function nearestDoor() {
  let nearest = null, distance = Infinity;
  for (const b of buildings) {
    if (!overlapsBox(player.x, player.y, 55, b)) continue;
    for (const d of interiorLayouts.get(b)?.doors || []) {
      const length = dist(player, doorCenter(d));
      if (length < distance && canReachDoor(d)) { nearest = d; distance = length; }
    }
  }
  return nearest;
}

function requestDoorOpen(door, manual = false) {
  if (mode !== 'play' || !canReachDoor(door)) return;
  if (doorState(door) === 'locked') {
    if (doorNoticeTime <= 0) { toast('Locked', 1.5); doorNoticeTime = 1.5; }
    return;
  }
  if (doorState(door) !== 'closed') return;
  if (doorAction?.door !== door) doorAction = {door, remaining: DOOR_OPEN_SECONDS, manual};
  else if (manual) doorAction.manual = true;
}

function contactDoor(x, y, radius) {
  if (player.dodgeTime > 0) return;
  const door = nearestDoor();
  if (door && doorState(door) !== 'open' && overlapsBox(x, y, radius, door)) {
    doorContact = door;
    requestDoorOpen(door);
  }
}

function interactDoor() {
  if (mode !== 'play') return;
  const door = nearestDoor();
  if (!door) return;
  if (doorState(door) !== 'open') { requestDoorOpen(door, true); return; }
  if ([player, ...zombies.filter(z => z.hp > 0)].some(a => overlapsBox(a.x, a.y, 14, door))) {
    toast('Doorway blocked', 1.5);
    return;
  }
  door.building.doorStates[door.id] = 'closed';
  doorRevision++;
  doorAction = null;
  saveRun();
}

function tickDoors(dt) {
  doorNoticeTime = Math.max(0, doorNoticeTime - dt);
  if (!doorAction) return;
  const {door, manual} = doorAction;
  if (mode !== 'play' || !canReachDoor(door) || player.dodgeTime > 0 ||
      doorState(door) !== 'closed' || (!manual && doorContact !== door)) {
    doorAction = null;
    return;
  }
  doorAction.remaining -= dt;
  if (doorAction.remaining <= 1e-9) {
    door.building.doorStates[door.id] = 'open';
    doorRevision++;
    doorAction = null;
    saveRun();
  }
}

// Doorway waypoints let investigating/pursuing zombies use open entrances and rooms.
// Closed and locked doors are obstacles for zombies; neither can be walked through.
function interiorRoute(start, target) {
  const nearby = buildings.filter(b => interiorLayouts.has(b) &&
    segmentHitsBox(start, target, b, 70)).slice(0, 6);
  if (!nearby.length) return [];
  const nodes = [{x: start.x, y: start.y}, {x: target.x, y: target.y}];
  for (const b of nearby) {
    const margin = 22;
    for (const x of [b.x - margin, b.x + b.w + margin])
      for (const y of [b.y - margin, b.y + b.h + margin]) nodes.push({x, y});
    for (const door of interiorLayouts.get(b).doors) {
      if (doorState(door) !== 'open') continue;
      const center = doorCenter(door);
      nodes.push({x: center.x, y: door.y - margin}, {x: center.x, y: door.y + door.h + margin});
    }
  }
  const cost = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set();
  cost[0] = 0;
  for (let pass = 0; pass < nodes.length; pass++) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++)
      if (!visited.has(i) && Number.isFinite(cost[i]) && (current < 0 || cost[i] < cost[current])) current = i;
    if (current < 0) break;
    if (current === 1) {
      const route = [];
      for (let i = 1; i !== 0; i = previous[i]) route.unshift(nodes[i]);
      return route;
    }
    visited.add(current);
    for (let i = 1; i < nodes.length; i++) {
      if (visited.has(i) || blocked(nodes[i].x, nodes[i].y, 13)) continue;
      const next = cost[current] + dist(nodes[current], nodes[i]);
      if (next < cost[i] && clearPath(nodes[current], nodes[i], 13)) { cost[i] = next; previous[i] = current; }
    }
  }
  return [];
}

function district(x,y){let col=Math.floor(x/1280),row=Math.floor(y/1280);return ['OLD TOWN','MARKET QUARTER','INDUSTRIAL YARD','FARMLAND','RESIDENTIAL','MEMORIAL PARK','HOSPITAL CAMPUS','WAREHOUSE DISTRICT','PINE WOODS','GARDEN ESTATE','CIVIC CENTRE','RAIL YARD','FARMSTEADS','SOUTH SUBURBS','RADIO HILL','FOREST EDGE'][clamp(row,0,3)*4+clamp(col,0,3)]}

function town(){buildings=[];trees=[];cars=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++){let name=district(x*640,y*640),nature=/PARK|WOODS|FOREST|FARM/.test(name),industrial=/INDUSTRIAL|WAREHOUSE|RAIL/.test(name),bx=x*640+110,by=y*640+112;if(!nature||((x+y)%3===0)){buildings.push({x:bx,y:by,w:industrial?300:range(150,210),h:industrial?260:range(155,210),name:industrial?'WAREHOUSE':name.includes('HOSPITAL')?'CLINIC':nature?'FARMHOUSE':['PHARMACY','HARDWARE','MARKET','DINER'][(x+y)%4]});if(!industrial&&!nature)buildings.push({x:bx+285,y:by+160,w:150,h:190,name:'RESIDENCE'})}for(let j=0;j<(nature?32:industrial?4:10);j++){let tx=x*640+range(90,570),ty=y*640+range(90,500);if(!blocked(tx,ty,28))trees.push({x:tx,y:ty,r:range(12,nature?29:20)})}if(!nature)cars.push({x:x*640+range(130,480),y:y*640+range(22,48),color:['#786044','#52706a','#7e5550'][(x+y)%3]})}}

'use strict';
// World. Shared classic-script bindings; startup runs last in main.js.
function blocked(x,y,r=12){return x<r||y<r||x>WORLD-r||y>WORLD-r||buildings.some(b=>x+r>b.x&&x-r<b.x+b.w&&y+r>b.y&&y-r<b.y+b.h)}

function move(e,dx,dy,r){if(!blocked(e.x+dx,e.y,r))e.x+=dx;if(!blocked(e.x,e.y+dy,r))e.y+=dy}

function los(a,b){let n=Math.ceil(dist(a,b)/20);for(let i=1;i<n;i++){if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,1))return false}return true}

function district(x,y){let col=Math.floor(x/1280),row=Math.floor(y/1280);return ['OLD TOWN','MARKET QUARTER','INDUSTRIAL YARD','FARMLAND','RESIDENTIAL','MEMORIAL PARK','HOSPITAL CAMPUS','WAREHOUSE DISTRICT','PINE WOODS','GARDEN ESTATE','CIVIC CENTRE','RAIL YARD','FARMSTEADS','SOUTH SUBURBS','RADIO HILL','FOREST EDGE'][clamp(row,0,3)*4+clamp(col,0,3)]}

function town(){buildings=[];trees=[];cars=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++){let name=district(x*640,y*640),nature=/PARK|WOODS|FOREST|FARM/.test(name),industrial=/INDUSTRIAL|WAREHOUSE|RAIL/.test(name),bx=x*640+110,by=y*640+112;if(!nature||((x+y)%3===0)){buildings.push({x:bx,y:by,w:industrial?300:range(150,210),h:industrial?260:range(155,210),name:industrial?'WAREHOUSE':name.includes('HOSPITAL')?'CLINIC':nature?'FARMHOUSE':['PHARMACY','HARDWARE','MARKET','DINER'][(x+y)%4]});if(!industrial&&!nature)buildings.push({x:bx+285,y:by+160,w:150,h:190,name:'RESIDENCE'})}for(let j=0;j<(nature?32:industrial?4:10);j++){let tx=x*640+range(90,570),ty=y*640+range(90,500);if(!blocked(tx,ty,28))trees.push({x:tx,y:ty,r:range(12,nature?29:20)})}if(!nature)cars.push({x:x*640+range(130,480),y:y*640+range(22,48),color:['#786044','#52706a','#7e5550'][(x+y)%3]})}}

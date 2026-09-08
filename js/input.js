'use strict';
// Input. Shared classic-script bindings; startup runs last in main.js.
function resetInput(){input={x:0,y:0,id:null,originX:0,originY:0};keys={};$('#knob').style.transform='translate(0px,0px)';$('#stick').style.display='none'}
const stick=$('#stick'),game=$('#game');

function stickMove(e){if(e.pointerId!==input.id)return;e.preventDefault();let dx=e.clientX-input.originX,dy=e.clientY-input.originY,len=Math.hypot(dx,dy),max=40,f=Math.min(1,max/(len||1));input.x=dx*f/max;input.y=dy*f/max;$('#knob').style.transform='translate('+dx*f+'px,'+dy*f+'px)'}

function stickStart(e){if(mode!=='play'||input.id!==null||e.target.closest('button')||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();let r=game.getBoundingClientRect();input.id=e.pointerId;input.originX=e.clientX;input.originY=e.clientY;input.x=0;input.y=0;stick.style.left=(e.clientX-r.left)+'px';stick.style.top=(e.clientY-r.top)+'px';stick.style.display='block';game.setPointerCapture(e.pointerId);stickMove(e)}

function stickEnd(e){if(e.pointerId!==input.id)return;resetInput()}
game.addEventListener('pointerdown',stickStart);game.addEventListener('pointermove',stickMove);for(const event of ['pointerup','pointercancel','lostpointercapture'])game.addEventListener(event,stickEnd);
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.length===1?e.key.toLowerCase():e.key]=true;if(e.key===' '&&!e.repeat)dodge();if(e.key.toLowerCase()==='b'&&!e.repeat&&isSurvival()){if(mode==='play')characterMenu();else if(mode==='character')resumeRun()}if(e.key.toLowerCase()==='c'&&!e.repeat)toggleSneak();if((e.key==='Escape'||e.key==='p')&&!e.repeat)pause()});window.addEventListener('keyup',e=>keys[e.key.length===1?e.key.toLowerCase():e.key]=false);window.addEventListener('blur',()=>{resetInput();if(mode==='play')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();if(mode==='play')pause()}});

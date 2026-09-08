'use strict';
// Core. Shared classic-script bindings; startup runs last in main.js.
const GAME_VERSION = "1.1.0";


const $=s=>document.querySelector(s),canvas=$('#canvas'),ctx=canvas.getContext('2d'),overlay=$('#overlay');
const ISOX=.8, ISOY=.45; const project=(x,y)=>({x:(x-y)*ISOX,y:(x+y)*ISOY});
let gameMode='survival',saveTimer=0;const DAY=360,SURVIVAL_END=1080;const isSurvival=()=>true;const ready=()=>!!player.mission&&player.mission.progress>=routes.find(r=>r.id===player.mission.id).duration;
const WORLD=5120;let W=390,H=800,dpr=1,mode='title',last=0,t=0,kills=0,collected=0,spawnTimer=0,player,buildings=[],trees=[],cars=[],zombies=[],drops=[],effects=[],caches=[],camera={x:0,y:0},seed=731,uid=0,keys={},input={x:0,y:0,id:null},toastTime=0,pending=0,best=0;
try{best=Number(localStorage.getItem('dead-end-best'))||0}catch(e){}

function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}function range(a,b){return a+rand()*(b-a)}const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function resize(){const r=$('#game').getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}window.addEventListener('resize',resize);resize();

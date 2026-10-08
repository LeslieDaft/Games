import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'spider-angular-'));
const tempSource=path.join(temp,'game.mjs');
const handlers={},els=new Map(),ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{})});
function element(id=''){if(!els.has(id))els.set(id,{style:{},hidden:false,textContent:'',value:id==='quality'?'balanced':id==='timeOfDay'?'sunset':'',checked:id==='sound',append(){},getContext(){return ctx},addEventListener(){}});return els.get(id)}
globalThis.ProgressEvent=class {constructor(type,props){Object.assign(this,props);this.type=type}};const requests=[];globalThis.fetch=async u=>{requests.push(typeof u==='string'?u:u.url||u.href);const url=typeof u==='string'?u:u.url||u.href;return new Response(fs.readFileSync(new URL(url)),{status:200});};globalThis.document={getElementById:element,createElement:()=>({width:0,height:0,getContext:()=>ctx})};globalThis.window={addEventListener:(name,fn)=>handlers[name]=fn};globalThis.innerWidth=1440;globalThis.innerHeight=900;globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=()=>{};globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.HTMLSelectElement=class {};globalThis.HTMLInputElement=class {};
window.__spiderQuality=process.argv[2]||'lowshape';let source=fs.readFileSync(root+'game.js','utf8');source=source.replace("'./angular.mjs?v=angular-2'",`'file://${root}angular.mjs?v=angular-2'`);source=source.replace("'./detail-lite.mjs?v=angular-2'",`'file://${root}detail-lite.mjs'`);source=source.replace("'./bosses.mjs'",`'file://${root}bosses.mjs'`);source=source.replace("'./rooftops.mjs'",`'file://${root}rooftops.mjs'`);source=source.replace("'./events.mjs'",`'file://${root}events.mjs'`);source=source.replace("'./character.js'",`'file://${root}character.js'`);source=source.replace("'./detail.js'",`'file://${root}detail.js'`);source=source.replace("import * as THREE from './vendor/three.module.js';",`import * as Real from 'file://${root}vendor/three.module.js';class MockRenderer {constructor(){this.shadowMap={};this.domElement={};this.info={render:{calls:0,triangles:0}}}setSize(){}setPixelRatio(){}render(){}}const THREE={...Real,WebGLRenderer:MockRenderer};`).replace("'./physics.mjs?v=steering-1'",`'file://${root}physics.mjs'`);source=source.replace('window.__game={','window.__game={scene,hero,head,arms,legs,angularHero,npcParts,cars,');fs.writeFileSync(tempSource,source);await import(pathToFileURL(tempSource).href);fs.rmSync(temp,{recursive:true,force:true});


await window.__spiderReady;
const g=window.__game,angular=window.__spiderQuality==='lowshape';
function assert(v,message){if(!v)throw Error(message);}
function triangles(root){let total=0;const visible=root.visible;root.visible=true;root.traverseVisible(o=>{if(o.isMesh)total+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});root.visible=visible;return total;}
assert(requests.length===0,'School modes must not download models');
assert(!g.getCharacter(),'No skinned hero or GLTF mixer');
assert(g.detail.closePeople.length===0,'No extra close-up NPC pool');
assert(g.npcs.length===64&&g.cars.length===20,'School population budgets');
assert(g.campaign.length===38&&g.detail.bossRigs.length===8,'Campaign content retained');
const heroTriangles=triangles(g.hero),crowdTriangles=g.npcParts.reduce((n,m)=>n+m.geometry.index.count/3,0);
assert(heroTriangles<=5320&&crowdTriangles<=440,'Hero and crowd stay within basic triangle budgets');
const budgets=[2760,6372,6336,3312,4032,1968,13824,6168];g.detail.bossRigs.forEach(({p},i)=>assert(triangles(p.root)<=budgets[i],'Villain geometry budget '+i));
let skinned=0;g.scene.traverse(o=>{if(o.isSkinnedMesh)skinned++;if(o.isMesh){for(const x of o.geometry.attributes.position.array)assert(Number.isFinite(x),'Finite model coordinates');}});assert(skinned===0,'No GPU skinned models');
g.start('free');assert(!g.getMission(),'Free roam has no missions');
if(angular){
 // Reproduce the old per-frame Euler branch flip at headings beyond 90 degrees.
 g.player.ground=true;g.player.anchor=null;g.player.v.set(0,0,0);
 for(const yaw of [Math.PI,-Math.PI,2.3,-2.3,.5,0]){
  g.player.yaw=yaw;let previous=g.hero.quaternion.clone();
  for(let frame=0;frame<120;frame++){g.animateHero(1/30);if(frame>60)assert(previous.angleTo(g.hero.quaternion)<.0001,'Stationary hero must not flip at yaw '+yaw);previous.copy(g.hero.quaternion);}
  const facing=g.player.p.clone().set(0,0,1).applyQuaternion(g.hero.quaternion);assert(Math.abs(facing.x-Math.sin(yaw))<.001&&Math.abs(facing.z-Math.cos(yaw))<.001,'Hero settles facing requested heading');
 }
 for(const direction of [[20,80,30],[-40,30,20],[0,100,0]]){
  g.player.anchor=g.player.p.clone().add({x:direction[0],y:direction[1],z:direction[2]});g.animateHero(1/30);g.hero.updateMatrixWorld(true);
  const grip=g.angularHero.gripWorld();for(let i=0;i<2;i++)assert(g.angularHero.handWorld(i).distanceTo(grip)<.04,'Both hands meet rope grip');
 }
 g.player.anchor=null;g.player.ground=true;g.player.v.set(4,0,0);for(let i=0;i<90;i++)g.animateHero(1/30);assert(Math.abs(g.hero.rotation.x)<.001&&Math.abs(g.hero.rotation.z)<.001,'Swing release returns upright');
 for(const kind of ['pickup','setdown','punch','web']){const target={p:g.player.p.clone().add({x:0,y:0,z:.85})};g.player.event={kind,actor:g.player,target,t:.3,contact:.3,duration:1};g.animateHero(1/30);g.hero.updateMatrixWorld(true);for(let i=0;i<2;i++)assert(g.angularHero.handWorld(i).toArray().every(Number.isFinite),'Finite paired event pose '+kind);}
 g.player.event=null;
}
g.start('free');const victim=g.npcs.find(n=>!n.hostile&&!n.boss);for(const n of g.npcs)n.p.set(1900,.35,1900);victim.p.set(90,.35,90);victim.hp=45;victim.down=0;g.player.p.copy(victim.p).add({x:0,y:0,z:1});g.player.v.set(0,0,0);g.player.attack=0;g.attack(false);assert(g.player.event===victim.event,'Shared combat event');g.director.tick(.15);assert(victim.hp===45,'No early damage');g.director.tick(.14);assert(victim.hp<45,'Damage at contact');g.director.tick(1);assert(!victim.event&&!g.player.event,'Paired event released');

// One keydown must keep steering over many frames, without repeat events.
g.start('free');g.player.p.set(0,1500,0);g.player.ground=false;g.player.v.set(0,0,-30);
handlers.keydown({code:'KeyD',target:{},preventDefault(){}});
for(let i=0;i<60;i++)g.physics(1/120);const heldHeading1=Math.atan2(g.player.v.x,-g.player.v.z);
for(let i=0;i<60;i++)g.physics(1/120);const heldHeading2=Math.atan2(g.player.v.x,-g.player.v.z);
assert(heldHeading1>.35&&heldHeading2>heldHeading1+.5,'Holding D keeps curving right without repeated keydown');
handlers.keyup({code:'KeyD'});for(let i=0;i<90;i++)g.physics(1/120);assert(Math.abs(g.player.steer)<.001,'Steering eases out after release');
const releasedHeading=Math.atan2(g.player.v.x,-g.player.v.z);for(let i=0;i<60;i++)g.physics(1/120);assert(Math.abs(Math.atan2(g.player.v.x,-g.player.v.z)-releasedHeading)<.001,'No lingering turn after release');
handlers.keydown({code:'KeyA',target:{},preventDefault(){}});for(let i=0;i<120;i++)g.physics(1/120);assert(g.player.steer<-.99,'Holding A continuously reverses steering');handlers.keyup({code:'KeyA'});

g.start('campaign');for(let i=0;i<38;i++){g.setMissionIndex(i);g.loadMission();assert(Number.isFinite(g.getMission().p.y),'Mission '+i+' starts');}
g.updateNearbyCity();const total=g.staticBatches.reduce((s,b)=>s+b.items.length,0),active=g.staticBatches.reduce((s,b)=>s+b.mesh.count,0);assert(active<total/4,'City render reduction retained');
console.log(JSON.stringify({mode:window.__spiderQuality,heroTriangles,crowdTriangles,modelDownloads:requests.length,skinnedMeshes:skinned,campaignMissions:38,bosses:8,status:'passed'}));

import * as T from './vendor/three.module.js';
import {clearRoofPoint} from './rooftops.mjs';
export const BOSS_DEFS=[
 {id:'shocker',name:'Shocker',color:'#cf963b',trim:'#493326',hp:420,attack:'Shockwave',style:'pulse',damage:15,range:18,radius:4.2,windup:.9,scale:1.08,xy:[360,180],hint:'His gauntlets flash before a shockwave. Dodge with Q, then close in.'},
 {id:'rhino',name:'Rhino',color:'#788791',trim:'#303c46',hp:720,attack:'Armored charge',style:'charge',damage:24,range:23,radius:3,windup:1.05,scale:1.45,xy:[-540,180],hint:'Sidestep the straight charge with Q. Attack during his recovery.'},
 {id:'scorpion',name:'Scorpion',color:'#356b46',trim:'#bbdb49',hp:500,attack:'Venom strike',style:'venom',damage:18,range:23,radius:3.8,windup:1.1,scale:1.12,xy:[720,-360],hint:'Leave the green target circle before the tail strikes. Web him to interrupt.'},
 {id:'vulture',name:'Vulture',color:'#547b5c',trim:'#b4c2cb',hp:480,attack:'Wing dive',style:'dive',damage:20,range:25,radius:3.3,windup:1.15,scale:1.04,xy:[-360,-720],hint:'Watch his wings open. Dodge the dive, then punish the landing.'},
 {id:'electro',name:'Electro',color:'#253844',trim:'#ffe474',hp:520,attack:'Lightning burst',style:'bolt',damage:20,range:27,radius:3.5,windup:1.0,scale:1.06,xy:[900,540],hint:'Yellow sparks mark the strike zone. Keep moving and use R to interrupt.'},
 {id:'negative',name:'Mister Negative',color:'#ecebef',trim:'#242033',hp:560,attack:'Dark-energy slash',style:'slash',damage:22,range:17,radius:4,windup:.85,scale:1.07,xy:[-900,540],hint:'Dodge his dark-energy burst, then counter while his sword is lowered.'},
 {id:'octopus',name:'Doctor Octopus',color:'#526546',trim:'#c5a263',hp:680,attack:'Tentacle slam',style:'slam',damage:25,range:22,radius:4.5,windup:1.25,scale:1.12,xy:[360,-900],hint:'Four arms telegraph a heavy slam. Escape the circle, then web and punch.'},
 {id:'venom',name:'Venom',color:'#141c26',trim:'#e7edf0',hp:900,attack:'Symbiote smash',style:'smash',damage:28,range:20,radius:5,windup:1.15,scale:1.48,xy:[0,0],hint:'His second phase attacks faster. Dodge the smash and hit during recovery.'}
];
export function assignBosses(npcs,buildings){return BOSS_DEFS.map((def,i)=>{const n=npcs[npcs.length-BOSS_DEFS.length+i];n.boss=def;n.hostile=true;n.roof=buildings.reduce((a,b)=>Math.hypot(b.x-def.xy[0],b.z-def.xy[1])<Math.hypot(a.x-def.xy[0],a.z-def.xy[1])?b:a,buildings[0]);n.home=clearRoofPoint(n.roof);n.p.copy(n.home);n.origin=n.p.clone();n.maxHp=n.hp=def.hp;n.dead=false;n.down=0;n.shirt=def.color;n.color=def.id==='negative'?'#33313d':'#c39375';return n;});}
export function resetBosses(bosses,defeated=[]){for(const n of bosses){n.p.copy(n.home);n.origin.copy(n.p);n.dead=defeated.includes(n.boss.id);n.hp=n.dead?0:n.maxHp;n.down=n.dead?Infinity:0;n.downAge=n.dead?5:0;n.web=n.flee=0;n.event=null;n.mission=false;n.attackCooldown=2;n.attackTarget=null;}}
// All costume parts belong to the same articulated rig as the combat animation.
export function dressBoss(p,def,{ell,cube,tube,material,sphere,rounded}){
 const armor=material(def.color,.38,.45),trim=material(def.trim,.28,.65),dark=material('#16212a',.52,.35),glow=new T.MeshStandardMaterial({color:def.trim,emissive:def.trim,emissiveIntensity:1.4,roughness:.3});
 const root=p.root,extras=new T.Group();root.add(extras);p.bossExtras=extras;p.bossDef=def;p.animated=[];root.scale.setScalar(def.scale);
 const shell=(parent,x,y,z,sx,sy,sz,mat=armor)=>ell(parent,mat,x,y,z,sx,sy,sz,sphere(72,48));
 if(!['negative','octopus'].includes(def.id))for(const s of[-1,1]){shell(p.limbs[s===-1?0:2],0,-.06,0,.17,.17,.16);shell(p.elbows[s===-1?0:1],0,-.20,.02,.14,.22,.14);}
 if(def.id==='rhino'){
  root.scale.set(def.scale*1.32,def.scale,def.scale*1.25);shell(extras,0,1.19,0,.40,.44,.26);shell(extras,0,1.76,0,.24,.27,.23);
  const horn=new T.Mesh(new T.ConeGeometry(.085,.45,64,24),trim);horn.position.set(0,1.84,.35);horn.rotation.x=Math.PI*.38;extras.add(horn);for(const side of[-1,1])shell(extras,side*.09,1.8,.215,.055,.026,.025,dark);
  for(let i=0;i<5;i++){cube(extras,trim,0,.95+i*.1,.245,.56,.045,.06,rounded);for(const s of[-1,1])shell(extras,s*.29,1.1+i*.10,.21,.028,.028,.024,trim);}
 }else if(def.id==='shocker'){
  for(let s of[-1,1]){const hand=p.elbows[s===-1?0:1];shell(hand,0,-.3,.04,.18,.2,.19,trim);for(let j=0;j<5;j++)cube(hand,glow,(j-2)*.05,-.34,.2,.026,.16,.025,rounded);}
  for(let i=0;i<8;i++)for(let j=0;j<5;j++){const x=(j-2)*.105,y=.91+i*.064;const m=cube(extras,dark,x,y,.185,.07,.006,.012);m.rotation.z=Math.PI/4;}
  shell(extras,0,1.74,.01,.183,.245,.187);for(let s of[-1,1])shell(extras,s*.07,1.79,.185,.06,.027,.025,dark);
 }else if(def.id==='scorpion'){
  shell(extras,0,1.73,0,.20,.25,.2);for(const side of[-1,1])shell(extras,side*.075,1.79,.193,.06,.035,.025,glow);const tail=new T.Group();tail.position.set(0,1,-.15);extras.add(tail);p.animated.push({kind:'tail',object:tail});
  for(let j=0;j<24;j++){const a=j/23*Math.PI*1.36;const u=j/23,y=u*1.8,z=-Math.sin(u*Math.PI)*1.0+u*.6;ell(tail,j%3?armor:trim,0,y,z,.12-j*.002,.12,.12,sphere(48,32));}
  const sting=new T.Mesh(new T.ConeGeometry(.10,.38,48,16),glow);sting.position.set(0,1.8,.6);sting.rotation.x=-Math.PI/2;tail.add(sting);
 }else if(def.id==='vulture'){
  for(const s of[-1,1]){const wing=new T.Group();wing.position.set(s*.22,1.4,-.19);extras.add(wing);p.animated.push({kind:'wing',object:wing,side:s});for(let j=0;j<15;j++){const m=cube(wing,j%3?trim:armor,s*(.16+j*.105),-.1-j*.025,0,.16,.85-j*.025,.05,rounded);m.rotation.z=s*(.2+j*.018);}tube(wing,[new T.Vector3(),new T.Vector3(s*.8,.13,0),new T.Vector3(s*1.7,-.1,0)],.065,dark,12);}
  shell(extras,0,1.45,-.2,.25,.35,.2,trim);for(let s of[-1,1])shell(extras,s*.075,1.78,.18,.063,.043,.035,glow);
 }else if(def.id==='electro'){
  for(let s of[-1,1]){for(let j=0;j<5;j++)shell(extras,s*(.12+j*.017),1+j*.11,.19,.027,.065,.023,glow);shell(p.elbows[s===-1?0:1],0,-.35,.025,.085,.12,.065,glow);}
  for(let s of[-1,1])tube(extras,[new T.Vector3(s*.06,1.84,.18),new T.Vector3(s*.13,1.73,.18),new T.Vector3(s*.05,1.66,.18)],.009,glow,8);
 }else if(def.id==='negative'){
  for(let s of[-1,1]){const lapel=cube(extras,trim,s*.1,1.36,.19,.09,.32,.028,rounded);lapel.rotation.z=s*.22;}
  cube(extras,dark,0,1.24,.205,.035,.3,.024);const sword=cube(p.elbows[1],glow,0,-.65,.12,.055,.75,.10,rounded);sword.rotation.x=-.4;
 }else if(def.id==='octopus'){
  for(let k=0;k<4;k++){const arm=new T.Group();arm.position.set((k%2?1:-1)*.22,1.15,-.18);extras.add(arm);p.animated.push({kind:'tentacle',object:arm,side:k%2?1:-1,phase:k});for(let j=0;j<24;j++){const a=j/23,side=k%2?1:-1;const x=side*(a*1.5),y=Math.sin(a*Math.PI)*(k<2?1.2:-.8),z=-Math.sin(a*Math.PI)*.45;ell(arm,j%2?trim:dark,x,y,z,.065,.065,.07,sphere(32,20));if(j===23)for(let f=0;f<3;f++){const claw=cube(arm,trim,x+Math.cos(f*2.094)*.12,y+Math.sin(f*2.094)*.12,z+.08,.045,.25,.05,rounded);claw.rotation.z=f*2.094;}}}
  for(let s of[-1,1])shell(extras,s*.071,1.785,.185,.065,.038,.035,dark);
 }else if(def.id==='venom'){
  root.scale.set(def.scale*1.18,def.scale,def.scale*1.13);shell(extras,0,1.74,0,.22,.27,.22);shell(extras,0,1.22,.19,.075,.15,.025,trim);
  for(let s of[-1,1]){const eye=shell(extras,s*.087,1.82,.198,.084,.055,.028,trim);eye.rotation.z=s*.3;for(let k=0;k<4;k++)tube(extras,[new T.Vector3(s*.03,1.3-k*.04,.21),new T.Vector3(s*.2,1.37-k*.065,.18),new T.Vector3(s*.28,1.45-k*.15,.10)],.014,trim,10);for(let j=0;j<7;j++){const tooth=new T.Mesh(new T.ConeGeometry(.011,.052,20,6),trim);tooth.position.set((j-3)*.032,1.65+s*.026,.207);tooth.rotation.z=s<0?0:Math.PI;extras.add(tooth);}}
 }
 // Keep helmet features aligned with the human head proportions.
 for(const o of extras.children)if(o.isMesh&&o.position.y>1.53){o.position.x*=.70;o.position.y=1.64+(o.position.y-1.73)*.70;o.position.z*=.70;o.scale.multiplyScalar(.70);}
 if(['rhino','shocker','scorpion','venom'].includes(def.id))for(const o of root.children)if(o.isMesh&&o.position.y>1.50)o.visible=false;
 p.animateBoss=(time,n)=>{const attack=n.event?.actor===n?Math.sin(Math.min(1,n.event.t/n.event.contact)*Math.PI/2):0;for(const a of p.animated){if(a.kind==='wing')a.object.rotation.z=a.side*(.08+Math.sin(time*2)*.05+attack*.55);if(a.kind==='tail')a.object.rotation.x=Math.sin(time*2)*.12-attack*.8;if(a.kind==='tentacle'){a.object.rotation.y=a.side*(Math.sin(time*2+a.phase)*.18+attack*.65);a.object.rotation.x=Math.sin(time*1.4+a.phase)*.12-attack*.5;}}};
 return p;
}

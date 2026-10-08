import * as T from './vendor/three.module.js';
import {npcPose} from './events.mjs';
import {dressBoss} from './bosses.mjs';
export function installLiteDetail({scene,npcs,player}){
 const geo=new T.SphereGeometry(1,10,7),box=new T.BoxGeometry(1,1,1),material=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 function ell(parent,mat,x,y,z,sx,sy,sz,g=geo){const m=new T.Mesh(g,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
 const cube=(parent,mat,x,y,z,sx,sy,sz)=>ell(parent,mat,x,y,z,sx,sy,sz,box);
 function tube(parent,points,r,mat){const m=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,r,4,false),mat);parent.add(m);return m;}
 function person(n){const root=new T.Group(),cloth=material(n.boss?.color||'#bb993f'),skin=material(n.color||'#c39375'),limbs=[],elbows=[],knees=[];scene.add(root);ell(root,cloth,0,1.16,0,.29,.4,.17);ell(root,skin,0,1.65,0,.13,.18,.13);for(const s of[-1,1]){const a=new T.Group(),e=new T.Group(),l=new T.Group(),k=new T.Group();a.position.set(s*.34,1.4,0);root.add(a);ell(a,cloth,0,-.18,0,.09,.22,.09);e.position.y=-.35;a.add(e);ell(e,cloth,0,-.18,0,.07,.22,.07);elbows.push(e);l.position.set(s*.15,.9,0);root.add(l);ell(l,cloth,0,-.22,0,.12,.25,.12);k.position.y=-.43;l.add(k);ell(k,cloth,0,-.22,.03,.09,.25,.12);knees.push(k);limbs.push(a,l);}return{root,limbs,elbows,knees};}
 const bossRigs=npcs.filter(n=>n.boss).map(n=>{const p=person(n);dressBoss(p,n.boss,{ell,cube,tube,material,sphere:()=>geo,rounded:box});return{n,p};});
 function posePerson(p,n,time,world=true){const pose=npcPose(n,time);p.root.position.copy(world?n.p:new T.Vector3());p.root.position.y+=pose.bob;p.root.rotation.set(pose.lean,n.dir||0,pose.roll);for(let i=0;i<2;i++){p.limbs[i*2].rotation.set(pose.arms[i],0,pose.armZ[i]);p.limbs[i*2+1].rotation.x=pose.legs[i];p.elbows[i].rotation.x=pose.elbows[i];p.knees[i].rotation.x=pose.knees[i];}p.animateBoss?.(time,n);}
 return{ready:Promise.resolve(),bossRigs,closePeople:[],createPassenger(container){for(const c of container.children)c.visible=false;const p=person({});container.add(p.root);return p;},posePerson,update(time){for(const {n,p}of bossRigs){n.detailed=true;p.root.visible=n.p.distanceTo(player.p)<300;if(p.root.visible)posePerson(p,n,time);}},getInfo:()=>({detailedBuildings:0,detailedPedestrians:0,lightweight:true})};
}

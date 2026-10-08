import * as T from './vendor/three.module.js';
import {heroOverlay} from './events.mjs';

// Authored cross-sections give silhouette detail without a skeleton or model loader.
// Rings: height, half-width, half-depth, optional forward offset. Closed end caps.
export function loft(rings,sides=8){
 const p=[],uv=[],ix=[];
 for(let j=0;j<rings.length;j++){const[y,w,d,z=0]=rings[j];for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;p.push(Math.sin(a)*w,y,Math.cos(a)*d+z);uv.push(i/sides,j/(rings.length-1));}}
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;ix.push(a,b,a+1,a+1,b,b+1);}
 for(const j of[0,rings.length-1]){const center=p.length/3;p.push(0,rings[j][0],rings[j][3]||0);uv.push(.5,j?1:0);for(let i=0;i<sides;i++){const a=j*(sides+1)+i;ix.push(...(j?[center,a+1,a]:[center,a,a+1]));}}
 for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
const profiles={
 head:[[-1,.48,.58],[-.65,.75,.84],[-.05,1,.96],[.65,.94,.9],[1,.5,.5]],
 torso:[[-1,.76,.85],[-.5,.7,.76],[.4,1,1],[.8,1.04,.87],[1,.53,.65]],
 arm:[[-1.4,.62,.68],[-.65,.78,.8],[.2,.9,.92],[1.4,1,1]],
 leg:[[-1.4,.72,1.2,.3],[-.9,.65,.7],[.3,.83,.85],[1.4,1,1]]
};
const crowdCache=new Map();
export function crowdShape(k){const name=k===0?'head':k===1?'torso':k<4?'arm':'leg';if(!crowdCache.has(name))crowdCache.set(name,loft(profiles[name],6));return crowdCache.get(name);}
export function angularPerson(p){
 const nodes=[p.root,p.limbs[0],p.elbows[0],p.limbs[1],p.knees[0],p.limbs[2],p.elbows[1],p.limbs[3],p.knees[1]];
 for(const node of nodes)for(const m of node.children){if(!m.isMesh)continue;const kind=m.material===p.cloth?(node===p.root?'torso':node===p.limbs[1]||node===p.limbs[3]?'leg':'arm'):'head';m.geometry=crowdShape(kind==='head'?0:kind==='torso'?1:kind==='leg'?4:2);if(kind!=='head'&&kind!=='torso')m.scale.y/=1.4;}
 p.cloth.flatShading=true;p.skin.flatShading=true;
}
export function installAngularHero({hero,head,arms,legs}){
 const old=[];hero.traverse(o=>{if(o.isMesh||o.isLine)old.push(o);});for(const o of old){o.removeFromParent();o.geometry.dispose();}
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#57212b';ctx.lineWidth=1;
 for(let i=0;i<=8;i++){ctx.beginPath();ctx.moveTo(i*16,0);ctx.lineTo(i*16,128);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*16);ctx.lineTo(128,i*16);ctx.stroke();}
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
 const red=new T.MeshLambertMaterial({color:'#c8213d',map:tex,flatShading:true}),blue=new T.MeshLambertMaterial({color:'#173859',flatShading:true}),black=new T.MeshLambertMaterial({color:'#091323'}),white=new T.MeshLambertMaterial({color:'#edf6ff'});
 function part(parent,rings,material,sides=10){const m=new T.Mesh(loft(rings,sides),material);parent.add(m);return m;}
 // A tapered chest and pelvis replace overlapping chest spheres.
 part(hero,[[1.15,.27,.19],[1.25,.27,.18],[1.55,.39,.235],[1.76,.45,.20],[1.89,.28,.16],[2.02,.12,.12]],red,12);
 part(hero,[[.85,.25,.17],[1.02,.30,.21],[1.15,.27,.19]],blue,10);
 part(head,[[-.31,.11,.11],[-.23,.18,.19],[-.04,.24,.23],[.16,.225,.215],[.29,.14,.14],[.32,.045,.05]],red,12);
 for(const side of[-1,1]){const shape=new T.Shape();shape.moveTo(side*.027,.07);shape.lineTo(side*.204,.135);shape.lineTo(side*.17,-.028);shape.lineTo(side*.08,-.065);shape.closePath();const g=new T.ShapeGeometry(shape);const border=new T.Mesh(g,black);border.position.z=.232;head.add(border);const lens=new T.Mesh(g,white);lens.position.set(side*.018,.006,.237);lens.scale.set(.76,.76,1);head.add(lens);}
 for(const a of arms){part(a.pivot,[[-.49,.105,.10],[-.33,.14,.13],[-.13,.17,.15],[.04,.145,.135]],red);part(a.joint,[[-.55,.07,.06],[-.48,.10,.075],[-.39,.07,.065],[-.3,.105,.095],[-.1,.13,.12],[.04,.105,.10]],red);}
 for(const l of legs){part(l.pivot,[[-.53,.125,.12],[-.3,.17,.16],[-.06,.205,.19],[.10,.19,.18]],blue);part(l.joint,[[-.57,.13,.20,.1],[-.44,.13,.22,.1],[-.34,.10,.12],[0,.13,.125],[.045,.12,.12]],red);}
 // Small chest emblem, one mesh rather than many line draw calls.
 const shapes=[];
 function polygon(points){const sh=new T.Shape();points.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));sh.closePath();shapes.push(sh);}
 polygon([[0,1.71],[.035,1.66],[.024,1.60],[.043,1.56],[0,1.49],[-.043,1.56],[-.024,1.60],[-.035,1.66]]);
 for(const side of[-1,1])for(let j=0;j<4;j++){const y=1.66-j*.035,end=1.79-j*.11;polygon([[side*.02,y],[side*.105,y+.03],[side*.18,end],[side*.12,y+.004],[side*.03,y-.012]]);}
 const emblem=new T.Mesh(new T.ShapeGeometry(shapes),black);emblem.position.z=.24;hero.add(emblem);
 const grip=new T.Vector3(0,2.48,0),down=new T.Vector3(0,-1,0);
 function solveArm(i,target,weight=1){
  const a=arms[i],delta=target.clone().sub(a.pivot.position),d=T.MathUtils.clamp(delta.length(),.03,.869),dir=delta.normalize(),upper=.44,lower=.43;
  const along=(d*d+upper*upper-lower*lower)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
  let perpendicular=new T.Vector3(0,0,-1).addScaledVector(dir,dir.z);if(perpendicular.lengthSq()<.001)perpendicular.set(1,0,0).addScaledVector(dir,-dir.x);perpendicular.normalize();
  const elbow=a.pivot.position.clone().addScaledVector(dir,along).addScaledVector(perpendicular,height),q=new T.Quaternion().setFromUnitVectors(down,elbow.clone().sub(a.pivot.position).normalize());
  const forearm=a.pivot.position.clone().addScaledVector(dir,d).sub(elbow).applyQuaternion(q.clone().invert()).normalize();
  a.pivot.quaternion.slerp(q,weight);a.joint.quaternion.slerp(new T.Quaternion().setFromUnitVectors(down,forearm),weight);
 }
 const jointMap={LeftArm:arms[0].pivot,RightArm:arms[1].pivot,LeftForeArm:arms[0].joint,RightForeArm:arms[1].joint,LeftUpLeg:legs[0].pivot,RightUpLeg:legs[1].pivot,LeftLeg:legs[0].joint,RightLeg:legs[1].joint,Head:head};
 let overlayBase=[];
 return {
  beforePose(){for(const [node,q]of overlayBase)node.quaternion.copy(q);overlayBase=[];},
  gripWorld:()=>hero.localToWorld(grip.clone()),
  handWorld:i=>arms[i].joint.localToWorld(new T.Vector3(0,-.43,0)),
  poseSwing(){for(let i=0;i<2;i++)solveArm(i,grip.clone().add(new T.Vector3(i?.035:-.035,0,0)));},
  poseEvents(state,time){overlayBase=[hero,...new Set(Object.values(jointMap))].map(node=>[node,node.quaternion.clone()]);head.rotation.set(0,0,0);const overlay=heroOverlay(state,time);hero.position.y+=overlay.hip*.01;
   for(const[name,angles]of Object.entries(overlay.bones)){const joint=jointMap[name];if(joint)joint.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(...angles)));else if(name.startsWith('Spine'))hero.rotation.x+=angles[0];}
   hero.updateMatrixWorld(true);const e=state.event;
   if(e?.actor===state&&e.target){const weight=e.t<e.contact?Math.min(1,e.t/e.contact):Math.max(0,1-(e.t-e.contact)/(e.duration-e.contact));
    if(['punch','web'].includes(e.kind))solveArm(1,hero.worldToLocal(e.target.p.clone().add(new T.Vector3(0,1.55,0))),weight);
    if(['pickup','setdown'].includes(e.kind))for(let i=0;i<2;i++)solveArm(i,hero.worldToLocal(e.target.p.clone().add(new T.Vector3(i?.16:-.16,1.05,0))),Math.sin(Math.min(1,e.t/e.duration)*Math.PI));
   }else if(state.carrying&&state.carryTarget)solveArm(1,hero.worldToLocal(state.carryTarget.p.clone().add(new T.Vector3(0,.8,0))),.8);
  }
 };
}

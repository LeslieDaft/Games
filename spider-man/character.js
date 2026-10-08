import {heroOverlay} from './events.mjs';
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const V=T.Vector3;
export async function createCharacter(hero,{gltf=null,fabricCanvas=null,surfaceBuffer=null,lowPoly=false}={}){
 const gltfData=gltf||await new GLTFLoader().loadAsync(new URL(lowPoly?'./models/locomotion-rig.glb':'./models/athletic-base.glb',import.meta.url).href);
 const root=gltfData.scene,bones={},surfaces=[];root.updateMatrixWorld(true);root.traverse(o=>{if(o.isBone)bones[o.name.replace('mixamorig','')]=o;if(o.isSkinnedMesh)surfaces.push(o);});
 // Suit coordinates stay in the bind pose while the skeleton deforms the body.
 const cloth=fabricCanvas||document.createElement('canvas');cloth.width=cloth.height=256;const ctx=cloth.getContext('2d');ctx.fillStyle='#8080ff';ctx.fillRect(0,0,256,256);for(let y=0;y<256;y+=4)for(let x=0;x<256;x+=4){ctx.fillStyle=(x+y)%8?'#7987f7':'#8779f7';ctx.fillRect(x,y,2,3);}
 const micro=new T.CanvasTexture(cloth);micro.wrapS=micro.wrapT=T.RepeatWrapping;micro.repeat.set(22,22);
 const suit=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.48,metalness:.06,clearcoat:.12,clearcoatRoughness:.5,normalMap:micro,normalScale:new T.Vector2(.17,.17)});
 suit.onBeforeCompile=shader=>{
 shader.vertexShader='attribute vec3 suitPosition; varying vec3 vSuitP;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSuitP=suitPosition;');
 shader.fragmentShader='varying vec3 vSuitP;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 p=vSuitP;float ax=abs(p.x);
 float headMask=step(1.555,p.y);
 float boots=1.0-smoothstep(.43,.49,p.y);
 float gloves=smoothstep(.51,.55,ax);
 float chestWidth=.135+.065*smoothstep(1.16,1.39,p.y);
 float chest=(1.0-smoothstep(chestWidth,chestWidth+.009,ax))*step(1.035,p.y);
 float shoulders=step(1.38,p.y)*(1.0-smoothstep(.31,.34,ax));
 float belt=(1.0-smoothstep(.027,.038,abs(p.y-1.035)))*(1.0-step(.22,ax));
 float redMask=max(max(headMask,boots),max(gloves,max(chest,max(shoulders,belt))));
 vec3 red=vec3(.50,.013,.029), blue=vec3(.008,.026,.052);
 vec3 base=mix(blue,red,redMask);
 float theta=atan(p.x,p.z*1.5),rows=p.y*20.0;
 if(headMask>.5){theta=atan(p.x,p.z-.012);rows=(p.y-1.58)*36.0+cos(theta*2.0)*.19;}
 else if(ax>.32&&p.y>1.1){theta=atan(p.z+.048,p.y-1.438);rows=ax*24.0;}
 else if(p.y<.53){theta=atan(p.x-sign(p.x)*.083,p.z);rows=p.y*24.0;}
 else{rows=p.y*20.0+cos(theta*2.0)*.28;}
 float spoke=theta*2.54648;vec2 grid=vec2(spoke,rows);vec2 dd=max(fwidth(grid),vec2(.001));vec2 line=abs(fract(grid+.5)-.5)/dd;
 float ink=1.0-smoothstep(.35,1.0,min(line.x,line.y));
 base=mix(base,vec3(.006,.008,.012),ink*redMask*.82);
 float weave=sin(p.y*1750.0)*sin((p.x+p.z)*1750.0)*.025;
 diffuseColor.rgb*=base*(1.0+weave);
 `);
 };suit.customProgramCacheKey=()=> 'fitted-spider-suit-v3';
 const buffer=surfaceBuffer||await fetch(new URL(lowPoly?'./models/fitted-low.bin':'./models/fitted-surface.bin',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Suit surface unavailable');return r.arrayBuffer();});
 const header=new Uint32Array(buffer,0,2),count=header[0],indices=header[1];let offset=8;const geom=new T.BufferGeometry();
 for(const [name,n,type]of [['position',3,Float32Array],['normal',3,Float32Array],['uv',2,Float32Array],['skinIndex',4,Uint16Array],['skinWeight',4,Float32Array]]){const array=new type(buffer,offset,count*n);geom.setAttribute(name,new T.BufferAttribute(array,n));offset+=array.byteLength;}
 geom.setIndex(new T.BufferAttribute(new Uint32Array(buffer,offset,indices),1));geom.setAttribute('suitPosition',geom.attributes.position.clone());geom.computeVertexNormals();
 const mesh=surfaces[1];mesh.geometry=geom;mesh.material=suit;mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;surfaces[0].visible=false;const meshes=[mesh];
 const maskRoot=new T.Group();bones.Head.add(maskRoot);maskRoot.position.set(0,10.3,2.0);maskRoot.scale.setScalar(100);
 // Smooth skull-to-jaw silhouette, with no visible nose, mouth or robot panels.
 function maskSurface(x,y,lift=0){const yn=y/.12,taper=.82+.18*T.MathUtils.smoothstep(yn,-.85,.2),rx=.09*taper;return .10*Math.sqrt(Math.max(.025,1-x*x/(rx*rx)-yn*yn))+lift;}
 const maskGeo=new T.SphereGeometry(1,lowPoly?28:96,lowPoly?20:72),mp=maskGeo.attributes.position,bind=new Float32Array(mp.count*3);for(let i=0;i<mp.count;i++){let x=mp.getX(i),y=mp.getY(i),z=mp.getZ(i),taper=.82+.18*T.MathUtils.smoothstep(y,-.85,.2);x*=.09*taper;y*=.12;z*=.10;if(y<-.065)z*=.88;mp.setXYZ(i,x,y,z);bind.set([x,y+1.699,z+.01],i*3);}maskGeo.setAttribute('suitPosition',new T.BufferAttribute(bind,3));maskGeo.computeVertexNormals();const mask=new T.Mesh(maskGeo,suit);mask.castShadow=true;maskRoot.add(mask);
 const border=new T.MeshStandardMaterial({color:'#080c12',roughness:.34}),lens=new T.MeshPhysicalMaterial({color:'#edf4f4',roughness:.23,metalness:.12,clearcoat:1,clearcoatRoughness:.14});
 function eye(side,inset){const shape=new T.Shape();shape.moveTo(.014,.023);shape.bezierCurveTo(.031,.028,.065,.053,.082,.060);shape.bezierCurveTo(.080,.030,.078,-.012,.052,-.035);shape.bezierCurveTo(.029,-.052,.018,-.011,.014,.023);let geo=new T.ShapeGeometry(shape,lowPoly?12:40);
 // Tessellate the entire lens, then conform every interior vertex to the mask.
 for(let level=0;level<(lowPoly?1:3);level++){const p=geo.attributes.position,ix=geo.index.array,out=[];for(let t=0;t<ix.length;t+=3){const a=new V().fromBufferAttribute(p,ix[t]),b=new V().fromBufferAttribute(p,ix[t+1]),c=new V().fromBufferAttribute(p,ix[t+2]),ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);for(const v of[a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca])out.push(v.x,v.y,v.z);}geo.dispose();geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(out,3));geo.setIndex(Array.from({length:out.length/3},(_,i)=>i));}
 const p=geo.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i);if(inset){x=.049+(x-.049)*.78;y=.005+(y-.005)*.79;}x*=side*.92;y*=.94;const z=maskSurface(x,y,inset?.0039:.002);p.setXYZ(i,x,y,z);}if(side<0){const idx=geo.index.array;for(let i=0;i<idx.length;i+=3){let t=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=t;}}
 geo.computeVertexNormals();const m=new T.Mesh(geo,inset?lens:border);maskRoot.add(m);}
 for(const side of [-1,1]){eye(side,false);eye(side,true);}
 // Emblems are skinned accessories placed on the chest and back bones.
 function attachRest(parent,obj,world){root.updateMatrixWorld(true);const local=parent.worldToLocal(world.clone());parent.add(obj);obj.position.copy(local);obj.scale.setScalar(100);}
 const emblem=new T.Group();const body=new T.Mesh(new T.SphereGeometry(1,lowPoly?10:24,lowPoly?8:18),border);body.scale.set(.013,.028,.004);emblem.add(body);const bulb=new T.Mesh(new T.SphereGeometry(1,lowPoly?10:24,lowPoly?8:18),border);bulb.position.y=.025;bulb.scale.set(.009,.010,.005);emblem.add(bulb);
 for(const s of[-1,1])for(let k=0;k<4;k++){const y=.022-k*.013,pts=[new V(s*.004,y,0),new V(s*(.027+k*.002),y+.022-k*.007,0),new V(s*(.049+k*.001),y+.063-k*.032,-.005)];emblem.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),lowPoly?8:16,.0028,lowPoly?4:7,false),border));}
 attachRest(bones.Spine2,emblem,new V(0,1.415,.112));const back=emblem.clone();attachRest(bones.Spine2,back,new V(0,1.385,-.113));back.scale.setScalar(75);back.rotation.y=Math.PI;
 // Replace the old primitive character completely.
 for(const old of [...hero.children])old.visible=false;hero.add(root);root.scale.setScalar(1.31);
 const mixer=new T.AnimationMixer(root),actions={};for(const clip of gltfData.animations)if(['idle','walk','run'].includes(clip.name)){actions[clip.name]=mixer.clipAction(clip);actions[clip.name].play();actions[clip.name].setEffectiveWeight(clip.name==='idle'?1:0);}
 const rest=new Map();for(const b of Object.values(bones))rest.set(b,b.quaternion.clone());
 function set(name,x=0,y=0,z=0){const b=bones[name];if(b)b.quaternion.copy(rest.get(b)).multiply(new T.Quaternion().setFromEuler(new T.Euler(x,y,z)));}
 function poseAir(t,hang){bones.Hips.position.y=103.99;
 set('Spine',-.12,0,0);set('Spine1',-.08,0,0);set('Spine2',0,.08,0);set('Head',.10,-.08,0);
 // Bind arms point sideways; shoulders now lift naturally from the torso.
 set('LeftArm',hang?-.15:.10,hang?-.12:.2,hang?1.35:-.50);set('LeftForeArm',0,hang?-.12:-.50,hang?.05:-.35);
 set('RightArm',.2,-.15,.60);set('RightForeArm',0,.60,.70);
 set('LeftUpLeg',-.45,0,.13);set('LeftLeg',.85,0,0);set('LeftFoot',-.25,0,0);
 set('RightUpLeg',.22,0,-.14);set('RightLeg',.52,0,0);set('RightFoot',-.15,0,0);
 for(const side of['Left','Right'])for(const finger of['Middle','Ring'])for(let i=1;i<=3;i++)set(side+'Hand'+finger+i,0,0,side==='Left'?-1.15:1.15);
 }
 function poseSwing(t){bones.Hips.position.y=103.99;for(const name of ['Spine','Spine1','Spine2','Neck','Head','LeftShoulder','RightShoulder'])set(name);set('LeftArm',0,0,1.3);set('RightArm',0,0,-1.3);set('LeftForeArm',0,0,.1);set('RightForeArm',0,0,-.1);set('LeftUpLeg',-.40,0,.12);set('LeftLeg',1.0);set('LeftFoot',-.20);set('RightUpLeg',.08,0,-.06);set('RightLeg',.18);set('RightFoot',-.08);
 for(const side of ['Left','Right'])for(const finger of ['Index','Middle','Ring','Pinky'])for(let i=1;i<=3;i++)set(side+'Hand'+finger+i,0,0,side==='Left'?-1.2:1.2);}
 function getSwingGrip(){root.updateMatrixWorld(true);return bones.LeftHand.getWorldPosition(new V()).add(bones.RightHand.getWorldPosition(new V())).multiplyScalar(.5);}
 function crouch(){bones.Hips.position.y=62;for(const b of Object.values(bones))b.quaternion.copy(rest.get(b));set('Spine',.42);set('Spine1',.20);set('Spine2',-.13);set('Head',-.43);set('LeftUpLeg',-1.35,0,.62);set('LeftLeg',2.0);set('LeftFoot',-.55);set('RightUpLeg',-1.02,0,-.85);set('RightLeg',1.9);set('RightFoot',-.75);set('LeftArm',.10,0,-.8);set('LeftForeArm',0,-.65,-.3);set('RightArm',-.45,.3,.9);set('RightForeArm',0,.35,.15);}
 function reachHand(side,target,weight){const upper=bones[side+'Arm'],lower=bones[side+'ForeArm'],hand=bones[side+'Hand'];root.updateMatrixWorld(true);const shoulder=upper.getWorldPosition(new V()),elbow=lower.getWorldPosition(new V()),wrist=hand.getWorldPosition(new V()),len1=shoulder.distanceTo(elbow),len2=elbow.distanceTo(wrist),toward=target.clone().sub(shoulder),distance=Math.min(toward.length(),len1+len2-.002);toward.normalize();const along=(len1*len1-len2*len2+distance*distance)/(2*Math.max(distance,.001)),height=Math.sqrt(Math.max(0,len1*len1-along*along));const bend=new V(0,-1,0).addScaledVector(toward,toward.y).normalize();const elbowGoal=shoulder.clone().addScaledVector(toward,along).addScaledVector(bend,height),handGoal=shoulder.clone().addScaledVector(toward,distance),axis=new V(side==='Left'?1:-1,0,0);
 for(const [bone,goal]of [[upper,elbowGoal],[lower,handGoal]]){const local=bone.parent.worldToLocal(goal.clone()).sub(bone.position).normalize();const desired=new T.Quaternion().setFromUnitVectors(axis,local);bone.quaternion.slerp(desired,weight);root.updateMatrixWorld(true);}}
 const basePose=new Map(Object.values(bones).map(b=>[b,{q:b.quaternion.clone(),p:b.position.clone()}]));
 function update(dt,state,t,menu=false){for(const [b,p]of basePose){b.quaternion.copy(p.q);b.position.copy(p.p);}const speed=Math.hypot(state.v.x,state.v.z);for(const [name,a]of Object.entries(actions))a.setEffectiveWeight(state.ground?(name===(speed>10?'run':speed>1?'walk':'idle')?1:0):0);mixer.update(dt);for(const [b,p]of basePose){p.q.copy(b.quaternion);p.p.copy(b.position);}if(menu){crouch();}else if(state.anchor){poseSwing(t);}else if(!state.ground){poseAir(t,false);}if(state.attack>0){set('RightArm',-.4,-1.0,.55);set('RightForeArm',0,.20,.15);}if(!menu){const overlay=heroOverlay(state,t);bones.Hips.position.y+=overlay.hip;for(const [name,angles]of Object.entries(overlay.bones)){const b=bones[name];if(b)b.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(...angles)));}}root.updateMatrixWorld(true);const event=state.event;if(!menu&&event?.actor===state&&event.target&&['punch','web'].includes(event.kind)){const dx=state.p.clone().sub(event.target.p).setY(0).normalize();const goal=event.target.p.clone().add(new V(0,event.target.boss?1.2*event.target.boss.scale:1.55,0)).addScaledVector(dx,.20);const ratio=event.t/event.contact,weight=ratio<1?Math.min(1,ratio*ratio):Math.max(0,1-(event.t-event.contact)/(event.duration-event.contact));reachHand('Right',goal,weight);}if(!menu&&event?.actor===state&&event.target&&['pickup','setdown'].includes(event.kind)){const weight=Math.sin(Math.min(1,event.t/event.duration)*Math.PI);for(const side of ['Left','Right']){const offset=(side==='Left'?1:-1)*.16;const goal=event.target.p.clone().add(new V(Math.cos(state.yaw)*offset,1.05,-Math.sin(state.yaw)*offset));reachHand(side,goal,weight);}}else if(!menu&&state.carrying&&state.carryTarget){reachHand('Right',state.carryTarget.p.clone().add(new V(0,.8,0)),.8);}if(state.anchor&&!menu){hero.updateMatrixWorld(true);reachHand('Left',hero.localToWorld(new V(0,2.59,0)),1);reachHand('Right',hero.localToWorld(new V(0,2.55,0)),1);root.updateMatrixWorld(true);}}
 const api={root,bones,maskRoot,suit,reachHand,getSwingGrip,poseSwing,update,crouch,poseAir,meshes};return api;
}

export const DECK_THICKNESS=.6;
export function roofLayout(b){const {x,z,w,d,h}=b;return{
 deck:h+DECK_THICKNESS,
 base:[[x,h+.3,z,w+.2,.6,d+.2],[x,h+3,z,w*.3,6,d*.25],[x+w*.26,h+2,z+d*.2,9,4,14],...(h>350?[[x,h+10,z,20,20,20],[x,h+32,z,1.1,45,1.1]]:[])],
 cooling:Array.from({length:4},(_,i)=>[x-w*.27+i*8,h+1.7,z-d*.23,5,3.4,7]),
 steps:Array.from({length:12},(_,i)=>[x-w*.3,h+.2+i*.27,z+d*.24+i*.38,3,.18,.44]),
 tank:{x:x+w*.3,y:h+3,z:z+d*.25,r:2.6,height:5}
 };}
export function boxCollider(a,kind='box'){return{x:a[0],z:a[2],minX:a[0]-a[3]/2,maxX:a[0]+a[3]/2,bottom:a[1]-a[4]/2,top:a[1]+a[4]/2,minZ:a[2]-a[5]/2,maxZ:a[2]+a[5]/2,kind};}
export function roofColliders(layout,detailed=false){const out=layout.base.map((a,i)=>boxCollider(a,i===0?'deck':'box'));if(detailed){out.push(...layout.cooling.map(a=>boxCollider(a)),...layout.steps.map(a=>boxCollider(a)));const t=layout.tank;out.push({...boxCollider([t.x,t.y,t.z,t.r*2,t.height,t.r*2],'cylinder'),r:t.r});}return out;}
export function containsXZ(c,x,z,pad=0){return c.kind==='cylinder'?Math.hypot(x-c.x,z-c.z)<=c.r+pad:x>=c.minX-pad&&x<=c.maxX+pad&&z>=c.minZ-pad&&z<=c.maxZ+pad;}
export function topAt(b,x,z,ceiling=Infinity){let y=0;for(const c of roofColliders(b.roofLayout,!!b.detailVisible))if(c.top<=ceiling&&containsXZ(c,x,z))y=Math.max(y,c.top);return y;}
export function clearRoofPoint(b,fraction=.3,side=1){const l=b.roofLayout,all=roofColliders(l,true);const candidates=[[fraction,side*.34],[-.34,side*.34],[.34,-.34],[-.34,-.34],[.05,.37],[.37,.05],[-.37,.08]];for(const [u,v]of candidates){const x=b.x+u*b.w,z=b.z+v*b.d;if(!all.some(c=>c.kind!=='deck'&&c.top>l.deck+.2&&containsXZ(c,x,z,1.4)))return{x,y:l.deck,z};}return{x:b.x+b.w*.4,y:l.deck,z:b.z+b.d*.4};}

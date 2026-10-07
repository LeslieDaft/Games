export const clamp01=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp01(x);return x*x*(3-2*x)};
export function pulse(t,a,b,c){return t<a||t>c?0:t<b?smooth((t-a)/(b-a)):1-smooth((t-b)/(c-b));}
// One clock owns both participants, the contact marker and completion.
export class EventDirector{
 constructor(){this.events=new Set();this.serial=0;}
 start(kind,actor,target,{duration=.72,contact=.28,onContact=()=>{},onFinish=()=>{},onStep=()=>{}}={}){
  if(actor.event||target?.event)return null;
  const e={id:++this.serial,kind,actor,target,t:0,duration,contact,hit:false,onContact,onFinish,onStep};actor.event=e;if(target)target.event=e;this.events.add(e);return e;
 }
 tick(dt){if(dt<=0)return;for(const e of [...this.events]){e.t=Math.min(e.duration,e.t+dt);e.onStep(e,dt);if(!e.hit&&e.t>=e.contact){e.hit=true;e.onContact(e);}if(e.t>=e.duration){this.release(e);e.onFinish(e);}}}
 release(e){if(e.actor.event===e)e.actor.event=null;if(e.target?.event===e)e.target.event=null;this.events.delete(e);}
 clear(){for(const e of [...this.events])this.release(e);}
}
export function npcPose(n,time){const p={lean:0,roll:0,bob:0,arms:[0,0],armZ:[0,0],elbows:[0,0],legs:[0,0],knees:[0,0],bound:0};
 const stride=n.down||n.web>0?0:Math.sin(time*(n.flee?12:8)+(n.phase||0))*(n.flee?.65:.25);
 p.arms=[stride,-stride];p.legs=[-stride,stride];p.elbows=n.flee?[-1.1,-1.1]:[-.1,-.1];p.knees=[Math.max(0,stride)*.7,Math.max(0,-stride)*.7];if(n.flee){p.lean=.15;p.bob=Math.abs(Math.sin(time*12))*.035;}
 if(n.event){const e=n.event,t=e.t;if(e.actor===n&&(e.kind==='enemyPunch')){const ext=pulse(t,0,e.contact,e.duration);p.arms[1]=-1.5*ext;p.elbows[1]=-.9*(1-ext);p.lean=.12*ext;p.legs=[-.08,.12];}else if(e.target===n&&e.hit&&['punch','swingKick','enemyPunch'].includes(e.kind)){const recoil=pulse(t,e.contact,e.contact+.12,e.duration);p.lean=-.42*recoil;p.arms=[-.5*recoil,-.9*recoil];p.knees=[.25*recoil,.25*recoil];}}
 if(n.boss&&n.event?.actor===n&&!n.event.hit){const e=n.event,u=smooth(e.t/e.contact),style=n.boss.style;if(['pulse','bolt','slash'].includes(style)){p.arms=[-1.45*u,-1.45*u];p.elbows=[-.25,-.25];p.lean=-.08*u;}else if(['smash','slam'].includes(style)){p.arms=[-2.7*u,-2.7*u];p.elbows=[-.35,-.35];p.knees=[.3*u,.3*u];p.lean=-.2*u;}else if(['charge','dive'].includes(style)){p.lean=.45*u;p.arms=[.3,.3];p.knees=[.3,.3];}}
 if(n.web>0){p.bound=smooth((7-n.web)/.28);p.arms=[-.6,-.6];p.elbows=[-1.5,-1.5];p.armZ=[-.35,.35];p.roll=Math.sin(time*9+(n.phase||0))*.055;p.lean=.10;}
 if(n.down>0){const fall=smooth((n.downAge||0)/.65),rise=smooth(n.down/1.4),amount=fall*rise;p.lean=-Math.PI/2*amount;p.bob=.15*amount;p.arms=[-.6*amount,-.4*amount];p.elbows=[-.9*amount,-.7*amount];p.knees=[.4*amount,.2*amount];p.legs=[-.2*amount,.15*amount];}
 if(n.rescueState==='waiting'){p.arms[1]=-2.5;p.elbows[1]=-.2+Math.sin(time*5)*.25;}
 if(n.rescueState==='carried'){p.arms=[-1.4,-1.4];p.elbows=[-1.1,-1.1];p.legs=[-.7,-.7];p.knees=[1.4,1.4];p.lean=.16;}
 if(n.rescueState==='safe'){p.arms[1]=-.3-.8*pulse(n.safeAge||0,.1,.5,2);p.elbows[1]=-1.1;}
 if(n.event&&['pickup','setdown'].includes(n.event.kind)){const e=n.event,u=smooth(e.t/e.duration),v=e.kind==='pickup'?u:1-u;p.lean=.16*v;p.arms=[-1.4*v,-1.4*v];p.elbows=[-1.1*v,-1.1*v];p.legs=[-.7*v,-.7*v];p.knees=[1.4*v,1.4*v];}
 return p;
}
// Additive bone rotations: the authored idle / walk / run / swing clips remain intact.
export function heroOverlay(s,time){const o={bones:{},hip:0};const add=(b,x=0,y=0,z=0)=>{o.bones[b]=[x,y,z]};
 if(s.jumpAge<.45){const a=1-smooth(s.jumpAge/.45);add('LeftUpLeg',-.35*a);add('RightUpLeg',-.25*a);add('LeftLeg',.35*a);add('RightLeg',.25*a);}
 if(s.landAge<.55){const a=Math.sin(clamp01(s.landAge/.55)*Math.PI);o.hip-=16*a;add('Spine',.25*a);add('LeftUpLeg',-.45*a);add('RightUpLeg',-.45*a);add('LeftLeg',.8*a);add('RightLeg',.8*a);}
 if(s.dodge>0){const a=Math.sin(clamp01(s.dodge/.55)*Math.PI);o.hip-=13*a;add('Spine',.25*a);add('LeftUpLeg',-.4*a);add('RightUpLeg',-.4*a);add('LeftLeg',.6*a);add('RightLeg',.6*a);}
 if(s.climbing){const a=Math.sin(time*7);add('LeftArm',-.4,0,.65+a*.2);add('RightArm',-.4,0,-.65+a*.2);add('LeftUpLeg',-.6-.25*a);add('RightUpLeg',-.6+.25*a);add('LeftLeg',.8);add('RightLeg',.8);}
 if(s.diving&&!s.anchor){add('Spine',-.18);add('LeftArm',0,0,-.5);add('RightArm',0,0,.5);add('LeftLeg',-.45);add('RightLeg',-.45);}
 if(s.zipping){add('RightArm',-.3,0,-1);add('RightForeArm',0,.25,0);add('LeftUpLeg',-.35);add('RightUpLeg',-.35);}
 if(s.hacking){add('RightArm',-.25,-.6,.20);add('RightForeArm',0,.6+Math.sin(time*12)*.1,0);add('Head',.15);}
 if(s.carrying){add('Spine',.13);add('RightArm',0,.25,.4);add('RightForeArm',0,1.2,0);}
 if(s.hurtAge<.5){const a=1-smooth(s.hurtAge/.5);add('Spine',-.25*a);add('Head',-.20*a);}
 const e=s.event;if(e&&e.actor===s){let reach=pulse(e.t,0,e.contact,e.duration);if(e.kind==='punch'){add('Spine2',0,-.35*reach,0);add('RightArm',.2*reach,-.40*reach,0);add('RightForeArm',0,-.25*reach,0);add('LeftForeArm',0,-.75*reach,0);}if(e.kind==='swingKick'){add('RightUpLeg',-1.15*reach);add('RightLeg',-.48*reach);add('Spine',-.25*reach);}if(e.kind==='web'){add('RightArm',.15,-.45,.15);add('RightForeArm',0,-.20,0);}if(['pickup','setdown'].includes(e.kind)){const bend=Math.sin(clamp01(e.t/e.duration)*Math.PI);o.hip-=26*bend;add('Spine',.4*bend);add('LeftUpLeg',-.65*bend);add('RightUpLeg',-.65*bend);add('LeftLeg',1.05*bend);add('RightLeg',1.05*bend);add('LeftArm',0,-.35*bend,.1);add('RightArm',0,.35*bend,-.1);}}
 if(s.defeatAge!=null){const a=smooth(s.defeatAge/.8);o.hip-=58*a;add('Spine',.8*a);add('Head',.5*a);add('LeftUpLeg',-1.2*a);add('RightUpLeg',-1.2*a);add('LeftLeg',2.1*a);add('RightLeg',2.1*a);}
 return o;
}

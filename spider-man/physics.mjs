// A locked pendulum radius: project both inward and outward drift immediately.
export function constrainRope(p,v,a,length){let x=p.x-a.x,y=p.y-a.y,z=p.z-a.z,d=Math.hypot(x,y,z);if(d<1e-9||length<=0)return false;x/=d;y/=d;z/=d;p.x=a.x+x*length;p.y=a.y+y*length;p.z=a.z+z*length;const radial=v.x*x+v.y*y+v.z*z;v.x-=radial*x;v.y-=radial*y;v.z-=radial*z;return true}
export function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
export function segmentBoxEntry(a,b,min,max){let lo=0,hi=1;for(const k of ['x','y','z']){const d=b[k]-a[k];if(Math.abs(d)<1e-8){if(a[k]<min[k]||a[k]>max[k])return null;}else{let t0=(min[k]-a[k])/d,t1=(max[k]-a[k])/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return null;}}return lo;}

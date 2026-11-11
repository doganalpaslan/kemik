// Analytic distances in parent geometry coordinates, in millimetres.
// Kept identical to the fragment shader for camera fitting and authoring checks.
export function primitiveDistance(p, position, normal) {
 const v=position.map((x,k)=>x-p.center[k]);let d;
 if(p.type==='capsule'){
  d=Infinity;
  for(let i=1;i<p.points.length;i++){
   const a=p.points[i-1],ab=p.points[i].map((x,k)=>x-a[k]),ap=position.map((x,k)=>x-a[k]);
   const t=Math.max(0,Math.min(1,ap.reduce((s,x,k)=>s+x*ab[k],0)/Math.max(ab.reduce((s,x)=>s+x*x,0),.0001)));
   d=Math.min(d,Math.hypot(...ap.map((x,k)=>x-t*ab[k]))-p.radius);
  }
 }else if(p.type==='box'){
  const q=v.map((x,k)=>Math.abs(x)-p.radii[k]);d=Math.hypot(...q.map(x=>Math.max(x,0)))+Math.min(Math.max(...q),0);
 }else{
  const local=p.basis?p.basis.map(axis=>axis.reduce((s,x,k)=>s+x*v[k],0)):v;
  const q=local.map((x,k)=>x/p.radii[k]),k0=Math.hypot(...q),k1=Math.hypot(...q.map((x,k)=>x/p.radii[k]));
  d=k0<.0001?-Math.min(...p.radii):(k0-1)*k0/Math.max(k1,.0001);
 }
 if(p.normal)d=Math.max(d,(p.cos-normal.reduce((s,x,k)=>s+x*p.normal[k],0))*8);
 if(p.clip)d=Math.max(d,v.reduce((s,x,k)=>s+x*p.clip.normal[k],0)-p.clip.offset);
 return d;
}
export const regionDistance=(region,position,normal)=>Math.min(...region.primitives.map(p=>primitiveDistance(p,position,normal)));

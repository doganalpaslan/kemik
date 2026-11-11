import * as THREE from './vendor/three.module.min.js?v=2a71b56-20261111T074743391Z';
let patches;
// Distance is evaluated per fragment on the original bone surface. No triangle
// is a paint primitive: even a coarse triangle can contain a curved boundary.
function paintMaterial(b,data,all,boneMaterial){
 const material=boneMaterial.clone(),radii=new THREE.Vector3(...data.region.radiiMm),anchor=new THREE.Vector3(...data.anchor);
 const path=data.region.path.map(p=>new THREE.Vector3(...p));
 const head=all['landmark-1212'].find(p=>p.side===data.side);
 material.polygonOffset=true;material.polygonOffsetFactor=-2;material.polygonOffsetUnits=-2;
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{paintCenter:{value:anchor},paintRadii:{value:radii},paintRed:{value:new THREE.Color(0xd0103a)},headCenter:{value:new THREE.Vector3(...head.anchor)},headAxis:{value:new THREE.Vector3(...head.normal)}});
  if(path.length)shader.uniforms.paintPath={value:path};
  shader.vertexShader='varying vec3 paintPosition;varying vec3 paintNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npaintPosition=position;paintNormal=normal;');
  shader.fragmentShader=`varying vec3 paintPosition;varying vec3 paintNormal;
   uniform vec3 paintCenter;uniform vec3 paintRadii;uniform vec3 paintRed;uniform vec3 headCenter;uniform vec3 headAxis;
   ${path.length?`uniform vec3 paintPath[${path.length}];`:''}
   float paintDistance(){
    vec3 q=(paintPosition-paintCenter)/paintRadii;
    float k=length(q);
    float d=(k-1.0)*k/max(length(q/paintRadii),0.0001);
    ${path.length?`d=10000.0;for(int i=0;i<${path.length-1};i++){vec3 a=paintPath[i];vec3 v=paintPath[i+1]-a;float t=clamp(dot(paintPosition-a,v)/dot(v,v),0.0,1.0);d=min(d,length(paintPosition-a-t*v)-5.0);}`:''}
    ${b.ta2===1213?`vec3 v=paintPosition-headCenter;float h=dot(v,headAxis);
     d=max(length(v-h*headAxis)-14.0,max(h+1.5,-8.0-h));
     // The superior dish belongs exclusively to fovea (1212).
     d=max(d,(abs(dot(normalize(paintNormal),headAxis))-.65)*10.0);`:''}
    ${b.ta2===1212?'d=max(d,(.55-dot(normalize(paintNormal),headAxis))*10.0);':''}
    ${[1150,1151].includes(b.ta2)?'d=max(d,(normalize(paintNormal).z+.08)*8.0);':''}
    ${b.ta2===1145?'d=max(d,(.08-normalize(paintNormal).z)*8.0);':''}
    return d;
   }\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float paintWeight=1.0-smoothstep(-${data.region.edgeMm/2},${data.region.edgeMm/2},paintDistance());
   diffuseColor.rgb=mix(diffuseColor.rgb,paintRed,paintWeight);`);
 };
 material.customProgramCacheKey=()=>`landmark-${b.ta2}-${path.length}`;
 return material;
}
export async function landmarkView(b,round,meshes,red,boneMaterial){
 patches??=fetch('assets/model/landmarks-upper.json'+new URL(import.meta.url).search).then(r=>{if(!r.ok)throw Error('Yapı yüzeyleri yüklenemedi');return r.json()});
 const all=await patches,data=all[b.id].find(p=>p.side===(round===2?1:-1));
 const parent=meshes.find(m=>m.name===data.mesh),geometry=parent.geometry,position=geometry.attributes.position,index=geometry.index;
 const overlay=new THREE.Group(),center=new THREE.Vector3(...data.anchor),normal=new THREE.Vector3(...data.normal);
 const indices=data.faces.flatMap(f=>[index.getX(f*3),index.getX(f*3+1),index.getX(f*3+2)]);
 const bounds=new THREE.Box3();for(const i of indices)bounds.expandByPoint(new THREE.Vector3().fromBufferAttribute(position,i));
 if(b.ta2===1213){const h=all['landmark-1212'].find(p=>p.side===data.side).anchor;bounds.set(new THREE.Vector3(h[0]-14,h[1]-9,h[2]-14),new THREE.Vector3(h[0]+14,h[1],h[2]+14));}
 const surface=new THREE.Mesh(geometry.clone(),paintMaterial(b,data,all,boneMaterial));surface.renderOrder=2;overlay.add(surface);
 const length=Math.max(7,Math.min(18,Math.max(...b.placement.radiiMm)*.55)),end=center.clone().addScaledVector(normal,length);
 const pin=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,length,6),new THREE.MeshBasicMaterial({color:0xd0103a}));pin.position.copy(center).lerp(end,.5);pin.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);pin.userData.leader=true;overlay.add(pin);
 const dot=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:0xd0103a}));dot.position.copy(end);dot.userData.leader=true;overlay.add(dot);
 for(const m of meshes){m.material=m===parent?boneMaterial:m.material;m.renderOrder=m===parent?1:0;m.userData.closeVisible=m===parent;
  // The opposite limb has no orienting value when framing one parent bone.
  m.userData.contextVisible=Math.sign(m.geometry.boundingBox.getCenter(new THREE.Vector3()).x)===data.side&&!(b.ta2===1156&&m!==parent);
 }
 for(const m of overlay.children){m.userData.contextVisible=true;m.userData.closeVisible=true;}
 surface.userData.fitIndices=[...new Set(indices)];
 const box=geometry.boundingBox.clone(),size=box.getSize(new THREE.Vector3());
 // Long bones: keep the relevant epiphysis and one third of the shaft.
 if(['humerus','radius','ulna'].includes(b.parentBone)){
  const f=(center.y-box.min.y)/size.y;
  if(f<.34)box.max.y=box.min.y+size.y/3;
  else if(f>.66)box.min.y=box.max.y-size.y/3;
  // Fit only the portion's vertices, avoiding a proximal end's lateral extent.
  const local=new THREE.Box3();for(let i=0;i<position.count;i++){const p=new THREE.Vector3().fromBufferAttribute(position,i);if(p.y>=box.min.y&&p.y<=box.max.y)local.expandByPoint(p);}box.copy(local);
 }
 if(b.parentBone==='clavicle'){
  const f=(center.x-box.min.x)/size.x;if(f<.33)box.max.x=box.min.x+size.x*.45;else if(f>.67)box.min.x=box.max.x-size.x*.45;
 }
 const mainIndices=[];for(let i=0;i<position.count;i++)if(box.containsPoint(new THREE.Vector3().fromBufferAttribute(position,i)))mainIndices.push(i);
 overlay.userData.mainFit={position,indices:mainIndices};
 let angle=Math.atan2(-normal.x,normal.z),tilt=Math.atan2(normal.y,Math.hypot(normal.x,normal.z));
 // Posterior scapular silhouette makes the superior medial angle unambiguous.
 if(b.ta2===1156){angle=data.side*-.18+Math.PI;tilt=.06;}
 if(b.ta2===1203){angle=data.side*.12;tilt=.12;}
 return {overlay,parent,surface,center,box,patchBox:bounds,angle,tilt,closeAngle:b.ta2===1203?data.side*-.18:angle+.4,closeTilt:b.ta2===1203?-.08:tilt-.18,side:data.side,triangles:data.faces.length};
}
export function disposeLandmark(overlay){if(!overlay)return;overlay.traverse(m=>{m.geometry?.dispose();m.material?.dispose()});}

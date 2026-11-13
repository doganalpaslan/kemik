import * as THREE from './vendor/three.module.min.js?v=7e23d8b-20261113T075044921Z';
import {regionDistance} from './landmark-primitives.js?v=7e23d8b-20261113T075044921Z';
const patches={};
// Only the current target's 1–6 primitives are uploaded. Float texture headers:
// center/type, radii/point count, normal/cosine, base plane, then path points.
function paintMaterial(data,boneMaterial){
 const material=boneMaterial.clone(),primitives=data.region.primitives;
 const pixels=new Float32Array(48*6*4);
 const put=(row,col,v)=>pixels.set(v,(row*48+col)*4);
 for(const [i,p] of primitives.entries()){
  put(i,0,[...p.center,p.type==='capsule'?2:p.type==='box'?1:0]);
  put(i,1,[...(p.radii||[p.radius,p.radius,p.radius]),p.points?.length||0]);
  put(i,2,[...(p.normal||[0,0,0]),p.cos??-1]);
  put(i,3,[...(p.clip?.normal||[0,0,0]),p.clip?.offset??100000]);
  p.points?.forEach((v,k)=>put(i,4+k,[...v,0]));
  if(p.type!=='capsule')(p.basis||[[1,0,0],[0,1,0],[0,0,1]]).forEach((v,k)=>put(i,4+k,[...v,0]));
 }
 const texture=new THREE.DataTexture(pixels,48,6,THREE.RGBAFormat,THREE.FloatType);texture.needsUpdate=true;
 material.userData.paintTexture=texture;
 material.polygonOffset=true;material.polygonOffsetFactor=-2;material.polygonOffsetUnits=-2;
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{paintData:{value:texture},paintCount:{value:primitives.length},paintEdge:{value:data.region.edgeMm},paintRed:{value:new THREE.Color(0xd0103a)}});
  shader.vertexShader='varying vec3 paintPosition;varying vec3 paintNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npaintPosition=position;paintNormal=normal;');
  shader.fragmentShader=`varying vec3 paintPosition;varying vec3 paintNormal;
   uniform sampler2D paintData;uniform int paintCount;uniform float paintEdge;uniform vec3 paintRed;
   vec4 paintRead(int row,int col){return texelFetch(paintData,ivec2(col,row),0);}
   float paintDistance(){
    float result=100000.0;vec3 n=normalize(paintNormal);
    for(int i=0;i<6;i++){
     if(i>=paintCount)break;
     vec4 c=paintRead(i,0),r=paintRead(i,1),cone=paintRead(i,2),plane=paintRead(i,3);
     vec3 v=paintPosition-c.xyz;float d;
     if(c.w>1.5){
      d=100000.0;vec3 a=paintRead(i,4).xyz;
      for(int j=1;j<44;j++){
       if(float(j)>=r.w)break;
       vec3 b=paintRead(i,4+j).xyz,ab=b-a;
       float t=clamp(dot(paintPosition-a,ab)/max(dot(ab,ab),.0001),0.0,1.0);
       d=min(d,length(paintPosition-a-t*ab)-r.x);a=b;
      }
     }else if(c.w>.5){vec3 q=abs(v)-r.xyz;d=length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);}
     else {vec3 local=vec3(dot(v,paintRead(i,4).xyz),dot(v,paintRead(i,5).xyz),dot(v,paintRead(i,6).xyz));vec3 q=local/r.xyz;float k=length(q);d=k<.0001?-min(r.x,min(r.y,r.z)):(k-1.0)*k/max(length(q/r.xyz),.0001);}
     d=max(d,(cone.w-dot(n,cone.xyz))*8.0);
     d=max(d,dot(v,plane.xyz)-plane.w);result=min(result,d);
    }return result;
   }\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float paintWeight=1.0-smoothstep(-paintEdge*.5,paintEdge*.5,paintDistance());
   if(paintWeight<.001)discard;
   ${data.skull?.cutY?'if(paintPosition.y>'+data.skull.cutY.toFixed(3)+')discard;':''}
   ${data.skull?.keepSide?'if(paintPosition.x*'+data.skull.keepSide.toFixed(1)+'<0.0)discard;':''}
   diffuseColor.rgb=mix(diffuseColor.rgb,paintRed,paintWeight);`);
 };
 material.customProgramCacheKey=()=> 'landmark-analytic-v28-'+(data.skull?.cutY??'none')+'-'+(data.skull?.keepSide??0);
 return material;
}
export async function landmarkView(b,round,meshes,red,boneMaterial,glass,isCurrent=()=>true){
 const chunk=b.curriculumRegion==='upper'?'upper':b.curriculumRegion;
 patches[chunk]??=fetch('assets/model/landmarks-'+chunk+'.json'+new URL(import.meta.url).search).then(r=>{if(!r.ok)throw Error('Yapı yüzeyleri yüklenemedi');return r.json()});
 const all=await patches[chunk];if(!isCurrent())return null;
 const data=all[b.id].find(p=>p.side===(round===2?1:-1));
 const parent=meshes.find(m=>m.name===data.mesh),geometry=parent.geometry,position=geometry.attributes.position,index=geometry.index;
 const cutTest=[data.skull?.cutY?`if(skullPosition.y>${data.skull.cutY.toFixed(3)})discard;`:'',data.skull?.keepSide?`if(skullPosition.x*${data.skull.keepSide.toFixed(1)}<0.0)discard;`:''].join('');
 boneMaterial.onBeforeCompile=shader=>{
  if(!cutTest)return;
  shader.vertexShader='varying vec3 skullPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nskullPosition=position;');
  shader.fragmentShader='varying vec3 skullPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+cutTest);
 };
 boneMaterial.customProgramCacheKey=()=> 'skull-cut-'+cutTest;boneMaterial.needsUpdate=true;
 const overlay=new THREE.Group(),center=new THREE.Vector3(...data.anchor),normal=new THREE.Vector3(...data.normal);
 const indices=[];
 for(let i=0;i<position.count;i++){
  const v=new THREE.Vector3().fromBufferAttribute(position,i),n=new THREE.Vector3().fromBufferAttribute(geometry.attributes.normal,i);
  if(regionDistance(data.region,v.toArray(),n.toArray())<data.region.edgeMm)indices.push(i);
 }
 const bounds=new THREE.Box3(new THREE.Vector3(...data.bounds[0]),new THREE.Vector3(...data.bounds[1]));
 const surfaces=[];
 const paintedGeometry=geometry.clone();
 const surface=new THREE.Mesh(paintedGeometry,paintMaterial(data,boneMaterial));surface.renderOrder=2;overlay.add(surface);surfaces.push(surface);
 for(const id of data.paintMeshes||[]){if(id===data.mesh)continue;const neighbor=meshes.find(m=>m.name===id);if(!neighbor)continue;
  const pos=neighbor.geometry.attributes.position,norm=neighbor.geometry.attributes.normal,indices=[];
  for(let i=0;i<pos.count;i++)if(regionDistance(data.region,new THREE.Vector3().fromBufferAttribute(pos,i).toArray(),new THREE.Vector3().fromBufferAttribute(norm,i).toArray())<data.region.edgeMm)indices.push(i);
  if(!indices.length)continue;const extra=new THREE.Mesh(neighbor.geometry.clone(),paintMaterial(data,boneMaterial));extra.renderOrder=2;extra.userData.fitIndices=indices;overlay.add(extra);surfaces.push(extra);
 }
 const length=Math.max(7,Math.min(18,Math.max(...b.placement.radiiMm)*.55)),end=center.clone().addScaledVector(normal,length);
 const pin=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,length,6),new THREE.MeshBasicMaterial({color:0xd0103a}));pin.position.copy(center).lerp(end,.5);pin.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);pin.userData.leader=true;overlay.add(pin);
 const dot=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:0xd0103a}));dot.position.copy(end);dot.userData.leader=true;overlay.add(dot);
 for(const m of meshes){m.material=m===parent?boneMaterial:data.skull?glass:m.material;m.renderOrder=m===parent?1:0;m.userData.closeVisible=m===parent||!!data.skull;
  // The opposite limb has no orienting value when framing one parent bone.
  m.userData.contextVisible=b.curriculumRegion==='skull'?(!/tooth/.test(m.userData.meta?.name||'')&&!(data.skull.hideMandible&&m.name==='52748')&&!(data.skull.view==='inside'&&['52788','52789'].includes(m.name))):b.curriculumRegion==='upper'?(m===parent||Math.sign(m.geometry.boundingBox.getCenter(new THREE.Vector3()).x)===data.side)&&!(b.ta2===1156&&m!==parent):m===parent;
 }
 for(const m of overlay.children){m.userData.contextVisible=!b.reviewOnly;m.userData.closeVisible=!b.reviewOnly;if(b.reviewOnly)m.userData.leader=false;}
 if(b.reviewOnly){indices.length=0;for(let i=0;i<position.count;i++)if(new THREE.Vector3().fromBufferAttribute(position,i).distanceTo(center)<20)indices.push(i);}
 surface.userData.fitIndices=[...new Set(indices)];
 // Sparse source vertices can underestimate an analytic surface patch's width.
 // Its authored bounds also include the interior of triangles crossed by the mask.
 if(b.curriculumRegion==='skull'&&indices.length<6)overlay.userData.targetBounds=bounds;
 if(data.opening){
  const points=data.opening.fill.map(p=>new THREE.Vector3(...p)),middle=new THREE.Vector3();points.forEach(p=>middle.add(p));middle.divideScalar(points.length);
  const vertices=[];for(let i=0;i<points.length;i++)vertices.push(...middle,...points[i],...points[(i+1)%points.length]);
  const fillGeometry=new THREE.BufferGeometry();fillGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  const fill=new THREE.Mesh(fillGeometry,new THREE.MeshBasicMaterial({color:0xd0103a,opacity:.16,transparent:true,side:THREE.DoubleSide,depthWrite:false}));fill.renderOrder=3;fill.userData.contextVisible=true;fill.userData.closeVisible=true;overlay.add(fill);
 }
 const box=geometry.boundingBox.clone(),size=box.getSize(new THREE.Vector3());
 // Long bones: keep the relevant epiphysis and one third of the shaft.
 if(['humerus','radius','ulna','femur','tibia','fibula'].includes(b.parentBone)&&(b.curriculumRegion==='upper'||b.placement.radiiMm[1]<size.y*.12)){
  const f=(center.y-box.min.y)/size.y;
  if(f<.34)box.max.y=box.min.y+size.y/3;
  else if(f>.66)box.min.y=box.max.y-size.y/3;
  // Fit only the portion's vertices, avoiding a proximal end's lateral extent.
  const local=new THREE.Box3();for(let i=0;i<position.count;i++){const p=new THREE.Vector3().fromBufferAttribute(position,i);if(p.y>=box.min.y&&p.y<=box.max.y)local.expandByPoint(p);}box.copy(local);
 }
 if(b.parentBone==='clavicle'){
  const f=(center.x-box.min.x)/size.x;if(f<.33)box.max.x=box.min.x+size.x*.45;else if(f>.67)box.min.x=box.max.x-size.x*.45;
 }
 if(data.skull?.keepSide){if(data.side<0)box.max.x=0;else box.min.x=0;}
 if(data.skull){box.intersect(new THREE.Box3().setFromCenterAndSize(center,new THREE.Vector3().setScalar(data.skull.focusMm*2)));}
 const mainIndices=[];for(let i=0;i<position.count;i++)if(box.containsPoint(new THREE.Vector3().fromBufferAttribute(position,i)))mainIndices.push(i);
 overlay.userData.mainFit={position,indices:mainIndices};
 const viewNormal=new THREE.Vector3(...(data.viewNormal||data.normal));
 let angle=Math.atan2(-viewNormal.x,viewNormal.z),tilt=Math.atan2(viewNormal.y,Math.hypot(viewNormal.x,viewNormal.z));
 // Posterior scapular silhouette makes the superior medial angle unambiguous.
 if(b.ta2===1156){angle=data.side*-.18+Math.PI;tilt=.06;}
 if(b.ta2===1203){angle=data.side*.12;tilt=.12;}
 if(b.placement.view){angle=b.placement.view.angle;tilt=b.placement.view.tilt;}
 if(b.parentBone==='atlas'){tilt=.65;if(/posterior|posterius/.test(b.latin))angle=Math.PI-.15;else angle=.15;}
 if(b.parentBone==='atlas'&&/fovea dentis/.test(b.latin)){angle=Math.PI;tilt=.3;}
 if(b.parentBone==='atlas'&&/facies articularis inferior/.test(b.latin)){angle=data.side*.2;tilt=-1.05;}
 if(b.parentBone==='sacrum'){
  if(/pelvica|promontorium/.test(b.latin)){angle=0;tilt=.15;}
  if(/dorsalis|mediana|cornu/.test(b.latin)){angle=Math.PI;tilt=.15;}
  if(/basis|ala /.test(b.latin)){angle=0;tilt=1.5;}
 }
 if(b.parentBone==='hip'&&/fossa iliaca|facies glutea/.test(b.latin)){angle=data.side*(/fossa/.test(b.latin)?1.25:-1.25);tilt=.1;}
 if(['manubrium','sternal-body','xiphoid'].includes(b.parentBone)){angle=.12;tilt=.1;}
 if(b.parentBone==='manubrium'&&/incisura clavicularis/.test(b.latin)){angle=-data.side*1.15;tilt=.3;}
 if(/linea aspera/.test(b.latin)){angle=Math.PI;tilt=.05;}
 if(/margo anterior tibiae/.test(b.latin)){angle=.08;tilt=.05;}
 if(b.parentBone==='tibia'&&/facies articularis superior/.test(b.latin)){angle=.12;tilt=1.05;}
 // Authored target cameras apply to both renderers and both paired sides.
 if(data.camera){angle=data.camera.angle;tilt=data.camera.tilt;}
 return {cutY:data.skull?.cutY,overlay,surfaces,parent,surface,center,box,patchBox:bounds,angle,tilt,closeAngle:data.camera?.closeAngle??(b.ta2===1203?data.side*-.18:angle+.4),closeTilt:data.camera?.closeTilt??(b.ta2===1203?-.08:tilt-.18),side:data.side,triangles:geometry.index.count/3};
}
export function disposeLandmark(overlay){if(!overlay)return;overlay.traverse(m=>{m.geometry?.dispose();m.material?.userData.paintTexture?.dispose();m.material?.dispose()});}

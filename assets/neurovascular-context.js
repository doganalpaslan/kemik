import * as THREE from './vendor/three.module.min.js?v=5f66eee-20261113T081548612Z';
export const hasContextTree=b=>b.module==='vessels'||b.module==='nerves';
export function treeKind(meta){
 if(meta.kind==='nerve')return 'nerve';
 return /vein|venous|sinus/i.test(meta.sourceObject||meta.id)?'vein':'artery';
}
// Merge existing indexed surfaces by colour and side. The originals remain in
// the decoded region cache for the next target; only these draw buffers change.
export function contextTree(meshes,targetIDs,materials){
 const group=new THREE.Group(),buckets=new Map();
 for(const m of meshes){
  if(!['vessel','nerve'].includes(m.userData.kind)||targetIDs.includes(m.name))continue;
  const box=m.geometry.boundingBox,side=box.min.x>=0?1:box.max.x<=0?-1:0,key=`${treeKind(m.userData.meta)}:${side}`;
  if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(m);
 }
 for(const [key,parts] of buckets){
  let vertices=0,count=0;for(const m of parts){vertices+=m.geometry.attributes.position.count;count+=m.geometry.index.count;}
  const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3),indices=new Uint32Array(count);let v=0,j=0;
  for(const m of parts){const g=m.geometry;positions.set(g.attributes.position.array,v*3);normals.set(g.attributes.normal.array,v*3);for(const i of g.index.array)indices[j++]=i+v;v+=g.attributes.position.count;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('normal',new THREE.BufferAttribute(normals,3));g.setIndex(new THREE.BufferAttribute(indices,1));g.computeBoundingBox();
  const m=new THREE.Mesh(g,materials[key.split(':')[0]]);m.renderOrder=1;m.userData.contextVisible=true;m.userData.closeVisible=true;m.userData.tree=true;m.userData.side=Number(key.split(':')[1]);group.add(m);
 }
 return group;
}
export function disposeContextTree(group){group?.traverse(m=>m.geometry?.dispose());}
export function courseBox(b,target,meshes){
 // A local window includes the upstream junction and the start of downstream
 // branches without shrinking fine targets to a whole-body silhouette.
 const extent=target.getSize(new THREE.Vector3());
 let local=target;
 // Tiny paired branches disappear when the empty space between limbs dominates
 // the frame. Show one anatomical side with its parent course in the main view.
 if(extent.x>180&&extent.y<(b.module==='nerves'?100:55)){
  const parts=meshes.filter(m=>b.meshes.includes(m.name));
  if(parts.length>1&&parts.every(m=>m.geometry.boundingBox.getSize(new THREE.Vector3()).length()<(b.module==='nerves'?100:65))){
   const side=Math.sign(parts[0].geometry.boundingBox.getCenter(new THREE.Vector3()).x);local=new THREE.Box3();
   for(const m of parts)if(Math.sign(m.geometry.boundingBox.getCenter(new THREE.Vector3()).x)===side)local.union(m.geometry.boundingBox);
  }
 }
 const box=local.clone(),pad=local!==target&&b.module==='nerves'?45:b.curriculumRegion==='head'?40:b.curriculumRegion==='neck'?65:80;
 box.expandByScalar(pad);
 // Iliac courses must include the aortic bifurcation and femoral origin.
 if(b.meshes.some(id=>/iliac/i.test(id))){
  for(const m of meshes)if(/Common_iliac/i.test(m.name))box.union(m.geometry.boundingBox);
  box.expandByScalar(15);
 }
 return box;
}

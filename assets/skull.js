import * as THREE from './vendor/three.module.min.js?v=bfbdb39-20261111T155240608Z';
import {landmarkView,disposeLandmark} from './landmark-view.js?v=bfbdb39-20261111T155240608Z';
import {headNeckGroup,headNeckProfiles,contextVisible} from './head-neck-context.js?v=bfbdb39-20261111T155240608Z';
// Region files are loaded on demand. Inactive decoded regions are evicted beyond five; the active context stays loaded.
export async function createSkull(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xfaf9f6,0);
 const closeCanvas=document.createElement('canvas');closeCanvas.id='close-view';closeCanvas.setAttribute('aria-hidden','true');canvas.after(closeCanvas);
 let closeRenderer;
 function getCloseRenderer(){if(!closeRenderer){closeRenderer=new THREE.WebGLRenderer({canvas:closeCanvas,antialias:true,alpha:true,powerPreference:'low-power'});closeRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));closeRenderer.setClearColor(0x000000,0);closeRenderer.toneMapping=renderer.toneMapping;closeRenderer.toneMappingExposure=renderer.toneMappingExposure;closeRenderer.setSize(closeCanvas.clientWidth,closeCanvas.clientHeight,false)}return closeRenderer}
 // Glass is unlit so studio lighting cannot wash its grey tint out to white.
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;

 const scene=new THREE.Scene(),pivot=new THREE.Group(),root=new THREE.Group();pivot.add(root);scene.add(pivot);
 scene.add(new THREE.HemisphereLight(0xffffff,0x999999,1.4));
 const light=new THREE.DirectionalLight(0xffffff,1.6);light.position.set(-3,5,6);scene.add(light);
 const gray=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:false,
  uniforms:{skullCut:{value:100000},dark:{value:false},edgeFade:{value:false},viewSize:{value:new THREE.Vector2()},viewOrigin:{value:new THREE.Vector2()}},
  vertexShader:`varying vec3 surfaceNormal;varying float rawY;
   void main(){rawY=position.y;surfaceNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform float skullCut;varying float rawY;uniform bool dark;uniform bool edgeFade;uniform vec2 viewSize;uniform vec2 viewOrigin;varying vec3 surfaceNormal;
   void main(){
    if(rawY>skullCut)discard;
    float rim=pow(1.0-abs(normalize(surfaceNormal).z),2.0);
    // Softer dark-theme faces; stronger rims preserve sutures and silhouettes.
    vec3 tint=dark?mix(vec3(0.34),vec3(0.52),rim):mix(vec3(0.18),vec3(0.075),rim);
    float alpha=dark?mix(0.14,0.30,rim):mix(0.30,0.48,rim);
    if(edgeFade){vec2 p=((gl_FragCoord.xy-viewOrigin)/viewSize-0.5)*2.0;alpha*=1.0-smoothstep(0.65,1.0,length(p));}
    gl_FragColor=vec4(tint,alpha);
    #include <colorspace_fragment>
   }`
 });
 // Opacity stays one; the transparent queue allows this solid target to render
 // after both glass passes. Depth testing still preserves the target's own shape.
 const faint=gray.clone();faint.fragmentShader=faint.fragmentShader.replace('gl_FragColor=vec4(tint,alpha);','gl_FragColor=vec4(tint,alpha*0.13);');
 const contextGlass=gray.clone();contextGlass.fragmentShader=contextGlass.fragmentShader.replace('gl_FragColor=vec4(tint,alpha);','gl_FragColor=vec4(tint,alpha*0.30);');
 const eyeballGlass=gray.clone();eyeballGlass.fragmentShader=eyeballGlass.fragmentShader.replace('gl_FragColor=vec4(tint,alpha);','gl_FragColor=vec4(tint,alpha*0.65);');
 const boneMaterial=new THREE.MeshStandardMaterial({color:0xeee3cc,roughness:.8});
 let landmarkOverlay=null;
 const red=new THREE.MeshStandardMaterial({color:0xd0103a,roughness:.58,metalness:0,transparent:true,opacity:1});
 const halo=new THREE.Mesh(new THREE.RingGeometry(.87,1,64),new THREE.MeshBasicMaterial({color:0xd0103a,transparent:true,opacity:.8,depthTest:false,depthWrite:false}));halo.renderOrder=3;halo.visible=false;scene.add(halo);
 const response=await fetch('assets/model/manifest.json'+new URL(import.meta.url).search);if(!response.ok)throw Error('Model dizini yüklenemedi');const manifest=await response.json();
 const cache=new Map();let request=0,running=true,lastId='',activeBone,angle=0,targetAngle=0,tilt=.08,targetTilt=.08,frame,mainCenter=new THREE.Vector3(),closeCenter=new THREE.Vector3(),mainSize=100,closeSize=50,ready=false,mainBox=new THREE.Box3(),closeBox=new THREE.Box3(),closeSide=0,closeTargets=[],closeAngle=0;
 const camera=new THREE.OrthographicCamera(-200,200,200,-200,.1,5000);camera.position.set(0,0,2000);camera.lookAt(0,0,0);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const observer=new ResizeObserver(()=>{const {width,height}=canvas.getBoundingClientRect();renderer.setSize(width,height,false);closeRenderer?.setSize(closeCanvas.clientWidth,closeCanvas.clientHeight,false)});observer.observe(canvas);
 async function load(region,anatomical=false){
  const cacheKey=region+(anatomical=== 'landmarks'?':raw':anatomical?':anatomical':'');
  if(cache.has(cacheKey)){const v=cache.get(cacheKey);cache.delete(cacheKey);cache.set(cacheKey,v);return v;}
  const res=await fetch(`assets/model/${region==='skull'?'skull':region}.bin`+new URL(import.meta.url).search);if(!res.ok)throw Error('Bölge yüklenemedi');const buffer=await res.arrayBuffer(),group=new THREE.Group();
  const entries=manifest.filter(m=>m.region===region);
  // Bring the paired hands/feet together without changing their internal anatomical relationships.
  const sideCenters={};
  if(!anatomical&&(region==='hand'||region==='foot'))for(const side of [-1,1]){const box=new THREE.Box3();for(const item of entries){const p=new Float32Array(buffer,item.offset,item.vertices*3);for(let i=0;i<p.length;i+=3)if(Math.sign(p[i])===side)box.expandByPoint(new THREE.Vector3(p[i],p[i+1],p[i+2]));}sideCenters[side]=box.getCenter(new THREE.Vector3()).x;}
  for(const item of entries){
   const source=new Float32Array(buffer,item.offset,item.vertices*3),points=new Float32Array(source.length);
   for(let i=0;i<source.length;i+=3){let x=source[i];if(anatomical===true&&(region.endsWith('hand')||region.endsWith('foot'))){const center=region.endsWith('hand')?270:100;x=x-Math.sign(x)*center+Math.sign(x)*(region.endsWith('hand')?65:75);}if(sideCenters[Math.sign(x)]!==undefined)x=x-sideCenters[Math.sign(x)]+Math.sign(x)*(region==='hand'?65:75);points[i]=x;points[i+1]=source[i+2];points[i+2]=-source[i+1];}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(points,3));g.setIndex(new THREE.BufferAttribute(new Uint16Array(buffer,item.offset+source.byteLength,item.indices),1));g.computeVertexNormals();g.computeBoundingBox();
   const add=geometry=>{const mesh=new THREE.Mesh(geometry,gray);mesh.name=item.id;mesh.userData.kind=item.kind;mesh.userData.meta=item;mesh.userData.fitIndices=[...new Set(geometry.index.array)];group.add(mesh);};
   // BP3D stores some paired groups in one mesh. Split their triangles at the
   // sagittal plane so the second view can select a single anatomical side.
   if(item.kind==='muscle'&&!['13295','46841'].includes(item.id)&&g.boundingBox.min.x< -2&&g.boundingBox.max.x>2&&Math.abs(g.boundingBox.getCenter(new THREE.Vector3()).x)<2){
    const sides=[[],[]],index=g.index.array;
    for(let i=0;i<index.length;i+=3){const x=(points[index[i]*3]+points[index[i+1]*3]+points[index[i+2]*3])/3;sides[x<0?0:1].push(index[i],index[i+1],index[i+2]);}
    for(const indices of sides)if(indices.length){const part=g.clone();part.setIndex(indices);part.computeBoundingBox();const bounds=new THREE.Box3();for(const i of indices)bounds.expandByPoint(new THREE.Vector3().fromBufferAttribute(part.attributes.position,i));part.boundingBox=bounds;add(part);}
    g.dispose();
   }else add(g);
  }
  cache.set(cacheKey,group);
  return group;
 }
 async function setBone(b,r){
  if(lastId===`${b.id}:${r}`)return;lastId=`${b.id}:${r}`;activeBone=b;ready=false;const token=++request;canvas.dataset.loading='true';canvas.dataset.bone=b.id;
  canvas.parentElement.classList.toggle('landmark-stage',b.module==='landmarks');
  const loading=document.querySelector('#loading');loading.hidden=false;loading.textContent='Anatomi modeli yükleniyor.';
  try{
   const profile=b.region?.startsWith('muscles-z-')?headNeckProfiles[headNeckGroup(b.id)]:null;
   const regions=profile?[...profile.regions,b.region]:b.context?[...(b.contextRegions||[b.context]),b.region]:b.region==='ossicles'?['skull','ossicles']:b.region==='arm'?['shoulder','arm','forearm']:b.region==='thigh'?['pelvis','thigh','knee']:b.region==='knee'?['thigh','knee','leg']:[b.region||'skull'];const groups=await Promise.all(regions.map(region=>load(region,b.module==='landmarks'||b.contextRegions?'landmarks':!!b.context)));if(token!==request)return;disposeLandmark(landmarkOverlay);landmarkOverlay=null;root.clear();root.add(...groups);const meshes=groups.flatMap(g=>g.children);
   const whole=new THREE.Box3(),target=new THREE.Box3();
   for(const m of meshes){const active=b.meshes.includes(m.name);m.material=active?(b.module==='landmarks'?gray:red):b.context&&['muscle','nerve','vessel'].includes(m.userData.kind)?faint:profile?(m.userData.meta.contextKind==='eyeball'?eyeballGlass:contextGlass):gray;m.renderOrder=active?2:0;m.userData.contextVisible=!profile||active||contextVisible(headNeckGroup(b.id),m.userData.meta);if(m.userData.contextVisible)whole.union(m.geometry.boundingBox);if(active)target.union(m.geometry.boundingBox);}
   if(target.isEmpty())throw Error('Hedef ağı bulunamadı');
   whole.getCenter(mainCenter);target.getCenter(closeCenter);mainBox.copy(whole);closeBox.copy(target);
   if(b.context){
    const extent=target.getSize(new THREE.Vector3()),minimum=profile?profile.minimum:b.closeCamera?18:{skull:90,neck:100,trunk:180,shoulder:160,arm:150,forearm:130,hand:65,pelvis:170,thigh:170,leg:140,foot:70}[b.context];
    mainCenter.copy(closeCenter);mainBox.setFromCenterAndSize(mainCenter,new THREE.Vector3(Math.max(extent.x*1.4,minimum),Math.max(extent.y*1.4,minimum),Math.max(extent.z*1.4,minimum)));
   }
   const size=whole.getSize(new THREE.Vector3());mainSize=Math.max(size.y,size.x,size.z)*.56;
   // For long paired limbs, provide a full regional context in the main view.
   const ts=target.getSize(new THREE.Vector3());closeSize=Math.max(ts.x,ts.y,ts.z)*.65;
   // A bilateral target has lateral centers on both sides of the midline.
   // Central chains (vertebrae, sternum) must retain their entire target.
   const targets=meshes.filter(m=>b.meshes.includes(m.name));
   const lateralThreshold=Math.max(3,ts.x*.15);
   const centers=targets.map(m=>m.geometry.boundingBox.getCenter(new THREE.Vector3()).x);
   closeSide=centers.some(x=>x>lateralThreshold)&&centers.some(x=>x< -lateralThreshold)?Math.sign(centers[0]):0;
   if(closeSide){
    closeBox.makeEmpty();
    for(const m of targets)if(Math.sign(m.geometry.boundingBox.getCenter(new THREE.Vector3()).x)===closeSide)closeBox.union(m.geometry.boundingBox);
    closeBox.getCenter(closeCenter);
   }
   for(const m of meshes){
    const x=m.geometry.boundingBox.getCenter(new THREE.Vector3()).x;
    m.userData.closeVisible=!closeSide||Math.abs(x)<3||Math.sign(x)===closeSide;
   }
   closeTargets=targets.filter(m=>m.userData.closeVisible);
   // Long thin structures need a local detail view, while the main view keeps
   // their full source course. Fit existing vertices around the middle segment.
   const detail=b.contextRegions&&closeBox.getSize(new THREE.Vector3()).y>250;
   canvas.dataset.closeDetail=String(!!detail);
   for(const m of closeTargets){
    const p=m.geometry.attributes.position;
    const subset=detail?m.userData.fitIndices.filter(i=>Math.abs(p.getY(i)-closeCenter.y)<65):null;
    m.userData.closeFitIndices=subset?.length>10?subset:m.userData.fitIndices;
   }

   if(b.region==='ossicles'){mainCenter.lerp(closeCenter,.35);mainBox.setFromCenterAndSize(mainCenter,new THREE.Vector3(180,180,180));}
   if(b.region==='knee'){mainCenter.copy(closeCenter);mainBox.setFromCenterAndSize(mainCenter,new THREE.Vector3(230,210,160));}
   for(const [k,g] of cache){if(cache.size<=5)break;if(!groups.includes(g)){cache.delete(k);g.traverse(m=>m.geometry?.dispose());}}
   targetAngle=(b.angle||.25)+(r===2?Math.PI:0);targetTilt=(b.tilt||0)+(['foot','muscles-foot'].includes(b.region)?-.55:.08);
   angle=targetAngle;tilt=targetTilt;closeAngle=angle+.55;
   if(b.context){
    // Pick an oblique view with a broad target silhouette. A fixed side angle
    // can turn thin muscles (pectoralis, sartorius, deep back) edge-on.
    let best=-Infinity;const point=new THREE.Vector3();
    for(const offset of [.45,-.45,.75,-.75,1.05,-1.05]){
     const rotation=new THREE.Euler(tilt-.18,angle+offset,0);let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
     for(const m of closeTargets)for(const i of m.userData.closeFitIndices||m.userData.fitIndices){point.fromBufferAttribute(m.geometry.attributes.position,i).sub(closeCenter).applyEuler(rotation);minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);}
     const score=(maxX-minX)*(maxY-minY);if(score>best){best=score;closeAngle=angle+offset;}
    }
   }
   if(b.module==='landmarks'){
    const v=await landmarkView(b,r,meshes,red,boneMaterial,contextGlass,()=>token===request);
    if(!v)return;
    if(token!==request){disposeLandmark(v.overlay);return;}
    gray.uniforms.skullCut.value=v.cutY??100000;contextGlass.uniforms.skullCut.value=v.cutY??100000;
    landmarkOverlay=v.overlay;root.add(v.overlay);mainBox.copy(v.box);mainBox.expandByScalar(8);mainBox.getCenter(mainCenter);
    closeBox.copy(v.patchBox);v.patchBox.getCenter(closeCenter);closeTargets=v.surfaces||[v.surface];
    targetAngle=v.angle;targetTilt=v.tilt;angle=targetAngle;tilt=targetTilt;closeAngle=v.closeAngle;landmarkCloseTilt=v.closeTilt;
    canvas.dataset.landmarkSide=String(v.side);canvas.dataset.landmarkTriangles=String(v.triangles);canvas.dataset.parentMesh=v.parent.name;
   }else{gray.uniforms.skullCut.value=100000;contextGlass.uniforms.skullCut.value=100000;boneMaterial.onBeforeCompile=()=>{};boneMaterial.customProgramCacheKey=()=> 'uncut';boneMaterial.needsUpdate=true;delete canvas.dataset.landmarkSide;delete canvas.dataset.landmarkTriangles;delete canvas.dataset.parentMesh;}
   canvas.dataset.contextGroup=profile?headNeckGroup(b.id):'';canvas.dataset.contextMeshes=meshes.filter(m=>m.userData.contextVisible&&!b.meshes.includes(m.name)&&m.userData.kind!=='muscle').map(m=>m.name).join(',');
   canvas.dataset.loading='false';loading.hidden=true;ready=true;
   document.querySelector('.model-note').textContent=b.region==='skull'?'BodyParts3D · CC BY-SA 2.1 JP / Z-Anatomy · CC BY-SA 4.0':b.modelLicense?b.modelLicense:b.region==='ossicles'?'Z-Anatomy · CC BY-SA 4.0':'BodyParts3D · CC BY-SA 2.1 JP';
   canvas.setAttribute('aria-label',r===0?`${b.tr} kırmızı renkle gösteriliyor.`:'Sorulan yapı kırmızı renkle gösteriliyor.');
  }catch(error){if(token!==request)return;console.error(error);loading.hidden=false;lastId='';loading.textContent='Model yüklenemedi. Ad ve ipuçlarıyla devam edebilirsiniz. Yenilemek için sayfayı tekrar açın.';canvas.dataset.loading='error';}
 }
 let lastFrame=0,landmarkCloseTilt=0;
 function draw(now){if(!running)return;frame=requestAnimationFrame(draw);if(now-lastFrame<32||document.hidden||canvas.closest('[hidden]')||!ready)return;lastFrame=now;
  const home=document.body.dataset.route==='/',w=canvas.clientWidth,h=canvas.clientHeight,mobile=w<600,drift=reduced?0:Math.sin(now*.00024)*.17;
  renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);let primaryScale;
  function view(x,y,vw,vh,a,t,scale,center,close){
   const output=close?getCloseRenderer():renderer;
   output.setViewport(x,y,vw,vh);output.setScissor(x,y,vw,vh);const box=close?closeBox:mainBox,centerForFit=center;
   pivot.position.set(0,0,0);
   const rotation=new THREE.Euler(t,a,0),point=new THREE.Vector3();
   if(close){
    // Fit the actual projected vertices, not a rotated axis-aligned box, which
    // excessively shrinks oblique wrists/feet. Refit during the turn as well.
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const m of closeTargets){const p=m.geometry.attributes.position;for(const i of m.userData.closeFitIndices||m.userData.fitIndices){
     point.fromBufferAttribute(p,i).sub(center).applyEuler(rotation);
     minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);
    }}
    pivot.position.set(-(minX+maxX)/2,-(minY+maxY)/2,0);
    scale=Math.max((maxY-minY)/2,(maxX-minX)/2/(vw/vh))*2.0;
   }else if(activeBone.module==='landmarks'){
    const fit=landmarkOverlay.userData.mainFit;let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const i of fit.indices){point.fromBufferAttribute(fit.position,i).sub(center).applyEuler(rotation);minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);}
    pivot.position.set(-(minX+maxX)/2,-(minY+maxY)/2,0);
    scale=Math.max((maxY-minY)/2,(maxX-minX)/2/(vw/vh))*1.12+8;
   }else{
    let extentX=0,extentY=0;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
     point.set(x,y,z).sub(centerForFit).applyEuler(rotation);extentX=Math.max(extentX,Math.abs(point.x));extentY=Math.max(extentY,Math.abs(point.y));
    }
    scale=Math.max(extentY,extentX/(vw/vh))*1.12;
   }
   // Keep the whole landmark and surrounding bone visible in the inset.
   if(activeBone.module==='landmarks'){if(close)scale=Math.max(scale,primaryScale*.6);else primaryScale=scale;}
   camera.left=-scale*vw/vh;camera.right=scale*vw/vh;camera.top=scale;camera.bottom=-scale;camera.updateProjectionMatrix();
   root.position.copy(center).multiplyScalar(-1);pivot.rotation.set(t,a,0);
   for(const g of root.children){
    // At middle-ear scale the surrounding skull stacks into a dark mass.
    // Keep the other ossicles as glass context in the close view.
    g.visible=!close||activeBone.region!=='ossicles'||g===cache.get('ossicles');
    for(const m of g.children)m.visible=m.userData.contextVisible&&(!close||m.userData.closeVisible)&&(!activeBone.hideContext||activeBone.meshes.includes(m.name));
   }
   if(activeBone.module==='landmarks'){
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const m of closeTargets)for(const i of m.userData.closeFitIndices||m.userData.fitIndices){point.fromBufferAttribute(m.geometry.attributes.position,i).sub(center).applyEuler(rotation);minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);}
    if(landmarkOverlay.userData.targetBounds){const b=landmarkOverlay.userData.targetBounds;
     for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){point.set(x,y,z).sub(center).applyEuler(rotation);minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);}
    }
    const pixels=Math.max(maxX-minX,maxY-minY)*vh/(2*scale),show=pixels<24;
    for(const m of landmarkOverlay.children)if(m.userData.leader)m.visible=show;
    if(!close){canvas.dataset.targetPixels=String(pixels);canvas.dataset.leaderVisible=String(show);}
   }
   gray.uniforms.edgeFade.value=!!activeBone.context||close||['ossicles','knee'].includes(activeBone.region);
   const ratio=output.getPixelRatio();gray.uniforms.viewSize.value.set(vw*ratio,vh*ratio);gray.uniforms.viewOrigin.value.set(x*ratio,y*ratio);
   for(const material of [faint,contextGlass,eyeballGlass]){material.uniforms.edgeFade.value=gray.uniforms.edgeFade.value;material.uniforms.viewSize.value.copy(gray.uniforms.viewSize.value);material.uniforms.viewOrigin.value.copy(gray.uniforms.viewOrigin.value);}
   halo.visible=Boolean(!close&&(activeBone.region==='ossicles'||activeBone.closeCamera&&!activeBone.contextRegions));
   if(halo.visible){const p=closeCenter.clone().sub(center).applyEuler(rotation).add(pivot.position);halo.position.set(p.x,p.y,1500);halo.scale.setScalar(8*2*scale/vh);}
   output.render(scene,camera);
  }
  view(home?0:w*(mobile?.02:.16),10,home?w:w*(mobile?.74:.62),h-20,(activeBone.region==='ossicles'?Math.PI/2:angle)+drift,tilt,mainSize,mainCenter,false);
  if(!home)view(0,0,closeCanvas.clientWidth,closeCanvas.clientHeight,((activeBone.context||activeBone.module==='landmarks')?closeAngle:angle+Math.PI*.65)+(reduced?0:(activeBone.context||activeBone.module==='landmarks')?Math.sin(now*.00008)*.10:now*.00008),activeBone.module==='landmarks'?landmarkCloseTilt:tilt-.18,closeSize,closeCenter,true);
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;document.querySelector('#loading').hidden=false;document.querySelector('#loading').textContent='Görüntü durdu. Sayfayı yenileyerek devam edebilirsiniz.';});
 frame=requestAnimationFrame(draw);
 return {setBone,setTheme(dark){gray.uniforms.dark.value=dark;faint.uniforms.dark.value=dark;contextGlass.uniforms.dark.value=dark;eyeballGlass.uniforms.dark.value=dark},dispose(){running=false;cancelAnimationFrame(frame);observer.disconnect();for(const g of cache.values())g.traverse(m=>m.geometry?.dispose());gray.dispose();faint.dispose();contextGlass.dispose();eyeballGlass.dispose();red.dispose();boneMaterial.dispose();disposeLandmark(landmarkOverlay);halo.geometry.dispose();halo.material.dispose();renderer.dispose();closeRenderer?.dispose();closeCanvas.remove();}};
}

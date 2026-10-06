import * as THREE from 'three';
import {GLTFLoader} from './GLTFLoader.js';
import {RoomEnvironment} from './RoomEnvironment.js';

export async function createOpeningScene(canvas,signal){
 let renderer,root,mixer,environment,observer,room;
 const clean=()=>{observer?.disconnect();mixer?.stopAllAction();if(root){mixer?.uncacheRoot(root);const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.source?.data?.close?.();t.dispose()})}environment?.dispose();room?.dispose();renderer?.dispose()};
 try{
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.001,100);
  scene.add(new THREE.HemisphereLight(0xffecd3,0x533c40,2.5));
  const key=new THREE.DirectionalLight(0xffe3b4,3);key.position.set(2,4,3);scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,1.6);fill.position.set(-3,2,-1);scene.add(fill);
  room=new RoomEnvironment();const generator=new THREE.PMREMGenerator(renderer);environment=generator.fromScene(room,.04);scene.environment=environment.texture;generator.dispose();room.dispose();room=null;
  const response=await fetch('./Royal-Reveal-Intro.glb',{signal});if(!response.ok)throw new Error('Model unavailable');
  const buffer=await response.arrayBuffer();if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const gltf=await new GLTFLoader().parseAsync(buffer,'./');root=gltf.scene;
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  scene.add(root);mixer=new THREE.AnimationMixer(root);
  const clip=gltf.animations.find(a=>a.name==='StoryReveal');if(!clip)throw new Error('Opening animation unavailable');
  const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();action.paused=true;
  const seek=p=>{action.time=p*clip.duration;mixer.update(0);root.updateMatrixWorld(true)};
  let progress=0;
  const bounds=new THREE.Box3(),center=new THREE.Vector3();
  const direction=new THREE.Vector3(.3,1.2,1.6).normalize();
  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
  const up=new THREE.Vector3().crossVectors(direction,right).normalize();
  function position(){
   bounds.makeEmpty();root.traverse(o=>{if(o.isMesh&&o.name!=='Sleeve'){if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld))}});
   bounds.getCenter(center);const vfov=THREE.MathUtils.degToRad(camera.fov),tanV=Math.tan(vfov/2),tanH=tanV*camera.aspect;
   let distance=0;for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const offset=new THREE.Vector3(x,y,z).sub(center),depth=offset.dot(direction);distance=Math.max(distance,Math.abs(offset.dot(right))/tanH+depth,Math.abs(offset.dot(up))/tanV+depth)}
   distance*=1.12;camera.position.copy(center).addScaledVector(direction,distance);camera.lookAt(center);camera.near=.0001;camera.far=Math.max(distance*30,10);camera.updateProjectionMatrix();
  }
  function resize(){const stage=canvas.parentElement;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;position();renderer.render(scene,camera)}
  seek(0);
  observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();renderer.render(scene,camera);
  return {render(p){progress=p;seek(p);position();renderer.render(scene,camera)},dispose:clean};
 }catch(error){clean();throw error}
}

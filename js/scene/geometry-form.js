import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

function loadGLB(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

export async function apply(scene) {
  const gltf = await loadGLB('/arcade_portfolio.glb');
  const model = gltf.scene;

  const spotlights = model.getObjectByName('spotlights');
  if (spotlights) spotlights.removeFromParent();

  const view = model.getObjectByName('View');
  if (view) view.removeFromParent();

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Extract slot empties BEFORE scaling (positions in model space)
  const slotEmpties = {};
  model.traverse((child) => {
    if (child.name && child.name.startsWith('slot_')) {
      slotEmpties[child.name.replace('slot_', '')] = child.position.clone();
    }
  });

  // Scale down from Nomad units (~25 across) to Three.js units (~3 across)
  const targetSize = 3.5;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDim;
  model.scale.setScalar(scale);

  // Recenter: put floor at y=0, center x/z at origin
  box.setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const min = box.min;
  model.position.x -= center.x;
  model.position.y -= min.y;
  model.position.z -= center.z;

  model.name = 'glb_root';
  scene.add(model);

  // Now compute slot world positions after model is placed
  model.updateWorldMatrix(true, true);
  const slotPositions = {};
  for (const [id, localPos] of Object.entries(slotEmpties)) {
    const worldPos = localPos.clone();
    worldPos.applyMatrix4(model.matrixWorld);
    slotPositions[id] = worldPos;
    console.log(`Slot ${id}: (${worldPos.x.toFixed(3)}, ${worldPos.y.toFixed(3)}, ${worldPos.z.toFixed(3)})`);
  }
  window.__slotPositions = slotPositions;
}

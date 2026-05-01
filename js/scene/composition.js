import * as THREE from 'three';

export const cameraState1 = {
  pos: new THREE.Vector3(1.64, 1.47, -0.99),
  target: new THREE.Vector3(-0.02, 0.54, -0.14),
};

export const cameraState2 = {
  pos: new THREE.Vector3(0.55, 0.83, -0.55),
  target: new THREE.Vector3(-0.02, 0.61, -0.08),
};

export function apply(scene, renderer, camera) {
  camera.fov = 40;

  camera.position.copy(cameraState1.pos);
  camera.lookAt(cameraState1.target);
  camera.updateProjectionMatrix();

  const controls = window.__cephalopodControls;
  if (controls) {
    controls.target.copy(cameraState1.target);
    controls.update();
  }
}

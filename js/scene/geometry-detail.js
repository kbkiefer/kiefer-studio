import * as THREE from 'three';

// GLB model includes all details (buttons, joystick, coin slot, etc.)
// This arm only adds atmospheric elements not in the model.

export function apply(scene) {
  // Dust motes in the screen light cone
  const count = 30;
  const geo = new THREE.SphereGeometry(0.003, 4, 3);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffcc66,
    emissive: 0xffaa33,
    transparent: true,
    opacity: 0.7,
  });
  // MeshBasicMaterial doesn't support emissive, swap to Standard
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xffcc66,
    emissive: 0xffaa33,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
  });
  const motes = new THREE.InstancedMesh(geo, glowMat, count);
  motes.name = 'dust_motes';

  const dummy = new THREE.Object3D();

  // Find the screen to position motes relative to it
  const screen = scene.getObjectByName('STATIC_SCREEN');
  let cx = 0, cy = 1.15, cz = 0.5;
  if (screen) {
    const worldPos = new THREE.Vector3();
    screen.getWorldPosition(worldPos);
    cx = worldPos.x;
    cy = worldPos.y;
    cz = worldPos.z + 0.3;
  }

  for (let i = 0; i < count; i++) {
    const spread = 0.8;
    dummy.position.set(
      cx + (Math.random() - 0.5) * spread,
      cy + (Math.random() - 0.5) * spread * 0.8,
      cz + Math.random() * spread * 1.5
    );
    dummy.scale.setScalar(0.5 + Math.random());
    dummy.updateMatrix();
    motes.setMatrixAt(i, dummy.matrix);
  }

  motes.instanceMatrix.needsUpdate = true;
  scene.add(motes);
}

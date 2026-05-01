import * as THREE from 'three';

export function apply(scene) {
  scene.traverse((obj) => {
    if (!obj.isMesh) return;

    const name = obj.name;
    if (name === 'dust_motes') return;

    // Laptop meshes - convert to unlit so Meshy baked texture shows clean
    let isLaptop = false;
    let p = obj;
    while (p) {
      if (p.name === 'Group_1') { isLaptop = true; break; }
      p = p.parent;
    }
    if (isLaptop) {
      if (name !== 'Plane' && obj.material) {
        obj.material.metalness = 0;
        obj.material.roughness = 1;
        obj.material.envMapIntensity = 0;
      }
      return;
    }

    obj.castShadow = true;
    obj.receiveShadow = true;

    // CRT screen - animation arm handles material
    if (name === 'STATIC_SCREEN') return;

    // Hide screen border bezels - they block the view at close range
    if (name === 'screen_border' || name === 'screen_border_1') {
      obj.visible = false;
      return;
    }

    // KIEFER marquee - warm orange-to-yellow glow
    if (name === 'KIEFER') {
      obj.material.emissive = new THREE.Color(0xffaa00);
      obj.material.emissiveIntensity = 1.0;
      return;
    }

    // Everything else: keep original GLB materials, just boost contrast
    // Nomad's vertex colors and textures already look great
    if (obj.material.isMeshStandardMaterial || obj.material.isMeshPhysicalMaterial) {
      obj.material.roughness = Math.max(obj.material.roughness, 0.4);
      obj.material.envMapIntensity = 0;
    }
  });
}

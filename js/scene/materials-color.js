import * as THREE from 'three';

// GLB model carries its own colors/textures from Nomad Sculpt.
// This arm only touches parts that need emissive overrides.
// All original vertex colors and textures are preserved.

export function apply(scene) {
  // No color overrides needed - the GLB has its own materials.
  // The materials-surface arm handles emissive for STATIC SCREEN and KIEFER.
}

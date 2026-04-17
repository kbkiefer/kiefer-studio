import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const OBJECTS = [
  { file: 'Obj_BlueCube',    orbit: 2.0,  speed: 0.2,   yOffset: 0.4,   bobSpeed: 0.6,  bobAmp: 0.12, phase: 0,    scale: 0.5 },
  { file: 'Obj_BlueIco',     orbit: 1.4,  speed: -0.18, yOffset: -0.2,  bobSpeed: 0.9,  bobAmp: 0.08, phase: 1.2,  scale: 0.35 },
  { file: 'Obj_BlueTorus',   orbit: 2.5,  speed: 0.15,  yOffset: 0.1,   bobSpeed: 0.5,  bobAmp: 0.15, phase: 2.5,  scale: 0.6 },
  { file: 'Obj_DarkCube',    orbit: 2.8,  speed: -0.12, yOffset: 0.55,  bobSpeed: 0.7,  bobAmp: 0.1,  phase: 0.8,  scale: 0.3 },
  { file: 'Obj_DarkCone',    orbit: 1.6,  speed: 0.25,  yOffset: -0.35, bobSpeed: 1.0,  bobAmp: 0.07, phase: 3.1,  scale: 0.45 },
  { file: 'Obj_DarkIco',     orbit: 2.2,  speed: -0.2,  yOffset: 0.0,   bobSpeed: 0.55, bobAmp: 0.13, phase: 4.0,  scale: 0.25 },
  { file: 'Obj_GraySphere',  orbit: 3.0,  speed: 0.1,   yOffset: -0.5,  bobSpeed: 0.8,  bobAmp: 0.09, phase: 1.7,  scale: 0.7 },
  { file: 'Obj_GrayCube',    orbit: 1.2,  speed: -0.3,  yOffset: 0.6,   bobSpeed: 0.4,  bobAmp: 0.16, phase: 5.2,  scale: 0.2 },
  { file: 'Obj_BlueDot',     orbit: 1.0,  speed: 0.35,  yOffset: 0.15,  bobSpeed: 1.2,  bobAmp: 0.05, phase: 2.0,  scale: 0.15 },
  { file: 'Obj_DarkDot',     orbit: 2.6,  speed: -0.22, yOffset: -0.25, bobSpeed: 0.65, bobAmp: 0.1,  phase: 3.5,  scale: 0.18 },
  { file: 'Obj_LightIco',    orbit: 1.3,  speed: 0.28,  yOffset: 0.35,  bobSpeed: 0.95, bobAmp: 0.06, phase: 0.5,  scale: 0.3 },
  { file: 'Obj_WhiteCube',   orbit: 2.4,  speed: -0.14, yOffset: -0.45, bobSpeed: 0.7,  bobAmp: 0.11, phase: 4.5,  scale: 0.4 },
  { file: 'Obj_YellowIco',   orbit: 1.8,  speed: 0.22,  yOffset: 0.5,   bobSpeed: 0.85, bobAmp: 0.08, phase: 1.0,  scale: 0.55 },
];

const loadedObjects = [];
const loader = new GLTFLoader();

export function loadFloatingObjects(scene) {
  OBJECTS.forEach((cfg) => {
    loader.load(`/models/objects/${cfg.file}.glb`, (gltf) => {
      const obj = gltf.scene;
      obj.scale.setScalar(cfg.scale);

      obj.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });

      scene.add(obj);

      loadedObjects.push({
        mesh: obj,
        orbit: cfg.orbit,
        speed: cfg.speed,
        yOffset: cfg.yOffset,
        bobSpeed: cfg.bobSpeed,
        bobAmp: cfg.bobAmp,
        phase: cfg.phase,
        selfRotSpeed: (Math.random() - 0.5) * 2,
      });
    });
  });
}

let visible = true;

export function setFloatingObjectsVisible(v) {
  if (v === visible) return;
  visible = v;
  for (const obj of loadedObjects) {
    obj.mesh.visible = v;
  }
}

export function updateFloatingObjects(time) {
  if (!visible) return;

  for (const obj of loadedObjects) {
    const angle = obj.phase + time * obj.speed;

    obj.mesh.position.x = Math.cos(angle) * obj.orbit;
    obj.mesh.position.z = Math.sin(angle) * obj.orbit;
    obj.mesh.position.y = obj.yOffset + Math.sin(time * obj.bobSpeed + obj.phase) * obj.bobAmp;

    obj.mesh.rotation.x += obj.selfRotSpeed * 0.01;
    obj.mesh.rotation.y += obj.selfRotSpeed * 0.015;
  }
}

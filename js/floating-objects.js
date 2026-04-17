import * as THREE from 'three';
import { createBands3D, updateBands3D } from './bands-3d.js';
import { createBorderlandsMaterial } from './borderlands-material.js';
import { createTrail, updateTrails, setTrailsVisible } from './element-trails.js';

const SHAPES = [
  { type: 'dodecahedron', color: 0xd4940e, orbit: 5, speed: 0.19, yOffset: 2.25, bobSpeed: 0.5, bobAmp: 0.08, phase: 0, size: 0.41, zOffset: -5.9 },
  { type: 'octahedron', color: 0xf0e000, orbit: 5, speed: 0.42, yOffset: 0.9, bobSpeed: 0.8, bobAmp: 0.06, phase: 1.2, size: 0.43, zOffset: -4.15 },
  { type: 'box', color: 0x00a838, orbit: 5, speed: 0.15, yOffset: 0.05, bobSpeed: 0.45, bobAmp: 0.07, phase: 2.5, size: 0.41, zOffset: -4.75 },
  { type: 'tetrahedron', color: 0xee2200, orbit: 5, speed: 0.35, yOffset: -0.75, bobSpeed: 0.65, bobAmp: 0.06, phase: 0.8, size: 0.41, zOffset: -4.45 },
  { type: 'icosahedron', color: 0x2266ee, orbit: 4.45, speed: 0.27, yOffset: -1.4, bobSpeed: 0.9, bobAmp: 0.05, phase: 3.1, size: 0.31, zOffset: -5.15 },
];

const OUTLINE_THICKNESS = 0.1;
const loadedObjects = [];
const objectsMap = {};
let visible = true;
let lastTime = 0;

export const shapesScene = new THREE.Scene();
export const bandsScene = new THREE.Scene();

function createGeometry(type, size) {
  switch (type) {
    case 'dodecahedron': return new THREE.DodecahedronGeometry(size, 0);
    case 'tetrahedron':  return new THREE.TetrahedronGeometry(size, 0);
    case 'box':          return new THREE.BoxGeometry(size, size, size);
    case 'octahedron':   return new THREE.OctahedronGeometry(size, 0);
    case 'icosahedron':  return new THREE.IcosahedronGeometry(size, 0);
    default:             return new THREE.IcosahedronGeometry(size, 0);
  }
}

function createOutlineMesh(geo) {
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide,
  });
  const outlineMesh = new THREE.Mesh(geo.clone(), outlineMat);
  outlineMesh.scale.setScalar(1 + OUTLINE_THICKNESS);
  return outlineMesh;
}

export function loadFloatingObjects(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  shapesScene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3, 5, 4);
  shapesScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-3, -1, 2);
  shapesScene.add(fillLight);

  createBands3D(bandsScene);

  for (const cfg of SHAPES) {
    /* Shapes go into the main bust scene (passed as 'scene' arg) for pixelation */
    const geo = createGeometry(cfg.type, cfg.size);
    geo.computeVertexNormals();

    const mat = createBorderlandsMaterial(cfg.color);

    const mesh = new THREE.Mesh(geo, mat);

    const outline = createOutlineMesh(geo);

    const group = new THREE.Group();
    group.add(outline);
    group.add(mesh);
    group.position.z = cfg.zOffset;
    scene.add(group);

    createTrail(cfg.type, scene);

    loadedObjects.push({
      name: cfg.type,
      group,
      mesh,
      outline,
      orbit: cfg.orbit,
      speed: cfg.speed,
      yOffset: cfg.yOffset,
      bobSpeed: cfg.bobSpeed,
      bobAmp: cfg.bobAmp,
      phase: cfg.phase,
      zOffset: cfg.zOffset,
      size: cfg.size,
      origSize: cfg.size,
      selfRotSpeed: (Math.random() - 0.5) * 1.5,
    });
  }
}

export function getFloatingObjects() { return loadedObjects; }

export function setFloatingObjectsVisible(v) {
  if (v === visible) return;
  visible = v;
  for (const obj of loadedObjects) {
    obj.group.visible = v;
  }
  setTrailsVisible(v);
}

function animateFire(obj, t) {
  const angle = obj.phase + t * obj.speed;
  obj.group.position.x = Math.cos(angle) * obj.orbit;
  obj.group.position.z = obj.zOffset + Math.sin(angle) * 0.3;
  obj.group.position.y = obj.yOffset + Math.abs(Math.sin(t * 3.5)) * 0.15 + Math.sin(t * 7) * 0.03;

  obj.mesh.rotation.x += 0.015 + Math.sin(t * 5) * 0.008;
  obj.mesh.rotation.y += 0.02;
  obj.mesh.rotation.z = Math.sin(t * 4) * 0.1;

  const flicker = 1.0 + Math.sin(t * 8) * 0.05 + Math.sin(t * 13) * 0.03;
  obj.mesh.scale.setScalar((obj.size / obj.origSize) * flicker);
  obj.outline.rotation.copy(obj.mesh.rotation);
  obj.outline.scale.setScalar((obj.size / obj.origSize) * flicker * 1.1);
}

function animateAir(obj, t) {
  const angle = obj.phase + t * obj.speed;
  const drift = Math.sin(t * 0.3 + obj.phase) * 0.5;
  obj.group.position.x = Math.cos(angle) * obj.orbit + drift;
  obj.group.position.z = obj.zOffset + Math.sin(angle) * 0.3;
  obj.group.position.y = obj.yOffset + Math.sin(t * 0.8) * 0.12 + Math.cos(t * 1.3) * 0.06;

  obj.mesh.rotation.x = Math.sin(t * 0.4) * 0.3;
  obj.mesh.rotation.y += 0.005;
  obj.mesh.rotation.z = Math.cos(t * 0.5) * 0.2;

  const breathe = 1.0 + Math.sin(t * 1.2) * 0.06;
  obj.mesh.scale.setScalar((obj.size / obj.origSize) * breathe);
  obj.outline.rotation.copy(obj.mesh.rotation);
  obj.outline.scale.setScalar((obj.size / obj.origSize) * breathe * 1.1);
}

function animateEarth(obj, t) {
  const angle = obj.phase + t * obj.speed;
  obj.group.position.x = Math.cos(angle) * obj.orbit;
  obj.group.position.z = obj.zOffset + Math.sin(angle) * 0.3;
  obj.group.position.y = obj.yOffset + Math.sin(t * 0.4) * 0.02;

  obj.mesh.rotation.y += 0.003;
  obj.mesh.rotation.x += 0.001;

  const rumble = Math.sin(t * 15) * Math.max(0, Math.sin(t * 0.5) - 0.9) * 0.05;
  obj.group.position.x += rumble;
  obj.group.position.y += rumble * 0.5;

  obj.outline.rotation.copy(obj.mesh.rotation);
}

function animateWater(obj, t) {
  const angle = obj.phase + t * obj.speed;
  obj.group.position.x = Math.cos(angle) * obj.orbit;
  obj.group.position.z = obj.zOffset + Math.sin(angle) * 0.3;

  const wave1 = Math.sin(t * 1.2 + obj.phase) * 0.1;
  const wave2 = Math.sin(t * 0.7 + obj.phase * 2) * 0.06;
  obj.group.position.y = obj.yOffset + wave1 + wave2;

  obj.mesh.rotation.x = Math.sin(t * 0.6) * 0.15;
  obj.mesh.rotation.y += 0.008;
  obj.mesh.rotation.z = Math.cos(t * 0.8) * 0.1;

  obj.outline.rotation.copy(obj.mesh.rotation);
}

function animateAether(obj, t) {
  const angle = obj.phase + t * obj.speed;
  obj.group.position.x = Math.cos(angle) * obj.orbit;
  obj.group.position.z = obj.zOffset + Math.sin(angle) * 0.3;
  obj.group.position.y = obj.yOffset + Math.sin(t * 0.5) * 0.08;

  obj.mesh.rotation.x += 0.004;
  obj.mesh.rotation.y += 0.006;
  obj.mesh.rotation.z += 0.003;

  const pulse = 1.0 + Math.sin(t * 0.8) * 0.08;
  obj.mesh.scale.setScalar((obj.size / obj.origSize) * pulse);
  obj.outline.rotation.copy(obj.mesh.rotation);
  obj.outline.scale.setScalar((obj.size / obj.origSize) * pulse * 1.1);
}

const ELEMENT_ANIM = {
  tetrahedron: animateFire,
  octahedron: animateAir,
  box: animateEarth,
  icosahedron: animateWater,
  dodecahedron: animateAether,
};

export function updateFloatingObjects(time) {
  const dt = time - lastTime;
  lastTime = time;

  updateBands3D(time);
  if (!visible) return;

  for (const obj of loadedObjects) {
    const animFn = ELEMENT_ANIM[obj.name];
    if (animFn) {
      animFn(obj, time);
    }
    objectsMap[obj.name] = obj;
  }

  updateTrails(Math.min(dt, 0.05), objectsMap);
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model;
let mouseRotX = 0, mouseRotY = 0;
let currentMouseX = 0, currentMouseY = 0;

export let scrollRotX = 0, scrollRotY = 0, scrollRotZ = 0;

let pixelSize = 7;
let canvas;

/* Low-res render target + full-screen blit for pixelated transparency */
let lowResRT, blitScene, blitCamera, blitMesh;

/* Exported light refs for debug GUI */
export const lights = {};

export function initBust() {
  canvas = document.getElementById('bust-canvas');
  if (!canvas) return;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.57, 1.8);

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;

  setupPixelBlit();

  /* Lighting: high contrast for strong shadows like Rob's bust */
  lights.ambient = new THREE.AmbientLight(0xffffff, 0);
  scene.add(lights.ambient);

  lights.key = new THREE.DirectionalLight(0xffffff, 3.28);
  lights.key.position.set(3, 6.1, 3.5);
  scene.add(lights.key);

  lights.rim = new THREE.DirectionalLight(0xffffff, 0.56);
  lights.rim.position.set(-5.4, 10, -1);
  scene.add(lights.rim);

  /* Load model */
  const loader = new GLTFLoader();
  loader.load('/models/kiefer-bust.glb', (gltf) => {
    model = gltf.scene;

    const greyMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.95,
      metalness: 0.0,
    });

    model.traverse((child) => {
      if (child.isMesh) {
        child.material = greyMat;
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center);
    model.position.y += size.y * 0.05;
    model.scale.setScalar(1.3);

    scene.add(model);
    animate();
  });

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);
}

export function rebuildPixelBlit(newSize) {
  pixelSize = newSize || pixelSize;
  setupPixelBlit();
}

function setupPixelBlit() {
  const w = Math.ceil(window.innerWidth / pixelSize);
  const h = Math.ceil(window.innerHeight / pixelSize);

  lowResRT = new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
  });

  /* Fullscreen quad to blit the low-res texture at native res */
  const blitMaterial = new THREE.MeshBasicMaterial({
    map: lowResRT.texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  blitCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  blitScene = new THREE.Scene();
  const blitGeo = new THREE.PlaneGeometry(2, 2);
  blitMesh = new THREE.Mesh(blitGeo, blitMaterial);
  blitScene.add(blitMesh);
}

function onMouseMove(e) {
  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * 2;
  mouseRotY = x * 0.15;
  mouseRotX = -y * 0.08;
}

export function setScrollRotation(x, y, z) {
  scrollRotX = x;
  scrollRotY = y;
  scrollRotZ = z;
}

function onResize() {
  if (!renderer) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);

  /* Rebuild the low-res target at new dimensions */
  const lw = Math.ceil(w / pixelSize);
  const lh = Math.ceil(h / pixelSize);
  lowResRT.setSize(lw, lh);
}

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    currentMouseX += (mouseRotX - currentMouseX) * 0.05;
    currentMouseY += (mouseRotY - currentMouseY) * 0.05;
    model.rotation.x = scrollRotX + currentMouseX;
    model.rotation.y = scrollRotY + currentMouseY;
    model.rotation.z = scrollRotZ;
  }

  /* 1) Render scene into low-res RT (with alpha) */
  renderer.setRenderTarget(lowResRT);
  renderer.clear(true, true, true);
  renderer.render(scene, camera);

  /* 2) Blit low-res texture to screen with nearest-neighbor = pixelated look */
  renderer.setRenderTarget(null);
  renderer.clear(true, true, true);
  renderer.render(blitScene, blitCamera);
}

export function getModel() { return model; }
export function getCamera() { return camera; }
export function getCanvas() { return canvas; }

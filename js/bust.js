import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model;
let targetRotX = 0, targetRotY = 0;
let currentRotX = 0, currentRotY = 0;

const PIXEL_SIZE = 6;
let canvas;

/* Low-res render target + full-screen blit for pixelated transparency */
let lowResRT, blitScene, blitCamera, blitMesh;

export function initBust() {
  canvas = document.getElementById('bust-canvas');
  if (!canvas || window.innerWidth < 768) return;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.5, 4.5);

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

  /* Lighting */
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(2, 3, 4);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-2, 0, 2);
  scene.add(fillLight);

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

    scene.add(model);
    animate();
  });

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);
}

function setupPixelBlit() {
  const w = Math.ceil(window.innerWidth / PIXEL_SIZE);
  const h = Math.ceil(window.innerHeight / PIXEL_SIZE);

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
  targetRotY = x * 0.15;
  targetRotX = -y * 0.08;
}

function onResize() {
  if (!renderer) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);

  /* Rebuild the low-res target at new dimensions */
  const lw = Math.ceil(w / PIXEL_SIZE);
  const lh = Math.ceil(h / PIXEL_SIZE);
  lowResRT.setSize(lw, lh);
}

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    currentRotX += (targetRotX - currentRotX) * 0.05;
    currentRotY += (targetRotY - currentRotY) * 0.05;
    model.rotation.x = currentRotX;
    model.rotation.y = currentRotY;
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

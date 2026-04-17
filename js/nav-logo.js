import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model;

export function initNavLogo() {
  const container = document.getElementById('nav-logo-3d');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  const width = 120;
  const height = 55;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(30, width / height, 0.01, 50);
  camera.position.set(0, 0, 3.5);

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(2);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 5.0);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 3.0);
  rimLight.position.set(-4, 1, -3);
  scene.add(rimLight);

  const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
  topLight.position.set(0, 5, 0);
  scene.add(topLight);

  const bottomLight = new THREE.DirectionalLight(0xffffff, 0.3);
  bottomLight.position.set(0, -4, 2);
  scene.add(bottomLight);

  const loader = new GLTFLoader();
  loader.load('/models/kiefer-logo.glb', (gltf) => {
    console.log('Logo loaded:', gltf);
    model = gltf.scene;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 1.8 / maxDim;

    model.position.sub(center);
    model.scale.setScalar(scale);

    scene.add(model);
    animate();
  },
  (progress) => {},
  (error) => { console.error('Logo load error:', error); }
  );
}

function animate() {
  requestAnimationFrame(animate);
  if (!model) return;

  const t = performance.now() * 0.001;
  model.rotation.y = Math.sin(t * 0.5) * 0.3;
  model.rotation.x = Math.sin(t * 0.3) * 0.1;
  model.position.y = Math.sin(t * 0.8) * 0.05;

  renderer.render(scene, camera);
}

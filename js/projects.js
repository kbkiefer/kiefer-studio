import * as THREE from 'three';

const PROJECTS = [
  { name: 'Cymatics Lab', tags: 'iOS _ Metal _ Audio Visualization', color: 0x1a2a8e, desc: 'Real-time audio visualization powered by Metal shaders. Transform sound into mesmerizing cymatics patterns on iOS.' },
  { name: 'Imago', tags: 'iOS _ AI _ ADHD Companion', color: 0x1a6e2a, desc: 'An ADHD companion app using on-device AI to help with task management, focus, and daily routines.' },
  { name: 'Border Child', tags: 'Web _ React Three Fiber _ Film', color: 0x6e4e1a, desc: 'Cinematic scroll-driven website for a Laredo creative studio. React Three Fiber, post-processing, and immersive storytelling.' },
  { name: 'NovaTrade', tags: 'macOS _ SwiftUI _ Trading Terminal', color: 0x1a4e6e, desc: 'A sovereign trading terminal for macOS built with SwiftUI and Liquid Glass. Real-time market data visualization.' },
  { name: 'Resonance', tags: 'iOS _ Metal _ Consciousness', color: 0x4e1a6e, desc: 'A consciousness instrument combining Metal cymatics, audio entrainment, and Apple Watch heart rate monitoring.' },
  { name: 'ClearMind', tags: 'iOS _ Canvas _ Neural Map', color: 0x6e1a1a, desc: 'ADHD neural map task manager. Six life areas, AI categorization, and looming thoughts visualization.' },
  { name: 'Chrysalis', tags: 'Unity _ 3D _ Game', color: 0x6e6e1a, desc: 'A 3D game about transformation. Play as a caterpillar becoming a butterfly at two different scales.' },
  { name: 'ShalaMakes', tags: 'Web _ 3D Printing _ Store', color: 0x1a6e6e, desc: 'E-commerce storefront for custom 3D printed products. Static HTML, Stripe payments, GitHub Actions deploy.' },
  { name: 'Continuum', tags: 'macOS _ Vision _ AI Perception', color: 0x2a2a5e, desc: 'Local continuous visual perception for Apple Silicon. SigLIP + Qwen2-VL at 20 FPS.' },
];

const SPHERE_RADIUS = 3.2;
const CARD_W = 1.4;
const CARD_H = 1.0;
const COLS = 8;
const ROWS = 6;
const PIXEL_SIZE = 5;

let scene, camera, renderer;
let sphereGroup;
let targetRotY = 0, targetRotX = 0;
let currentRotY = 0, currentRotX = 0;
let isDragging = false, hasDragged = false;
let dragStartX, dragStartY;
let lowResRT, blitScene, blitCamera, blitMesh;
let cards = [];
let focusNameEl = null;
let focusEl = null;

export function initProjects() {
  const container = document.getElementById('work-grid');
  const modal = document.getElementById('work-modal');
  const modalClose = document.getElementById('work-modal-close');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  const w = container.offsetWidth;
  const h = container.offsetHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 0, 7);

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  setupPixelBlit(w, h);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.5);
  dir.position.set(2, 3, 5);
  scene.add(dir);

  sphereGroup = new THREE.Group();
  scene.add(sphereGroup);

  buildCards();
  focusNameEl = document.getElementById('work-focus-name');
  focusEl = document.querySelector('.work__focus');
  animate();

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    hasDragged = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    container.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
    targetRotY += dx * 0.005;
    targetRotX -= dy * 0.003;
    targetRotX = Math.max(-0.8, Math.min(0.8, targetRotX));
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    container.style.cursor = 'grab';
  });

  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    hasDragged = false;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
    targetRotY += dx * 0.005;
    targetRotX -= dy * 0.003;
    targetRotX = Math.max(-0.8, Math.min(0.8, targetRotX));
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });

  container.addEventListener('click', (e) => {
    if (hasDragged) return;
    const active = getActiveCard();
    if (active) openModal(active.project);
  });

  window.addEventListener('resize', () => {
    const w2 = container.offsetWidth;
    const h2 = container.offsetHeight;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
    setupPixelBlit(w2, h2);
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

function buildCards() {
  let pi = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const project = PROJECTS[pi % PROJECTS.length];
      pi++;

      const phi = ((row + 0.5) / ROWS) * Math.PI;
      const theta = (col / COLS) * Math.PI * 2;

      const geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
      const mat = new THREE.MeshStandardMaterial({
        color: project.color,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.setFromSphericalCoords(SPHERE_RADIUS, phi, theta);
      mesh.lookAt(0, 0, 0);
      mesh.rotateY(Math.PI);

      sphereGroup.add(mesh);
      cards.push({ mesh, project });
    }
  }
}

function getActiveCard() {
  let closest = null;
  let closestDot = -Infinity;
  const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

  for (const card of cards) {
    const cardPos = new THREE.Vector3();
    card.mesh.getWorldPosition(cardPos);
    cardPos.normalize();
    const dot = cardPos.dot(camDir);
    if (dot > closestDot) {
      closestDot = dot;
      closest = card;
    }
  }

  return closest;
}

function setupPixelBlit(w, h) {
  const lw = Math.ceil(w / PIXEL_SIZE);
  const lh = Math.ceil(h / PIXEL_SIZE);

  lowResRT = new THREE.WebGLRenderTarget(lw, lh, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
  });

  const blitMat = new THREE.MeshBasicMaterial({
    map: lowResRT.texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  blitCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  blitScene = new THREE.Scene();
  const geo = new THREE.PlaneGeometry(2, 2);
  blitMesh = new THREE.Mesh(geo, blitMat);
  blitScene.add(blitMesh);
}

function toScreen(vec3, cam, w, h) {
  const v = vec3.clone().project(cam);
  return {
    x: (v.x * 0.5 + 0.5) * w,
    y: (-v.y * 0.5 + 0.5) * h,
  };
}

function updateFocusBrackets(mesh) {
  const container = document.getElementById('work-grid');
  const w = container.offsetWidth;
  const h = container.offsetHeight;

  const geo = mesh.geometry;
  const posAttr = geo.attributes.position;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (let i = 0; i < posAttr.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
    mesh.localToWorld(v);
    const s = toScreen(v, camera, w, h);
    if (s.x < minX) minX = s.x;
    if (s.x > maxX) maxX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.y > maxY) maxY = s.y;
  }

  const pad = 12;
  focusEl.style.left = (minX - pad) + 'px';
  focusEl.style.top = (minY - pad) + 'px';
  focusEl.style.width = (maxX - minX + pad * 2) + 'px';
  focusEl.style.height = (maxY - minY + pad * 2) + 'px';
  focusEl.style.transform = 'none';
}

function animate() {
  requestAnimationFrame(animate);

  currentRotY += (targetRotY - currentRotY) * 0.08;
  currentRotX += (targetRotX - currentRotX) * 0.08;

  sphereGroup.rotation.y = currentRotY;
  sphereGroup.rotation.x = currentRotX;

  if (!isDragging) {
    targetRotY += 0.001;
  }

  const active = getActiveCard();
  if (active && focusNameEl && focusEl) {
    focusNameEl.textContent = active.project.name;
    updateFocusBrackets(active.mesh);
  }

  for (const card of cards) {
    const worldPos = new THREE.Vector3();
    card.mesh.getWorldPosition(worldPos);
    const dot = worldPos.normalize().dot(new THREE.Vector3(0, 0, 1));
    card.mesh.material.opacity = THREE.MathUtils.clamp(dot * 1.5 + 0.3, 0.15, 1);
    card.mesh.material.transparent = true;
  }

  renderer.setRenderTarget(lowResRT);
  renderer.clear(true, true, true);
  renderer.render(scene, camera);

  renderer.setRenderTarget(null);
  renderer.clear(true, true, true);
  renderer.render(blitScene, blitCamera);
}

function openModal(project) {
  const modal = document.getElementById('work-modal');
  const hero = document.getElementById('work-modal-hero');
  const title = document.getElementById('work-modal-title');
  const tags = document.getElementById('work-modal-tags');
  const body = document.getElementById('work-modal-body');

  hero.style.background = `linear-gradient(135deg, #${(project.color >> 1 & 0x7f7f7f).toString(16).padStart(6, '0')}, #${project.color.toString(16).padStart(6, '0')})`;
  title.textContent = project.name;
  tags.textContent = project.tags;
  body.innerHTML = `<p>${project.desc}</p>`;

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('work-modal').classList.remove('is-open');
  document.body.style.overflow = '';
}

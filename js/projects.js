import * as THREE from 'three';

const PROJECTS = [
  { name: 'Cymatics Lab', tags: 'iOS _ Metal _ Audio Viz', tech: 'iOS', color: '#012FFF', desc: 'Real-time audio visualization powered by Metal shaders.' },
  { name: 'Imago', tags: 'iOS _ AI _ ADHD', tech: 'iOS', color: '#22cc55', desc: 'An ADHD companion app using on-device AI.' },
  { name: 'Border Child', tags: 'Web _ R3F _ Film', tech: 'Web', color: '#cc8822', desc: 'Cinematic scroll-driven website for a Laredo creative studio.' },
  { name: 'NovaTrade', tags: 'macOS _ SwiftUI _ Trading', tech: 'macOS', color: '#2299cc', desc: 'A sovereign trading terminal for macOS.' },
  { name: 'Resonance', tags: 'iOS _ Metal _ Consciousness', tech: 'iOS', color: '#8822cc', desc: 'Consciousness instrument: cymatics + entrainment + Watch HR.' },
  { name: 'ClearMind', tags: 'iOS _ Canvas _ Neural Map', tech: 'iOS', color: '#cc2244', desc: 'ADHD neural map task manager with AI categorization.' },
  { name: 'Chrysalis', tags: 'Unity _ 3D _ Game', tech: 'Unity', color: '#ccaa22', desc: 'A 3D game about transformation at two scales.' },
  { name: 'ShalaMakes', tags: 'Web _ 3D Printing _ Store', tech: 'Web', color: '#22ccaa', desc: 'E-commerce for custom 3D printed products.' },
  { name: 'Continuum', tags: 'macOS _ Vision _ AI', tech: 'macOS', color: '#4455cc', desc: 'Local visual perception for Apple Silicon at 20 FPS.' },
];

const COUNT = PROJECTS.length;
const RADIUS = 12;
const ARC_PER_FRAME = 0.35;
const FRAME_H = 3.0;
const STRIP_H = 0.35;

let activeIndex = 0;
let targetAngle = 0;
let currentAngle = 0;

export function initProjects() {
  const container = document.getElementById('work-grid');
  const modal = document.getElementById('work-modal');
  const modalClose = document.getElementById('work-modal-close');
  if (!container) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.2, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x0a0a1a);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, {
    display: 'block', width: '100%', height: '100%', touchAction: 'none',
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const spot = new THREE.SpotLight(0xffffff, 3.0, 20, Math.PI / 3, 0.6);
  spot.position.set(0, 3, 2);
  scene.add(spot);
  const spot2 = new THREE.SpotLight(0x8888ff, 1.0, 20, Math.PI / 2, 0.8);
  spot2.position.set(0, -2, 1);
  scene.add(spot2);

  const reelGroup = new THREE.Group();
  scene.add(reelGroup);

  const panels = [];

  for (let i = 0; i < COUNT; i++) {
    const project = PROJECTS[i];
    const angle = i * ARC_PER_FRAME;

    const frameGroup = new THREE.Group();

    const curvedGeo = createCurvedPlane(ARC_PER_FRAME * 0.92, FRAME_H, RADIUS, 16, 1);
    const tex = makeFrameTexture(project, i);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide });
    const frameMesh = new THREE.Mesh(curvedGeo, mat);
    frameGroup.add(frameMesh);

    const topStripGeo = createCurvedPlane(ARC_PER_FRAME, STRIP_H, RADIUS, 16, 1);
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, side: THREE.DoubleSide });
    const topStrip = new THREE.Mesh(topStripGeo, stripMat);
    topStrip.position.y = FRAME_H / 2 + STRIP_H / 2;
    frameGroup.add(topStrip);
    addCurvedSprocketHoles(frameGroup, FRAME_H / 2 + STRIP_H / 2, ARC_PER_FRAME, RADIUS);

    const botStrip = new THREE.Mesh(topStripGeo.clone(), stripMat.clone());
    botStrip.position.y = -FRAME_H / 2 - STRIP_H / 2;
    frameGroup.add(botStrip);
    addCurvedSprocketHoles(frameGroup, -FRAME_H / 2 - STRIP_H / 2, ARC_PER_FRAME, RADIUS);

    frameGroup.rotation.y = -angle;
    reelGroup.add(frameGroup);

    panels.push({ group: frameGroup, mesh: frameMesh, project, index: i, angle });
  }

  const setTarget = (i) => {
    activeIndex = ((i % COUNT) + COUNT) % COUNT;
    targetAngle = activeIndex * ARC_PER_FRAME;
    updateUI();
  };

  const el = renderer.domElement;

  let wheelAccum = 0;
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    wheelAccum += e.deltaY;
    const step = Math.sign(wheelAccum) * Math.floor(Math.abs(wheelAccum) / 60);
    if (step) { wheelAccum -= step * 60; setTarget(activeIndex + step); }
  }, { passive: false });

  let touchStartX = null;
  el.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (touchStartX == null) return;
    const dx = e.touches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      setTarget(activeIndex + (dx > 0 ? -1 : 1));
      touchStartX = e.touches[0].clientX;
    }
  }, { passive: true });
  el.addEventListener('touchend', () => { touchStartX = null; });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { setTarget(activeIndex + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { setTarget(activeIndex - 1); e.preventDefault(); }
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  el.addEventListener('click', (e) => {
    const rect = el.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(panels.map(p => p.mesh));
    if (hits.length) {
      const panel = panels.find(p => p.mesh === hits[0].object);
      if (panel) {
        if (panel.index === activeIndex) openModal(panel.project);
        else setTarget(panel.index);
      }
    }
  });

  const nameEl = document.getElementById('work-focus-name');
  const counterEl = document.getElementById('work-counter');
  const dotsEl = document.getElementById('work-dots');

  if (dotsEl) {
    for (let i = 0; i < COUNT; i++) {
      const dot = document.createElement('div');
      dot.className = 'work__dot' + (i === 0 ? ' is-active' : '');
      dotsEl.appendChild(dot);
    }
  }

  function updateUI() {
    const p = PROJECTS[activeIndex];
    if (nameEl) { nameEl.textContent = p.name; nameEl.style.color = p.color; }
    if (counterEl) counterEl.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(COUNT).padStart(2, '0')} · ${p.tech}`;
    if (dotsEl) dotsEl.querySelectorAll('.work__dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === activeIndex);
      d.style.width = i === activeIndex ? '18px' : '4px';
    });
  }
  updateUI();

  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(container);

  (function loop() {
    currentAngle += (targetAngle - currentAngle) * 0.08;
    reelGroup.rotation.y = currentAngle;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

function createCurvedPlane(arcAngle, height, radius, segmentsW, segmentsH) {
  const geo = new THREE.BufferGeometry();
  const w = segmentsW, h = segmentsH;
  const verts = [];
  const uvs = [];
  const indices = [];

  for (let iy = 0; iy <= h; iy++) {
    for (let ix = 0; ix <= w; ix++) {
      const u = ix / w;
      const v = iy / h;
      const a = (u - 0.5) * arcAngle;
      const x = Math.sin(a) * radius;
      const z = Math.cos(a) * radius - radius;
      const y = (v - 0.5) * height;
      verts.push(x, y, z);
      uvs.push(u, 1 - v);
    }
  }

  for (let iy = 0; iy < h; iy++) {
    for (let ix = 0; ix < w; ix++) {
      const a = iy * (w + 1) + ix;
      const b = a + 1;
      const c = a + (w + 1);
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function addCurvedSprocketHoles(group, yPos, arcAngle, radius) {
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x0a0a1a });
  const count = 8;
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const a = (u - 0.5) * arcAngle;
    const x = Math.sin(a) * (radius + 0.01);
    const z = Math.cos(a) * (radius + 0.01) - radius;
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.18), holeMat);
    hole.position.set(x, yPos, z);
    hole.rotation.y = -a;
    group.add(hole);
  }
}

function makeFrameTexture(p, i) {
  const W = 720, H = 480;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = p.color;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 0, W, 44);

  ctx.fillStyle = '#F0ECE4';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText('#' + String(i + 1).padStart(2, '0'), 16, 30);
  ctx.textAlign = 'right';
  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.fillText(p.tech.toUpperCase(), W - 16, 30);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.font = 'bold 52px "Silkscreen", monospace';
  ctx.fillText(p.name.toUpperCase(), 22, H / 2 + 6);
  ctx.fillStyle = '#F0ECE4';
  ctx.fillText(p.name.toUpperCase(), 18, H / 2 + 2);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText(p.tags, 18, H / 2 + 36);

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '14px "Space Grotesk", sans-serif';
  wrapText(ctx, p.desc, 18, H / 2 + 64, W - 36, 20);

  ctx.fillStyle = '#FFFF62';
  ctx.fillRect(18, H - 52, 130, 32);
  ctx.fillStyle = '#202020';
  ctx.font = 'bold 12px "Silkscreen", monospace';
  ctx.fillText('VIEW PROJECT', 28, H - 31);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = w + ' '; y += lh; }
    else line = test;
    if (y > 440) return;
  }
  ctx.fillText(line, x, y);
}

function openModal(project) {
  const modal = document.getElementById('work-modal');
  document.getElementById('work-modal-hero').style.background = project.color;
  document.getElementById('work-modal-title').textContent = project.name;
  document.getElementById('work-modal-tags').textContent = project.tags;
  document.getElementById('work-modal-body').innerHTML = `<p>${project.desc}</p>`;
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('work-modal').classList.remove('is-open');
  document.body.style.overflow = '';
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import * as geometryForm from './scene/geometry-form.js';
import * as geometryDetail from './scene/geometry-detail.js';
import * as materialsSurface from './scene/materials-surface.js';
import * as materialsColor from './scene/materials-color.js';
import * as lighting from './scene/lighting.js';
import * as composition from './scene/composition.js';
import * as animation from './scene/animation.js';

const DOMAINS = [
  { name: 'geometry-form', mod: geometryForm },
  { name: 'geometry-detail', mod: geometryDetail },
  { name: 'materials-surface', mod: materialsSurface },
  { name: 'materials-color', mod: materialsColor },
  { name: 'lighting', mod: lighting },
  { name: 'composition', mod: composition },
  { name: 'animation', mod: animation },
];

const CAM_DESKTOP = {
  idle: {
    pos: new THREE.Vector3(1.93, 1.19, -0.65),
    target: new THREE.Vector3(0.43, 0.56, 0.45),
    fov: 40,
  },
  play: {
    pos: new THREE.Vector3(0.55, 0.83, -0.55),
    target: new THREE.Vector3(-0.02, 0.61, -0.08),
    fov: 40,
  },
};

const CAM_MOBILE = {
  idle: {
    pos: new THREE.Vector3(2.14, 1.18, -0.55),
    target: new THREE.Vector3(0.15, 0.39, -0.20),
    fov: 50,
  },
  play: {
    pos: new THREE.Vector3(0.69, 0.89, -0.64),
    target: new THREE.Vector3(0.02, 0.47, -0.11),
    fov: 48,
  },
};

function isMobile() { return window.innerWidth <= 768; }
function pickStates() {
  const src = isMobile() ? CAM_MOBILE : CAM_DESKTOP;
  return { idle: src.idle, play: src.play };
}
const CAM_STATES = pickStates();

let scene, camera, renderer, controls, activeComposer;
let currentState = 'idle';
let camTransition = { t: 1, from: null, to: null, active: false };
const clock = new THREE.Clock();

function lerpCam(delta) {
  if (!camTransition.active) return;
  camTransition.t += delta * 0.8;
  if (camTransition.t >= 1) {
    camTransition.t = 1;
    camTransition.active = false;
  }
  const t = camTransition.t * camTransition.t * (3 - 2 * camTransition.t);
  const from = camTransition.from;
  const to = camTransition.to;

  camera.position.lerpVectors(from.pos, to.pos, t);
  controls.target.lerpVectors(from.target, to.target, t);
  camera.fov = from.fov + (to.fov - from.fov) * t;
  camera.updateProjectionMatrix();
  controls.update();
}

function transitionTo(stateName) {
  const target = CAM_STATES[stateName];
  if (!target) return;

  camTransition.from = {
    pos: camera.position.clone(),
    target: controls.target.clone(),
    fov: camera.fov,
  };
  camTransition.to = target;
  camTransition.t = 0;
  camTransition.active = true;
  currentState = stateName;
}

export async function initFooterScene() {
  const container = document.getElementById('footer-canvas-container');
  if (!container) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(CAM_STATES.idle.fov, container.clientWidth / container.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envMap = pmremGenerator.fromScene(new RoomEnvironment()).texture;
  scene.environment = envMap;
  pmremGenerator.dispose();

  window.__cephalopodCamera = camera;
  window.__cephalopodRenderer = renderer;
  window.__cephalopodScene = scene;
  window.THREE = THREE;

  renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 0.5;
  controls.maxDistance = 20;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.enabled = false;
  window.__cephalopodControls = controls;

  const errors = [];
  for (const { name, mod } of DOMAINS) {
    try {
      if (name === 'composition') {
        camera.fov = CAM_STATES.idle.fov;
        camera.position.copy(CAM_STATES.idle.pos);
        controls.target.copy(CAM_STATES.idle.target);
        camera.updateProjectionMatrix();
        controls.update();
      } else if (name === 'lighting') {
        await mod.apply(scene, renderer, camera);
        if (mod.getComposer) {
          activeComposer = mod.getComposer(renderer, scene, camera);
        }
      } else {
        await mod.apply(scene);
      }
    } catch (e) {
      errors.push({ agent: name, error: e.message });
      console.warn(`Footer scene [${name}]:`, e.message);
    }
  }

  const playBtn = document.getElementById('footer-play-btn');
  const footer = document.getElementById('footer');

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (currentState === 'idle') {
        transitionTo('play');
        footer.classList.add('footer--active');
        controls.enabled = false;
      } else {
        transitionTo('idle');
        footer.classList.remove('footer--active');
        controls.enabled = false;
      }
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!animating) startAnimation();
      } else {
        stopAnimation();
      }
    });
  }, { threshold: 0.05 });
  observer.observe(container);

  let wasMobile = isMobile();
  window.addEventListener('resize', () => {
    if (!container.clientWidth) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    if (activeComposer) {
      activeComposer.setSize(container.clientWidth, container.clientHeight);
    }
    const nowMobile = isMobile();
    if (nowMobile !== wasMobile) {
      wasMobile = nowMobile;
      const src = nowMobile ? CAM_MOBILE : CAM_DESKTOP;
      CAM_STATES.idle = src.idle;
      CAM_STATES.play = src.play;
      transitionTo(currentState);
    }
  });

  createCamTweaker();
}

let animating = false;
let frameId = null;

function startAnimation() {
  if (animating) return;
  animating = true;
  animate();
}

function stopAnimation() {
  animating = false;
  if (frameId) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }
}

function animate() {
  if (!animating) return;
  frameId = requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  lerpCam(delta);
  controls.update();

  scene.traverse((obj) => {
    if (obj.material && obj.material.uniforms && obj.material.uniforms.uTime) {
      obj.material.uniforms.uTime.value = elapsed;
    }
  });

  if (scene.userData.animations) {
    for (const fn of scene.userData.animations) {
      fn(elapsed, delta);
    }
  }

  if (activeComposer) {
    activeComposer.render();
  } else {
    renderer.render(scene, camera);
  }
}

function createCamTweaker() {
  const panel = document.createElement('div');
  panel.id = 'cam-tweaker';
  panel.innerHTML = `
    <div class="ctw__header">
      <span>CAM STATES</span>
      <button class="ctw__close">&times;</button>
    </div>
    <div class="ctw__section">
      <label class="ctw__label">ORBIT CONTROLS</label>
      <div class="ctw__row">
        <button class="ctw__btn" id="ctw-orbit-toggle">ENABLE ORBIT</button>
        <button class="ctw__btn" id="ctw-pan-toggle">PAN MODE</button>
      </div>
    </div>
    <div class="ctw__section">
      <label class="ctw__label">CURRENT CAMERA</label>
      <div class="ctw__readout" id="ctw-readout">---</div>
    </div>
    <div class="ctw__section">
      <label class="ctw__label">IDLE STATE</label>
      <div class="ctw__readout ctw__readout--sm" id="ctw-idle-vals">pos(${v3str(CAM_STATES.idle.pos)}) target(${v3str(CAM_STATES.idle.target)})</div>
      <div class="ctw__row">
        <button class="ctw__btn" id="ctw-set-idle">SET FROM CURRENT</button>
        <button class="ctw__btn" id="ctw-go-idle">GO TO</button>
      </div>
    </div>
    <div class="ctw__section">
      <label class="ctw__label">PLAY STATE</label>
      <div class="ctw__readout ctw__readout--sm" id="ctw-play-vals">pos(${v3str(CAM_STATES.play.pos)}) target(${v3str(CAM_STATES.play.target)})</div>
      <div class="ctw__row">
        <button class="ctw__btn" id="ctw-set-play">SET FROM CURRENT</button>
        <button class="ctw__btn" id="ctw-go-play">GO TO</button>
      </div>
    </div>
    <div class="ctw__section">
      <label class="ctw__label">EXPORT</label>
      <div class="ctw__row">
        <button class="ctw__btn ctw__btn--accent" id="ctw-copy">COPY STATES</button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  const toggle = document.createElement('button');
  toggle.id = 'cam-toggle';
  toggle.textContent = 'CAM';
  toggle.style.cssText = `position:fixed;top:50%;left:0;transform:translateY(-50%);z-index:10001;background:rgba(8,8,16,0.8);border:1px solid rgba(255,255,255,0.1);border-left:none;color:rgba(255,255,255,0.5);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;padding:12px 8px;cursor:pointer;writing-mode:vertical-rl;transition:all 0.2s;backdrop-filter:blur(10px);`;
  document.body.appendChild(toggle);

  toggle.addEventListener('click', () => {
    panel.classList.toggle('ctw--open');
    toggle.classList.toggle('ctw--shifted');
  });

  panel.querySelector('.ctw__close').addEventListener('click', () => {
    panel.classList.remove('ctw--open');
    toggle.classList.remove('ctw--shifted');
  });

  const orbitBtn = panel.querySelector('#ctw-orbit-toggle');
  orbitBtn.addEventListener('click', () => {
    controls.enabled = !controls.enabled;
    orbitBtn.textContent = controls.enabled ? 'DISABLE ORBIT' : 'ENABLE ORBIT';
    orbitBtn.style.borderColor = controls.enabled ? 'rgba(0,212,255,0.5)' : '';
  });

  let panMode = false;
  const panBtn = panel.querySelector('#ctw-pan-toggle');
  panBtn.addEventListener('click', () => {
    panMode = !panMode;
    if (panMode) {
      controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
      controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    } else {
      controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    }
    panBtn.textContent = panMode ? 'ROTATE MODE' : 'PAN MODE';
    panBtn.style.borderColor = panMode ? 'rgba(0,212,255,0.5)' : '';
  });

  panel.querySelector('#ctw-set-idle').addEventListener('click', () => {
    CAM_STATES.idle.pos.copy(camera.position);
    CAM_STATES.idle.target.copy(controls.target);
    CAM_STATES.idle.fov = camera.fov;
    panel.querySelector('#ctw-idle-vals').textContent = `pos(${v3str(camera.position)}) target(${v3str(controls.target)})`;
  });

  panel.querySelector('#ctw-set-play').addEventListener('click', () => {
    CAM_STATES.play.pos.copy(camera.position);
    CAM_STATES.play.target.copy(controls.target);
    CAM_STATES.play.fov = camera.fov;
    panel.querySelector('#ctw-play-vals').textContent = `pos(${v3str(camera.position)}) target(${v3str(controls.target)})`;
  });

  panel.querySelector('#ctw-go-idle').addEventListener('click', () => {
    transitionTo('idle');
    document.getElementById('footer').classList.remove('footer--active');
  });

  panel.querySelector('#ctw-go-play').addEventListener('click', () => {
    transitionTo('play');
    document.getElementById('footer').classList.add('footer--active');
  });

  panel.querySelector('#ctw-copy').addEventListener('click', () => {
    const out = `idle: { pos: (${v3str(CAM_STATES.idle.pos)}), target: (${v3str(CAM_STATES.idle.target)}), fov: ${CAM_STATES.idle.fov} }\nplay: { pos: (${v3str(CAM_STATES.play.pos)}), target: (${v3str(CAM_STATES.play.target)}), fov: ${CAM_STATES.play.fov} }`;
    navigator.clipboard.writeText(out);
    const btn = panel.querySelector('#ctw-copy');
    btn.textContent = 'COPIED!';
    setTimeout(() => { btn.textContent = 'COPY STATES'; }, 1500);
  });

  setInterval(() => {
    if (!camera) return;
    const el = panel.querySelector('#ctw-readout');
    if (el) {
      el.textContent = `pos(${v3str(camera.position)}) target(${v3str(controls.target)}) fov:${camera.fov.toFixed(0)}`;
    }
  }, 200);

  injectCamTweakerStyles();
}

function v3str(v) {
  return `${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`;
}

function injectCamTweakerStyles() {
  const s = document.createElement('style');
  s.textContent = `
    #cam-tweaker { position:fixed;top:0;left:-300px;width:280px;height:100vh;background:rgba(8,8,16,0.95);border-right:1px solid rgba(255,255,255,0.1);z-index:10000;overflow-y:auto;padding:16px;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.7);transition:left 0.3s cubic-bezier(0.4,0,0.2,1);backdrop-filter:blur(20px); }
    #cam-tweaker.ctw--open { left:0; }
    .ctw--shifted { left:280px !important; }
    .ctw__header { display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.1);font-size:12px;letter-spacing:3px;color:rgba(255,255,255,0.9); }
    .ctw__close { background:none;border:none;color:rgba(255,255,255,0.5);font-size:20px;cursor:pointer; }
    .ctw__section { margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.05); }
    .ctw__label { display:block;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.3);margin-bottom:8px; }
    .ctw__readout { font-size:9px;color:rgba(0,212,255,0.7);margin-bottom:8px;word-break:break-all;line-height:1.4; }
    .ctw__readout--sm { font-size:8px;color:rgba(255,255,255,0.35); }
    .ctw__row { display:flex;gap:6px;flex-wrap:wrap; }
    .ctw__btn { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;padding:6px 10px;cursor:pointer;transition:all 0.2s; }
    .ctw__btn:hover { background:rgba(255,255,255,0.08);color:white; }
    .ctw__btn--accent { border-color:rgba(0,212,255,0.3);color:rgba(0,212,255,0.7); }
    .ctw__btn--accent:hover { background:rgba(0,212,255,0.12);color:#00D4FF; }
  `;
  document.head.appendChild(s);
}

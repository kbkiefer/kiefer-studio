# kiefer.studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scroll-driven portfolio website at kiefer.studio with a Three.js pixelated 3D bust hero, GSAP scroll animations, bold color-shifting sections, and horizontal project gallery.

**Architecture:** Static single-page site. Vanilla HTML/CSS/JS with ES modules. Three.js handles the 3D bust with pixelation post-processing. GSAP + ScrollTrigger orchestrates all scroll-linked animations including the 3D model behavior. Lenis provides smooth scrolling. No build step needed for dev (use a local server for ES module imports); production bundles via a simple Vite config.

**Tech Stack:** HTML/CSS/JS, Three.js (GLTFLoader, EffectComposer, RenderPixelatedPass), GSAP + ScrollTrigger + Draggable, Lenis, SplitType, Vite (build only)

---

## File Structure

```
kiefer-studio/
├── index.html                    # Single page, all sections
├── css/
│   └── styles.css                # All styles, CSS variables, responsive
├── js/
│   ├── main.js                   # Entry: init Lenis, GSAP, sections
│   ├── bust.js                   # Three.js scene: load model, pixelate, grayscale
│   ├── scroll-animations.js      # GSAP ScrollTrigger: color shifts, text reveals, bust scroll
│   ├── marquee.js                # Marquee speed control (optional GSAP velocity)
│   └── projects.js               # Horizontal drag scroll for project gallery
├── assets/
│   ├── models/
│   │   └── kiefer-bust.glb       # 3D model (copied from Downloads)
│   └── fonts/
│       └── (OffBit font files when licensed, Silkscreen via Google Fonts for dev)
├── package.json                  # Dependencies: three, gsap, lenis, split-type
├── vite.config.js                # Minimal Vite config for production build
└── docs/                         # Specs and plans (already exists)
```

---

### Task 1: Project Scaffold + Dev Server

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html` (skeleton)
- Create: `css/styles.css` (CSS variables + reset)
- Create: `js/main.js` (empty entry)
- Copy: model file to `assets/models/`

- [ ] **Step 1: Initialize project**

```bash
cd /Users/kbkiefer/Documents/Projects/kiefer-studio
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install three gsap @studio-freight/lenis split-type
npm install -D vite
```

- [ ] **Step 3: Create vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  },
});
```

- [ ] **Step 4: Copy the 3D model**

```bash
mkdir -p assets/models
cp "/Users/kbkiefer/Downloads/Kiefer Website Model.glb" assets/models/kiefer-bust.glb
```

- [ ] **Step 5: Create index.html skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kiefer | Design, Code, Build</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=JetBrains+Mono:wght@300;400&family=Space+Grotesk:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <nav class="nav" id="nav"></nav>
  <section class="hero" id="hero"></section>
  <div class="marquee" id="marquee"></div>
  <section class="section section--blue" id="statement"></section>
  <section class="projects" id="projects"></section>
  <section class="section section--pink" id="services"></section>
  <section class="section section--cyan" id="about"></section>
  <section class="section section--yellow" id="cta"></section>
  <footer class="footer" id="footer"></footer>
  <script type="module" src="/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 6: Create css/styles.css with variables and reset**

```css
/* css/styles.css */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-base: #D9D9D9;
  --bg-blue: #012FFF;
  --bg-pink: #FFBDFF;
  --bg-yellow: #FFFF62;
  --bg-cyan: #7DFFFF;
  --bg-dark: #202020;
  --text-dark: #202020;
  --text-light: #F0ECE4;
  --border-light: rgba(32, 32, 32, 0.12);
  --border-dark: rgba(255, 255, 255, 0.1);

  --font-display: 'Silkscreen', monospace;
  --font-mono: 'JetBrains Mono', monospace;
  --font-body: 'Space Grotesk', sans-serif;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

body {
  background: var(--bg-base);
  color: var(--text-dark);
  font-family: var(--font-body);
  overflow-x: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}

ul { list-style: none; }

img { max-width: 100%; display: block; }
```

- [ ] **Step 7: Create empty js/main.js**

```js
// js/main.js
console.log('kiefer.studio loaded');
```

- [ ] **Step 8: Add dev script to package.json and test**

Add to package.json scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Run: `npm run dev`
Expected: Dev server at http://localhost:3000, blank page with grey background, console shows "kiefer.studio loaded"

- [ ] **Step 9: Initialize git and commit**

```bash
cd /Users/kbkiefer/Documents/Projects/kiefer-studio
git init
echo "node_modules/\ndist/\n.DS_Store\n.superpowers/" > .gitignore
git add .
git commit -m "feat: project scaffold with Vite, Three.js, GSAP deps"
```

---

### Task 2: Navigation Bar

**Files:**
- Modify: `index.html` (nav content)
- Modify: `css/styles.css` (nav styles)

- [ ] **Step 1: Add nav HTML to index.html**

Replace the empty `<nav>` with:

```html
<nav class="nav" id="nav">
  <div class="nav__left">
    <a href="#projects" class="nav__link">work</a>
    <a href="#services" class="nav__link">services</a>
    <a href="#about" class="nav__link">about</a>
  </div>
  <div class="nav__logo">K<br>I E<br>F E R</div>
  <div class="nav__right">
    <a href="#" class="nav__link">curiosity</a>
    <a href="mailto:kbkiefer95@gmail.com" class="nav__contact">
      <span class="nav__contact-track">contact &ndash; contact &ndash; contact &ndash; contact &ndash; contact</span>
    </a>
  </div>
</nav>
```

- [ ] **Step 2: Add nav styles to css/styles.css**

```css
/* Navigation */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  mix-blend-mode: difference;
  color: white;
}

.nav__left,
.nav__right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav__link {
  font-family: var(--font-body);
  font-size: 13px;
  letter-spacing: 0.5px;
  padding: 8px 16px;
  cursor: pointer;
  border-bottom: 1px solid currentColor;
  transition: opacity 0.3s;
}

.nav__link:hover {
  opacity: 0.6;
}

.nav__logo {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 1px;
  text-transform: uppercase;
  line-height: 1.1;
  text-align: center;
}

.nav__contact {
  display: block;
  background: var(--bg-dark);
  color: white;
  padding: 8px 0;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: lowercase;
  overflow: hidden;
  max-width: 200px;
  mix-blend-mode: normal;
}

.nav__contact-track {
  display: inline-block;
  white-space: nowrap;
  padding: 0 20px;
  animation: contact-scroll 8s linear infinite;
}

@keyframes contact-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Expected: Fixed nav at top with links left, stacked "KIEFER" center, scrolling contact strip right. Nav inverts color on different backgrounds via mix-blend-mode.

- [ ] **Step 4: Commit**

```bash
git add index.html css/styles.css
git commit -m "feat: add fixed navigation with mix-blend-mode"
```

---

### Task 3: Hero Section with Diagonal Marquee Bands

**Files:**
- Modify: `index.html` (hero content)
- Modify: `css/styles.css` (hero + band styles)

- [ ] **Step 1: Add hero HTML to index.html**

Replace the empty `<section class="hero">` with:

```html
<section class="hero" id="hero">
  <div class="hero__band hero__band--1">
    <div class="hero__band-track">
      <span class="hero__band-text">design and code and build and design and code and build and design and code and build and&nbsp;</span>
      <span class="hero__band-text">design and code and build and design and code and build and design and code and build and&nbsp;</span>
    </div>
  </div>

  <div class="hero__band hero__band--2">
    <div class="hero__band-track">
      <span class="hero__band-text">KIEFER</span>
      <span class="hero__band-text">STUDIO</span>
      <span class="hero__band-text">KIEFER</span>
      <span class="hero__band-text">STUDIO</span>
      <span class="hero__band-text">KIEFER</span>
      <span class="hero__band-text">STUDIO</span>
      <span class="hero__band-text">KIEFER</span>
      <span class="hero__band-text">STUDIO</span>
    </div>
  </div>

  <div class="hero__band hero__band--3">
    <div class="hero__band-track hero__band-track--reverse">
      <span class="hero__band-text">self-taught &middot; developer &middot; designer &middot; builder &middot; self-taught &middot; developer &middot; designer &middot; builder &middot;&nbsp;</span>
      <span class="hero__band-text">self-taught &middot; developer &middot; designer &middot; builder &middot; self-taught &middot; developer &middot; designer &middot; builder &middot;&nbsp;</span>
    </div>
  </div>

  <canvas id="bust-canvas"></canvas>
</section>
```

- [ ] **Step 2: Add hero + band styles**

```css
/* Hero */
.hero {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-base);
}

#bust-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

/* Diagonal Marquee Bands */
.hero__band {
  position: absolute;
  white-space: nowrap;
  overflow: hidden;
  z-index: 1;
}

.hero__band-track {
  display: inline-flex;
  white-space: nowrap;
  animation: band-scroll 20s linear infinite;
}

.hero__band-track--reverse {
  animation-direction: reverse;
}

.hero__band-text {
  font-family: var(--font-display);
  letter-spacing: 2px;
  padding: 0 24px;
  flex-shrink: 0;
}

@keyframes band-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.hero__band--1 {
  top: 12%;
  left: -10%;
  right: -10%;
  transform: rotate(-4deg);
  background: var(--bg-blue);
  color: white;
  padding: 14px 0;
  font-size: 28px;
}

.hero__band--2 {
  top: 38%;
  left: -10%;
  right: -10%;
  transform: rotate(-6deg);
  background: var(--bg-blue);
  color: white;
  padding: 20px 0;
  font-size: 72px;
}

.hero__band--3 {
  bottom: 2%;
  left: 0;
  right: 0;
  background: var(--bg-yellow);
  color: var(--text-dark);
  padding: 8px 0;
  font-size: 18px;
  z-index: 3;
}
```

- [ ] **Step 3: Verify in browser**

Expected: Full-viewport hero with grey bg, two diagonal blue marquee bands scrolling with "design and code and build" and "KIEFER STUDIO", yellow bottom strip scrolling in reverse. Canvas element is transparent and invisible (no 3D yet).

- [ ] **Step 4: Commit**

```bash
git add index.html css/styles.css
git commit -m "feat: hero section with diagonal marquee text bands"
```

---

### Task 4: Three.js Pixelated 3D Bust

**Files:**
- Create: `js/bust.js`
- Modify: `js/main.js`

This is the core visual feature. The bust loads centered, renders in grayscale with pixelation, follows the mouse, and responds to scroll.

- [ ] **Step 1: Create js/bust.js**

```js
// js/bust.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';

let scene, camera, renderer, composer, model;
let targetRotX = 0, targetRotY = 0;
let currentRotX = 0, currentRotY = 0;
const canvas = document.getElementById('bust-canvas');

export function initBust() {
  if (!canvas || window.innerWidth < 768) return;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
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

  composer = new EffectComposer(renderer);

  const pixelPass = new RenderPixelatedPass(6, scene, camera);
  pixelPass.normalEdgeStrength = 0.3;
  pixelPass.depthEdgeStrength = 0.4;
  composer.addPass(pixelPass);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(2, 3, 4);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-2, 0, 2);
  scene.add(fillLight);

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

function onMouseMove(e) {
  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * 2;
  targetRotY = x * 0.15;
  targetRotX = -y * 0.08;
}

function onResize() {
  if (!renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    currentRotX += (targetRotX - currentRotX) * 0.05;
    currentRotY += (targetRotY - currentRotY) * 0.05;
    model.rotation.x = currentRotX;
    model.rotation.y = currentRotY;
  }

  composer.render();
}

export function getModel() { return model; }
export function getCamera() { return camera; }
export function getCanvas() { return canvas; }
```

- [ ] **Step 2: Wire bust into main.js**

```js
// js/main.js
import { initBust } from './bust.js';

document.addEventListener('DOMContentLoaded', () => {
  initBust();
});
```

- [ ] **Step 3: Verify in browser**

Expected: The 3D model appears centered in the hero, rendered in grey with pixelated edges. Background is transparent (diagonal blue bands show through). Model subtly follows the mouse cursor. No dark box or frame around the model.

- [ ] **Step 4: Commit**

```bash
git add js/bust.js js/main.js
git commit -m "feat: Three.js pixelated grayscale bust with mouse follow"
```

---

### Task 5: Smooth Scrolling + Scroll Animations (Lenis + GSAP)

**Files:**
- Create: `js/scroll-animations.js`
- Modify: `js/main.js`

- [ ] **Step 1: Create js/scroll-animations.js**

```js
// js/scroll-animations.js
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { getModel, getCamera, getCanvas } from './bust.js';

gsap.registerPlugin(ScrollTrigger);

let lenis;

export function initScrollAnimations() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  initBustScroll();
  initTextReveals();
}

function initBustScroll() {
  const model = getModel();
  const camera = getCamera();
  const canvas = getCanvas();
  if (!model || !canvas) return;

  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
    onUpdate: (self) => {
      const p = self.progress;

      model.rotation.y += p * Math.PI * 0.5;

      camera.position.y = 0.5 - p * 0.8;
      camera.position.z = 4.5 - p * 2.0;

      canvas.style.opacity = 1 - p * 1.5;
    },
  });
}

function initTextReveals() {
  const statementTitle = document.querySelector('#statement .section__title');
  if (statementTitle) {
    const split = new SplitType(statementTitle, { types: 'lines' });
    gsap.from(split.lines, {
      y: 60,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: statementTitle,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  const aboutText = document.querySelector('#about .section__text');
  if (aboutText) {
    const split = new SplitType(aboutText, { types: 'lines' });
    gsap.from(split.lines, {
      y: 40,
      opacity: 0,
      stagger: 0.12,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: aboutText,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  }
}
```

- [ ] **Step 2: Update main.js**

```js
// js/main.js
import { initBust } from './bust.js';
import { initScrollAnimations } from './scroll-animations.js';

document.addEventListener('DOMContentLoaded', () => {
  initBust();

  setTimeout(() => {
    initScrollAnimations();
  }, 500);
});
```

The `setTimeout` gives the bust model time to load before wiring scroll triggers that reference it.

- [ ] **Step 3: Verify in browser**

Expected: Smooth scrolling via Lenis. As you scroll past the hero, the bust rotates on Y, camera moves closer/lower, and the canvas fades out. Statement and about text reveal line-by-line on scroll.

- [ ] **Step 4: Commit**

```bash
git add js/scroll-animations.js js/main.js
git commit -m "feat: Lenis smooth scroll + GSAP bust scroll behavior + text reveals"
```

---

### Task 6: All Page Sections (Marquee, Statement, Projects, Services, About, CTA, Footer)

**Files:**
- Modify: `index.html` (all section content)
- Modify: `css/styles.css` (all section styles)

- [ ] **Step 1: Add all section HTML to index.html**

Replace all empty section placeholders with full content:

```html
<!-- Discipline Marquee -->
<div class="marquee" id="marquee">
  <div class="marquee__track">
    <span class="marquee__pill">iOS Apps</span>
    <span class="marquee__pill marquee__pill--filled">Immersive Web</span>
    <span class="marquee__pill">3D Printing</span>
    <span class="marquee__pill marquee__pill--filled">Game Dev</span>
    <span class="marquee__pill">AI Research</span>
    <span class="marquee__pill">Branding</span>
    <span class="marquee__pill marquee__pill--filled">Motion</span>
    <span class="marquee__pill">Typography</span>
    <span class="marquee__pill">iOS Apps</span>
    <span class="marquee__pill marquee__pill--filled">Immersive Web</span>
    <span class="marquee__pill">3D Printing</span>
    <span class="marquee__pill marquee__pill--filled">Game Dev</span>
    <span class="marquee__pill">AI Research</span>
    <span class="marquee__pill">Branding</span>
    <span class="marquee__pill marquee__pill--filled">Motion</span>
    <span class="marquee__pill">Typography</span>
  </div>
</div>

<!-- Statement -->
<section class="section section--blue" id="statement">
  <span class="section__label">01 // What I Do</span>
  <h2 class="section__title">One Person.<br>Full Stack.<br>Every Pixel.</h2>
</section>

<!-- Projects -->
<section class="projects" id="projects">
  <div class="projects__header">
    <span class="projects__label">Selected Work</span>
    <span class="projects__hint">Drag &rarr;</span>
  </div>
  <div class="projects__track" id="projects-track">
    <a class="project-card" href="#">
      <div class="project-card__img" style="background: linear-gradient(135deg, #0a1050, #1a2a8e);">
        <span class="project-card__watermark">Cymatics Lab</span>
      </div>
      <div class="project-card__info">
        <span class="project-card__name">Cymatics Lab</span>
        <span class="project-card__tags">iOS &middot; Metal &middot; Audio Visualization</span>
      </div>
    </a>
    <a class="project-card" href="#">
      <div class="project-card__img" style="background: linear-gradient(135deg, #0a3a15, #1a6e2a);">
        <span class="project-card__watermark">Imago</span>
      </div>
      <div class="project-card__info">
        <span class="project-card__name">Imago</span>
        <span class="project-card__tags">iOS &middot; AI &middot; ADHD Companion</span>
      </div>
    </a>
    <a class="project-card" href="#">
      <div class="project-card__img" style="background: linear-gradient(135deg, #3a2a0a, #6e4e1a);">
        <span class="project-card__watermark">Border Child</span>
      </div>
      <div class="project-card__info">
        <span class="project-card__name">Border Child</span>
        <span class="project-card__tags">Web &middot; R3F &middot; Film</span>
      </div>
    </a>
    <a class="project-card" href="#">
      <div class="project-card__img" style="background: linear-gradient(135deg, #0a2a3a, #1a4e6e);">
        <span class="project-card__watermark">NovaTrade</span>
      </div>
      <div class="project-card__info">
        <span class="project-card__name">NovaTrade</span>
        <span class="project-card__tags">macOS &middot; SwiftUI &middot; Trading</span>
      </div>
    </a>
    <a class="project-card" href="#">
      <div class="project-card__img" style="background: linear-gradient(135deg, #2a0a3a, #4e1a6e);">
        <span class="project-card__watermark">Resonance</span>
      </div>
      <div class="project-card__info">
        <span class="project-card__name">Resonance</span>
        <span class="project-card__tags">iOS &middot; Metal &middot; Consciousness</span>
      </div>
    </a>
    <a class="project-card" href="#">
      <div class="project-card__img" style="background: linear-gradient(135deg, #3a0a0a, #6e1a1a);">
        <span class="project-card__watermark">ClearMind</span>
      </div>
      <div class="project-card__info">
        <span class="project-card__name">ClearMind</span>
        <span class="project-card__tags">iOS &middot; Canvas &middot; Neural Map</span>
      </div>
    </a>
    <a class="project-card" href="#">
      <div class="project-card__img" style="background: linear-gradient(135deg, #3a3a0a, #6e6e1a);">
        <span class="project-card__watermark">Chrysalis</span>
      </div>
      <div class="project-card__info">
        <span class="project-card__name">Chrysalis</span>
        <span class="project-card__tags">Unity &middot; 3D &middot; Game</span>
      </div>
    </a>
    <a class="project-card" href="#">
      <div class="project-card__img" style="background: linear-gradient(135deg, #0a3a3a, #1a6e6e);">
        <span class="project-card__watermark">ShalaMakes</span>
      </div>
      <div class="project-card__info">
        <span class="project-card__name">ShalaMakes</span>
        <span class="project-card__tags">Web &middot; 3D Printing &middot; Store</span>
      </div>
    </a>
  </div>
  <div class="projects__ghost" id="projects-ghost">Cymatics Lab</div>
</section>

<!-- Services -->
<section class="section section--pink" id="services">
  <span class="section__label">02 // Services</span>
  <h2 class="section__title">What I Build</h2>
  <div class="services__grid">
    <div class="service-card">
      <span class="service-card__name">iOS & macOS</span>
      <span class="service-card__desc">SwiftUI &middot; Metal &middot; Core ML</span>
      <span class="service-card__hover">part of the script</span>
    </div>
    <div class="service-card">
      <span class="service-card__name">Immersive Web</span>
      <span class="service-card__desc">React &middot; Three.js &middot; GSAP</span>
      <span class="service-card__hover">deploy, deploy, deploy</span>
    </div>
    <div class="service-card">
      <span class="service-card__name">3D & Game Dev</span>
      <span class="service-card__desc">Unity &middot; Blender &middot; Meshy</span>
      <span class="service-card__hover">mixing realities</span>
    </div>
    <div class="service-card">
      <span class="service-card__name">Branding</span>
      <span class="service-card__desc">Identity &middot; Typography &middot; Direction</span>
      <span class="service-card__hover">with hot irons</span>
    </div>
    <div class="service-card">
      <span class="service-card__name">3D Printing</span>
      <span class="service-card__desc">Product Design &middot; Prototyping</span>
      <span class="service-card__hover">from bits to atoms</span>
    </div>
    <div class="service-card">
      <span class="service-card__name">AI & Research</span>
      <span class="service-card__desc">Agents &middot; ML &middot; Consciousness</span>
      <span class="service-card__hover">crafted to inspire</span>
    </div>
  </div>
</section>

<!-- About -->
<section class="section section--cyan" id="about">
  <span class="section__label">03 // About</span>
  <p class="section__text">
    <strong>Self-taught developer and designer.</strong> I build across iOS, macOS, web, and physical objects. From Metal shaders to 3D printing to consciousness research. Based in Laredo, Texas. Everything on this site was designed, coded, and shipped by one person.
  </p>
</section>

<!-- CTA -->
<section class="section section--yellow" id="cta">
  <h2 class="section__title section__title--center">Got An Idea?</h2>
  <span class="section__subtitle">Let's make it real</span>
</section>

<!-- Footer -->
<footer class="footer" id="footer">
  <a href="mailto:kbkiefer95@gmail.com" class="footer__cta">Let's Build<br>Something</a>
  <div class="footer__marquee">
    <div class="marquee__track marquee__track--reverse">
      <span class="marquee__pill marquee__pill--dark">ShalaWorks</span>
      <span class="marquee__pill marquee__pill--dark">ShalaMakes</span>
      <span class="marquee__pill marquee__pill--dark">Available for Projects</span>
      <span class="marquee__pill marquee__pill--dark">Laredo TX</span>
      <span class="marquee__pill marquee__pill--dark">ShalaWorks</span>
      <span class="marquee__pill marquee__pill--dark">ShalaMakes</span>
      <span class="marquee__pill marquee__pill--dark">Available for Projects</span>
      <span class="marquee__pill marquee__pill--dark">Laredo TX</span>
    </div>
  </div>
  <div class="footer__bottom">
    <div class="footer__links">
      <a href="#">GitHub</a>
      <a href="#">Twitter</a>
      <a href="#">Instagram</a>
      <a href="mailto:kbkiefer95@gmail.com">Email</a>
    </div>
    <span class="footer__copy">&copy; 2026 Kiefer</span>
  </div>
</footer>
```

- [ ] **Step 2: Add all section styles to css/styles.css**

```css
/* Marquee */
.marquee {
  padding: 14px 0;
  overflow: hidden;
  border-top: 1.5px solid var(--border-light);
  border-bottom: 1.5px solid var(--border-light);
}

.marquee__track {
  display: inline-flex;
  gap: 16px;
  white-space: nowrap;
  animation: marquee-scroll 30s linear infinite;
}

.marquee__track--reverse {
  animation-direction: reverse;
}

.marquee__pill {
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 8px 20px;
  border-radius: 100px;
  border: 1.5px solid var(--text-dark);
  color: var(--text-dark);
  flex-shrink: 0;
}

.marquee__pill--filled {
  background: var(--bg-blue);
  border-color: var(--bg-blue);
  color: white;
}

.marquee__pill--dark {
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.35);
  font-size: 11px;
  padding: 6px 14px;
}

@keyframes marquee-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Generic Section */
.section {
  padding: 120px 32px;
}

.section--blue { background: var(--bg-blue); color: white; }
.section--pink { background: var(--bg-pink); color: var(--text-dark); }
.section--cyan { background: var(--bg-cyan); color: var(--text-dark); }
.section--yellow {
  background: var(--bg-yellow);
  color: var(--text-dark);
  text-align: center;
  padding: 140px 32px;
}

.section__label {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 4px;
  text-transform: uppercase;
  opacity: 0.4;
  margin-bottom: 48px;
}

.section__title {
  font-family: var(--font-display);
  font-size: clamp(40px, 7vw, 100px);
  line-height: 1.15;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.section__title--center {
  font-size: clamp(48px, 10vw, 140px);
}

.section__subtitle {
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 4px;
  text-transform: uppercase;
  opacity: 0.35;
  margin-top: 24px;
}

.section__text {
  font-family: var(--font-body);
  font-size: 26px;
  font-weight: 300;
  line-height: 1.55;
  max-width: 720px;
}

.section__text strong {
  font-weight: 500;
}

/* Projects */
.projects {
  background: var(--bg-dark);
  color: white;
  padding: 80px 0;
}

.projects__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 32px;
  margin-bottom: 48px;
}

.projects__label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 4px;
  text-transform: uppercase;
  opacity: 0.4;
}

.projects__hint {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  opacity: 0.4;
}

.projects__track {
  display: flex;
  gap: 3px;
  overflow-x: auto;
  cursor: grab;
  scrollbar-width: none;
  padding: 0 32px;
}

.projects__track::-webkit-scrollbar { display: none; }

.project-card {
  display: block;
  min-width: 400px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.project-card:hover .project-card__img { transform: scale(1.05); }
.project-card:hover .project-card__info { opacity: 1; }

.project-card__img {
  width: 100%;
  aspect-ratio: 4 / 3;
  transition: transform 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-card__watermark {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 4px;
  text-transform: uppercase;
  opacity: 0.2;
}

.project-card__info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  opacity: 0;
  transition: opacity 0.4s;
}

.project-card__name {
  display: block;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.project-card__tags {
  display: block;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.5;
  margin-top: 6px;
}

.projects__ghost {
  font-family: var(--font-display);
  font-size: 60px;
  letter-spacing: 4px;
  text-transform: uppercase;
  text-align: right;
  padding: 0 32px;
  margin-top: 32px;
  opacity: 0.06;
  height: 70px;
}

/* Services Grid */
.services__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2px;
  margin-top: 48px;
}

.service-card {
  padding: 36px 24px;
  background: rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: background 0.3s;
}

.service-card:hover {
  background: rgba(0, 0, 0, 0.12);
}

.service-card:hover .service-card__hover {
  opacity: 1;
  transform: translateY(0);
}

.service-card__name {
  display: block;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.service-card__desc {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1px;
  opacity: 0.4;
  margin-top: 8px;
  text-transform: uppercase;
}

.service-card__hover {
  display: block;
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0;
  margin-top: 12px;
  transform: translateY(8px);
  transition: all 0.3s;
  color: rgba(0, 0, 0, 0.5);
}

/* Footer */
.footer {
  background: var(--bg-dark);
  color: white;
  padding: 100px 32px 48px;
}

.footer__cta {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(40px, 8vw, 120px);
  line-height: 1.1;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.3s;
}

.footer__cta:hover {
  color: var(--bg-yellow);
}

.footer__marquee {
  margin-top: 64px;
  padding: 12px 0;
  border-top: 1px solid var(--border-dark);
  border-bottom: 1px solid var(--border-dark);
  overflow: hidden;
}

.footer__bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 48px;
}

.footer__links {
  display: flex;
  gap: 24px;
}

.footer__links a {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  transition: color 0.3s;
}

.footer__links a:hover {
  color: white;
}

.footer__copy {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.15);
}

/* Responsive */
@media (max-width: 768px) {
  #bust-canvas {
    display: none;
  }

  .hero__band--2 {
    font-size: 36px;
    padding: 12px 0;
  }

  .project-card {
    min-width: 300px;
  }

  .nav__contact {
    display: none;
  }

  .section {
    padding: 80px 20px;
  }

  .section__text {
    font-size: 20px;
  }

  .footer {
    padding: 60px 20px 32px;
  }
}
```

- [ ] **Step 3: Verify in browser**

Scroll through entire page. Expected: Grey hero with bands > pill marquee > blue statement > dark project gallery (drag to scroll) > pink services grid > cyan about > yellow CTA > dark footer. All sections have correct colors and typography.

- [ ] **Step 4: Commit**

```bash
git add index.html css/styles.css
git commit -m "feat: all page sections with full content and styles"
```

---

### Task 7: Horizontal Project Drag Scroll

**Files:**
- Create: `js/projects.js`
- Modify: `js/main.js`
- Modify: `js/scroll-animations.js`

- [ ] **Step 1: Create js/projects.js**

```js
// js/projects.js

export function initProjects() {
  const track = document.getElementById('projects-track');
  const ghost = document.getElementById('projects-ghost');
  if (!track) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener('mouseleave', () => {
    isDown = false;
    track.style.cursor = 'grab';
  });

  track.addEventListener('mouseup', () => {
    isDown = false;
    track.style.cursor = 'grab';
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  });

  const cards = track.querySelectorAll('.project-card');
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      const name = card.querySelector('.project-card__name');
      if (name && ghost) {
        ghost.textContent = name.textContent;
      }
    });
  });
}
```

- [ ] **Step 2: Update main.js**

```js
// js/main.js
import { initBust } from './bust.js';
import { initScrollAnimations } from './scroll-animations.js';
import { initProjects } from './projects.js';

document.addEventListener('DOMContentLoaded', () => {
  initBust();
  initProjects();

  setTimeout(() => {
    initScrollAnimations();
  }, 500);
});
```

- [ ] **Step 3: Verify in browser**

Expected: Project gallery is drag-scrollable. Ghost text at bottom-right updates to show hovered project name. Cards scale on hover and show info overlay.

- [ ] **Step 4: Commit**

```bash
git add js/projects.js js/main.js
git commit -m "feat: horizontal drag scroll for project gallery with ghost text"
```

---

### Task 8: Final Polish + Mobile

**Files:**
- Modify: `css/styles.css` (mobile refinements)
- Modify: `index.html` (meta tags, favicon placeholder)

- [ ] **Step 1: Add meta tags and OG data to index.html head**

```html
<meta name="description" content="Kevin Kiefer - Design, Code, Build. Self-taught developer and designer building across iOS, macOS, web, and physical objects.">
<meta property="og:title" content="Kiefer | Design, Code, Build">
<meta property="og:description" content="Self-taught developer and designer. One person, full stack, every pixel.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://kiefer.studio">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='28' font-size='28' font-family='monospace'>K</text></svg>">
```

- [ ] **Step 2: Add mobile nav hamburger styles**

Add to css/styles.css:

```css
@media (max-width: 768px) {
  .nav__left {
    display: none;
  }

  .nav__right .nav__link {
    display: none;
  }

  .hero__band--1 {
    font-size: 18px;
    top: 15%;
  }

  .hero__band--2 {
    font-size: 40px;
    top: 35%;
  }

  .projects__ghost {
    display: none;
  }

  .services__grid {
    grid-template-columns: 1fr;
  }

  .footer__bottom {
    flex-direction: column;
    gap: 24px;
    align-items: flex-start;
  }
}
```

- [ ] **Step 3: Full browser test**

Test on desktop: all sections, scroll behavior, bust interactions, project drag, hover states.
Test at 768px width: bust hidden, simplified nav, stacked services, responsive text.
Test at 375px width: everything readable, no horizontal overflow.

- [ ] **Step 4: Commit**

```bash
git add index.html css/styles.css
git commit -m "feat: meta tags, favicon, mobile responsive polish"
```

---

## Self-Review

**Spec coverage check:**
- [x] Nav with mix-blend-mode difference: Task 2
- [x] Hero with diagonal bands + Three.js bust: Tasks 3 + 4
- [x] Discipline marquee: Task 6
- [x] Statement section blue: Task 6
- [x] Projects horizontal drag: Tasks 6 + 7
- [x] Services grid pink: Task 6
- [x] About cyan: Task 6
- [x] CTA yellow: Task 6
- [x] Footer dark: Task 6
- [x] Smooth scroll (Lenis): Task 5
- [x] Text reveals (SplitType + GSAP): Task 5
- [x] Bust scroll behavior (rotate, zoom, fade): Task 5
- [x] Bust mouse follow: Task 4
- [x] Bust pixelation + grayscale: Task 4
- [x] Responsive/mobile: Task 8
- [x] Color section backgrounds: Task 6

**Placeholder scan:** None found. All code blocks contain complete implementations.

**Type consistency:** Verified. `getModel()`, `getCamera()`, `getCanvas()` used consistently between bust.js and scroll-animations.js. BEM class names consistent between HTML and CSS.

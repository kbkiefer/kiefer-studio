# Shader x Kiefer Mashup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone portfolio site that applies kiefer.studio's visual identity (colors, typography, pixelated bust, marquee bands, color-blocked sections) onto shader.se's layout choreography (CRT boot loader, split hero, film strip carousel, full-bleed About, cinematic scroll pacing).

**Architecture:** Vite + vanilla JS project. The 3D bust and supporting modules (pixelation shader, Borderlands cel-shading, floating shapes, 3D marquee bands, element trails) are copied from `~/Documents/Projects/kiefer-studio/` and adapted. New sections (boot loader, film strip, contact card) are built from scratch. GSAP ScrollTrigger + Lenis handle scroll choreography. No React needed for this experiment.

**Tech Stack:** Vite, Three.js, GSAP + ScrollTrigger, Lenis, SplitType, vanilla HTML/CSS/JS

**Source reference (DO NOT MODIFY):** `~/Documents/Projects/kiefer-studio/` - copy files from here, never edit originals.

**Design tokens (kiefer.studio):**
```css
--bg-base: #D9D9D9;
--bg-blue: #012FFF;
--bg-pink: #FFBDFF;
--bg-yellow: #FFFF62;
--bg-cyan: #7DFFFF;
--bg-dark: #202020;
--text-dark: #202020;
--text-light: #F0ECE4;
--font-display: 'Silkscreen', monospace;
--font-mono: 'JetBrains Mono', monospace;
--font-body: 'Space Grotesk', sans-serif;
```

**Fonts:** Load from Google Fonts: Silkscreen (400, 700), JetBrains Mono (300, 400), Space Grotesk (300, 400, 500)

---

## File Structure

```
shader-kiefer-experiment/
  index.html                  # Single page HTML with all sections
  css/
    styles.css                # All styles, CSS variables, responsive
  js/
    main.js                   # Entry point, initializes all modules
    boot.js                   # CRT boot loader animation
    bust.js                   # Copied + adapted from kiefer-studio
    floating-objects.js        # Copied from kiefer-studio
    bands-3d.js               # Copied from kiefer-studio
    borderlands-material.js    # Copied from kiefer-studio (unchanged)
    element-trails.js          # Copied from kiefer-studio (unchanged)
    scroll-animations.js       # New scroll choreography for this layout
    film-strip.js              # Film strip carousel for work section
  assets/
    models/
      kiefer-bust.glb         # Copied from kiefer-studio/assets/models/
    images/
      kiefer-logo.png         # Copied from kiefer-studio/assets/images/
  vite.config.js              # Vite config
  package.json                # Dependencies
```

---

### Task 1: Project Scaffold + Dependencies

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html` (minimal shell)

- [ ] **Step 1: Create package.json**

```json
{
  "name": "shader-kiefer-experiment",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@studio-freight/lenis": "^1.0.42",
    "gsap": "^3.15.0",
    "split-type": "^0.3.4",
    "three": "^0.184.0"
  },
  "devDependencies": {
    "vite": "^8.0.8"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  build: { outDir: 'dist' },
  server: { port: 3001 },
});
```

Note: Port 3001 to avoid conflict if kiefer-studio is running on 3000.

- [ ] **Step 3: Create minimal index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kiefer | Shader x Kiefer Experiment</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=JetBrains+Mono:wght@300;400&family=Space+Grotesk:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div id="boot"></div>
  <div id="site" style="display:none;"></div>
  <script type="module" src="/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create css/styles.css with reset and variables**

```css
*,
*::before,
*::after {
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

- [ ] **Step 5: Create js/main.js placeholder**

```js
console.log('shader-kiefer-experiment loaded');
```

- [ ] **Step 6: Copy assets from kiefer-studio**

Run these commands from the project root (`~/Documents/Projects/shader-kiefer-experiment/`):

```bash
mkdir -p assets/models assets/images
cp ~/Documents/Projects/kiefer-studio/assets/models/kiefer-bust.glb assets/models/
cp ~/Documents/Projects/kiefer-studio/assets/images/kiefer-logo.png assets/images/
```

- [ ] **Step 7: Install dependencies and verify dev server starts**

```bash
cd ~/Documents/Projects/shader-kiefer-experiment
npm install
npm run dev
```

Expected: Vite dev server starts on port 3001, blank page loads with console log.

- [ ] **Step 8: Initialize git and commit**

```bash
cd ~/Documents/Projects/shader-kiefer-experiment
git init
git add -A
git commit -m "feat: project scaffold with dependencies and assets"
```

---

### Task 2: CRT Boot Loader

**Files:**
- Create: `js/boot.js`
- Modify: `index.html` (add boot screen markup)
- Modify: `css/styles.css` (add boot screen styles)
- Modify: `js/main.js` (initialize boot)

The boot loader mimics shader.se's retro CRT startup screen but uses kiefer's blue `#012FFF` background, Silkscreen font, and pixelated aesthetic. It shows a progress bar that fills over ~3 seconds, then fades out to reveal the main site.

- [ ] **Step 1: Add boot screen HTML to index.html**

Replace the `<div id="boot"></div>` in index.html with:

```html
<div class="boot" id="boot">
  <div class="boot__crt">
    <div class="boot__content">
      <div class="boot__logo">K://KIEFER</div>
      <div class="boot__sub">Design + Code + Build, v2026.04</div>
      <div class="boot__bar-wrap">
        <div class="boot__bar" id="boot-bar"></div>
      </div>
      <div class="boot__status" id="boot-status">Initializing...</div>
      <div class="boot__copy">Copyright (c) ShalaWorks 2026. All Rights Reserved.</div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add boot screen CSS to css/styles.css**

```css
/* Boot Screen */
.boot {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.6s ease;
}

.boot.is-done {
  opacity: 0;
  pointer-events: none;
}

.boot__crt {
  width: 90vw;
  max-width: 900px;
  aspect-ratio: 4 / 3;
  background: var(--bg-blue);
  border-radius: 24px;
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow:
    0 0 80px rgba(1, 47, 255, 0.4),
    inset 0 0 60px rgba(0, 0, 0, 0.3);
}

.boot__crt::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
  pointer-events: none;
}

.boot__content {
  text-align: center;
  color: white;
  width: 100%;
  max-width: 500px;
}

.boot__logo {
  font-family: var(--font-display);
  font-size: clamp(36px, 6vw, 72px);
  letter-spacing: 4px;
  margin-bottom: 16px;
  text-shadow: 2px 2px 0 rgba(255, 189, 255, 0.5), -1px -1px 0 rgba(125, 255, 255, 0.3);
}

.boot__sub {
  font-family: var(--font-mono);
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 48px;
  letter-spacing: 1px;
}

.boot__bar-wrap {
  width: 100%;
  height: 32px;
  border: 2px solid white;
  padding: 4px;
  margin-bottom: 24px;
}

.boot__bar {
  height: 100%;
  width: 0%;
  background: white;
  transition: width 0.1s steps(20);
}

.boot__status {
  font-family: var(--font-mono);
  font-size: 12px;
  opacity: 0.5;
  letter-spacing: 2px;
  text-transform: uppercase;
  min-height: 18px;
}

.boot__copy {
  font-family: var(--font-mono);
  font-size: 11px;
  opacity: 0.3;
  margin-top: 48px;
  letter-spacing: 1px;
}
```

- [ ] **Step 3: Create js/boot.js**

```js
const STATUS_MESSAGES = [
  'Initializing...',
  'Loading modules...',
  'Compiling shaders...',
  'Mounting 3D pipeline...',
  'Preparing bust geometry...',
  'Calibrating pixel grid...',
  'Rendering Borderlands materials...',
  'System ready.',
];

export function initBoot(onComplete) {
  const boot = document.getElementById('boot');
  const bar = document.getElementById('boot-bar');
  const status = document.getElementById('boot-status');
  const site = document.getElementById('site');

  if (!boot || !bar || !status) {
    if (site) site.style.display = '';
    onComplete();
    return;
  }

  let progress = 0;
  let msgIndex = 0;
  const duration = 3000;
  const interval = 80;
  const steps = duration / interval;
  const increment = 100 / steps;

  const timer = setInterval(() => {
    progress = Math.min(100, progress + increment + Math.random() * 2);
    bar.style.width = `${progress}%`;

    const newMsgIndex = Math.floor((progress / 100) * (STATUS_MESSAGES.length - 1));
    if (newMsgIndex !== msgIndex) {
      msgIndex = newMsgIndex;
      status.textContent = STATUS_MESSAGES[msgIndex];
    }

    if (progress >= 100) {
      clearInterval(timer);
      status.textContent = 'System ready.';

      setTimeout(() => {
        boot.classList.add('is-done');
        if (site) site.style.display = '';

        setTimeout(() => {
          boot.remove();
          onComplete();
        }, 600);
      }, 400);
    }
  }, interval);
}
```

- [ ] **Step 4: Wire boot into js/main.js**

```js
import { initBoot } from './boot.js';

initBoot(() => {
  console.log('Boot complete, site revealed');
});
```

- [ ] **Step 5: Verify boot loader works in browser**

Run `npm run dev`, open http://localhost:3001. You should see a blue CRT screen with "K://KIEFER", a progress bar filling with stepped blocks, status messages cycling, then fading out to reveal an empty page.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: CRT boot loader with progress bar and status messages"
```

---

### Task 3: Copy and Adapt 3D Bust Pipeline

**Files:**
- Create: `js/bust.js` (copied + adapted from kiefer-studio)
- Create: `js/floating-objects.js` (copied from kiefer-studio)
- Create: `js/bands-3d.js` (copied from kiefer-studio)
- Create: `js/borderlands-material.js` (copied unchanged from kiefer-studio)
- Create: `js/element-trails.js` (copied unchanged from kiefer-studio)

These files are the 3D rendering pipeline. Copy them from `~/Documents/Projects/kiefer-studio/js/` and adapt for the new layout.

- [ ] **Step 1: Copy unchanged utility files**

```bash
cp ~/Documents/Projects/kiefer-studio/js/borderlands-material.js js/
cp ~/Documents/Projects/kiefer-studio/js/element-trails.js js/
cp ~/Documents/Projects/kiefer-studio/js/floating-objects.js js/
cp ~/Documents/Projects/kiefer-studio/js/bands-3d.js js/
```

- [ ] **Step 2: Copy bust.js and adapt**

Copy `~/Documents/Projects/kiefer-studio/js/bust.js` to `js/bust.js`.

Then make these changes:

1. Remove the import of `initDebugGUI`, `scrollConfig`, `modelConfig`, `exitConfig`, `setTimelineProgress`, `setExitProgress` and `initHeroGUI` (those debug modules won't exist in this project).
2. Remove the `initPixelTransition` import (we'll build our own version or skip it).
3. Remove the complex scissor/blit logic for the `#statement` and `#projects` sections in the `animate()` function. Replace with a simpler render path that just renders the bust into the low-res RT and blits it full-screen.
4. Keep the model loading path to `/models/kiefer-bust.glb`.
5. Keep the mouse parallax, pixelation, and all lighting.

The simplified `animate()` function should be:

```js
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  if (model) {
    currentMouseX += (mouseRotX - currentMouseX) * 0.05;
    currentMouseY += (mouseRotY - currentMouseY) * 0.05;
    model.rotation.x = scrollRotX + currentMouseX;
    model.rotation.y = scrollRotY + currentMouseY;
    model.rotation.z = scrollRotZ;
  }

  updateFloatingObjects(elapsed);

  renderer.setRenderTarget(null);
  renderer.clear(true, true, true);

  // Render bands at full resolution
  const hero = document.getElementById('hero');
  const rect = hero ? hero.getBoundingClientRect() : null;
  if (rect && rect.bottom > 0) {
    const bottom = window.innerHeight - rect.bottom;
    renderer.setScissorTest(true);
    renderer.setScissor(0, bottom, window.innerWidth, rect.height);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render(bandsScene, bandsCamera);
    renderer.setScissorTest(false);
  }

  // Render bust pixelated
  renderer.setRenderTarget(lowResRT);
  renderer.clear(true, true, true);
  renderer.render(scene, camera);

  // Blit to screen
  renderer.setRenderTarget(null);
  renderer.render(blitScene, blitCamera);
}
```

- [ ] **Step 3: Verify bust.js exports are correct**

Ensure `bust.js` exports:
- `initBust()` - main init
- `setScrollRotation(x, y, z)` - called by scroll animations
- `setExitOffsetX(x)` - called by scroll animations
- `getModel()`, `getCamera()`, `getCanvas()` - for scroll animations
- `lights` object - for potential debug
- `rebuildPixelBlit(newSize)` - for potential debug

- [ ] **Step 4: Add bust canvas to index.html**

Add inside the `<div id="site">`:

```html
<canvas id="bust-canvas"></canvas>
```

And in the `#site` div, add the hero section placeholder:

```html
<section class="hero" id="hero">
  <div class="hero__text">
    <h1 class="hero__title">Design,<br>Code,<br>Build.</h1>
  </div>
</section>
```

- [ ] **Step 5: Add bust-canvas CSS**

```css
#bust-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 50;
  pointer-events: none;
}
```

- [ ] **Step 6: Wire bust init into main.js**

```js
import { initBoot } from './boot.js';
import { initBust } from './bust.js';

initBoot(() => {
  initBust();
});
```

- [ ] **Step 7: Verify bust renders in browser**

Run `npm run dev`. After boot loader completes, you should see the pixelated grey bust with Borderlands cel-shading, floating shapes orbiting around it, and 3D marquee bands behind it. Mouse parallax should work.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: 3D bust pipeline with pixelation, floating shapes, and bands"
```

---

### Task 4: Hero Section with Split Layout

**Files:**
- Modify: `index.html` (expand hero markup)
- Modify: `css/styles.css` (hero styles)

The hero takes shader.se's split layout (big headline on the left, 3D object on the right) but the 3D object is your existing bust, not a retro computer. The bust is already fixed-position via the canvas, so the hero section just needs to create the visual framing.

- [ ] **Step 1: Update hero HTML in index.html**

Replace the hero section with:

```html
<section class="hero" id="hero">
  <div class="hero__text">
    <h1 class="hero__title">Design,<br>Code,<br>Build.</h1>
    <p class="hero__scroll-cue">Scroll to Inspect the Work</p>
    <div class="hero__pointers">
      <span class="hero__pointer">&#9758;</span>
      <span class="hero__pointer">&#9758;</span>
      <span class="hero__pointer">&#9758;</span>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add hero CSS**

```css
.hero {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-base);
  display: flex;
  align-items: center;
}

.hero__text {
  position: relative;
  z-index: 60;
  padding: 0 48px;
  max-width: 55%;
}

.hero__title {
  font-family: var(--font-display);
  font-size: clamp(48px, 8vw, 120px);
  line-height: 1.1;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-dark);
}

.hero__scroll-cue {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 3px;
  text-transform: uppercase;
  opacity: 0.4;
  margin-top: 48px;
}

.hero__pointers {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  font-size: 24px;
  opacity: 0.4;
  animation: point-bounce 1.5s ease-in-out infinite;
}

@keyframes point-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

@media (max-width: 768px) {
  .hero__text {
    max-width: 100%;
    padding: 0 20px;
    padding-top: 120px;
  }

  .hero__title {
    font-size: clamp(36px, 10vw, 64px);
  }
}
```

The bust on the right side is handled naturally by the fixed canvas -- it's already centered. The hero text sits on the left, bust visually occupies the right half. Shader.se uses this same optical trick where the headline is left-aligned and the 3D object fills the right space.

- [ ] **Step 3: Verify in browser**

The hero should show "DESIGN, CODE, BUILD." large on the left with the bust visible on the right side. Scroll cue and pointing hands at bottom-left.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: split hero layout with headline left, bust right"
```

---

### Task 5: Navigation

**Files:**
- Modify: `index.html` (add nav markup)
- Modify: `css/styles.css` (nav styles)

Borrow shader.se's clean nav bar but with kiefer typography and an email CTA instead of "Book a call".

- [ ] **Step 1: Add nav HTML before the hero section**

```html
<nav class="nav" id="nav">
  <a href="#" class="nav__logo">
    <img src="/images/kiefer-logo.png" alt="Kiefer" class="nav__logo-img">
  </a>
  <div class="nav__links">
    <a href="#work" class="nav__link">Selected Work</a>
    <a href="#about" class="nav__link">About</a>
    <a href="#contact" class="nav__link">Contact</a>
  </div>
  <a href="mailto:kbkiefer95@gmail.com" class="nav__cta">Get in touch</a>
</nav>
```

- [ ] **Step 2: Add nav CSS**

```css
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav__logo-img {
  height: 48px;
  width: auto;
  mix-blend-mode: multiply;
  filter: contrast(1.6);
}

.nav__links {
  display: flex;
  gap: 32px;
}

.nav__link {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 1px;
  text-transform: uppercase;
  border-bottom: 2px solid var(--text-dark);
  padding-bottom: 2px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.nav__link:hover {
  opacity: 0.5;
}

.nav__cta {
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: var(--bg-blue);
  color: white;
  padding: 10px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.nav__cta:hover {
  background: var(--text-dark);
}

@media (max-width: 768px) {
  .nav__links { display: none; }
  .nav__cta { display: none; }
}
```

- [ ] **Step 3: Verify and commit**

```bash
git add -A
git commit -m "feat: fixed navigation with logo, links, and CTA"
```

---

### Task 6: Marquee Skill Pills

**Files:**
- Modify: `index.html` (add marquee after hero)
- Modify: `css/styles.css` (marquee styles)

This is the skill-pill scrolling bar from kiefer.studio, placed between hero and content sections as a visual divider.

- [ ] **Step 1: Add marquee HTML after the hero section**

```html
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
```

- [ ] **Step 2: Add marquee CSS**

```css
.marquee {
  padding: 14px 0;
  overflow: hidden;
  border-top: 1.5px solid var(--border-light);
  border-bottom: 1.5px solid var(--border-light);
  position: relative;
  z-index: 100;
  background: var(--bg-base);
}

.marquee__track {
  display: inline-flex;
  gap: 16px;
  white-space: nowrap;
  animation: marquee-scroll 30s linear infinite;
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

@keyframes marquee-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

- [ ] **Step 3: Verify and commit**

```bash
git add -A
git commit -m "feat: marquee skill pills divider"
```

---

### Task 7: Statement Section (Blue Block)

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

Color-blocked blue section with large Silkscreen headline, matching kiefer.studio's section style.

- [ ] **Step 1: Add statement HTML after marquee**

```html
<section class="section section--blue" id="statement">
  <span class="section__label">01 // What I Do</span>
  <h2 class="section__title">One Person.<br>Full Stack.<br>Every Pixel.</h2>
</section>
```

- [ ] **Step 2: Add section CSS**

```css
.section {
  padding: 120px 48px;
  position: relative;
  z-index: 100;
}

.section--blue {
  background: var(--bg-blue);
  color: white;
}

.section--pink {
  background: var(--bg-pink);
  color: var(--text-dark);
}

.section--cyan {
  background: var(--bg-cyan);
  color: var(--text-dark);
}

.section--yellow {
  background: var(--bg-yellow);
  color: var(--text-dark);
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

.section__text {
  font-family: var(--font-body);
  font-size: 26px;
  font-weight: 300;
  line-height: 1.55;
  max-width: 720px;
}

@media (max-width: 768px) {
  .section {
    padding: 60px 20px;
  }

  .section__title {
    font-size: clamp(28px, 8vw, 60px);
  }

  .section__text {
    font-size: 18px;
  }
}
```

- [ ] **Step 3: Verify and commit**

```bash
git add -A
git commit -m "feat: blue statement section"
```

---

### Task 8: Film Strip Work Carousel

**Files:**
- Create: `js/film-strip.js`
- Modify: `index.html` (work section markup)
- Modify: `css/styles.css` (film strip styles)
- Modify: `js/main.js` (init film strip)

This is the signature shader.se element: a curved film strip with sprocket holes showing project cards. Instead of screenshot images, we use kiefer's color-blocked cards.

- [ ] **Step 1: Add work section HTML**

```html
<section class="work" id="work">
  <h2 class="work__heading">Selected Work</h2>
  <p class="work__subheading">02 // Projects</p>
  <div class="work__viewport">
    <div class="work__strip" id="work-strip">
      <div class="work__frame" data-color="blue">
        <div class="work__sprocket-top"></div>
        <div class="work__card">
          <span class="work__num">01</span>
          <span class="work__name">Cymatics Lab</span>
          <span class="work__desc">iOS Sound Visualization</span>
        </div>
        <div class="work__sprocket-bottom"></div>
      </div>
      <div class="work__frame" data-color="pink">
        <div class="work__sprocket-top"></div>
        <div class="work__card">
          <span class="work__num">02</span>
          <span class="work__name">Dink</span>
          <span class="work__desc">Pickleball Companion</span>
        </div>
        <div class="work__sprocket-bottom"></div>
      </div>
      <div class="work__frame" data-color="dark">
        <div class="work__sprocket-top"></div>
        <div class="work__card">
          <span class="work__num">03</span>
          <span class="work__name">Resonance</span>
          <span class="work__desc">Consciousness Instrument</span>
        </div>
        <div class="work__sprocket-bottom"></div>
      </div>
      <div class="work__frame" data-color="yellow">
        <div class="work__sprocket-top"></div>
        <div class="work__card">
          <span class="work__num">04</span>
          <span class="work__name">ShalaMakes</span>
          <span class="work__desc">3D Print Store</span>
        </div>
        <div class="work__sprocket-bottom"></div>
      </div>
      <div class="work__frame" data-color="cyan">
        <div class="work__sprocket-top"></div>
        <div class="work__card">
          <span class="work__num">05</span>
          <span class="work__name">ClearMind</span>
          <span class="work__desc">ADHD Neural Map</span>
        </div>
        <div class="work__sprocket-bottom"></div>
      </div>
      <div class="work__frame" data-color="blue">
        <div class="work__sprocket-top"></div>
        <div class="work__card">
          <span class="work__num">06</span>
          <span class="work__name">Imago</span>
          <span class="work__desc">ADHD Companion</span>
        </div>
        <div class="work__sprocket-bottom"></div>
      </div>
    </div>
  </div>
  <div class="work__nav">
    <button class="work__nav-btn" id="work-prev" aria-label="Previous">&#8592;</button>
    <button class="work__nav-btn" id="work-next" aria-label="Next">&#8594;</button>
  </div>
</section>
```

- [ ] **Step 2: Add film strip CSS**

```css
.work {
  background: var(--bg-dark);
  color: white;
  padding: 100px 0;
  position: relative;
  z-index: 100;
  overflow: hidden;
}

.work__heading {
  font-family: var(--font-display);
  font-size: clamp(40px, 6vw, 80px);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.work__subheading {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 4px;
  text-transform: uppercase;
  opacity: 0.3;
  text-align: center;
  margin-bottom: 64px;
}

.work__viewport {
  overflow: hidden;
  padding: 20px 0;
}

.work__strip {
  display: flex;
  gap: 0;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  padding: 0 calc(50vw - 200px);
}

.work__frame {
  flex-shrink: 0;
  width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.work__sprocket-top,
.work__sprocket-bottom {
  width: 100%;
  height: 24px;
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 20px,
      rgba(255,255,255,0.15) 20px,
      rgba(255,255,255,0.15) 36px,
      transparent 36px,
      transparent 56px
    );
  border-top: 2px solid rgba(255,255,255,0.1);
  border-bottom: 2px solid rgba(255,255,255,0.1);
}

.work__card {
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-left: 2px solid rgba(255,255,255,0.1);
  border-right: 2px solid rgba(255,255,255,0.1);
}

.work__frame[data-color="blue"] .work__card { background: var(--bg-blue); }
.work__frame[data-color="pink"] .work__card { background: var(--bg-pink); color: var(--text-dark); }
.work__frame[data-color="dark"] .work__card { background: #0a0a0a; }
.work__frame[data-color="yellow"] .work__card { background: var(--bg-yellow); color: var(--text-dark); }
.work__frame[data-color="cyan"] .work__card { background: var(--bg-cyan); color: var(--text-dark); }

.work__num {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 4px;
  opacity: 0.4;
}

.work__name {
  font-family: var(--font-display);
  font-size: 32px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.work__desc {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 2px;
  opacity: 0.6;
}

.work__nav {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
}

.work__nav-btn {
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  font-size: 20px;
  cursor: pointer;
  font-family: var(--font-display);
  transition: background 0.2s;
}

.work__nav-btn:hover {
  background: rgba(255,255,255,0.15);
}

@media (max-width: 768px) {
  .work__frame { width: 280px; }
  .work__card { height: 220px; }
  .work__name { font-size: 24px; }
  .work__strip { padding: 0 calc(50vw - 140px); }
}
```

- [ ] **Step 3: Create js/film-strip.js**

```js
export function initFilmStrip() {
  const strip = document.getElementById('work-strip');
  const prev = document.getElementById('work-prev');
  const next = document.getElementById('work-next');

  if (!strip || !prev || !next) return;

  const frames = strip.querySelectorAll('.work__frame');
  const frameCount = frames.length;
  let current = 0;

  function getFrameWidth() {
    return frames[0] ? frames[0].offsetWidth : 400;
  }

  function update() {
    const fw = getFrameWidth();
    strip.style.transform = `translateX(${-current * fw}px)`;
  }

  prev.addEventListener('click', () => {
    current = Math.max(0, current - 1);
    update();
  });

  next.addEventListener('click', () => {
    current = Math.min(frameCount - 1, current + 1);
    update();
  });

  update();
}
```

- [ ] **Step 4: Wire film strip into main.js**

Update main.js:

```js
import { initBoot } from './boot.js';
import { initBust } from './bust.js';
import { initFilmStrip } from './film-strip.js';

initBoot(() => {
  initBust();
  initFilmStrip();
});
```

- [ ] **Step 5: Verify carousel works**

Navigate to http://localhost:3001, scroll to the work section. You should see color-blocked project cards in a horizontal film strip with sprocket holes above and below. Prev/next buttons should slide between cards.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: film strip work carousel with color-blocked project cards"
```

---

### Task 9: About Section (Full-Bleed Immersive)

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

Shader.se does a full-bleed 3D scene for About. We'll do a full-bleed color block (pink) with large typography, borrowing that immersive feeling without needing another 3D scene.

- [ ] **Step 1: Add about + statement sections HTML**

```html
<section class="about" id="about">
  <div class="about__inner">
    <span class="section__label">03 // About</span>
    <h2 class="about__heading">About</h2>
  </div>
</section>

<section class="section section--pink" id="about-text">
  <p class="section__text">Self-taught developer and designer building across iOS, macOS, web, and physical objects. I design AND build. Every project ships with the same intensity whether it's an app, a website, or a 3D print.</p>
  <p class="section__text" style="margin-top: 24px;">One person. Full stack. Every pixel. No shortcuts, no handoffs, no design-to-dev translation loss.</p>
</section>
```

- [ ] **Step 2: Add about CSS**

```css
.about {
  position: relative;
  z-index: 100;
  height: 80vh;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-cyan);
  overflow: hidden;
}

.about__inner {
  text-align: center;
}

.about__heading {
  font-family: var(--font-display);
  font-size: clamp(80px, 15vw, 200px);
  text-transform: uppercase;
  letter-spacing: 4px;
  color: var(--text-dark);
  opacity: 0.15;
}
```

- [ ] **Step 3: Verify and commit**

```bash
git add -A
git commit -m "feat: full-bleed about section with pink description"
```

---

### Task 10: Scrolling Marquee Bands

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

The angled scrolling text bands from kiefer.studio, placed as a visual break before the contact section. These are the CSS/HTML bands (separate from the 3D bands in the hero).

- [ ] **Step 1: Add bands HTML**

```html
<div class="bands">
  <div class="band band--blue">
    <div class="band__track">
      <span>design and code and build and design and code and build and design and code and build and&nbsp;</span>
      <span>design and code and build and design and code and build and design and code and build and&nbsp;</span>
    </div>
  </div>
  <div class="band band--pink">
    <div class="band__track band__track--reverse">
      <span>IMAGINE&nbsp;&nbsp;CREATE&nbsp;&nbsp;IMAGINE&nbsp;&nbsp;CREATE&nbsp;&nbsp;IMAGINE&nbsp;&nbsp;CREATE&nbsp;&nbsp;IMAGINE&nbsp;&nbsp;CREATE&nbsp;&nbsp;</span>
      <span>IMAGINE&nbsp;&nbsp;CREATE&nbsp;&nbsp;IMAGINE&nbsp;&nbsp;CREATE&nbsp;&nbsp;IMAGINE&nbsp;&nbsp;CREATE&nbsp;&nbsp;IMAGINE&nbsp;&nbsp;CREATE&nbsp;&nbsp;</span>
    </div>
  </div>
  <div class="band band--yellow">
    <div class="band__track">
      <span>ShalaWorks &#183; ShalaMakes &#183; Available for Projects &#183; Laredo TX &#183; ShalaWorks &#183; ShalaMakes &#183; Available for Projects &#183; Laredo TX &#183;&nbsp;</span>
      <span>ShalaWorks &#183; ShalaMakes &#183; Available for Projects &#183; Laredo TX &#183; ShalaWorks &#183; ShalaMakes &#183; Available for Projects &#183; Laredo TX &#183;&nbsp;</span>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add band CSS**

```css
.bands {
  position: relative;
  z-index: 100;
  padding: 40px 0;
  background: var(--bg-base);
  overflow: hidden;
}

.band {
  white-space: nowrap;
  overflow: hidden;
  padding: 12px 0;
  margin: 8px 0;
  transform: rotate(-2deg);
}

.band--blue {
  background: var(--bg-blue);
  color: white;
  font-size: 20px;
}

.band--pink {
  background: var(--bg-pink);
  color: var(--text-dark);
  font-size: 36px;
  transform: rotate(1.5deg);
}

.band--yellow {
  background: var(--bg-yellow);
  color: var(--text-dark);
  font-size: 14px;
  transform: rotate(-1deg);
}

.band__track {
  display: inline-flex;
  white-space: nowrap;
  font-family: var(--font-display);
  letter-spacing: 2px;
  text-transform: uppercase;
  animation: band-scroll 20s linear infinite;
}

.band__track--reverse {
  animation-direction: reverse;
}

@keyframes band-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

- [ ] **Step 3: Verify and commit**

```bash
git add -A
git commit -m "feat: angled scrolling marquee bands"
```

---

### Task 11: Contact Card + Footer

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

Contact card uses shader.se's dashed-border approach but with kiefer's color system. Footer matches kiefer.studio's dark footer.

- [ ] **Step 1: Add contact and footer HTML**

```html
<section class="contact" id="contact">
  <div class="contact__card">
    <div class="contact__avatar">K</div>
    <div class="contact__info">
      <h3 class="contact__name">Kevin Kiefer</h3>
      <p class="contact__role">Designer, Developer, Builder</p>
      <a href="mailto:kbkiefer95@gmail.com" class="contact__email">kbkiefer95@gmail.com</a>
    </div>
  </div>
</section>

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

- [ ] **Step 2: Add contact and footer CSS**

```css
/* Contact */
.contact {
  background: var(--bg-dark);
  padding: 80px 32px;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 100;
}

.contact__card {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 32px 48px;
  border: 2px dashed rgba(255, 255, 255, 0.25);
  max-width: 600px;
  width: 100%;
}

.contact__avatar {
  width: 80px;
  height: 80px;
  background: var(--bg-blue);
  color: white;
  font-family: var(--font-display);
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contact__name {
  font-family: var(--font-display);
  font-size: 20px;
  color: white;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.contact__role {
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
  margin-top: 4px;
}

.contact__email {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--bg-cyan);
  margin-top: 8px;
  display: inline-block;
  transition: color 0.2s;
}

.contact__email:hover {
  color: var(--bg-yellow);
}

/* Footer */
.footer {
  background: var(--bg-dark);
  color: white;
  padding: 100px 32px 48px;
  position: relative;
  z-index: 100;
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

.marquee__pill--dark {
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.35);
  font-size: 11px;
  padding: 6px 14px;
}

.marquee__track--reverse {
  animation-direction: reverse;
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

@media (max-width: 768px) {
  .contact__card {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }

  .footer {
    padding: 60px 20px 32px;
  }

  .footer__bottom {
    flex-direction: column;
    gap: 24px;
    align-items: flex-start;
  }
}
```

- [ ] **Step 3: Verify and commit**

```bash
git add -A
git commit -m "feat: dashed contact card and dark footer"
```

---

### Task 12: Scroll Choreography (Lenis + GSAP)

**Files:**
- Create: `js/scroll-animations.js`
- Modify: `js/main.js`

This ties everything together: Lenis smooth scroll, bust rotation on scroll, text reveals, and section transitions. This borrows kiefer.studio's scroll behavior (bust rotates and camera moves as you scroll through the hero) and adds cinematic pacing.

- [ ] **Step 1: Create js/scroll-animations.js**

```js
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { getModel, getCamera, getCanvas, setScrollRotation, setExitOffsetX } from './bust.js';

gsap.registerPlugin(ScrollTrigger);

const scrollConfig = {
  rotationY: 62.83,
  camStartX: 0,
  camStartY: 0.61,
  camEndY: 0.91,
  camStartZ: 1.9,
  camEndZ: 1.44,
  scrollLength: 850,
  scrub: 1.5,
};

const modelConfig = {
  rotOffsetX: -0.002,
  rotOffsetY: -0.632,
  rotOffsetZ: -0.002,
};

const exitConfig = {
  camExitX: -1.4,
};

let exitOffsetX = 0;

function applyScrollToModel(p) {
  const camera = getCamera();
  if (!camera) return;

  setScrollRotation(
    modelConfig.rotOffsetX,
    p * scrollConfig.rotationY + modelConfig.rotOffsetY,
    modelConfig.rotOffsetZ
  );

  camera.position.x = scrollConfig.camStartX + exitOffsetX;
  camera.position.y = scrollConfig.camStartY + p * (scrollConfig.camEndY - scrollConfig.camStartY);
  camera.position.z = scrollConfig.camStartZ + p * (scrollConfig.camEndZ - scrollConfig.camStartZ);
}

export function initScrollAnimations() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  initBustScroll();
  initTextReveals();
}

function initBustScroll() {
  const model = getModel();
  const canvas = getCanvas();
  if (!model || !canvas) return;

  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: () => `+=${scrollConfig.scrollLength}%`,
    scrub: scrollConfig.scrub,
    onUpdate: (self) => {
      applyScrollToModel(self.progress);
    },
  });

  ScrollTrigger.create({
    trigger: '#statement',
    start: 'top 30%',
    end: 'bottom 50%',
    scrub: 1,
    onUpdate: (self) => {
      exitOffsetX = self.progress * exitConfig.camExitX;
      setExitOffsetX(exitOffsetX);
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

  const aboutText = document.querySelector('#about-text .section__text');
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

  const workHeading = document.querySelector('.work__heading');
  if (workHeading) {
    gsap.from(workHeading, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: workHeading,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  }
}
```

- [ ] **Step 2: Update js/main.js**

```js
import { initBoot } from './boot.js';
import { initBust } from './bust.js';
import { initFilmStrip } from './film-strip.js';
import { initScrollAnimations } from './scroll-animations.js';

initBoot(() => {
  initBust();
  initFilmStrip();

  setTimeout(() => {
    initScrollAnimations();
  }, 500);
});
```

- [ ] **Step 3: Verify full scroll experience**

Open the site, go through the full flow:
1. Boot loader fills and fades out
2. Hero: bust visible on right, headline on left, bust rotates as you scroll
3. Marquee pills scroll by
4. Statement section: text reveals line by line, bust slides left
5. Work section: film strip carousel with navigation
6. About: full-bleed cyan with large faded heading
7. Pink about text with line reveals
8. Scrolling bands
9. Contact card with dashed border
10. Footer with CTA

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: scroll choreography with Lenis, bust rotation, and text reveals"
```

---

### Task 13: Polish Pass

**Files:**
- Modify: `css/styles.css` (final adjustments)

Final visual refinements: smooth transitions between sections, z-index cleanup, consistent spacing.

- [ ] **Step 1: Add smooth section transitions**

Add to css/styles.css:

```css
/* Smooth scroll behavior for anchor links */
html {
  scroll-behavior: smooth;
}

/* Ensure sections stack correctly */
.hero { z-index: 10; }
#bust-canvas { z-index: 50; }
.nav { z-index: 200; }
.marquee { z-index: 100; }
.section { z-index: 100; }
.work { z-index: 100; }
.about { z-index: 100; }
.bands { z-index: 100; }
.contact { z-index: 100; }
.footer { z-index: 100; }
```

- [ ] **Step 2: Add CRT scan-line overlay to hero (optional shader.se nod)**

```css
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
  z-index: 55;
}
```

- [ ] **Step 3: Full browser test**

Walk through every section at desktop and mobile (resize to 375px width). Check:
- Boot loader fills and fades
- Hero layout: headline left, bust right, scroll rotates bust
- Marquee scrolls infinitely
- Statement text reveals
- Film strip navigates with buttons
- About section fills viewport
- Bands animate correctly
- Contact card is centered
- Footer CTA hover turns yellow
- No z-index conflicts (bust doesn't overlap nav, sections stack cleanly)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: polish pass - z-index, scan lines, final spacing"
```

---

## Summary

13 tasks, building from scaffold to polished experiment. The bust pipeline (Tasks 1-3) is the foundation. The layout choreography (Tasks 4-12) adds shader.se's cinematic pacing. Task 13 ties it together.

Key files to get right:
- `js/bust.js` (Task 3) - must be correctly adapted from kiefer-studio without breaking the pixelation pipeline
- `js/scroll-animations.js` (Task 12) - scroll config values come from kiefer-studio's debug-gui.js defaults
- `css/styles.css` - all styles in one file, using CSS variables from kiefer.studio's design tokens

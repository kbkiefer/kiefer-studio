import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initPixelTransition() {
  const workSection = document.getElementById('projects');
  if (!workSection) return;

  const overlay = document.createElement('canvas');
  overlay.id = 'pixel-transition';
  overlay.style.cssText = 'position:absolute;inset:0;z-index:20;pointer-events:none;';
  workSection.appendChild(overlay);

  const ctx = overlay.getContext('2d');

  function resize() {
    overlay.width = workSection.offsetWidth;
    overlay.height = workSection.offsetHeight;
  }
  resize();
  new ResizeObserver(resize).observe(workSection);

  const BLOCK = 48;

  function seedRandom(x, y) {
    return ((x * 73856093 ^ y * 19349663) & 0xffff) / 0xffff;
  }

  function drawEnterTransition(p) {
    const W = overlay.width;
    const H = overlay.height;
    ctx.clearRect(0, 0, W, H);
    if (p <= 0) return;

    const cols = Math.ceil(W / BLOCK);
    const rows = Math.ceil(H / BLOCK);
    const halfRows = rows / 2;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const distFromEdge = Math.abs(y - halfRows) / halfRows;
        const rowThreshold = distFromEdge * 0.6 + seedRandom(x, y) * 0.4;

        if (p > 1 - rowThreshold) {
          ctx.fillStyle = '#012FFF';
          ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
        }
      }
    }
  }

  function drawExitTransition(p) {
    const W = overlay.width;
    const H = overlay.height;
    ctx.clearRect(0, 0, W, H);
    if (p <= 0) return;

    const cols = Math.ceil(W / BLOCK);
    const rows = Math.ceil(H / BLOCK);
    const halfRows = rows / 2;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const distFromEdge = Math.abs(y - halfRows) / halfRows;
        const rowThreshold = distFromEdge * 0.6 + seedRandom(x + 99, y + 77) * 0.4;

        if (p > 1 - rowThreshold) {
          ctx.fillStyle = '#FFBDFF';
          ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
        }
      }
    }
  }

  ScrollTrigger.create({
    trigger: '#projects',
    start: 'top bottom',
    end: 'top 30%',
    scrub: 0.3,
    onUpdate: (self) => {
      const p = 1 - self.progress;
      drawEnterTransition(p);
      window.__pixelTransitionState.progress = p;
    },
  });

  ScrollTrigger.create({
    trigger: '#projects',
    start: 'bottom 70%',
    end: 'bottom top',
    scrub: 0.3,
    onUpdate: (self) => {
      drawExitTransition(self.progress);
    },
  });

  ScrollTrigger.create({
    trigger: '#projects',
    start: 'top 40%',
    end: 'top top',
    snap: 1,
  });

  drawEnterTransition(1);

  window.__pixelTransitionState = { progress: 1, BLOCK, seedRandom };
}

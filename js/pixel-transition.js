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

  window.__pixelTransitionState = { progress: 1, BLOCK, seedRandom };

  function updateOnScroll() {
    const projRect = workSection.getBoundingClientRect();
    const wH = window.innerHeight;

    const enterStart = wH;
    const enterEnd = wH * 0.3;
    const enterRaw = (enterStart - projRect.top) / (enterStart - enterEnd);
    const enterProgress = Math.max(0, Math.min(1, enterRaw));
    const p = 1 - enterProgress;
    drawEnterTransition(p);
    window.__pixelTransitionState.progress = p;

    if (p <= 0) {
      const exitStart = wH * 0.7;
      const exitEnd = 0;
      const exitRaw = (exitStart - projRect.bottom) / (exitStart - exitEnd);
      const exitProgress = Math.max(0, Math.min(1, exitRaw));
      drawExitTransition(exitProgress);
    }
  }

  window.addEventListener('scroll', updateOnScroll, { passive: true });
  updateOnScroll();

  drawEnterTransition(1);
}

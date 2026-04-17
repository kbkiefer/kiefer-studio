import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { getModel, getCamera, getCanvas, lights, rebuildPixelBlit, setScrollRotation } from './bust.js';
import { setFloatingObjectsVisible } from './floating-objects.js';
import { initDebugGUI, scrollConfig, modelConfig, setTimelineProgress } from './debug-gui.js';

gsap.registerPlugin(ScrollTrigger);

let lenis;

function applyScrollToModel(p) {
  const camera = getCamera();
  if (!camera) return;

  const cfg = scrollConfig;

  setScrollRotation(
    modelConfig.rotOffsetX,
    p * cfg.rotationY + modelConfig.rotOffsetY,
    modelConfig.rotOffsetZ
  );

  camera.position.x = modelConfig.posX;
  camera.position.y = cfg.camStartY + p * (cfg.camEndY - cfg.camStartY);
  camera.position.z = cfg.camStartZ + p * (cfg.camEndZ - cfg.camStartZ);
}

export function initScrollAnimations() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  initBustScroll();
  initFloatingObjectsScroll();
  initTextReveals();

  initDebugGUI(
    (p) => { applyScrollToModel(p); },
    lights,
    rebuildPixelBlit
  );
}

function initBustScroll() {
  const model = getModel();
  const camera = getCamera();
  const canvas = getCanvas();
  if (!model || !canvas) return;

  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: () => `+=${scrollConfig.scrollLength}%`,
    scrub: scrollConfig.scrub,
    onUpdate: (self) => {
      setTimelineProgress(self.progress);
      applyScrollToModel(self.progress);
    },
  });
}

function initFloatingObjectsScroll() {
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'bottom 90%',
    onEnterBack: () => setFloatingObjectsVisible(true),
    onLeave: () => setFloatingObjectsVisible(false),
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

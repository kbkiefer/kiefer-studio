import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { getModel, getCamera, getCanvas, lights, rebuildPixelBlit, setScrollRotation, setExitOffsetX, getExitOffsetX } from './bust.js';
import { setFloatingObjectsVisible, getFloatingObjects } from './floating-objects.js';
import { initDebugGUI, scrollConfig, modelConfig, exitConfig, setTimelineProgress, setExitProgress } from './debug-gui.js';
import { initHeroGUI } from './hero-gui.js';
import { initPixelTransition } from './pixel-transition.js';

gsap.registerPlugin(ScrollTrigger);

let lenis;

const mobileOverrides = window.innerWidth <= 768 ? { camStartZ: 2.8, camStartY: 0.5 } : {};

function applyScrollToModel(p) {
  const camera = getCamera();
  if (!camera) return;

  const cfg = scrollConfig;
  const startY = mobileOverrides.camStartY || cfg.camStartY;
  const startZ = mobileOverrides.camStartZ || cfg.camStartZ;

  setScrollRotation(
    modelConfig.rotOffsetX,
    p * cfg.rotationY + modelConfig.rotOffsetY,
    modelConfig.rotOffsetZ
  );

  camera.position.x = cfg.camStartX + getExitOffsetX();
  camera.position.y = startY + p * (cfg.camEndY - startY);
  camera.position.z = startZ + p * (cfg.camEndZ - startZ);
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
  initPixelTransition();

  if (window.location.hash === '#debug') {
    initDebugGUI(
      (p) => { applyScrollToModel(p); },
      lights,
      rebuildPixelBlit,
      (p) => { applyExitToModel(p); }
    );

    setTimeout(() => {
      const shapes = getFloatingObjects();
      if (shapes.length > 0) initHeroGUI(shapes);
    }, 1000);
  }
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

  ScrollTrigger.create({
    trigger: '#statement',
    start: 'top 30%',
    end: 'bottom 50%',
    scrub: 1,
    onUpdate: (self) => {
      setExitProgress(self.progress);
      setExitOffsetX(self.progress * exitConfig.camExitX);
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

import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { getModel, getCamera, getCanvas, setScrollRotation, setExitOffsetX, setModelOffset } from './bust.js';
import { setFloatingObjectsVisible } from './floating-objects.js';

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
  camExitX: -0.52,
  modelExitX: 0.24,
  modelExitY: -0.03,
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
  initFloatingObjectsScroll();
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
    start: 'top 72%',
    end: 'top 18%',
    scrub: 1,
    onUpdate: (self) => {
      const isMobile = window.innerWidth <= 768;
      const modelX = isMobile ? exitConfig.modelExitX * 0.45 : exitConfig.modelExitX;
      const modelY = isMobile ? 0 : exitConfig.modelExitY;
      exitOffsetX = self.progress * exitConfig.camExitX;
      setExitOffsetX(exitOffsetX);
      setModelOffset(self.progress * modelX, self.progress * modelY, 0);
    },
    onLeaveBack: () => {
      exitOffsetX = 0;
      setExitOffsetX(0);
      setModelOffset(0, 0, 0);
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

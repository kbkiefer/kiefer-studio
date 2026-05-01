import React from 'react';
import { createRoot } from 'react-dom/client';
import { initBoot } from './boot.js';
import { initBust } from './bust.js';
import { initScrollAnimations } from './scroll-animations.js';
import { initPixelTransition } from './pixel-transition.js';
import { initFooterScene } from './footer-scene.js';
import SelectedWorkSection from './components/SelectedWorkSection.jsx';

initBoot(() => {
  initBust();

  const workRoot = document.getElementById('selected-work-root');
  if (workRoot) {
    createRoot(workRoot).render(React.createElement(SelectedWorkSection));
  }

  setTimeout(() => {
    initScrollAnimations();
    initPixelTransition();
    initFooterScene();
  }, 500);
});

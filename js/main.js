import { initBust } from './bust.js';
import { initScrollAnimations } from './scroll-animations.js';
import { initProjects } from './projects.js';

initBust();
initProjects();

setTimeout(() => {
  initScrollAnimations();
}, 500);

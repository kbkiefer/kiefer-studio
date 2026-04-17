import { initBust } from './bust.js';
import { initScrollAnimations } from './scroll-animations.js';
import { initProjects } from './projects.js';
import { initNavLogo } from './nav-logo.js';

initBust();
initNavLogo();
initProjects();

setTimeout(() => {
  initScrollAnimations();
}, 500);

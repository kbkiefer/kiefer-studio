import { initBust } from './bust.js';
import { initScrollAnimations } from './scroll-animations.js';

initBust();

setTimeout(() => {
  initScrollAnimations();
}, 500);

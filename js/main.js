import { initBoot } from './boot.js';
import { initBust } from './bust.js';
import { initFilmStrip } from './film-strip.js';
import { initScrollAnimations } from './scroll-animations.js';
import { initPixelTransition } from './pixel-transition.js';

initBoot(() => {
  initBust();
  initFilmStrip();

  setTimeout(() => {
    initScrollAnimations();
    initPixelTransition();
  }, 500);
});

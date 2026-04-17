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

const burger = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('nav-mobile-menu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    mobileMenu.classList.toggle('is-open');
  });
  mobileMenu.querySelectorAll('.nav__mobile-link').forEach((link) => {
    link.addEventListener('click', () => {
      burger.classList.remove('is-open');
      mobileMenu.classList.remove('is-open');
    });
  });
}

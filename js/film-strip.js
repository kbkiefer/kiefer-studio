let strip, frames, frameCount, current;
let prev, next;

const FRAME_W = 420;
const MOBILE_FRAME_W = 300;
const SPROCKET_STEP = 50;
const ARC_DEG = 38;
const MOBILE_ARC_DEG = 30;
const RIBBON_OVERLAP = 0.88;
const FADE_DISTANCE = 2.8;

function getFrameWidth() {
  return window.matchMedia('(max-width: 768px)').matches ? MOBILE_FRAME_W : FRAME_W;
}

function applyTransforms() {
  const frameWidth = getFrameWidth();
  const geometryWidth = frameWidth * RIBBON_OVERLAP;
  const arcDeg = window.matchMedia('(max-width: 768px)').matches ? MOBILE_ARC_DEG : ARC_DEG;
  const arcRad = arcDeg * (Math.PI / 180);
  const radius = geometryWidth / arcRad;

  for (let i = 0; i < frameCount; i++) {
    const dist = i - current;
    const absDist = Math.abs(dist);
    const theta = dist * arcRad;
    const translateX = Math.sin(theta) * radius;
    const translateZ = (Math.cos(theta) - 1) * radius;
    const translateY = Math.sin(theta * 1.2) * 58;
    const rotateY = -dist * arcDeg;
    const rotateZ = Math.sin(theta * 0.85) * -5;
    const opacity = Math.max(0.36, 1 - absDist * 0.14);
    const shade = Math.min(0.7, absDist * 0.18);
    const glow = Math.max(0, 1 - absDist * 0.35);

    frames[i].style.transform =
      `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    frames[i].style.opacity = opacity;
    frames[i].style.zIndex = 1000 - Math.round(absDist * 10);
    frames[i].style.setProperty('--sprocket-x', `${-(i * frameWidth) % SPROCKET_STEP}px`);
    frames[i].style.setProperty('--curve-shade', shade.toFixed(2));
    frames[i].style.setProperty('--curve-glow', glow.toFixed(2));

    const card = frames[i].querySelector('.work__card');
    if (card) {
      card.style.boxShadow = absDist === 0
        ? 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 18px 70px rgba(1, 47, 255, 0.12)'
        : 'inset 0 0 0 1px rgba(255,255,255,0.04)';
    }
  }
}

function updateButtons() {
  prev.disabled = current === 0;
  next.disabled = current === frameCount - 1;
  prev.style.opacity = current === 0 ? '0.3' : '1';
  next.style.opacity = current === frameCount - 1 ? '0.3' : '1';
}

function goTo(index) {
  current = Math.max(0, Math.min(frameCount - 1, index));
  applyTransforms();
  updateButtons();
}

function setupKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    const work = document.getElementById('work');
    if (!work) return;
    const rect = work.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;

    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
  });
}

function setupTouchSwipe() {
  let startX = 0, delta = 0, swiping = false;

  strip.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    delta = 0;
    swiping = true;
  }, { passive: true });

  strip.addEventListener('touchmove', (e) => {
    if (!swiping) return;
    delta = e.touches[0].clientX - startX;
  }, { passive: true });

  strip.addEventListener('touchend', () => {
    if (!swiping) return;
    swiping = false;
    if (delta < -60) goTo(current + 1);
    else if (delta > 60) goTo(current - 1);
  });
}

function setupMouseDrag() {
  let startX = 0, delta = 0, dragging = false;

  strip.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    delta = 0;
    dragging = true;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    delta = e.clientX - startX;
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    if (delta < -60) goTo(current + 1);
    else if (delta > 60) goTo(current - 1);
  });
}

export function initFilmStrip() {
  strip = document.getElementById('work-strip');
  prev = document.getElementById('work-prev');
  next = document.getElementById('work-next');
  if (!strip || !prev || !next) return;

  frames = Array.from(strip.querySelectorAll('.work__frame'));
  frameCount = frames.length;
  current = Math.min(2, frameCount - 1);

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));

  setupKeyboardNav();
  setupTouchSwipe();
  setupMouseDrag();
  window.addEventListener('resize', applyTransforms);

  goTo(current);
}

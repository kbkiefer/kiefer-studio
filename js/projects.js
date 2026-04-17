const PROJECTS = [
  { name: 'Cymatics Lab', tags: 'iOS _ Metal _ Audio Visualization', color: '#012FFF', desc: 'Real-time audio visualization powered by Metal shaders. Transform sound into mesmerizing cymatics patterns on iOS.' },
  { name: 'Imago', tags: 'iOS _ AI _ ADHD Companion', color: '#22cc55', desc: 'An ADHD companion app using on-device AI to help with task management, focus, and daily routines.' },
  { name: 'Border Child', tags: 'Web _ R3F _ Film', color: '#cc8822', desc: 'Cinematic scroll-driven website for a Laredo creative studio. React Three Fiber and immersive storytelling.' },
  { name: 'NovaTrade', tags: 'macOS _ SwiftUI _ Trading', color: '#2299cc', desc: 'A sovereign trading terminal for macOS built with SwiftUI and Liquid Glass.' },
  { name: 'Resonance', tags: 'iOS _ Metal _ Consciousness', color: '#8822cc', desc: 'A consciousness instrument combining Metal cymatics, audio entrainment, and Watch HR.' },
  { name: 'ClearMind', tags: 'iOS _ Canvas _ Neural Map', color: '#cc2244', desc: 'ADHD neural map task manager. Six life areas, AI categorization, looming thoughts.' },
  { name: 'Chrysalis', tags: 'Unity _ 3D _ Game', color: '#ccaa22', desc: 'A 3D game about transformation. Caterpillar to butterfly at two different scales.' },
  { name: 'ShalaMakes', tags: 'Web _ 3D Printing _ Store', color: '#22ccaa', desc: 'E-commerce for custom 3D printed products. Static HTML, Stripe, GitHub Actions.' },
  { name: 'Continuum', tags: 'macOS _ Vision _ AI', color: '#4455cc', desc: 'Local continuous visual perception for Apple Silicon. SigLIP + Qwen2-VL at 20 FPS.' },
];

const COLS = 3;
const CELL_W = 420;
const CELL_H = 320;
const GAP = 4;

let offsetX = 0, offsetY = 0;
let dragStartX, dragStartY, startOffsetX, startOffsetY;
let isDragging = false;
let hasDragged = false;
let activeIndex = -1;

export function initProjects() {
  const grid = document.getElementById('work-grid');
  const modal = document.getElementById('work-modal');
  const modalClose = document.getElementById('work-modal-close');
  if (!grid) return;

  const rows = Math.ceil(PROJECTS.length / COLS);
  const totalW = COLS * (CELL_W + GAP);
  const totalH = rows * (CELL_H + GAP);

  offsetX = -(totalW - grid.offsetWidth) / 2;
  offsetY = -(totalH - grid.offsetHeight) / 2;

  for (let i = 0; i < PROJECTS.length; i++) {
    const p = PROJECTS[i];
    const cell = document.createElement('div');
    cell.className = 'work__cell';
    cell.dataset.index = i;
    cell.innerHTML = `
      <div class="work__cell-bg" style="background:${p.color}"></div>
      <span class="work__cell-name">${p.name}</span>
      <span class="work__cell-tags">${p.tags}</span>
    `;
    grid.appendChild(cell);
  }

  updateGrid(grid);

  grid.addEventListener('mousedown', (e) => {
    isDragging = true;
    hasDragged = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startOffsetX = offsetX;
    startOffsetY = offsetY;
    grid.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
    offsetX = startOffsetX + dx;
    offsetY = startOffsetY + dy;
    updateGrid(grid);
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    grid.style.cursor = 'grab';
    snapToCenter(grid);
  });

  grid.addEventListener('touchstart', (e) => {
    isDragging = true;
    hasDragged = false;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    startOffsetX = offsetX;
    startOffsetY = offsetY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
    offsetX = startOffsetX + dx;
    offsetY = startOffsetY + dy;
    updateGrid(grid);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    snapToCenter(grid);
  });

  grid.addEventListener('click', (e) => {
    if (hasDragged) return;
    const cell = e.target.closest('.work__cell');
    if (!cell || !cell.classList.contains('is-active')) return;
    openModal(PROJECTS[activeIndex]);
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

function updateGrid(grid) {
  const cells = grid.querySelectorAll('.work__cell');
  const cx = grid.offsetWidth / 2;
  const cy = grid.offsetHeight / 2;
  let closestIdx = -1;
  let closestDist = Infinity;

  cells.forEach((cell, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = offsetX + col * (CELL_W + GAP);
    const y = offsetY + row * (CELL_H + GAP);

    cell.style.transform = `translate(${x}px, ${y}px)`;
    cell.style.width = CELL_W + 'px';
    cell.style.height = CELL_H + 'px';

    const cellCx = x + CELL_W / 2;
    const cellCy = y + CELL_H / 2;
    const dist = Math.hypot(cellCx - cx, cellCy - cy);

    if (dist < closestDist) {
      closestDist = dist;
      closestIdx = i;
    }

    cell.classList.remove('is-active');
  });

  if (closestIdx >= 0) {
    cells[closestIdx].classList.add('is-active');
    activeIndex = closestIdx;
    const nameEl = document.getElementById('work-focus-name');
    if (nameEl) nameEl.textContent = PROJECTS[closestIdx].name;
  }
}

function snapToCenter(grid) {
  if (activeIndex < 0) return;

  const cx = grid.offsetWidth / 2;
  const cy = grid.offsetHeight / 2;
  const col = activeIndex % COLS;
  const row = Math.floor(activeIndex / COLS);

  const targetX = cx - col * (CELL_W + GAP) - CELL_W / 2;
  const targetY = cy - row * (CELL_H + GAP) - CELL_H / 2;

  const startX = offsetX;
  const startY = offsetY;
  const duration = 300;
  const start = performance.now();

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const p = ease(t);
    offsetX = startX + (targetX - startX) * p;
    offsetY = startY + (targetY - startY) * p;
    updateGrid(grid);
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function openModal(project) {
  const modal = document.getElementById('work-modal');
  const hero = document.getElementById('work-modal-hero');
  const title = document.getElementById('work-modal-title');
  const tags = document.getElementById('work-modal-tags');
  const body = document.getElementById('work-modal-body');

  hero.style.background = project.color;
  title.textContent = project.name;
  tags.textContent = project.tags;
  body.innerHTML = `<p>${project.desc}</p>`;

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('work-modal').classList.remove('is-open');
  document.body.style.overflow = '';
}

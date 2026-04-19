import React from 'react';
import { createRoot } from 'react-dom/client';
import FilmStripPortfolio from './FilmStrip.jsx';

export function initProjects() {
  const container = document.getElementById('work-grid');
  if (!container) return;

  const root = createRoot(container);
  root.render(React.createElement(FilmStripPortfolio));

  const closeBtn = document.getElementById('work-modal-close');
  const modal = document.getElementById('work-modal');

  if (closeBtn) closeBtn.addEventListener('click', () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  });

  if (modal) modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });
}

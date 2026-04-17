export function initProjects() {
  const track = document.getElementById('projects-track');
  const ghost = document.getElementById('projects-ghost');
  if (!track) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener('mouseleave', () => {
    isDown = false;
    track.style.cursor = 'grab';
  });

  track.addEventListener('mouseup', () => {
    isDown = false;
    track.style.cursor = 'grab';
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  });

  const cards = track.querySelectorAll('.project-card');
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      const name = card.querySelector('.project-card__name');
      if (name && ghost) {
        ghost.textContent = name.textContent;
      }
    });
  });
}

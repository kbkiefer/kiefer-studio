const STATUS_MESSAGES = [
  'Initializing...',
  'Loading modules...',
  'Compiling shaders...',
  'Mounting 3D pipeline...',
  'Preparing bust geometry...',
  'Calibrating pixel grid...',
  'Rendering Borderlands materials...',
  'System ready.',
];

export function initBoot(onComplete) {
  const boot = document.getElementById('boot');
  const bar = document.getElementById('boot-bar');
  const status = document.getElementById('boot-status');
  const site = document.getElementById('site');

  if (!boot || !bar || !status) {
    if (site) site.style.display = '';
    onComplete();
    return;
  }

  let progress = 0;
  let msgIndex = 0;
  const duration = 3000;
  const interval = 80;
  const steps = duration / interval;
  const increment = 100 / steps;

  const timer = setInterval(() => {
    progress = Math.min(100, progress + increment + Math.random() * 2);
    bar.style.width = `${progress}%`;

    const newMsgIndex = Math.floor((progress / 100) * (STATUS_MESSAGES.length - 1));
    if (newMsgIndex !== msgIndex) {
      msgIndex = newMsgIndex;
      status.textContent = STATUS_MESSAGES[msgIndex];
    }

    if (progress >= 100) {
      clearInterval(timer);
      status.textContent = 'System ready.';

      setTimeout(() => {
        boot.classList.add('is-done');
        if (site) site.style.display = '';

        setTimeout(() => {
          boot.remove();
          onComplete();
        }, 600);
      }, 400);
    }
  }, interval);
}

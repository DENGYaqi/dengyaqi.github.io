export default String.raw`(() => {
  const stops = [];
  for (const section of document.querySelectorAll('[data-demo]')) {
    const preview = section.querySelector('.demo-preview');
    const dialog = section.querySelector('dialog');
    const enlarged = dialog.querySelector('img');
    const buttons = section.querySelectorAll('.demo-play');
    const errors = section.querySelectorAll('.demo-error');
    const size = section.querySelector('.demo-size');
    let playing = false;

    function show(active) {
      playing = active;
      const source = active ? section.dataset.demo : section.dataset.poster;
      preview.src = source;
      if (dialog.open) enlarged.src = source;
      for (const button of buttons) {
        button.textContent = active ? section.dataset.stop : section.dataset.play;
        button.setAttribute('aria-pressed', String(active));
      }
    }
    const stop = () => { if (playing) show(false); };
    stops.push(stop);
    for (const button of buttons) button.addEventListener('click', () => {
      const active = !playing;
      stops.forEach(stop => stop());
      errors.forEach(error => { error.hidden = true; });
      show(active);
    });
    for (const img of [preview, enlarged]) img.addEventListener('error', () => {
      stop();
      errors.forEach(error => { error.hidden = false; });
    });
    section.querySelector('.demo-zoom').addEventListener('click', () => {
      enlarged.src = preview.src;
      dialog.showModal();
    });
    section.querySelector('.demo-close').addEventListener('click', () => dialog.close());
    size.addEventListener('click', () => {
      const original = dialog.classList.toggle('original-size');
      size.setAttribute('aria-pressed', String(original));
    });
    dialog.addEventListener('close', () => {
      stop();
      enlarged.removeAttribute('src');
      dialog.classList.remove('original-size');
      size.setAttribute('aria-pressed', 'false');
    });
    section.querySelectorAll('[data-demo-controls]').forEach(controls => { controls.hidden = false; });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stops.forEach(stop => stop());
  });
})();`;

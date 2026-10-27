export default String.raw`(() => {
  const panel = document.querySelector('[data-launch-status]');
  if (!panel) return;
  const status = panel.querySelector('[role=status]');
  const open = panel.querySelector('[data-launch-open]');
  const stop = panel.querySelector('[data-launch-stop]');
  let attempts = 0;
  async function poll() {
    try {
      const response = await fetch(panel.dataset.launchStatus, { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('unavailable');
      const result = await response.json();
      status.textContent = panel.dataset[result.state] || panel.dataset.failed;
      open.hidden = result.state !== 'ready';
      stop.hidden = ['stopped', 'failed'].includes(result.state);
      if (result.state === 'ready') { open.requestSubmit(); return; }
      if (['stopped', 'failed'].includes(result.state)) return;
      attempts = 0;
    } catch {
      status.textContent = panel.dataset.error;
      if (++attempts >= 5) return;
    }
    setTimeout(poll, 3000);
  }
  poll();
})();`;

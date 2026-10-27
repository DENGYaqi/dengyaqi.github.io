export default String.raw`(() => {
  for (const panel of document.querySelectorAll('[data-local-launch]')) {
    const form = panel.querySelector('form'), button = form.querySelector('button');
    const status = panel.querySelector('[role=status]'), retry = panel.querySelector('[data-local-retry]');
    let expiryTimer;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled || button.hidden) return;
      button.disabled = true; retry.hidden = true; retry.removeAttribute('href'); clearTimeout(expiryTimer);
      status.textContent = panel.dataset.working;
      try {
        const body = new URLSearchParams(new FormData(form));
        const response = await fetch(panel.dataset.localLaunch, { method: 'POST', credentials: 'same-origin', body, cache: 'no-store' });
        if (!response.ok) throw new Error('launch');
        const result = await response.json();
        if (!/^yaqi-local:\/\/launch\?ticket=[A-Za-z0-9_.-]+$/.test(result.uri) || !Number.isInteger(result.expires_at) || result.expires_at * 1000 <= Date.now()) throw new Error('launch');
        retry.href = result.uri; retry.hidden = false; button.hidden = true;
        panel.querySelector('[data-local-help]').hidden = false;
        status.textContent = panel.dataset.sent;
        expiryTimer = setTimeout(() => { retry.hidden = true; retry.removeAttribute('href'); button.hidden = false; status.textContent = panel.dataset.expired; }, Math.max(0, result.expires_at * 1000 - Date.now()));
        // Leave external-app navigation to the user's direct link click.
      } catch { status.textContent = panel.dataset.error; }
      finally { button.disabled = false; }
    });
  }
})();`;

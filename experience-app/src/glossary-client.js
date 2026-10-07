export default String.raw`(() => {
  const prose = document.querySelector('.prose[data-glossary-url]');
  if (!prose) return;
  let openButton = null;

  function closeTip() {
    if (!openButton) return;
    openButton.setAttribute('aria-expanded', 'false');
    openButton.nextElementSibling.removeAttribute('data-open');
    openButton = null;
  }

  function showTip(button) {
    if (openButton !== button) closeTip();
    const tip = button.nextElementSibling;
    tip.setAttribute('data-open', '');
    button.setAttribute('aria-expanded', 'true');
    openButton = button;
    const rect = button.getBoundingClientRect();
    const margin = 12;
    tip.style.left = Math.max(margin, Math.min(rect.left, window.innerWidth - tip.offsetWidth - margin)) + 'px';
    tip.style.top = (rect.top >= tip.offsetHeight + margin * 2
      ? rect.top - tip.offsetHeight - 8
      : Math.min(rect.bottom + 8, window.innerHeight - tip.offsetHeight - margin)) + 'px';
  }

  function annotate(terms) {
    const available = terms.filter(term => term.key && term.text && term.definition);
    const used = new Set();
    const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let index = 0;
    for (const node of nodes) {
      const value = node.nodeValue;
      let offset = 0, changed = false;
      const fragment = document.createDocumentFragment();
      while (offset < value.length) {
        let match = null, at = value.length;
        for (const term of available) {
          if (used.has(term.key)) continue;
          const found = value.indexOf(term.text, offset);
          if (found >= 0 && (found < at || (found === at && term.text.length > match.text.length))) {
            match = term;
            at = found;
          }
        }
        if (!match) break;
        fragment.append(document.createTextNode(value.slice(offset, at)));
        const wrapper = document.createElement('span');
        wrapper.className = 'glossary-entry';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'glossary-trigger';
        button.textContent = value.slice(at, at + match.text.length);
        button.setAttribute('aria-expanded', 'false');
        const tip = document.createElement('span');
        tip.id = 'glossary-tip-' + index++;
        tip.className = 'glossary-tip';
        tip.setAttribute('role', 'tooltip');
        tip.textContent = match.definition;
        button.setAttribute('aria-describedby', tip.id);
        wrapper.append(button, tip);
        fragment.append(wrapper);
        used.add(match.key);
        offset = at + match.text.length;
        changed = true;
      }
      if (changed) {
        fragment.append(document.createTextNode(value.slice(offset)));
        node.replaceWith(fragment);
      }
    }
  }

  prose.addEventListener('pointerover', event => {
    const button = event.target.closest?.('.glossary-trigger');
    if (button && event.pointerType !== 'touch') showTip(button);
  });
  prose.addEventListener('pointerout', event => {
    const button = event.target.closest?.('.glossary-trigger');
    if (button === openButton && document.activeElement !== button) closeTip();
  });
  prose.addEventListener('focusin', event => {
    if (event.target.matches?.('.glossary-trigger')) showTip(event.target);
  });
  prose.addEventListener('focusout', event => {
    if (event.target === openButton) closeTip();
  });
  prose.addEventListener('click', event => {
    const button = event.target.closest?.('.glossary-trigger');
    if (button) showTip(button);
  });
  document.addEventListener('pointerdown', event => {
    if (openButton && !event.target.closest?.('.glossary-entry')) closeTip();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeTip();
  });
  window.addEventListener('wheel', closeTip, { passive: true });
  window.addEventListener('touchmove', closeTip, { passive: true });

  fetch(prose.dataset.glossaryUrl, { credentials: 'same-origin' })
    .then(response => response.ok ? response.json() : null)
    .then(data => { if (Array.isArray(data?.terms)) annotate(data.terms); })
    .catch(() => {});
})();`;

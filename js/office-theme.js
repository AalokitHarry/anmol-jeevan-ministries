/* Light/dark switch for the office pages. The saved choice (ajm-theme) is shared
   with the public site and is only a display preference, never a key. */
(() => {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const lightColor = meta ? meta.getAttribute('content') : '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-fab';
  btn.id = 'themeToggle';
  btn.innerHTML = '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
    + '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  function apply(theme){
    root.setAttribute('data-theme', theme);
    const dark = theme === 'dark';
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.title = dark ? 'Light theme' : 'Dark theme';
    if(meta) meta.setAttribute('content', dark ? '#0a0b22' : lightColor);
  }
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('ajm-theme', next); } catch(e) {}
  });
  apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  document.body.appendChild(btn);
})();

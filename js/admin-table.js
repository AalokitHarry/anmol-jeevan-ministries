/* Sortable data tables shared by the office pages (admin, media, worship).
   Each page builds its own rows; this only draws the header and sorts. */
(() => {
  const collator = new Intl.Collator(undefined, {numeric:true, sensitivity:'base'});
  const blank = v => v === '' || v === null || v === undefined;

  // cols: [{key, label, sort, cls}] — label is plain text; state: {key, dir}
  function head(cols, state){
    return '<thead><tr>' + cols.map(c => {
      const cls = c.cls ? ` class="${c.cls}"` : '';
      if(!c.sort) return `<th scope="col"${cls}>${c.label ? esc(c.label) : `<span class="dt-sr">${esc(c.sr || '')}</span>`}</th>`;
      const on = state && state.key === c.key;
      const aria = on ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      return `<th scope="col"${cls} aria-sort="${aria}"><button type="button" class="dt-sort${on ? ' on' : ''}" data-sort-key="${esc(c.key)}">${esc(c.label)}<span class="dt-arrow" aria-hidden="true">${on && state.dir === 'asc' ? '▴' : '▾'}</span></button></th>`;
    }).join('') + '</tr></thead>';
  }

  // get: {key: row => value}; empty values always go last, numbers compare as numbers
  function sort(rows, state, get){
    if(!state || !state.key) return rows.slice();
    const pick = (get && get[state.key]) || (r => r[state.key]);
    const sign = state.dir === 'asc' ? 1 : -1;
    return rows.slice().sort((a, b) => {
      const x = pick(a), y = pick(b);
      if(blank(x) || blank(y)) return blank(x) === blank(y) ? 0 : blank(x) ? 1 : -1;
      return sign * (typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y)));
    });
  }

  // Clicking a header sorts by it; clicking it again flips the direction.
  // firstDir names the columns that should start newest/largest first.
  // state may be a function, for one container that shows different tables.
  function onSort(el, getState, render, firstDir){
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-sort-key]');
      if(!b || !el.contains(b)) return;
      const state = typeof getState === 'function' ? getState() : getState;
      const k = b.dataset.sortKey, hadFocus = document.activeElement === b;
      if(state.key === k) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
      else { state.key = k; state.dir = (firstDir && firstDir[k]) || 'asc'; }
      render();
      const again = hadFocus && el.querySelector(`[data-sort-key="${k}"]`);
      if(again) again.focus();
    });
  }

  window.AjmTable = {head, sort, onSort};
})();

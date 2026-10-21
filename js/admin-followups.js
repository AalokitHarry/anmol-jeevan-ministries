(() => {
  const form = $('followupForm');
  let supported = false, editing = null, dirty = false, saving = false, session = 0;
  const today = () => new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Kolkata'});
  const dateText = value => value ? new Date(value + 'T12:00:00').toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : 'No date set';
  const hasFollowUp = row => row.FollowUpOwner || row.FollowUpDate || row.FollowUpNote || row.FollowUpStatus === 'Done';
  function renderFollowUps() {
    const day = today(), rows = activeRows().filter(hasFollowUp);
    const due = rows.filter(r => r.FollowUpStatus !== 'Done' && r.FollowUpDate && r.FollowUpDate <= day);
    $('followupCount').textContent = due.length ? due.length + ' due or overdue' : 'None due';
    const filter = $('followupFilter').value, owner = $('followupOwnerFilter').value.trim().toLowerCase();
    const shown = rows.filter(r => {
      if (owner && !String(r.FollowUpOwner || '').toLowerCase().includes(owner)) return false;
      if (filter === 'done') return r.FollowUpStatus === 'Done';
      if (filter === 'due') return due.includes(r);
      if (filter === 'upcoming') return r.FollowUpStatus !== 'Done' && r.FollowUpDate > day;
      return true;
    }).sort((a,b) => String(a.FollowUpDate || '9999').localeCompare(String(b.FollowUpDate || '9999')));
    $('followupList').innerHTML = shown.length ? shown.map(r => {
      const done = r.FollowUpStatus === 'Done', late = !done && r.FollowUpDate && r.FollowUpDate < day;
      return `<article class="workflow-row"><div><h3>${esc(r.Name || 'Registration')}</h3><p><span class="workflow-tag ${done ? 'is-done' : late ? 'is-late' : ''}">${done ? 'Completed' : late ? 'Overdue' : 'Open'}</span>${esc(dateText(r.FollowUpDate))} · ${esc(r.FollowUpOwner || 'Unassigned')}</p>${r.FollowUpNote ? `<p class="workflow-notes">${esc(r.FollowUpNote)}</p>` : ''}</div><button type="button" class="btn" data-followup="${esc(r.ID)}">Edit Follow-up</button></article>`;
    }).join('') : '<p class="workflow-empty">No follow-ups match this view. Use Follow-up beside a registration to assign someone and set the next contact date.</p>';
  }
  function closeEditor() {
    form.hidden = true; form.reset(); editing = null; dirty = false;
    [...form.querySelectorAll('input,textarea,select,button')].forEach(el => { el.disabled = false; });
    $('followupResult').textContent = '';
  }
  function openEditor(id) {
    if (saving || (dirty && !confirm('Discard the unsaved follow-up changes?'))) return;
    const row = allRows.find(r => r.ID === id);
    if (!row) return;
    editing = {id, rev: row.FollowUpRev || ''};
    $('followupTitle').textContent = 'Follow-up for ' + (row.Name || 'registration');
    $('followupOwner').value = row.FollowUpOwner || '';
    $('followupDate').value = row.FollowUpDate || '';
    $('followupNote').value = row.FollowUpNote || '';
    $('followupStatus').value = row.FollowUpStatus === 'Done' ? 'Done' : 'Open';
    $('followupSave').disabled = !supported;
    $('followupResult').textContent = supported ? '' : 'Update the Google Sheet script before saving follow-ups.';
    $('followupResult').classList.remove('is-error');
    form.hidden = false; $('followupPanel').open = true; dirty = false;
    $('followupTitle').focus(); form.scrollIntoView({block:'start',behavior:'auto'});
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('.followup-open,[data-followup]');
    if (button) openEditor(button.dataset.followup || button.dataset.id);
  });
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('change', () => { dirty = true; });
  $('followupFilter').addEventListener('change', renderFollowUps);
  $('followupOwnerFilter').addEventListener('input', renderFollowUps);
  $('followupCancel').addEventListener('click', () => {
    if (!saving && (!dirty || confirm('Discard the unsaved follow-up changes?'))) closeEditor();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!supported || !editing || saving || !adminKey) return;
    const requestSession = session, id = editing.id;
    saving = true; $('followupSave').disabled = true; $('followupCancel').disabled = true;
    [...form.querySelectorAll('input,textarea,select')].forEach(el => { el.disabled = true; });
    const result = $('followupResult');
    result.classList.remove('is-error'); result.textContent = 'Saving follow-up…';
    try {
      const response = await fetch(ADMIN_URL, {method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'setFollowUp',key:adminKey,id,rev:editing.rev,owner:$('followupOwner').value.trim(),due:$('followupDate').value,note:$('followupNote').value.trim(),status:$('followupStatus').value})});
      const json = await response.json();
      if (requestSession !== session) return;
      if (!json.ok || !json.followUp) throw new Error(json.error || 'unsupported');
      const row = allRows.find(r => r.ID === id);
      if (row) Object.assign(row, json.followUp);
      editing.rev = json.followUp.FollowUpRev;
      dirty = false; result.textContent = 'Follow-up saved for the team.';
      renderFollowUps();
    } catch (error) {
      if (requestSession !== session) return;
      result.classList.add('is-error');
      result.textContent = error.message === 'conflict' ? 'A teammate changed this follow-up. Your draft is kept. Refresh the registrations, then reopen the follow-up to review their changes.' : error.message === 'unauthorized' ? 'Your session is no longer authorized. Log in again before saving.' : 'Follow-up not saved. Your draft is kept; check the connection and try again.';
    } finally {
      if (requestSession === session) { saving = false; [...form.querySelectorAll('input,textarea,select')].forEach(el => { el.disabled = false; }); $('followupSave').disabled = !supported; $('followupCancel').disabled = false; if (!form.hidden) $('followupSave').focus(); }
    }
  });
  document.addEventListener('ajm:admin-render', renderFollowUps);
  document.addEventListener('ajm:admin-features', event => {
    supported = event.detail.followUps;
    $('followupUpgrade').hidden = supported;
    $('followupSave').disabled = !supported;
  });
  document.addEventListener('ajm:admin-logout', () => {
    session++; saving = false; supported = false; closeEditor(); $('followupList').textContent = ''; $('followupCount').textContent = '';
  });
  $('logoutBtn').addEventListener('click', event => {
    if ((saving || dirty) && !confirm(saving ? 'A follow-up save is in progress. Log out anyway?' : 'Discard the unsaved follow-up changes and log out?')) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.addEventListener('beforeunload', event => {
    if (dirty || saving) { event.preventDefault(); event.returnValue = ''; }
  });
})();

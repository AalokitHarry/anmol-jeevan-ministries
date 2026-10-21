(() => {
  const form = $('planTaskForm');
  let tasks = [], loaded = false, loading = false, saving = false, dirty = false, editing = null;
  const dateKey = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const istToday = () => new Date(serverNow().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}) + 'T00:00:00');
  const dateLabel = value => new Date(value+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  const weekStart = () => { const d=istToday(); return addDays(d,-d.getDay()+planOffset*7); };
  const finished = task => task.status === 'Done' || task.status === 'Cancelled';
  function tag(task) {
    const late = !finished(task) && task.due < dateKey(istToday());
    return `<span class="workflow-tag ${task.status==='Done'?'is-done':late?'is-late':''}">${esc(late?'Overdue · '+task.status:task.status)}</span>`;
  }
  function chips(date) {
    const items = tasks.filter(t=>t.due===dateKey(date)&&t.status!=='Cancelled');
    return items.length ? items.map(t=>`<div class="workflow-task-chip"><strong>${esc(t.title)}</strong><span>${esc(t.owner||'Unassigned')} · ${esc(t.type)}</span>${tag(t)}</div>`).join('') : '<p class="workflow-empty">No assignments</p>';
  }
  function render() {
    const today=istToday(), start=weekStart(), end=addDays(start,6);
    $('plRange').textContent = dateLabel(dateKey(start))+' – '+dateLabel(dateKey(end))+(planOffset===0?' · this week':'');
    $('plPrev').disabled=false; $('plNext').disabled=false; $('plNowBtn').hidden=planOffset===0;
    $('planAdd').disabled=!loaded||saving;
    $('planRefresh').disabled=loading||saving;
    $('plNow').parentElement.classList.toggle('workflow-no-event',$('plEvent').hidden);
    $('plNow').innerHTML=[today,addDays(today,1)].map((d,i)=>`<div class="pl-day ${i?'tm':'td'}"><h3>${i?'Tomorrow':'Today'}</h3><p>${esc(dateLabel(dateKey(d)))}</p>${loaded?chips(d):'<p class="workflow-help">Load the shared assignments to see this day.</p>'}</div>`).join('');
    let board='';
    for(let i=0;i<7;i++){
      const d=addDays(start,i);
      board+=`<div class="pl-col${i===0?' sun':''}${sameDay(d,today)?' today':''}"${sameDay(d,today)?' aria-current="date"':''} style="--col:${i+1}"><div class="pl-h"><span><span class="dn">${SHORT_DAYS[i]}</span><span class="dd">${esc(fmtDM(d))}</span></span>${sameDay(d,today)?'<span class="workflow-today-label">Today</span>':''}</div><div class="pl-b">${loaded?chips(d):'<p class="workflow-help">Not loaded</p>'}</div></div>`;
    }
    $('plBoard').classList.add('workflow-board'); $('plBoard').style.setProperty('--rr',0); $('plBoard').innerHTML=board;
    const owner=$('planOwnerFilter').value.trim().toLowerCase(), status=$('planStatusFilter').value;
    const shown=tasks.filter(t=>t.due>=dateKey(start)&&t.due<=dateKey(end)&&(!owner||t.owner.toLowerCase().includes(owner))&&(status==='all'||t.status===status)).sort((a,b)=>a.due.localeCompare(b.due)||a.title.localeCompare(b.title));
    $('planTaskList').innerHTML=shown.length?shown.map(t=>`<article class="workflow-row"><div><h3>${esc(t.title)}</h3><p>${tag(t)}${esc(dateLabel(t.due))} · ${esc(t.owner||'Unassigned')} · ${esc(t.type)}</p>${t.notes?`<p class="workflow-notes">${esc(t.notes)}</p>`:''}</div><button class="btn" type="button" data-plan-edit="${esc(t.id)}">Edit Assignment</button></article>`).join(''):`<p class="workflow-empty">${loaded?'No assignments match this week and filter. Add an assignment to plan the team’s work.':'The shared assignments have not loaded yet. Use Refresh Assignments to try again.'}</p>`;
  }
  async function load(silent=false) {
    if(!hasPlan||loading||saving) return;
    loading=true;
    let changed=false;
    if(!silent)render();
    const status=$('planLoadState');
    if(!silent){status.textContent='Loading shared assignments…';status.classList.remove('is-error');}
    try {
      const result=await call('mediaPlanList');
      if(!Array.isArray(result.tasks)) throw new Error('unsupported');
      changed=!loaded||JSON.stringify(tasks)!==JSON.stringify(result.tasks);
      tasks=result.tasks; loaded=true;
      if(!silent||changed||status.classList.contains('is-error')){status.textContent='Assignments are up to date.'; status.classList.remove('is-error');}
    } catch(error) {
      status.classList.add('is-error');
      status.textContent=error.message==='unauthorized'?'Session expired. Log in again to load assignments.':loaded?'Could not refresh. Showing the last loaded assignments; try again.':'Could not load assignments. Check the connection and refresh. The updated Google Sheet script is required.';
    } finally {loading=false;if(!silent||changed)render();}
  }
  function setBusy(value) {
    [...form.querySelectorAll('input,textarea,select,button')].forEach(el=>{el.disabled=value;});
  }
  function closeEditor() {
    form.hidden=true; form.reset(); editing=null; dirty=false;
    $('planSaveState').textContent='';
  }
  function openEditor(task) {
    if(!loaded||saving||(dirty&&!confirm('Discard the unsaved assignment changes?'))) return;
    editing=task?{id:task.id,rev:task.rev}:null;
    $('planTaskTitle').textContent=task?'Edit Assignment':'Add Assignment';
    $('planTitle').value=task?task.title:'';
    $('planType').innerHTML=[...new Set(CATEGORIES.concat(tasks.map(t=>t.type)))].map(t=>`<option>${esc(t)}</option>`).join('');
    $('planType').value=task?task.type:CATEGORIES[0];
    $('planOwner').value=task?task.owner:'';
    $('planDue').value=task?task.due:dateKey(planOffset===0?istToday():weekStart());
    $('planStatus').value=task?task.status:'Planned';
    $('planNotes').value=task?task.notes:'';
    $('planSaveState').textContent=''; $('planSaveState').classList.remove('is-error');
    form.hidden=false;dirty=false;setBusy(false);
    $('planTaskTitle').focus();form.scrollIntoView({block:'start',behavior:'auto'});
  }
  $('planAdd').addEventListener('click',()=>openEditor(null));
  $('planRefresh').addEventListener('click',()=>load());
  $('planOwnerFilter').addEventListener('input',render);
  $('planStatusFilter').addEventListener('change',render);
  $('planTaskList').addEventListener('click',event=>{
    const button=event.target.closest('[data-plan-edit]');
    if(button)openEditor(tasks.find(t=>t.id===button.dataset.planEdit));
  });
  form.addEventListener('input',()=>{dirty=true;});
  form.addEventListener('change',()=>{dirty=true;});
  $('planCancel').addEventListener('click',()=>{if(!saving&&(!dirty||confirm('Discard the unsaved assignment changes?')))closeEditor();});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(saving||!hasPlan||!loaded||!mediaKey)return;
    const request={action:'mediaPlanSave',key:mediaKey,id:editing?editing.id:'',rev:editing?editing.rev:'',title:$('planTitle').value.trim(),type:$('planType').value,owner:$('planOwner').value.trim(),due:$('planDue').value,status:$('planStatus').value,notes:$('planNotes').value.trim()};
    if(!request.title){$('planTitle').setCustomValidity('Enter a content title.');$('planTitle').reportValidity();return;}
    saving=true;setBusy(true);render();
    const status=$('planSaveState');status.textContent='Saving assignment…';status.classList.remove('is-error');
    try {
      const response=await fetch(MEDIA_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(request)});
      const result=await response.json();
      if(!result.ok||!result.task)throw new Error(result.error||'unsupported');
      const at=tasks.findIndex(t=>t.id===result.task.id);
      if(at>=0)tasks[at]=result.task;else tasks.push(result.task);
      editing={id:result.task.id,rev:result.task.rev};dirty=false;
      $('planTaskTitle').textContent='Edit Assignment';
      const due=new Date(result.task.due+'T00:00:00'),base=istToday();
      planOffset=Math.floor(daysBetween(addDays(base,-base.getDay()),due)/7);
      status.textContent='Assignment saved for the team.';
    } catch(error) {
      status.classList.add('is-error');
      status.textContent=error.message==='conflict'?'A teammate changed this assignment. Your draft is kept. Refresh assignments, then reopen it to review their changes.':error.message==='unauthorized'?'Session expired. Log in again before saving.':'Assignment not saved. Your draft is kept; check the connection and try again.';
    } finally {saving=false;setBusy(false);render();if(activeTab==='plan'&&!form.hidden)$('planSave').focus();}
  });
  $('planTitle').addEventListener('input',()=>$('planTitle').setCustomValidity(''));
  window.AjmPlan={render,load,poll:()=>dirty?undefined:load(true),hasUnsaved:()=>dirty||saving};
})();

// The Open Door: shows the next gathering in the home hero, always in India time (IST).
// The schedule comes from events.json, the same list the AJM Office app reads.
(function(){
  const hero=document.getElementById('top'),when=document.getElementById('doorWhen'),name=document.getElementById('doorName'),
    detail=document.getElementById('doorDetail'),cta=document.getElementById('doorCta'),ctaText=document.getElementById('doorCtaText'),
    rail=document.getElementById('doorRail');
  if(!hero||!when||!rail)return;

  const IST=330*60000,MIN=60000,DAY=1440*MIN,WA='https://wa.me/917999929550?text=';
  const CODES=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WEEKDAYS=['MON','TUE','WED','THU','FRI','SAT'];
  const CONFERENCE_ENDS=Date.UTC(2027,0,16,18,30); // midnight after 16 Jan 2027, IST
  let weekly=[
    {title:'Sunday Worship Service',days:['SUN'],time:'15:00',durationMinutes:120,where:'Indore, Madhya Pradesh',online:false},
    {title:'90 Minutes with Jesus',days:['WED'],time:'19:00',durationMinutes:90,where:'Indore, Madhya Pradesh',online:false},
    {title:'Youth Fellowship',days:['THU'],time:'20:30',durationMinutes:60,where:'Online via Zoom',online:true},
    {title:'Morning Devotion',days:WEEKDAYS,time:'07:30',durationMinutes:30,where:'Online via Zoom',online:true},
    {title:'Night Prayer',days:WEEKDAYS,time:'22:00',durationMinutes:30,where:'Online via Zoom',online:true}
  ];
  let chosen=null,railKeys='';

  const clock=mins=>{const h=Math.floor(mins/60),m=mins%60;return (h%12||12)+':'+String(m).padStart(2,'0')+(h<12?' AM':' PM');};
  const dateKey=d=>d.toISOString().slice(0,10);

  // Every sitting from now on for 8 days, skipping weeks it does not meet.
  // A sitting stops being offered 10 minutes before it ends: too late to get a link.
  function upcoming(now){
    const today=Math.floor((now+IST)/DAY)*DAY,list=[];
    for(let i=0;i<9;i++){
      const day=new Date(today+i*DAY),code=CODES[day.getUTCDay()];
      weekly.forEach(g=>{
        if(!g.days.includes(code)||(g.skip||[]).includes(dateKey(day)))return;
        const [h,m]=g.time.split(':').map(Number),mins=h*60+m,start=day.getTime()+mins*MIN-IST,end=start+g.durationMinutes*MIN;
        if(end-10*MIN>now)list.push({g,mins,start,end,day,offset:i,key:g.title+start});
      });
    }
    return list.sort((a,b)=>a.start-b.start);
  }
  function dayLabel(s){
    if(s.offset===0)return s.mins>=17*60?'Tonight':'Today';
    if(s.offset===1)return 'Tomorrow';
    return DAYS[s.day.getUTCDay()];
  }
  function fullDate(s){return DAYS[s.day.getUTCDay()]+', '+s.day.getUTCDate()+' '+MONTHS[s.day.getUTCMonth()];}
  function countdown(s,now){
    if(s.start<=now)return 'Happening now';
    const mins=Math.ceil((s.start-now)/MIN);
    if(mins<60)return 'Starts in '+mins+' min';
    if(mins<1440)return 'Starts in '+Math.floor(mins/60)+'h'+(mins%60?' '+(mins%60)+'m':'');
    const days=Math.round(mins/1440);
    return 'In '+days+(days===1?' day':' days');
  }
  function yourTime(s){
    if(new Date(s.start).getTimezoneOffset()===-330)return '';
    return ' ('+new Date(s.start).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}).replace(/\s/g,' ')+' your time)';
  }
  function message(s,now){
    const at=fullDate(s)+' at '+clock(s.mins)+' IST';
    if(s.g.online)return 'Hello AJM Family, please send me the Zoom link for '+s.g.title+(s.start<=now?', which is happening now.':' on '+at+'.');
    return 'Hello AJM Family, I would like to join '+s.g.title+' in Indore on '+at+'. Please share the exact venue and landmark.';
  }
  function setSky(now){
    const d=new Date(now+IST),t=d.getUTCHours()*60+d.getUTCMinutes();
    hero.dataset.sky=t<5*60||t>=19*60+30?'night':t<8*60+30?'dawn':t<17*60?'day':'dusk';
  }
  function showRail(list,now){
    const seen=new Set(),stops=list.filter(s=>!seen.has(s.g.title)&&seen.add(s.g.title)),keys=stops.map(s=>s.key).join('|');
    if(keys!==railKeys){
      railKeys=keys;
      rail.textContent='';
      stops.forEach(s=>{
        const li=document.createElement('li'),b=document.createElement('button'),t=document.createElement('b'),n=document.createElement('span');
        b.type='button';b.className='door-stop';b.dataset.key=s.key;
        t.textContent=dayLabel(s)+' · '+clock(s.mins);n.textContent=s.g.title;
        b.append(t,n);li.append(b);rail.append(li);
        b.addEventListener('click',()=>{chosen=s.key;show();});
      });
      if(now<CONFERENCE_ENDS){
        const li=document.createElement('li'),a=document.createElement('a'),t=document.createElement('b'),n=document.createElement('span');
        a.className='door-stop';a.href='faith-conference.html';
        t.textContent='14, 15, 16 Jan 2027';n.textContent='Faith Conference, Indore';
        a.append(t,n);li.append(a);rail.append(li);
      }
    }
    rail.hidden=false;
  }
  function show(){
    const now=Date.now(),list=upcoming(now);
    setSky(now);
    if(!list.length)return;
    const s=list.find(x=>x.key===chosen)||list[0];
    showRail(list,now);
    rail.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.key===s.key)));
    when.lastChild.textContent=countdown(s,now);
    when.classList.toggle('is-now',s.start<=now);
    if(name.textContent!==s.g.title)name.textContent=s.g.title;
    const line=(s.start<=now?'Started at':dayLabel(s)+' at')+' '+clock(s.mins)+' IST'+yourTime(s)+' · '+s.g.where;
    if(detail.textContent!==line)detail.textContent=line;
    ctaText.textContent=s.g.online?'Get the Zoom link':'Ask for the venue';
    cta.href=WA+encodeURIComponent(message(s,now));
    cta.target='_blank';cta.rel='noopener';
  }

  show();
  setInterval(show,20000);
  // On phones the moon button would sit on the timeline, so it waits until the timeline has scrolled away
  if('IntersectionObserver' in window)new IntersectionObserver(e=>document.body.classList.toggle('at-door',e[e.length-1].isIntersecting)).observe(rail);
  fetch('events.json').then(r=>r.ok?r.json():null).then(data=>{
    if(data&&Array.isArray(data.weekly)&&data.weekly.length){weekly=data.weekly;show();}
  }).catch(()=>{});
})();

// Scatters gold bokeh, confetti and sparkles inside any element with data-bokeh="<count>".
// Pieces cluster toward the edges/corners, like the anniversary flyer.
(function(){
  function rand(a,b){return a+Math.random()*(b-a)}
  function edge(v){return v<.5?Math.pow(v*2,2)/2:1-Math.pow((1-v)*2,2)/2}

  function fill(el,count){
    const frag=document.createDocumentFragment();
    for(let n=0;n<count;n++){
      const i=document.createElement('i');
      const roll=Math.random();
      const x=edge(Math.random())*100, y=edge(Math.random())*100;
      i.style.left=x+'%';
      i.style.top=y+'%';
      i.style.animationDelay=(-Math.random()*8)+'s';
      if(roll<.62){
        const size=rand(4,26);
        i.className='b';
        i.style.width=i.style.height=size+'px';
        if(size>16)i.style.filter='blur('+rand(1,3).toFixed(1)+'px)';
        i.style.animationDuration=rand(7,13).toFixed(1)+'s';
      }else if(roll<.82){
        i.className='c';
        i.style.width=rand(4,7).toFixed(1)+'px';
        i.style.height=rand(9,15).toFixed(1)+'px';
        i.style.setProperty('--r',rand(-70,70).toFixed(0)+'deg');
        i.style.animationDuration=rand(6,11).toFixed(1)+'s';
      }else{
        const size=rand(9,20);
        i.className='s';
        i.style.width=i.style.height=size+'px';
        i.style.animationDuration=rand(2.6,4.8).toFixed(1)+'s';
      }
      frag.appendChild(i);
    }
    el.appendChild(frag);
  }

  document.querySelectorAll('[data-bokeh]').forEach(function(el){
    fill(el,parseInt(el.getAttribute('data-bokeh'),10)||24);
  });
})();

// Gold confetti drifting down over the whole page, on every page.
(function(){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const cv=document.createElement('canvas');
  cv.className='confetti-fx';
  cv.setAttribute('aria-hidden','true');
  document.body.appendChild(cv);
  const ctx=cv.getContext('2d');
  const COLORS=['#fff3c2','#f9d878','#f2c25f','#e8a33d','#d0912a'];
  let W=0,H=0,pieces=[];

  function rand(a,b){return a+Math.random()*(b-a)}

  function make(y){
    return {
      x:rand(0,W), y:y,
      w:rand(5,10), h:rand(9,17),
      rot:rand(0,6.28), vr:rand(-.04,.04),
      flip:rand(0,6.28), vf:rand(.03,.09),
      vy:rand(.45,1.35), sway:rand(.3,1.1), ph:rand(0,6.28), vph:rand(.008,.02),
      c:COLORS[Math.floor(Math.random()*COLORS.length)],
      a:rand(.55,.95)
    };
  }

  function resize(){
    const dpr=Math.min(window.devicePixelRatio||1,2);
    W=window.innerWidth;H=window.innerHeight;
    cv.width=W*dpr;cv.height=H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const want=W<700?34:66;
    while(pieces.length<want)pieces.push(make(rand(-H,H)));
    pieces.length=want;
  }
  resize();
  window.addEventListener('resize',resize);

  function frame(){
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<pieces.length;i++){
      const p=pieces[i];
      p.y+=p.vy;p.ph+=p.vph;p.rot+=p.vr;p.flip+=p.vf;
      p.x+=Math.sin(p.ph)*p.sway;
      if(p.y>H+24){pieces[i]=make(-20);continue}
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot);
      ctx.scale(1,Math.cos(p.flip));
      ctx.globalAlpha=p.a;
      ctx.fillStyle=p.c;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

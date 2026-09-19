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

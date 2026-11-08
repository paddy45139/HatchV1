window.HatchRender = function(canvas,sim,view) {
  const ctx=canvas.getContext('2d');
  return function draw() {
    const v=view(),dpr=Math.min(devicePixelRatio||1,2),s=v.scale;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr);
    ctx.translate(v.x,v.y);ctx.scale(s,s);
    ctx.fillStyle='#F4F0E5';ctx.fillRect(0,0,512,512);
    const contour=()=>{ctx.beginPath();sim.nodes.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();};
    contour();ctx.fillStyle=sim.grab?'rgba(223,119,100,.19)':'rgba(223,119,100,.14)';ctx.fill();
    for(const p of sim.inhabitants) {
      ctx.beginPath();ctx.arc(p.x,p.y,6,0,Math.PI*2);ctx.fillStyle='#D5A737';ctx.fill();
      ctx.beginPath();ctx.arc(p.x+3.8*Math.cos(p.heading),p.y+3.8*Math.sin(p.heading),1.7,0,Math.PI*2);ctx.fillStyle='#FFF4CC';ctx.fill();
    }
    contour();ctx.lineWidth=2.25/s;ctx.strokeStyle='#24313A';ctx.lineJoin='round';ctx.stroke();
    const g=sim.grab;
    const p=g?{x:sim.nodes[g.hit.i].x*(1-g.hit.t)+sim.nodes[(g.hit.i+1)%24].x*g.hit.t,y:sim.nodes[g.hit.i].y*(1-g.hit.t)+sim.nodes[(g.hit.i+1)%24].y*g.hit.t}:sim.nodes[0];
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    ctx.beginPath();ctx.arc(p.x,p.y,(6+(g?1.5*(reduced?1:Math.min(g.age/.06,1)):0))/s,0,Math.PI*2);ctx.fillStyle=g?'#D5A737':'#24313A';ctx.fill();
  };
};

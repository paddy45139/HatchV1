window.HatchRender = function(canvas,sim,view) {
  const ctx=canvas.getContext('2d');
  let shadow=0,grip=0,last=performance.now(),previousTime=sim.time;
  const pressure=Array(24).fill(0);
  return function draw() {
    const v=view(),dpr=Math.min(devicePixelRatio||1,2),s=v.scale;
    const now=performance.now(),dt=Math.min((now-last)/1000,.1),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    last=now;
    if(sim.time<previousTime || sim.steps===0) {pressure.fill(0);shadow=0;grip=0;}
    previousTime=sim.time;
    const target=sim.grab?1:0;
    shadow=reduced?target:shadow+(target-shadow)*(1-Math.exp(-dt/(target?.08:.12)));
    grip=reduced?target:Math.min(target,grip+dt/.06);
    pressure.forEach((value,i)=>{const goal=Math.min(1,sim.pressure[i]/45);pressure[i]=reduced?goal:value+(goal-value)*(1-Math.exp(-dt/(goal>value?.03:.14)));});
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr);
    ctx.translate(v.x,v.y);ctx.scale(s,s);
    ctx.fillStyle='#F4F0E5';ctx.fillRect(0,0,512,512);
    const contour=()=>{ctx.beginPath();sim.nodes.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();};
    ctx.save();ctx.translate(0,(1+shadow*2)/s);ctx.shadowColor=`rgba(36,49,58,${.05+shadow*.09})`;ctx.shadowBlur=(3+shadow*5)*dpr;contour();ctx.fillStyle=`rgba(36,49,58,${.015+shadow*.025})`;ctx.fill();ctx.restore();
    contour();ctx.fillStyle=sim.grab?'rgba(223,119,100,.19)':'rgba(223,119,100,.14)';ctx.fill();
    for(const p of sim.inhabitants) {
      ctx.beginPath();ctx.arc(p.x,p.y,6,0,Math.PI*2);ctx.fillStyle='#D5A737';ctx.fill();
      ctx.beginPath();ctx.arc(p.x+3.8*Math.cos(p.heading),p.y+3.8*Math.sin(p.heading),1.7,0,Math.PI*2);ctx.fillStyle='#FFF4CC';ctx.fill();
    }
    contour();ctx.lineWidth=2.25/s;ctx.strokeStyle='#24313A';ctx.lineJoin='round';ctx.stroke();
    sim.nodes.forEach((p,i)=>{
      const q=sim.nodes[(i+1)%24],a=pressure[i],b=pressure[(i+1)%24];
      if(Math.max(a,b)<.005) return;
      const gradient=ctx.createLinearGradient(p.x,p.y,q.x,q.y);
      gradient.addColorStop(0,`rgba(213,167,55,${a*.9})`);gradient.addColorStop(1,`rgba(213,167,55,${b*.9})`);
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=gradient;ctx.lineWidth=3/s;ctx.stroke();
    });
    const g=sim.grab;
    const p=g?{x:sim.nodes[g.hit.i].x*(1-g.hit.t)+sim.nodes[(g.hit.i+1)%24].x*g.hit.t,y:sim.nodes[g.hit.i].y*(1-g.hit.t)+sim.nodes[(g.hit.i+1)%24].y*g.hit.t}:sim.nodes[0];
    ctx.beginPath();ctx.arc(p.x,p.y,(6+1.5*grip)/s,0,Math.PI*2);ctx.fillStyle=g?'#D5A737':'#24313A';ctx.fill();
  };
};

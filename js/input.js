window.HatchInput = function(canvas, sim, view, audio) {
  let active=null;
  const point=e=>{const r=canvas.getBoundingClientRect(),v=view();return {x:(e.clientX-r.left-v.x)/v.scale,y:(e.clientY-r.top-v.y)/v.scale};};
  function finish(cancel) {
    if(active===null) return;
    const id=active.id; active=null;
    const meaningful=sim.grab?.moved;
    if(cancel) sim.cancel(); else sim.release();
    if(!cancel && meaningful && sim.state==='SETTLING') audio?.release(); else audio?.update(null);
    if(canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }
  canvas.addEventListener('pointerdown',e=>{
    if(active || !e.isPrimary || e.button!==0 || sim.state==='PAUSED') return;
    const p=point(e),v=view(),hit=HatchSim.nearest(p,sim.nodes),bead=sim.nodes[0];
    if(hit.d*v.scale>24 && Math.hypot(p.x-bead.x,p.y-bead.y)*v.scale>22) return;
    active={id:e.pointerId,start:p,offset:{x:hit.x-p.x,y:hit.y-p.y}};
    sim.beginGrab(hit,v.scale); audio?.engage(); canvas.setPointerCapture(e.pointerId); e.preventDefault();
  });
  canvas.addEventListener('pointermove',e=>{
    if(!active || active.id!==e.pointerId || !sim.grab) return;
    const p=point(e),g=sim.grab,dx=p.x-active.start.x,dy=p.y-active.start.y,d=Math.hypot(dx,dy),scale=g.scale;
    if(d*scale>=4) g.moved=true;
    if(!g.moved) return;
    const f=Math.min(1,90/(scale*(d||1)));
    g.target={x:active.start.x+dx*f+active.offset.x,y:active.start.y+dy*f+active.offset.y};
  });
  canvas.addEventListener('pointerup',e=>{if(active?.id===e.pointerId) finish(false);});
  canvas.addEventListener('pointercancel',e=>{if(active?.id===e.pointerId) finish(true);});
  canvas.addEventListener('lostpointercapture',e=>{if(active?.id===e.pointerId) finish(true);});
  window.addEventListener('keydown',e=>{if(e.key==='Escape') finish(true);});
  return {cancel:()=>finish(true)};
};

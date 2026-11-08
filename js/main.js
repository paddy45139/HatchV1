(() => {
  const canvas=document.querySelector('canvas'),sim=new HatchSim.Simulation();
  let transform={scale:1,x:0,y:0},last=null,accumulator=0,manual=false;
  const view=()=>transform;
  function resize() {
    const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),scale=Math.min(r.width,r.height)/512;
    canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);
    transform={scale,x:(r.width-512*scale)/2,y:(r.height-512*scale)/2};
  }
  const audio=HatchAudio(),input=HatchInput(canvas,sim,view,audio),draw=HatchRender(canvas,sim,view);
  document.addEventListener('pointerdown',audio.gesture,{once:true,capture:true});
  document.addEventListener('keydown',audio.gesture,{once:true,capture:true});
  document.querySelector('#sound').addEventListener('click',e=>{const enabled=audio.toggle();e.currentTarget.setAttribute('aria-pressed',String(enabled));e.currentTarget.textContent=enabled?'Sound on':'Sound off';});
  let resume='LIVE';
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) {input.cancel();resume=sim.state;sim.state='PAUSED';}
    else if(sim.state==='PAUSED') sim.state=resume;
    last=null;accumulator=0;
  });
  document.querySelector('#reset').addEventListener('click',()=>{input.cancel();sim.reset();if(document.hidden)sim.state='PAUSED';last=null;accumulator=0;});
  window.addEventListener('resize',resize);resize();
  function frame(now) {
    if(!manual && sim.state!=='PAUSED' && last!==null) {
      accumulator+=Math.min((now-last)/1000,HatchSim.DT*8);
      let steps=0;while(accumulator>=HatchSim.DT && steps++<8){sim.step();accumulator-=HatchSim.DT;}
    }
    last=now;audio.update(sim.state==='PAUSED'?null:sim.grab);draw();requestAnimationFrame(frame);
  }
  window.__hatch={sim,view,draw,input,setManual(value){manual=value;last=null;accumulator=0;},advance(seconds){for(let i=0;i<Math.round(seconds/HatchSim.DT);i++)sim.step();draw();}};
  requestAnimationFrame(frame);
})();

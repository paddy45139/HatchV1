window.HatchAudio = function() {
  let context=null,master=null,friction=null,enabled=true,attempted=false;
  function initialize() {
    if(attempted) return;
    attempted=true;
    try {
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio) return;
      context=new Audio();master=context.createGain();master.gain.value=enabled?.12:0;master.connect(context.destination);
      const buffer=context.createBuffer(1,context.sampleRate,context.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
      const source=context.createBufferSource(),filter=context.createBiquadFilter();
      source.buffer=buffer;source.loop=true;filter.type='bandpass';filter.frequency.value=850;filter.Q.value=.6;
      friction=context.createGain();friction.gain.value=0;
      source.connect(filter);filter.connect(friction);friction.connect(master);source.start();
    } catch { context=null;master=null;friction=null; }
  }
  function gesture() {
    initialize();
    try { if(context?.state==='suspended') context.resume().catch(()=>{}); } catch {}
  }
  function engage() {
    gesture();if(!context||!master||!enabled) return;
    try {
      const now=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
      const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.025),context.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*(1-i/data.length);
      source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1600;
      gain.gain.setValueAtTime(.22,now);gain.gain.exponentialRampToValueAtTime(.001,now+.025);
      source.connect(filter);filter.connect(gain);gain.connect(master);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();
    } catch {}
  }
  function update(grab) {
    if(!context||!friction) return;
    try {friction.gain.setTargetAtTime(enabled&&grab?Math.min(.16,(grab.deformationSpeed||0)*.0006):0,context.currentTime,.02);} catch {}
  }
  function release() {
    update(null);if(!context||!master||!enabled) return;
    try {
      const now=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
      osc.type='sine';osc.frequency.setValueAtTime(180,now);osc.frequency.exponentialRampToValueAtTime(125,now+.09);
      gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.3,now+.008);gain.gain.exponentialRampToValueAtTime(.001,now+.09);
      osc.connect(gain);gain.connect(master);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(now);osc.stop(now+.095);
    } catch {}
  }
  return {gesture,engage,release,update,toggle(){gesture();enabled=!enabled;try {if(master)master.gain.setValueAtTime(enabled?.12:0,context.currentTime);} catch {} return enabled;}};
};

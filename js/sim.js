(() => {
  const N = 24, DT = 1 / 120, TAU = Math.PI * 2;
  const copy = value => JSON.parse(JSON.stringify(value));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cross = (a, b, c) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  function area(nodes) { return nodes.reduce((s,p,i) => { const q=nodes[(i+1)%N]; return s+p.x*q.y-p.y*q.x; },0)/2; }
  function nearest(p, nodes) {
    let best = { d: Infinity };
    nodes.forEach((a,i) => {
      const b=nodes[(i+1)%N], dx=b.x-a.x, dy=b.y-a.y;
      const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy),0,1);
      const x=a.x+t*dx, y=a.y+t*dy, d=Math.hypot(p.x-x,p.y-y);
      if(d<best.d) best={i,t,x,y,d,nx:-dy/Math.hypot(dx,dy),ny:dx/Math.hypot(dx,dy)};
    });
    return best;
  }
  function inside(p,nodes) {
    let yes=false;
    for(let i=0,j=N-1;i<N;j=i++) { const a=nodes[i],b=nodes[j]; if((a.y>p.y)!==(b.y>p.y) && p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) yes=!yes; }
    return yes;
  }
  function valid(nodes, minimum) {
    if(nodes.some(p=>!Number.isFinite(p.x+p.y+p.vx+p.vy)) || area(nodes)<minimum) return false;
    if(nodes.some((p,i)=>Math.hypot(p.x-nodes[(i+1)%N].x,p.y-nodes[(i+1)%N].y)<1e-6)) return false;
    for(let i=0;i<N;i++) for(let j=i+2;j<N;j++) {
      if(i===0 && j===N-1) continue;
      const a=nodes[i],b=nodes[(i+1)%N],c=nodes[j],d=nodes[(j+1)%N];
      const overlap=Math.max(a.x,b.x)>=Math.min(c.x,d.x) && Math.max(c.x,d.x)>=Math.min(a.x,b.x) && Math.max(a.y,b.y)>=Math.min(c.y,d.y) && Math.max(c.y,d.y)>=Math.min(a.y,b.y);
      if(overlap && cross(a,b,c)*cross(a,b,d)<=0 && cross(c,d,a)*cross(c,d,b)<=0) return false;
    }
    return true;
  }
  class Simulation {
    constructor() { this.initialize(); this.baseline=this.snapshot(); this.lastValid=this.snapshot(); }
    random() { this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0; return this.rng/4294967296; }
    initialize() {
      this.rng=45139; this.time=0; this.steps=0; this.recoveries=0; this.rejectedCommits=0; this.contactImpulse=0; this.state='LIVE'; this.settle=0; this.grab=null;
      this.nodes=Array.from({length:N},(_,i)=>{ const a=i*TAU/N, r=170+2*Math.sin(a*3); return {x:256+r*Math.cos(a),y:256+r*Math.sin(a),vx:0,vy:0}; });
      this.preferred=this.nodes.map(p=>({x:p.x-256,y:p.y-256}));
      this.lengths=this.nodes.map((p,i)=>Math.hypot(p.x-this.nodes[(i+1)%N].x,p.y-this.nodes[(i+1)%N].y));
      this.bending=this.restBending(this.preferred);
      this.initialArea=area(this.nodes);
      this.inhabitants=Array.from({length:N},(_,i)=>{const a=i*TAU/N+.02*this.random(), r=i%3===0?161:55+75*this.random(), h=a+(this.random()-.5)*.8; return {x:256+r*Math.cos(a),y:256+r*Math.sin(a),vx:35*Math.cos(h),vy:35*Math.sin(h),heading:h};});
    }
    snapshot() { return copy({nodes:this.nodes,preferred:this.preferred,lengths:this.lengths,bending:this.bending,inhabitants:this.inhabitants,rng:this.rng,time:this.time,steps:this.steps,recoveries:this.recoveries,rejectedCommits:this.rejectedCommits,contactImpulse:this.contactImpulse,state:this.state,settle:this.settle,initialArea:this.initialArea}); }
    restore(snapshot) { Object.assign(this,copy(snapshot)); this.grab=null; this.lastValid=this.snapshot(); }
    reset() { this.restore(this.baseline); }
    beginGrab(hit,scale) {
      const before=this.snapshot(), center=this.center();
      const index=(hit.i+(hit.t>.5?1:0))%N;
      this.grab={before,index,hit,scale,center,anchor:this.nodes.map(p=>({x:p.x,y:p.y})),target:{x:hit.x,y:hit.y},follow:{x:hit.x,y:hit.y},age:0,moved:false};
      this.state='GRABBING';
    }
    cancel() { if(this.grab) this.restore(this.grab.before); }
    restBending(shape) { return shape.map((p,i)=>({x:(shape[(i+N-1)%N].x+shape[(i+1)%N].x)/2-p.x,y:(shape[(i+N-1)%N].y+shape[(i+1)%N].y)/2-p.y})); }
    commitContour() {
      if(!valid(this.nodes,this.initialArea*.45)) {
        const rejected=this.rejectedCommits+1;
        this.cancel();this.rejectedCommits=rejected;
        return false;
      }
      const center=this.center();
      this.preferred=this.nodes.map(p=>({x:p.x-center.x,y:p.y-center.y}));
      this.lengths=this.nodes.map((p,i)=>Math.hypot(p.x-this.nodes[(i+1)%N].x,p.y-this.nodes[(i+1)%N].y));
      this.bending=this.restBending(this.preferred);
      return true;
    }
    release() { if(!this.grab) return; if(!this.grab.moved) { this.cancel(); return; } if(!this.commitContour()) return; this.grab=null; this.state='SETTLING'; this.settle=.2; this.lastValid=this.snapshot(); }
    center() { return this.nodes.reduce((c,p)=>({x:c.x+p.x/N,y:c.y+p.y/N}),{x:0,y:0}); }
    alignment() {
      const center=this.center();let dot=0,det=0;
      this.nodes.forEach((p,i)=>{const r=this.preferred[i],x=p.x-center.x,y=p.y-center.y;dot+=r.x*x+r.y*y;det+=r.x*y-r.y*x;});
      return {center,angle:Math.atan2(det,dot)};
    }
    restorationForces() {
      const {center,angle}=this.alignment(),c=Math.cos(angle),s=Math.sin(angle);
      return this.nodes.map((p,i)=>{const r=this.preferred[i];return {x:4*(center.x+r.x*c-r.y*s-p.x),y:4*(center.y+r.x*s+r.y*c-p.y)};});
    }
    step(dt=DT) {
      if(this.state==='PAUSED') return;
      const previous=this.snapshot(), all=[...this.nodes,...this.inhabitants], old=all.map(p=>({x:p.x,y:p.y}));
      this.contactImpulse=0;
      for(const p of this.inhabitants) {
        const edge=nearest(p,this.nodes);
        if(edge.d<14) {
          const tangent=Math.atan2(-edge.nx,edge.ny), other=tangent+Math.PI;
          const diff=a=>Math.atan2(Math.sin(a-p.heading),Math.cos(a-p.heading));
          const turn=Math.abs(diff(tangent))<=Math.abs(diff(other))?diff(tangent):diff(other);
          p.heading+=clamp(turn,-2.5*dt,2.5*dt);
        }
        const f=1-Math.exp(-dt/.15);
        p.vx+=(35*Math.cos(p.heading)-p.vx)*f; p.vy+=(35*Math.sin(p.heading)-p.vy)*f;
      }
      const {angle}=this.alignment(),forces=this.grab?null:this.restorationForces();
      this.nodes.forEach((p,i)=>{
        p.vx*=Math.exp(-dt*3); p.vy*=Math.exp(-dt*3);
        if(forces) {p.vx+=forces[i].x*.5*dt;p.vy+=forces[i].y*.5*dt;}
      });
      if(this.grab) {const g=this.grab,f=1-Math.exp(-dt/.015);g.age+=dt;g.follow.x+=(g.target.x-g.follow.x)*f;g.follow.y+=(g.target.y-g.follow.y)*f;}
      all.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;});
      for(let iteration=0;iteration<4;iteration++) {
        this.nodes.forEach((p,i)=>{const q=this.nodes[(i+1)%N],dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||1,c=(d-this.lengths[i])/d*.45;p.x+=dx*c;p.y+=dy*c;q.x-=dx*c;q.y-=dy*c;});
        const bend=this.nodes.map((p,i)=>{const a=this.nodes[(i+N-1)%N],b=this.nodes[(i+1)%N],r=this.bending[i];return {x:((a.x+b.x)/2-p.x-r.x*Math.cos(angle)+r.y*Math.sin(angle))*.008,y:((a.y+b.y)/2-p.y-r.x*Math.sin(angle)-r.y*Math.cos(angle))*.008};});
        this.nodes.forEach((p,i)=>{p.x+=bend[i].x;p.y+=bend[i].y;});
        for(let i=0;i<N;i++) for(let j=i+1;j<N;j++) {const a=this.inhabitants[i],b=this.inhabitants[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<12){const nx=d?dx/d:1,ny=d?dy/d:0,c=(12-d)/2;a.x-=nx*c;a.y-=ny*c;b.x+=nx*c;b.y+=ny*c;this.contactImpulse+=c/dt;}}
        for(const p of this.inhabitants) {
          const e=nearest(p,this.nodes), contained=inside(p,this.nodes), depth=contained?6-e.d:6+e.d;
          if(depth>0) {const a=this.nodes[e.i],b=this.nodes[(e.i+1)%N],wa=1-e.t,wb=e.t,den=1+.5*(wa*wa+wb*wb),c=depth/den;p.x+=e.nx*c;p.y+=e.ny*c;a.x-=e.nx*c*.5*wa;a.y-=e.ny*c*.5*wa;b.x-=e.nx*c*.5*wb;b.y-=e.ny*c*.5*wb;this.contactImpulse+=c/dt;}
        }
        if(this.grab) {
          const g=this.grab,dx=g.follow.x-g.hit.x,dy=g.follow.y-g.hit.y;
          for(let k=-2;k<=2;k++){const i=(g.index+k+N)%N,p=this.nodes[i],w=[1,.5,.15][Math.abs(k)];p.x+=(g.anchor[i].x+dx-p.x)*w*.65;p.y+=(g.anchor[i].y+dy-p.y)*w*.65;}
          const c=this.center();let dot=0,det=0;this.nodes.forEach((p,i)=>{const a=g.anchor[i];dot+=(a.x-g.center.x)*(p.x-c.x)+(a.y-g.center.y)*(p.y-c.y);det+=(a.x-g.center.x)*(p.y-c.y)-(a.y-g.center.y)*(p.x-c.x);});const angle=-Math.atan2(det,dot),co=Math.cos(angle),si=Math.sin(angle);this.nodes.forEach(p=>{const x=p.x-c.x,y=p.y-c.y;p.x=g.center.x+x*co-y*si;p.y=g.center.y+x*si+y*co;});
        }
        this.nodes.forEach(p=>{p.x=clamp(p.x,3,509);p.y=clamp(p.y,3,509);});
        const deficit=this.initialArea*.46-area(this.nodes);
        if(deficit>0) {
          const gradients=this.nodes.map((p,i)=>({x:(this.nodes[(i+1)%N].y-this.nodes[(i+N-1)%N].y)/2,y:(this.nodes[(i+N-1)%N].x-this.nodes[(i+1)%N].x)/2}));
          const magnitude=gradients.reduce((sum,g)=>sum+g.x*g.x+g.y*g.y,0);
          if(magnitude>0) this.nodes.forEach((p,i)=>{p.x=clamp(p.x+gradients[i].x*deficit/magnitude,3,509);p.y=clamp(p.y+gradients[i].y*deficit/magnitude,3,509);});
        }
      }
      for(const p of this.inhabitants) {const e=nearest(p,this.nodes);if(!inside(p,this.nodes)||e.d<6){p.x=e.x+e.nx*6.001;p.y=e.y+e.ny*6.001;}}
      all.forEach((p,i)=>{p.vx=clamp((p.x-old[i].x)/dt,-180,180);p.vy=clamp((p.y-old[i].y)/dt,-180,180);});
      if(!valid(this.nodes,this.initialArea*.45)||this.inhabitants.some(p=>!Number.isFinite(p.x+p.y+p.vx+p.vy+p.heading)||!inside(p,this.nodes))) {
        const g=this.grab,count=this.recoveries+1;this.restore(this.lastValid||previous);this.grab=g;this.state=previous.state;this.recoveries=count;[...this.nodes,...this.inhabitants].forEach(p=>{p.vx*=.2;p.vy*=.2;});return;
      }
      this.time+=dt;this.steps++;
      if(this.state==='SETTLING' && (this.settle-=dt)<=0){this.state='LIVE';this.settle=0;}
      this.lastValid=this.snapshot();
    }
  }
  window.HatchSim={Simulation,nearest,inside,valid,DT};
})();

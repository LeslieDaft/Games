/* Out of Credits — lightweight, self-contained canvas lab. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const C = { ink:'#0b1418', deep:'#111f25', panel:'#1b3037', edge:'#31494d', mint:'#b8f579', green:'#62dba7', orange:'#ffa16b', blue:'#80b8d0', muted:'#7f9797' };

  class CreditScene {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.state = {stage:0,hardware:[],agents:[],personality:'speedster',projects:0,generation:1,reducedMotion:false};
      this.particles = [];
      this.flash = 0;
      this.frame = 0;
      this.last = 0;
      this.destroyed = false;
      this.width = 720;
      this.height = 400;
      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      this.visibility = () => {
        cancelAnimationFrame(this.frame);
        this.frame = 0;
        this.last = 0;
        if (!document.hidden && !this.destroyed) this.frame = requestAnimationFrame(this.tick);
      };
      this.observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(this.resize) : null;
      if (this.observer) this.observer.observe(canvas);
      else window.addEventListener('resize', this.resize);
      document.addEventListener('visibilitychange', this.visibility);
      this.resize();
      if (!document.hidden) this.frame = requestAnimationFrame(this.tick);
    }
    setState(state) {
      Object.assign(this.state, state || {});
      this.state.stage = Math.max(0, Math.min(7, Number(this.state.stage) || 0));
      if (!this.destroyed && !document.hidden) this.draw(performance.now() / 1000);
    }
    resize() {
      if (this.destroyed) return;
      const b = this.canvas.getBoundingClientRect();
      this.width = Math.max(1, b.width || 640);
      this.height = Math.max(1, b.height || 330);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);
      this.dpr = dpr;
      if (!document.hidden) this.draw(performance.now() / 1000);
    }
    burst(amount) {
      if (this.destroyed) return;
      this.flash = 1;
      if (this.state.reducedMotion || document.hidden) return;
      const n = Math.min(9, 4 + Math.floor(Math.log10(Math.max(1, Number(amount) || 1))));
      for (let i = 0; i < n && this.particles.length < 32; i++) {
        this.particles.push({x:432 + Math.random()*30,y:219,vx:(Math.random()-.5)*170,vy:-95-Math.random()*80,life:1,rotation:Math.random()*TAU});
      }
    }
    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.frame);
      if (this.observer) this.observer.disconnect();
      else window.removeEventListener('resize', this.resize);
      document.removeEventListener('visibilitychange', this.visibility);
      this.particles.length = 0;
    }
    tick(ms) {
      this.frame = 0;
      if (this.destroyed || document.hidden) return;
      if (ms - this.last >= 1000/30) {
        const dt = this.last ? Math.min((ms-this.last)/1000, .08) : 1/30;
        this.last = ms;
        this.flash = Math.max(0, this.flash-dt*2.5);
        for (let i=this.particles.length-1;i>=0;i--) {
          const p=this.particles[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=210*dt; p.life-=dt*1.2; p.rotation+=dt*2;
          if(p.life<=0) this.particles.splice(i,1);
        }
        this.draw(this.state.reducedMotion ? 0 : ms/1000);
      }
      this.frame = requestAnimationFrame(this.tick);
    }
    rect(x,y,w,h,r,fill,stroke) {
      const c=this.ctx; r=Math.min(r,w/2,h/2);
      c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath();
      if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}
    }
    line(points,color,width=1) {
      const c=this.ctx; c.beginPath(); c.moveTo(points[0][0],points[0][1]); for(let i=1;i<points.length;i++) c.lineTo(points[i][0],points[i][1]); c.strokeStyle=color;c.lineWidth=width;c.stroke();
    }
    poly(points,fill,stroke) {
      const c=this.ctx;c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
    }
    ellipse(x,y,rx,ry,fill) {const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill();}
    label(text,x,y,size,color,weight=600) {const c=this.ctx;c.font=weight+' '+size+'px ui-monospace, SFMono-Regular, Consolas, monospace';c.fillStyle=color;c.fillText(text,x,y);}
    coin(x,y,r,alpha=1,rotation=0) {
      const c=this.ctx;c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(rotation);
      this.ellipse(0,0,r,r,C.mint);this.ellipse(0,0,r*.73,r*.73,'#83b951');
      c.strokeStyle='#d4ff9b';c.lineWidth=Math.max(1,r*.12);c.beginPath();c.arc(0,0,r*.68,0,TAU);c.stroke();
      this.label('C',-r*.35,r*.37,r*1.05,C.ink,800);c.restore();
    }
    rack(x,y,h,t,i) {
      this.ellipse(x+29,y+5,36,10,'#081315');
      this.poly([[x+57,y-h],[x+71,y-h-8],[x+71,y-7],[x+57,y+2]],'#102126',C.edge);
      this.poly([[x,y-h],[x+14,y-h-8],[x+71,y-h-8],[x+57,y-h]],'#37514f',C.edge);
      this.rect(x,y-h,58,h,6,C.panel,C.edge);
      const rows=Math.floor((h-13)/23);
      for(let j=0;j<rows;j++){
        const sy=y-h+10+j*23;this.rect(x+7,sy,44,17,3,C.deep,'#263f43');
        this.rect(x+13,sy+5,18,2,1,'#496164');this.rect(x+13,sy+10,13,2,1,'#31474c');
        this.ellipse(x+42,sy+8,2.3,2.3,Math.sin(t*2+j+i)>.4?C.orange:C.mint);
      }
      this.rect(x+9,y-8,9,4,1,'#0b171b');this.rect(x+39,y-8,9,4,1,'#0b171b');
    }
    bot(x,y,scale,t,small=false) {
      const c=this.ctx;c.save();c.translate(x,y);c.scale(scale,scale);
      const bob = this.state.reducedMotion?0:Math.sin(t*2.4)*2.3;
      this.ellipse(0,4,45,12,'#071419');
      c.translate(0,bob);
      this.rect(-27,-12,20,20,6,'#405951',C.edge);this.rect(8,-12,20,20,6,'#405951',C.edge);
      this.rect(-35,-67,70,59,16,'#8fa99a','#c1d0ae');
      this.rect(-27,-60,54,37,10,'#203935','#537f65');
      this.ellipse(0,-43,11,11,'#5b8750');
      this.ellipse(0,-43,6+this.flash*2,6+this.flash*2,C.mint);
      this.line([[-37,-61],[-48,-48],[-46,-29]],'#91aa99',11);
      this.line([[36,-61],[47,-47],[47,-31]],'#91aa99',11);
      this.ellipse(-46,-27,7,7,'#c6d5ae');this.ellipse(47,-29,7,7,'#c6d5ae');
      this.rect(-45,-129,90,69,19,'#b9caaa','#deead0');
      this.rect(-51,-108,8,25,4,'#78958a');this.rect(44,-108,8,25,4,'#78958a');
      this.rect(-36,-116,72,38,11,'#13282b','#6f9284');
      const blink = !this.state.reducedMotion && Math.sin(t*.83)>0.998;
      const eyeH=blink?2:12;
      this.rect(-23,-104,12,eyeH,4,C.mint);this.rect(11,-104,12,eyeH,4,C.mint);
      this.line([[-6,-91],[0,-88],[6,-91]],C.green,2);
      this.line([[0,-130],[0,-146]],'#90b197',3);
      this.ellipse(0,-149,5,5,C.orange);
      if(!small){this.rect(-18,-71,36,8,4,'#6b8974');this.rect(-11,-19,22,3,1,'#49664e');}
      c.restore();
    }
    laptop(x,y,t,stage) {
      const c=this.ctx;
      this.ellipse(x+66,y+16,105,19,'#081417');
      // Chunky desk, angled top and warm maple front edge.
      this.poly([[x-44,y-32],[x+118,y-32],[x+148,y-10],[x-16,y-10]],'#647061','#86967a');
      this.poly([[x-16,y-10],[x+148,y-10],[x+148,y],[x-16,y]],'#8c8a66');
      this.line([[x-6,y],[x-6,y+44]],'#55615a',9);this.line([[x+129,y],[x+129,y+39]],'#55615a',9);
      this.rect(x,y-125,108,80,7,'#9ba993','#c3cfac');
      this.rect(x+7,y-118,94,65,4,'#102a2c');
      // The tiny AI in the screen.
      this.rect(x+39,y-106,29,25,6,'#25473e',C.green);
      this.rect(x+45,y-98,4,6,1,C.mint);this.rect(x+58,y-98,4,6,1,C.mint);
      this.line([[x+49,y-87],[x+55,y-87]],C.green,1);
      this.rect(x+18,y-72,72,3,1,'#31554b');
      this.rect(x+18,y-72,20+(Math.sin(t*.8)*.5+.5)*49,3,1,C.green);
      this.poly([[x,y-44],[x+108,y-44],[x+125,y-26],[x-15,y-26]],'#849888','#c2cead');
      for(let i=0;i<3;i++) this.line([[x+4-i*4,y-40+i*4],[x+102+i*4,y-40+i*4]],'#465f54',1);
      this.rect(x+43,y-30,24,2,1,'#4c6a5a');
      // Cup and pencil.
      this.rect(x+115,y-54,18,22,3,'#d69765');
      c.beginPath();c.arc(x+136,y-45,6,-Math.PI/2,Math.PI/2);c.strokeStyle='#d69765';c.lineWidth=3;c.stroke();
      if(stage>0){this.rect(x-52,y-81,34,48,5,C.deep,C.edge);for(let j=0;j<2;j++){this.ellipse(x-35,y-66+j*19,9,9,'#263e3c');this.ellipse(x-35,y-66+j*19,4,4,C.green);}}
    }
    draw(t) {
      if(!this.ctx || this.destroyed) return;
      const c=this.ctx;
      c.setTransform(this.dpr,0,0,this.dpr,0,0);
      c.fillStyle=C.ink;c.fillRect(0,0,this.width,this.height);
      const scale=Math.min(this.width/720,this.height/400);
      c.translate((this.width-720*scale)/2,(this.height-400*scale)/2);c.scale(scale,scale);
      c.lineCap='round';c.lineJoin='round';
      const stage=this.state.stage;
      const glow=c.createRadialGradient(386,168,25,386,168,320);glow.addColorStop(0,'#1a3834');glow.addColorStop(1,C.ink);c.fillStyle=glow;c.fillRect(0,0,720,400);
      // Back wall, architectural linework and soft overhead light.
      this.line([[26,250],[26,61],[692,61],[692,250]],'#203135',1);
      this.line([[45,244],[45,78],[675,78],[675,244]],'#15262c',1);
      this.rect(251,60,216,3,1,'#679076');this.rect(282,63,152,2,1,'#b5d095');
      // Floor grid uses one vanishing point, keeping the scene quiet and readable.
      this.poly([[26,250],[358,199],[694,251],[694,386],[26,386]],'#112126');
      for(let i=0;i<13;i++){const x=-300+i*110;this.line([[358+(x-358)*.3,230],[x,400]],'#203236',1);}
      for(let i=0;i<6;i++){let yy=244+i*i*5.5;this.line([[26,yy],[694,yy]],'#203236',1);}
      this.line([[26,250],[26,385],[694,385],[694,251]],'#32413f',1);
      // Wall display evolves into an orbital window.
      this.rect(491,97,150,88,9,'#0b1d23','#314a4c');
      if(stage<5){
        this.label(stage<2?'LOCAL COMPUTE':'CLUSTER ONLINE',505,117,8,C.muted,600);
        for(let i=0;i<11;i++){let h=9+((i*7+stage*5)%30)+Math.sin(t*1.2+i)*3;this.rect(507+i*11,169-h,6,h,2,i>7?C.orange:C.green);}
        this.line([[505,172],[628,172]],'#36504a',1);
      }else{
        for(let i=0;i<15;i++)this.ellipse(504+(i*29)%125,108+(i*17)%64,i%3===0?1.5:.8,i%3===0?1.5:.8,'#91b7b4');
        this.ellipse(564,144,26,26,stage>6?'#a4e16b':'#507895');
        c.save();c.translate(564,144);c.rotate(-.35);c.beginPath();c.ellipse(0,0,49,10,0,0,TAU);c.strokeStyle=stage>6?C.orange:'#83c9ad';c.lineWidth=2;c.stroke();c.restore();
        this.ellipse(564+Math.cos(t*.3)*48,144+Math.sin(t*.3)*16,4,4,C.mint);
      }
      // Cables with subtle travelling packets.
      this.line([[319,280],[377,306],[529,279],[576,291]],'#355c51',3);
      if(!this.state.reducedMotion){let d=(t*.22)%1;this.ellipse(377+152*d,306-27*d,2.5,2.5,C.mint);}
      if(stage>=1)this.rack(102,257,stage<3?79:122,t,0);
      if(stage>=2)this.rack(559,279,110,t,1);
      if(stage>=3)this.rack(175,245,140,t,2);
      if(stage>=4)this.rack(625,313,149,t,3);
      if(stage>=5)this.rack(50,292,157,t,4);
      // A small plant keeps the starter room friendly.
      this.rect(616,245,22,28,3,'#b47f5b');
      this.line([[627,245],[627,213]],'#65a484',3);
      this.ellipse(617,221,11,5,'#4b846c');this.ellipse(637,216,11,5,'#74ab80');this.ellipse(621,233,10,4,'#76a976');
      this.laptop(279,275,t,stage);
      this.bot(466,316,stage>=6?1.02:.93,t);
      // Completed projects become actual objects on the wall shelf.
      if(Number(this.state.projects)>0){
        this.rect(282,154,140,5,2,'#738a70');
        const projects=Math.min(5,Number(this.state.projects)||0);
        for(let i=0;i<projects;i++){
          this.rect(290+i*25,134-(i%2)*6,17,20+(i%2)*6,3,[C.orange,C.green,C.blue,C.mint,'#a68ad0'][i]);
          this.rect(294+i*25,139-(i%2)*6,9,2,1,'#263c38');
        }
      }
      const agents=Array.isArray(this.state.agents)?this.state.agents.reduce((sum,n)=>sum+(Number(n)||0),0):Number(this.state.agents)||0;
      const count=Math.min(4,agents);
      for(let i=0;i<count;i++){
        const wave=this.state.reducedMotion?0:Math.sin(t*.38+i*2)*24;
        this.bot(124+i*151+wave,351+(i%2)*13,.29,t+i*1.4,true);
      }
      // In-scene terminal label.
      this.rect(282,335,137,26,7,'#142b2b','#365445');
      this.ellipse(294,348,3,3,C.mint);
      this.label(['IDEA → REALITY','GPU POWERED','AGENTS AT WORK','RACK & ROLL','SCALE EVERYTHING','PLANETARY COMPUTE','BEYOND THE CLOUD','STELLAR INTELLIGENCE'][stage],304,351,7.2,'#a4c697',600);
      for(const p of this.particles)this.coin(p.x,p.y,8,Math.min(1,p.life*2),p.rotation);
      if(this.flash>0){c.save();c.globalAlpha=this.flash*.12;this.ellipse(466,237,59,59,C.mint);c.restore();}
    }
  }
  window.CreditScene=CreditScene;
})();

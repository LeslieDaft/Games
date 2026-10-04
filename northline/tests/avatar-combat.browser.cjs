// Optional browser regression: NODE_PATH=/path/to/node_modules CHROMIUM_PATH=/path/to/chromium node tests/avatar-combat.browser.cjs
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const server=spawn(process.execPath,[path.resolve(__dirname,'../server/server.mjs')],{env:{...process.env,PORT:'18788'}});
 let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader']});
  const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Advance real game frames explicitly, independent of software-rendering speed.
  await page.addInitScript(()=>{window.requestAnimationFrame=fn=>{window.testFrame=fn;return 1;};});
  await page.goto('http://127.0.0.1:18788');
  await page.waitForFunction(()=>window.__battle,null,{polling:100});
  const sizes=await page.evaluate(async()=>{
   const T=await import('/assets/three.module.js');
   document.getElementById('bot-count').value=4;window.__battle.solo();window.__battle.tick(.05);
   const actors=window.__preview.scene.children.filter(g=>{let found=false;g.traverse(o=>{if(o.isSkinnedMesh)found=true;});return found;});
   return actors.map(g=>{g.updateMatrixWorld(true);return new T.Box3().setFromObject(g,true).getSize(new T.Vector3()).y;});
  });
  assert.equal(sizes.length,6);for(const h of sizes)assert.ok(h>1.6&&h<2.1,`Actor height ${h} is not human-sized`);
  await page.evaluate(()=>{
   const b=window.__battle,s=b.sim,me=s.players.get(b.id),target=s.players.get('bot0');
   for(const p of [...s.players.values()])if(p.id!==me.id&&p.id!==target.id)s.removePlayer(p.id);
   let found=false;
   for(let x=-100;x<100&&!found;x+=10)for(let z=-100;z<100&&!found;z+=10){
    if(s.height(x,z)<.01&&s.height(x,z-10)<.01&&!s.blocked(x,z)&&!s.blocked(x,z-10)&&s.lineClear({x,y:1.68,z},{x,y:1.68,z:z-10})){
     Object.assign(me,{x,y:0,z,yaw:0,pitch:0});Object.assign(target,{x,y:0,z:z-10,bot:false,input:{},spawnUntil:0,hp:100});
     window.__preview.teleport(x,z);found=true;
    }
   }
   if(!found)throw Error('No clear firing lane on the production map');
   b.accept(s.snapshot());b.tick(.05);window.__preview.step(.05);
  });
  await page.keyboard.down('KeyZ');await page.keyboard.down('KeyX');
  await page.evaluate(()=>{window.__preview.step(.1);window.__battle.tick(.1);});
  await page.keyboard.up('KeyX');await page.keyboard.up('KeyZ');
  const shot=await page.evaluate(()=>({hp:window.__battle.sim.players.get('bot0').hp,rounds:window.__preview.getState().loadedMagazine.rounds,hit:document.getElementById('hit-marker').classList.contains('show')}));
  assert.ok(shot.hp<100,`Aimed shot did not damage the visible target: ${JSON.stringify(shot)}`);
  assert.equal(shot.rounds,29);assert.equal(shot.hit,true);
  for(let i=0;i<3;i++){
   await page.keyboard.down('KeyX');await page.evaluate(()=>{window.__battle.tick(.1);window.__preview.step(.1);});await page.keyboard.up('KeyX');await page.evaluate(()=>window.__preview.step(.05));
  }
  const result=await page.evaluate(()=>({dead:window.__battle.sim.players.get('bot0').dead,kills:window.__battle.sim.players.get(window.__battle.id).kills}));
  assert.equal(result.dead,true);assert.equal(result.kills,1);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({pass:true,actorHeights:sizes,aimedShot:shot,result}));
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});

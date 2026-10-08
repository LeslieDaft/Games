const $=id=>document.getElementById(id),profiles=['low','balanced','high','ultra'];
let choice='low';try{const saved=localStorage.getItem('spider-graphics');if(profiles.includes(saved))choice=saved;}catch{}
$('launchQuality').value=$('quality').value=choice;
function choose(value){$('launchQuality').value=$('quality').value=value;try{localStorage.setItem('spider-graphics',value);}catch{}}
$('launchQuality').onchange=e=>choose(e.target.value);$('quality').onchange=e=>choose(e.target.value);
$('settingsBtn').onclick=()=>{$('pause').hidden=false;$('pauseTitle').textContent='Controls & settings';};$('resumeBtn').onclick=$('menuBtn').onclick=()=>{$('pause').hidden=true;};$('restartBtn').hidden=true;
let loading=false;
async function launch(mode){if(loading)return;loading=true;choose($('launchQuality').value);window.__spiderQuality=$('launchQuality').value;window.__spiderStartMode=mode;$('freeBtn').disabled=$('campaignBtn').disabled=true;$('launchQuality').disabled=true;$('loading').textContent=window.__spiderQuality==='low'?'Loading lightweight city…':'Loading detailed city and models…';
 try{await import('./game.js?v=school-1');await window.__spiderReady;$('restartBtn').hidden=false;document.body.classList.add('game-loaded');}
 catch(error){console.error(error);$('loading').textContent='Could not load. Reload and choose School computer.';$('reloadLow').hidden=false;}}
$('freeBtn').onclick=()=>launch('free');$('campaignBtn').onclick=()=>launch('campaign');$('reloadLow').onclick=()=>{choose('low');location.reload();};

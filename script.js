const table=document.getElementById('statsTable');
const saveBtn=document.getElementById('saveBtn');
const resetBtn=document.getElementById('resetBtn');
const matchNameInput=document.getElementById('matchName');
const matchDateInput=document.getElementById('matchDate');
const homeNameInput=document.getElementById('homeName');
const awayNameInput=document.getElementById('awayName');
const homeTimeEl=document.getElementById('homeTime');
const awayTimeEl=document.getElementById('awayTime');
const livePossessionEl=document.getElementById('livePossession');
const finalPossessionEl=document.getElementById('finalPossession');

function getRows(){return Array.from(table.querySelectorAll('tbody tr'));}
const homeKeys={'1':0,'2':1,'3':2,'4':3,'5':4};
const awayKeys={'6':0,'7':1,'8':2,'9':3,'0':4};
function isEditing(){const ae=document.activeElement;return ae&&(ae.tagName==='INPUT'||ae.isContentEditable);}
document.addEventListener('keydown',ev=>{
  if(isEditing())return;
  const k=ev.key;
  if(homeKeys[k]!=null)incrementCell('home',homeKeys[k]);
  else if(awayKeys[k]!=null)incrementCell('away',awayKeys[k]);
  else if(k==='q'||k==='Q')handleQPress();
});
function incrementCell(side,idx){
  const r=getRows();
  if(idx<0||idx>=r.length)return;
  const c=r[idx].querySelector('td.'+side);
  const v=parseInt(c.textContent)||0;
  c.textContent=v+1;
}

resetBtn.onclick=()=>{
  if(!confirm('Reset semua data & stopwatch?'))return;
  getRows().forEach(r=>{
    r.querySelector('.home').textContent='0';
    r.querySelector('.away').textContent='0';
  });
  resetStopwatch();
  finalPossessionEl.textContent='';
  livePossessionEl.textContent='0% - 0%';
};

saveBtn.onclick=saveCSV;
function saveCSV(){
  const matchName=matchNameInput.value||'Match';
  const dateVal=matchDateInput.value||new Date().toISOString().split('T')[0];
  const homeName=homeNameInput.value||'Home';
  const awayName=awayNameInput.value||'Away';
  const rows=getRows();
  const totalHome=Math.floor(homeElapsed/1000);
  const totalAway=Math.floor(awayElapsed/1000);
  const total=totalHome+totalAway;
  const homePct=total?((totalHome/total)*100).toFixed(1):0;
  const awayPct=total?((totalAway/total)*100).toFixed(1):0;

  let csv=`Match,${matchName},Date,${dateVal}\n`;
  csv+=`Aksi,${homeName},${awayName}\n`;
  rows.forEach(r=>{
    const aksi=r.cells[0].innerText.trim();
    const home=r.querySelector('.home').textContent.trim();
    const away=r.querySelector('.away').textContent.trim();
    csv+=`${aksi},${home},${away}\n`;
  });
  csv+=`Home Possession (s),${totalHome}\nAway Possession (s),${totalAway}\nBall Possession %,${homePct}%,${awayPct}%\n\n`;

  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='match_data.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

let homeElapsed=0,awayElapsed=0;
let active=null,startTime=null,lastQ=0,timer=null;
function updateDisplay(){
  homeTimeEl.textContent=formatTime(homeElapsed);
  awayTimeEl.textContent=formatTime(awayElapsed);
  updateLivePossession();
}
function formatTime(ms){
  const s=Math.floor(ms/1000);
  const m=Math.floor(s/60).toString().padStart(2,'0');
  const sec=(s%60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}
function handleQPress(){
  const now=Date.now();
  if(now-lastQ<400){stopAll();return;}
  lastQ=now;
  if(active===null)startHome();
  else if(active==='home')switchToAway();
  else if(active==='away')switchToHome();
}
function startHome(){active='home';startTime=Date.now();runTimer();}
function switchToAway(){stopTimer();const diff=Date.now()-startTime;if(active==='home')homeElapsed+=diff;active='away';startTime=Date.now();runTimer();}
function switchToHome(){stopTimer();const diff=Date.now()-startTime;if(active==='away')awayElapsed+=diff;active='home';startTime=Date.now();runTimer();}
function stopAll(){if(!active)return;stopTimer();const diff=Date.now()-startTime;if(active==='home')homeElapsed+=diff;else awayElapsed+=diff;active=null;updateDisplay();showFinalPossession();}
function resetStopwatch(){stopTimer();active=null;homeElapsed=0;awayElapsed=0;updateDisplay();}
function runTimer(){
  stopTimer();
  timer=setInterval(()=>{
    const diff=Date.now()-startTime;
    if(active==='home')homeTimeEl.textContent=formatTime(homeElapsed+diff);
    else if(active==='away')awayTimeEl.textContent=formatTime(awayElapsed+diff);
    updateLivePossession(diff);
  },200);
}
function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
function updateLivePossession(diff=0){
  const h=active==='home'?homeElapsed+diff:homeElapsed;
  const a=active==='away'?awayElapsed+diff:awayElapsed;
  const total=h+a;
  if(total<=0){livePossessionEl.textContent='0% - 0%';return;}
  const homePct=((h/total)*100).toFixed(1);
  const awayPct=((a/total)*100).toFixed(1);
  livePossessionEl.textContent=`${homePct}% - ${awayPct}%`;
}
function showFinalPossession(){
  const total=homeElapsed+awayElapsed;
  if(total<=0){finalPossessionEl.textContent='';return;}
  const homePct=((homeElapsed/total)*100).toFixed(1);
  const awayPct=((awayElapsed/total)*100).toFixed(1);
  finalPossessionEl.textContent=`Ball Possession Final: Home ${homePct}% — Away ${awayPct}%`;
}
(function(){const today=new Date().toISOString().split('T')[0];if(!matchDateInput.value)matchDateInput.value=today;})();

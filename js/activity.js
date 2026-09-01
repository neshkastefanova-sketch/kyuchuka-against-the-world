async function loadActivity(){
 const {data,error}=await sb.from('activities').select('*').eq('user_id',currentUser.id).maybeSingle();
 if(error){return} currentActivity=data||null; renderActivity();
}
function renderActivity(){
 const card=E('activityCard'); if(!currentActivity){card.classList.add('hidden');document.querySelectorAll('.zone,.fight-btn').forEach(b=>b.disabled=false);return}
 card.classList.remove('hidden'); const isWork=currentActivity.kind==='work';
 E('activityTitle').textContent=(isWork?'💼 Работиш: ':'🚶 Патрулираш: ')+currentActivity.activity_name;
 E('activitySub').textContent=`Започнато: ${new Date(currentActivity.started_at).toLocaleString('bg-BG')} · ${currentActivity.duration_minutes} мин.`;
 E('cancelActivityBtn').textContent=isWork?'🏃 ЧУПИ СЕ ОТ РАБОТА':'🏃 ЧУПИ СЕ ОТ ПАТРУЛА'; updateActivityTimer(); document.querySelectorAll('.zone,.fight-btn').forEach(b=>b.disabled=true);
}
function updateActivityTimer(){
 if(!currentActivity)return; let ms=new Date(currentActivity.ends_at).getTime()-Date.now();
 if(ms<=0){E('activityTimer').textContent='ГОТОВО';E('claimBtn').classList.remove('hidden');E('cancelActivityBtn').classList.add('hidden');return}
 E('claimBtn').classList.add('hidden');E('cancelActivityBtn').classList.remove('hidden'); let sec=Math.floor(ms/1000),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),ss=sec%60;
 E('activityTimer').textContent=[h,m,ss].map(x=>String(x).padStart(2,'0')).join(':');
}
async function startActivity(kind,name,minutes){
 if(currentActivity){E('log').textContent='⏳ Героят вече е зает. Първо приключи текущата дейност.';return}
 const {data,error}=await sb.rpc('start_activity',{p_kind:kind,p_name:name,p_duration_minutes:minutes});
 if(error){E('log').textContent='⏳ '+bgError(error);return} currentActivity=data;
 E('log').textContent=(kind==='work'?`💼 Започна работа като ${name}.`:`🚶 Започна патрул в ${name}.`)+`\nРеално време: ${minutes>=60?minutes/60+' ч.':minutes+' мин.'}\nМожеш спокойно да затвориш играта.`;
 renderActivity();
}
async function patrol(zone){await startActivity('patrol',zone,Number(E('patrolDuration').value))}
async function work(job){await startActivity('work',job,Number(E('workDuration').value))}
async function cancelActivity(){
 if(!currentActivity)return;
 const isWork=currentActivity.kind==='work';
 const warning=isWork?'Ще получиш само 80% от заработеното до момента. Чупиш ли се?':'Ще прекратиш патрула без награда. Чупиш ли се?';
 if(!confirm(warning))return;
 const btn=E('cancelActivityBtn');btn.disabled=true;
 const {data,error}=await sb.rpc('cancel_activity');btn.disabled=false;
 if(error){E('log').textContent='🏃 '+bgError(error);return}
 E('log').textContent='🏃 '+data.event;
 currentActivity=null;renderActivity();await refreshAll();
}
async function claimActivity(){
 E('claimBtn').disabled=true; const {data,error}=await sb.rpc('claim_activity'); E('claimBtn').disabled=false;
 if(error){E('log').textContent='⏳ '+bgError(error);return}
 E('log').textContent=`🎁 ${data.event}\n${data.money?`+${data.money} € `:''}${data.respect?`+${data.respect} респект`:''}${data.loot?`\n🎒 Нов предмет: ${data.loot}`:''}`;
 currentActivity=null;renderActivity();await refreshAll();
}

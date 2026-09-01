let currentGang=null,gangBattleChannel=null,gangBattleTick=null,currentGangBattleId=null;

async function loadGangs(){
 if(!currentUser)return;
 const [{data:myMember},{data:gangs,error:gerr}]=await Promise.all([
  sb.from('gang_members').select('gang_id,role,gang:gangs(id,name,side,respect,leader_id,premium_emblem,premium_style)').eq('user_id',currentUser.id).maybeSingle(),
  sb.from('gangs').select('*').order('respect',{ascending:false}).order('created_at',{ascending:true})
 ]);
 if(gerr){E('gangInfo').innerHTML=`<div class="msg err">${escapeHtml(bgError(gerr))}</div>`;return}
 currentGang=myMember||null;
 if(myMember){
  const g=myMember.gang;E('gangInfo').innerHTML=`<div class="msg ${g.premium_style==='gold'?'gang-premium-gold':''}"><b>${g.premium_emblem?escapeHtml(g.premium_emblem)+' ':''}👊 ${escapeHtml(g.name)}</b><br><span class="tiny">${escapeHtml(g.side)} · ${myMember.role==='leader'?'Лидер':'Член'} · Бандов респект: ${g.respect||0}</span>${myMember.role!=='leader'?'<br><button style="margin-top:10px" onclick="leaveGang()">НАПУСНИ БАНДАТА</button>':''}</div>`;
 }else E('gangInfo').innerHTML=`<div class="field"><label>Име на нова банда</label><input id="newGangName" maxlength="28" placeholder="Напр. Кючук Crew"></div><button class="primary" onclick="createGang()">СЪЗДАЙ БАНДА</button>`;
 const available=(gangs||[]).filter(g=>!myMember&&g.side===currentProfile.side);
 E('gangList').innerHTML=`<h3>${myMember?'Всички банди':'Банди от твоята страна'}</h3>`+((gangs||[]).length?(myMember?(gangs||[]):available).map(g=>`<div class="item ${g.premium_style==='gold'?'gang-premium-gold':''}"><div><b>${g.premium_emblem?escapeHtml(g.premium_emblem)+' ':''}${escapeHtml(g.name)}</b><small>${escapeHtml(g.side)} · Респект ${g.respect||0}</small></div>${!myMember?`<button class="blue" onclick="joinGang(${g.id})">ВЛЕЗ</button>`:''}</div>`).join(''):'<div class="msg">Още няма банди.</div>');
 await loadGangBattles(gangs||[]);
}
async function createGang(){const name=(E('newGangName')?.value||'').trim();if(!name)return alert('Напиши име на бандата.');if(!confirm(`Създаваме банда „${name}“?`))return;const {data,error}=await sb.rpc('create_gang',{p_name:name});if(error)return alert('❌ '+bgError(error));alert('✅ Бандата „'+data.name+'“ е създадена!');await loadGangs()}
async function joinGang(id){if(!confirm('Сигурен ли си, че искаш да влезеш в тази банда?'))return;const {data,error}=await sb.rpc('join_gang',{p_gang_id:id});if(error)return alert('❌ '+bgError(error));alert('✅ Вече си в „'+data.name+'“!');await loadGangs()}
async function leaveGang(){if(!confirm('Напускаш бандата?'))return;const {error}=await sb.rpc('leave_gang');if(error)return alert('❌ '+bgError(error));alert('✅ Напусна бандата.');await loadGangs()}

function gangBattleClock(ts){const left=Math.max(0,new Date(ts)-Date.now());const m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);return `${m}:${String(s).padStart(2,'0')}`}
function gangBattleStatus(b){const now=Date.now(),start=new Date(b.starts_at).getTime(),end=new Date(b.ends_at).getTime();if(b.status==='finished')return 'finished';if(now<start)return 'registration';if(now<end)return 'live';return 'ending'}
function stopGangBattleRealtime(){if(gangBattleTick){clearInterval(gangBattleTick);gangBattleTick=null}if(gangBattleChannel){sb.removeChannel(gangBattleChannel);gangBattleChannel=null}currentGangBattleId=null}
function startGangBattleRealtime(id){if(currentGangBattleId===id&&gangBattleChannel)return;stopGangBattleRealtime();currentGangBattleId=id;gangBattleChannel=sb.channel('gang-battle-'+id)
 .on('postgres_changes',{event:'*',schema:'public',table:'gang_battles',filter:`id=eq.${id}`},()=>refreshGangBattle(id))
 .on('postgres_changes',{event:'*',schema:'public',table:'gang_battle_entries',filter:`battle_id=eq.${id}`},()=>refreshGangBattle(id))
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'gang_battle_events',filter:`battle_id=eq.${id}`},()=>refreshGangBattle(id))
 .subscribe();gangBattleTick=setInterval(()=>refreshGangBattle(id,true),1000)}

async function loadGangBattles(gangs){
 const {data:battles,error}=await sb.from('gang_battles').select('*').order('created_at',{ascending:false}).limit(10);if(error){E('gangBattleBox').innerHTML=`<div class="msg err">${escapeHtml(bgError(error))}</div>`;return}
 const byId=new Map((gangs||[]).map(g=>[g.id,g]));
 const relevant=(battles||[]).find(b=>b.status!=='finished'&&currentGang&&(b.challenger_gang_id===currentGang.gang_id||b.defender_gang_id===currentGang.gang_id));
 if(relevant){await renderGangBattle(relevant,byId);startGangBattleRealtime(relevant.id)}else{stopGangBattleRealtime();renderGangBattleCreate(gangs||[])}
 const fin=(battles||[]).filter(b=>b.status==='finished').slice(0,6);if(fin.length)E('gangBattleBox').insertAdjacentHTML('beforeend',`<h3>Последни битки</h3>`+fin.map(b=>{const c=byId.get(b.challenger_gang_id)?.name||'Банда',d=byId.get(b.defender_gang_id)?.name||'Банда',w=b.winner_gang_id?(byId.get(b.winner_gang_id)?.name||'Победител'):'Равенство';return `<button class="event gang-history" onclick="openGangBattleHistory(${b.id})"><div><b>🏆 ${escapeHtml(w)}</b><small>${escapeHtml(c)} ${b.challenger_score||0} : ${b.defender_score||0} ${escapeHtml(d)} · отвори live log</small></div></button>`}).join(''))
}
function renderGangBattleCreate(gangs){
 if(currentGang?.role==='leader'){
  const opponents=gangs.filter(g=>g.id!==currentGang.gang_id);E('gangBattleBox').innerHTML=opponents.length?`<div class="field"><label>Предизвикай банда</label><select id="gangOpponent">${opponents.map(g=>`<option value="${g.id}">${escapeHtml(g.name)} · ${escapeHtml(g.side)}</option>`).join('')}</select></div><div class="msg">⏱️ Записване: 5 минути · Битка: 2 минути · Личен cooldown: 5 секунди</div><button class="primary" style="width:100%" onclick="createGangBattle()">ОРГАНИЗИРАЙ БИТКА</button>`:'<div class="msg">Няма друга банда, която да предизвикаш.</div>';
 }else E('gangBattleBox').innerHTML=currentGang?'<div class="msg">Няма активна битка. Само лидерът може да предизвика друга банда.</div>':'<div class="msg">Първо влез в банда.</div>';
}
async function createGangBattle(){const opp=Number(E('gangOpponent')?.value);if(!opp)return;const {data,error}=await sb.rpc('create_gang_battle',{p_defender_gang_id:opp,p_duration_minutes:2});if(error)return alert('❌ '+bgError(error));alert(`🔥 ${data.challenger} vs ${data.defender}: записването започна. Старт след 5 минути.`);await loadGangs()}
async function joinGangBattle(id){const {data,error}=await sb.rpc('join_gang_battle',{p_battle_id:id});if(error)return alert('❌ '+bgError(error));alert(`✅ Записан си. Battle HP: ${data.battle_hp}`);await refreshGangBattle(id)}

async function refreshGangBattle(id,tickOnly=false){
 if(!currentGang||!E('gangBattleBox'))return;
 const {data:b,error}=await sb.from('gang_battles').select('*').eq('id',id).maybeSingle();if(error||!b)return;if(!tickOnly&&b.status==='finished'){stopGangBattleRealtime();return loadGangs()}
 const {data:gangs}=await sb.from('gangs').select('id,name').in('id',[b.challenger_gang_id,b.defender_gang_id]);await renderGangBattle(b,new Map((gangs||[]).map(g=>[g.id,g])));
}
async function renderGangBattle(b,byId){
 const state=gangBattleStatus(b);if(state==='ending'){await sb.rpc('finish_gang_battle',{p_battle_id:b.id});return refreshGangBattle(b.id)}
 const [{data:entries},{data:events}]=await Promise.all([
  sb.from('gang_battle_entries').select('battle_id,user_id,gang_id,power,battle_hp,battle_max_hp,total_damage,knocked_out,last_attack_at').eq('battle_id',b.id).order('joined_at'),
  sb.from('gang_battle_events').select('id,actor_id,target_id,event_type,message,damage,target_hp,special_effect,created_at').eq('battle_id',b.id).order('id',{ascending:false}).limit(80)
 ]);
 const ids=[...new Set((entries||[]).map(e=>e.user_id))],names=new Map();if(ids.length){const {data:people}=await sb.from('profiles').select('id,username').in('id',ids);(people||[]).forEach(p=>names.set(p.id,p.username))}
 const mine=(entries||[]).find(e=>e.user_id===currentUser.id),myGang=mine?.gang_id||currentGang?.gang_id,enemy=(entries||[]).filter(e=>e.gang_id!==myGang),weapons=mine&&state==='live'&&!mine.knocked_out?await gangBattleWeaponOptions():[];
 const c=(entries||[]).filter(x=>x.gang_id===b.challenger_gang_id),d=(entries||[]).filter(x=>x.gang_id===b.defender_gang_id),sumHP=list=>list.reduce((n,x)=>n+(x.battle_hp||0),0),sumDmg=list=>list.reduce((n,x)=>n+(x.total_damage||0),0);
 const titleA=byId.get(b.challenger_gang_id)?.name||'Банда',titleB=byId.get(b.defender_gang_id)?.name||'Банда';
 let action='';
 if(state==='registration')action=`<div class="msg">📝 Записване до старта: <b>${gangBattleClock(b.starts_at)}</b>. След старта няма нови участници.</div>${mine?'<button class="primary" disabled>✅ ЗАПИСАН СИ</button>':`<button class="primary" style="width:100%" onclick="joinGangBattle(${b.id})">ВКЛЮЧИ СЕ В БИТКАТА</button>`}`;
 else if(state==='live'&&mine){action=mine.knocked_out?'<div class="msg err">💀 Нокаутиран си — можеш да следиш битката, но не можеш да атакуваш.</div>':`<div class="gang-controls"><div class="field"><label>Конкретен противник</label><select id="gangBattleTarget">${enemy.filter(x=>!x.knocked_out).map(x=>`<option value="${x.user_id}">${escapeHtml(names.get(x.user_id)||'Играч')} · ❤️ ${x.battle_hp}</option>`).join('')}</select></div><div class="field"><label>Оръжие</label><select id="gangBattleWeapon"><option value="">👊 С голи ръце</option>${weapons.map(w=>`<option value="${w.item_id}">${escapeHtml(w.items.name)}${w.quantity>1?' ×'+w.quantity:''}${w.items.combat_effect==='burn'?' 🔥':''}</option>`).join('')}</select></div><button class="primary" id="gangAttackBtn" onclick="attackGangBattle(${b.id})">АТАКУВАЙ</button><div class="tiny" id="gangCooldown">Cooldown: 5 сек.</div></div>`}
 else if(state==='live')action='<div class="msg">Битката тече. Не си записан и не можеш да се включиш след старта.</div>';
 const rows=list=>list.map(x=>`<div class="gang-fighter ${x.knocked_out?'ko':''}"><b>${escapeHtml(names.get(x.user_id)||'Играч')}</b><span>❤️ ${x.battle_hp}/${x.battle_max_hp}${x.knocked_out?' · НОКАУТ':''}</span><div class="hpbar"><i style="width:${Math.max(0,Math.min(100,(x.battle_hp/x.battle_max_hp)*100))}%"></i></div><small>Нанесени щети: ${x.total_damage||0}</small></div>`).join('')||'<div class="tiny">Няма записани.</div>';
 E('gangBattleBox').innerHTML=`<div class="gang-live"><div class="fanvs"><div><b>${escapeHtml(titleA)}</b><div class="fanbig">❤️ ${sumHP(c)}</div><small>щети ${sumDmg(c)}</small></div><b>VS</b><div><b>${escapeHtml(titleB)}</b><div class="fanbig">❤️ ${sumHP(d)}</div><small>щети ${sumDmg(d)}</small></div></div><p class="gang-state">${state==='registration'?'📝 Записване':'🔴 LIVE'} · ${state==='registration'?gangBattleClock(b.starts_at):gangBattleClock(b.ends_at)}</p><div class="gang-teams"><div><h4>${escapeHtml(titleA)}</h4>${rows(c)}</div><div><h4>${escapeHtml(titleB)}</h4>${rows(d)}</div></div>${action}<h3>📡 Live battle log</h3><div class="gang-live-log">${(events||[]).map(e=>`<div class="gang-log-line ${e.event_type}"><small>${new Date(e.created_at).toLocaleTimeString('bg-BG')}</small><b>${escapeHtml(e.message)}</b>${e.damage?`<span>−${e.damage} HP · остава ${e.target_hp} HP</span>`:''}${e.special_effect?`<em>${escapeHtml(e.special_effect)}</em>`:''}</div>`).join('')||'<div class="msg">Битката още няма действия.</div>'}</div></div>`;
 if(mine&&!mine.knocked_out&&state==='live')updateGangCooldown(mine.last_attack_at);
}
async function gangBattleWeaponOptions(){const {data}=await sb.from('inventory').select('item_id,quantity,items(id,name,item_type,combat_effect,consumed_on_use)').eq('user_id',currentUser.id);return (data||[]).filter(x=>x.items?.item_type==='weapon'&&(x.quantity||0)>0)}
function updateGangCooldown(last){const el=E('gangCooldown'),btn=E('gangAttackBtn');if(!el||!btn)return;const sec=Math.max(0,5-Math.floor((Date.now()-new Date(last||0).getTime())/1000));btn.disabled=sec>0;el.textContent=sec>0?`Cooldown: ${sec} сек.`:'Готов за атака.'}
async function attackGangBattle(id){const target=E('gangBattleTarget')?.value,weapon=E('gangBattleWeapon')?.value;if(!target)return alert('Избери противник.');const btn=E('gangAttackBtn');if(btn)btn.disabled=true;const {data,error}=await sb.rpc('attack_gang_battle',{p_battle_id:id,p_target_user_id:target,p_weapon_item_id:weapon?Number(weapon):null});if(error){if(btn)btn.disabled=false;return alert('❌ '+bgError(error))}if(data.finished)await loadGangs();else await refreshGangBattle(id)}

async function openGangBattleHistory(id){
 const [{data:b,error:be},{data:events,error:ee},{data:entries}]=await Promise.all([
  sb.from('gang_battles').select('*').eq('id',id).single(),
  sb.from('gang_battle_events').select('*').eq('battle_id',id).order('id'),
  sb.from('gang_battle_entries').select('user_id,gang_id,battle_hp,battle_max_hp,total_damage,knocked_out').eq('battle_id',id)
 ]);if(be||ee)return alert('❌ '+bgError(be||ee));
 const ids=[...new Set((entries||[]).map(x=>x.user_id))],names=new Map();if(ids.length){const {data:p}=await sb.from('profiles').select('id,username').in('id',ids);(p||[]).forEach(x=>names.set(x.id,x.username))}
 E('battleModal').className='battlemodal';E('battleTitle').textContent='👊 БАНДОВА БИТКА — LOG';E('battleBody').innerHTML=`<div class="battleline"><span>Резултат</span><b>${b.challenger_score||0} : ${b.defender_score||0}</b></div><div class="battle-log">${(events||[]).map(e=>`<div class="battle-event ${e.event_type}"><small>${new Date(e.created_at).toLocaleString('bg-BG')}</small><b>${escapeHtml(e.message)}</b>${e.damage?`<div>Щета: ${e.damage} · HP след удара: ${e.target_hp}</div>`:''}${e.special_effect?`<div>✨ ${escapeHtml(e.special_effect)}</div>`:''}</div>`).join('')||'<div class="msg">Няма записани действия.</div>'}</div>`;E('battleOverlay').classList.remove('hidden')
}

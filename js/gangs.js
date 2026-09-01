let currentGang=null;
async function loadGangs(){
 if(!currentUser)return;
 const [{data:myMember},{data:gangs,error:gerr}]=await Promise.all([
   sb.from('gang_members').select('gang_id,role,gang:gangs(id,name,side,respect,leader_id)').eq('user_id',currentUser.id).maybeSingle(),
   sb.from('gangs').select('*').order('respect',{ascending:false}).order('created_at',{ascending:true})
 ]);
 if(gerr){E('gangInfo').innerHTML=`<div class="msg err">${escapeHtml(bgError(gerr))}</div>`;return}
 currentGang=myMember||null;
 if(myMember){
   const g=myMember.gang;E('gangInfo').innerHTML=`<div class="msg ${g.premium_style==='gold'?'gang-premium-gold':''}"><b>${g.premium_emblem?escapeHtml(g.premium_emblem)+' ':''}👊 ${escapeHtml(g.name)}</b><br><span class="tiny">${escapeHtml(g.side)} · ${myMember.role==='leader'?'Лидер':'Член'} · Бандов респект: ${g.respect||0}</span>${myMember.role!=='leader'?'<br><button style="margin-top:10px" onclick="leaveGang()">НАПУСНИ БАНДАТА</button>':''}</div>`;
 }else{
   E('gangInfo').innerHTML=`<div class="field"><label>Име на нова банда</label><input id="newGangName" maxlength="28" placeholder="Напр. Кючук Crew"></div><button class="primary" onclick="createGang()">СЪЗДАЙ БАНДА</button>`;
 }
 const available=(gangs||[]).filter(g=>!myMember && g.side===currentProfile.side);
 E('gangList').innerHTML=`<h3>${myMember?'Всички банди':'Банди от твоята страна'}</h3>`+(gangs||[]).length? (myMember?(gangs||[]):available).map(g=>`<div class="item ${g.premium_style==='gold'?'gang-premium-gold':''}"><div><b>${g.premium_emblem?escapeHtml(g.premium_emblem)+' ':''}${escapeHtml(g.name)}</b><small>${escapeHtml(g.side)} · Респект ${g.respect||0}</small></div>${!myMember?`<button class="blue" onclick="joinGang(${g.id})">ВЛЕЗ</button>`:''}</div>`).join(''):'<div class="msg">Още няма банди.</div>';
 await loadGangBattles(gangs||[]);
}
async function createGang(){const name=(E('newGangName')?.value||'').trim();if(!name)return alert('Напиши име на бандата.');if(!confirm(`Създаваме банда „${name}“?`))return;const {data,error}=await sb.rpc('create_gang',{p_name:name});if(error)return alert('❌ '+bgError(error));alert('✅ Бандата „'+data.name+'“ е създадена!');await loadGangs()}
async function joinGang(id){if(!confirm('Сигурен ли си, че искаш да влезеш в тази банда?'))return;const {data,error}=await sb.rpc('join_gang',{p_gang_id:id});if(error)return alert('❌ '+bgError(error));alert('✅ Вече си в „'+data.name+'“!');await loadGangs()}
async function leaveGang(){if(!confirm('Напускаш бандата?'))return;const {error}=await sb.rpc('leave_gang');if(error)return alert('❌ '+bgError(error));alert('✅ Напусна бандата.');await loadGangs()}
async function loadGangBattles(gangs){
 const {data:battles,error}=await sb.from('gang_battles').select('*').order('created_at',{ascending:false}).limit(8);if(error){E('gangBattleBox').innerHTML=`<div class="msg err">${escapeHtml(bgError(error))}</div>`;return}
 let active=(battles||[]).find(b=>b.status==='open'&&(currentGang&&(b.challenger_gang_id===currentGang.gang_id||b.defender_gang_id===currentGang.gang_id)));
 if(active&&new Date(active.ends_at)<=new Date()){await sb.rpc('finish_gang_battle',{p_battle_id:active.id});return loadGangs()}
 const byId=new Map((gangs||[]).map(g=>[g.id,g]));
 if(active){const {data:entries}=await sb.from('gang_battle_entries').select('user_id,gang_id').eq('battle_id',active.id);const c=(entries||[]).filter(x=>x.gang_id===active.challenger_gang_id).length,d=(entries||[]).filter(x=>x.gang_id===active.defender_gang_id).length,joined=(entries||[]).some(x=>x.user_id===currentUser.id);const left=Math.max(0,new Date(active.ends_at)-Date.now()),m=Math.floor(left/60000),sec=Math.floor((left%60000)/1000);E('gangBattleBox').innerHTML=`<div class="fanbattle"><div class="fanvs"><div><b>${escapeHtml(byId.get(active.challenger_gang_id)?.name||'Банда')}</b><div class="fanbig">${c}</div><small>записани</small></div><b>VS</b><div><b>${escapeHtml(byId.get(active.defender_gang_id)?.name||'Банда')}</b><div class="fanbig">${d}</div><small>записани</small></div></div><p style="text-align:center">⏳ ${m}:${String(sec).padStart(2,'0')} до края</p><button class="primary" style="width:100%" ${joined?'disabled':''} onclick="joinGangBattle(${active.id})">${joined?'ЗАПИСАН СИ':'ВКЛЮЧИ СЕ В БИТКАТА'}</button></div>`
 }else if(currentGang?.role==='leader'){
   const opponents=(gangs||[]).filter(g=>g.id!==currentGang.gang_id);E('gangBattleBox').innerHTML=opponents.length?`<div class="field"><label>Предизвикай банда</label><select id="gangOpponent">${opponents.map(g=>`<option value="${g.id}">${escapeHtml(g.name)} · ${escapeHtml(g.side)}</option>`).join('')}</select></div><div class="row"><button class="primary" onclick="createGangBattle(10)">10 МИН.</button><button class="primary" onclick="createGangBattle(30)">30 МИН.</button><button class="primary" onclick="createGangBattle(60)">60 МИН.</button></div>`:'<div class="msg">Няма друга банда, която да предизвикаш.</div>';
 }else E('gangBattleBox').innerHTML=currentGang?'<div class="msg">Няма активна битка. Само лидерът може да предизвика друга банда.</div>':'<div class="msg">Първо влез в банда.</div>';
 const fin=(battles||[]).filter(b=>b.status==='finished').slice(0,4);if(fin.length)E('gangBattleBox').innerHTML+=`<h3>Последни битки</h3>`+fin.map(b=>{const c=byId.get(b.challenger_gang_id)?.name||'Банда',d=byId.get(b.defender_gang_id)?.name||'Банда',w=b.winner_gang_id?(byId.get(b.winner_gang_id)?.name||'Победител'):'Равенство';return `<div class="event"><div><b>🏆 ${escapeHtml(w)}</b><small>${escapeHtml(c)} ${b.challenger_score} : ${b.defender_score} ${escapeHtml(d)}</small></div></div>`}).join('')
}
async function createGangBattle(minutes){const opp=Number(E('gangOpponent')?.value);if(!opp)return;const {data,error}=await sb.rpc('create_gang_battle',{p_defender_gang_id:opp,p_duration_minutes:minutes});if(error)return alert('❌ '+bgError(error));alert(`🔥 Битката ${data.challenger} vs ${data.defender} е организирана!`);await loadGangs()}
async function joinGangBattle(id){const {data,error}=await sb.rpc('join_gang_battle',{p_battle_id:id});if(error)return alert('❌ '+bgError(error));alert(`✅ Записа се за битката. Бойна мощ: ${data.power}`);await loadGangs()}

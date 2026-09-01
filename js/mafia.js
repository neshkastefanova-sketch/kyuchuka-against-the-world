let currentMafia=null;
async function loadMafia(){
 const box=E('mafiaBox');if(!box||!currentUser||!currentGang){if(box)box.innerHTML='<div class="msg">Първо трябва да си в банда.</div>';return}
 const {data:link}=await sb.from('mafia_gangs').select('mafia_id,gang_id').eq('gang_id',currentGang.gang_id).maybeSingle();
 const {data:allGangs}=await sb.from('gangs').select('id,name,respect').order('respect',{ascending:false});
 if(link){
   const {data:m}=await sb.from('mafias').select('*').eq('id',link.mafia_id).single();currentMafia=m;
   const {data:links}=await sb.from('mafia_gangs').select('gang_id,joined_at').eq('mafia_id',m.id).order('joined_at');
   const ids=(links||[]).map(x=>x.gang_id),members=(allGangs||[]).filter(g=>ids.includes(g.id));
   const totalRep=members.reduce((s,g)=>s+(g.respect||0),0)+(m.reputation||0),isLead=m.leader_gang_id===currentGang.gang_id&&currentGang.role==='leader';
   const candidates=(allGangs||[]).filter(g=>!ids.includes(g.id));
   box.innerHTML=`<div class="mafia-card"><h3>🕴️ ${escapeHtml(m.name)}</h3><div class="tiny">Лидерска банда: ${escapeHtml(members.find(g=>g.id===m.leader_gang_id)?.name||'—')} · Обща репутация: <b>${totalRep}</b></div><div class="mafia-gangs">${members.map(g=>`<span>👊 ${escapeHtml(g.name)} <small>${g.respect||0} rep</small></span>`).join('')}</div>${isLead&&candidates.length?`<div class="field"><label>Покани друга банда</label><select id="mafiaInviteGang">${candidates.map(g=>`<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('')}</select></div><button class="gold" onclick="inviteMafiaGang()">ИЗПРАТИ ПОКАНА</button>`:''}${currentGang.role==='leader'&&!isLead?'<button style="margin-top:10px" onclick="leaveMafia()">ИЗВАДИ БАНДАТА ОТ МАФИЯТА</button>':''}<div class="tiny" style="margin-top:12px">⚔️ Структурата е готова за бъдещи Mafia vs Mafia войни.</div></div>`;
 }else{
   currentMafia=null;const {data:invites}=await sb.from('mafia_invites').select('id,mafia_id,status,created_at').eq('gang_id',currentGang.gang_id).eq('status','pending').order('created_at',{ascending:false});
   let inviteHtml='';if(invites?.length){const mids=invites.map(i=>i.mafia_id);const {data:ms}=await sb.from('mafias').select('id,name').in('id',mids);const mn=new Map((ms||[]).map(m=>[m.id,m.name]));inviteHtml=`<h3>📨 Покани</h3>`+invites.map(i=>`<div class="item"><div><b>${escapeHtml(mn.get(i.mafia_id)||'Мафия')}</b><small>Иска бандата ти да се присъедини.</small></div><div class="row"><button class="primary" onclick="respondMafiaInvite(${i.id},true)">ПРИЕМИ</button><button onclick="respondMafiaInvite(${i.id},false)">ОТКАЖИ</button></div></div>`).join('')}
   box.innerHTML=currentGang.role==='leader'?`${inviteHtml}<div class="field"><label>Име на нова Мафия</label><input id="newMafiaName" maxlength="32" placeholder="Напр. Тракийски синдикат"></div><button class="primary" onclick="createMafia()">СЪЗДАЙ МАФИЯ</button><div class="tiny" style="margin-top:8px">След създаването покани поне още една банда. Бандите запазват собствените си имена, лидери и респект.</div>`:`${inviteHtml}<div class="msg">Бандата ти още не е в Мафия. Решението се взема от лидера.</div>`;
 }
}
async function createMafia(){const name=(E('newMafiaName')?.value||'').trim();if(!name)return alert('Напиши име на Мафията.');const {data,error}=await sb.rpc('create_mafia',{p_name:name});if(error)return alert('❌ '+bgError(error));alert('✅ Мафия „'+data.name+'“ е създадена. Покани още банди.');await loadMafia()}
async function inviteMafiaGang(){const id=Number(E('mafiaInviteGang')?.value);if(!id)return;const {error}=await sb.rpc('invite_mafia_gang',{p_gang_id:id});if(error)return alert('❌ '+bgError(error));alert('📨 Поканата е изпратена.');await loadMafia()}
async function respondMafiaInvite(id,accept){const {data,error}=await sb.rpc('respond_mafia_invite',{p_invite_id:id,p_accept:accept});if(error)return alert('❌ '+bgError(error));alert(accept?'✅ Бандата вече е в Мафията.':'Поканата е отказана.');await loadMafia()}
async function leaveMafia(){if(!confirm('Да извадим бандата от Мафията?'))return;const {error}=await sb.rpc('leave_mafia');if(error)return alert('❌ '+bgError(error));alert('✅ Бандата напусна Мафията.');await loadMafia()}
const mafiaLoadGangs=loadGangs;loadGangs=async function(){await mafiaLoadGangs();await loadMafia()};

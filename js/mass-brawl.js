async function loadMassBrawls(){
 const box=E('massBrawlBox');if(!box||!currentUser)return;
 await sb.rpc('ensure_mass_brawls');
 const now=new Date().toISOString();
 const {data:brawls,error}=await sb.from('mass_brawls').select('*').gte('ends_at',now).order('starts_at').limit(4);
 if(error){box.innerHTML=`<div class="msg err">${escapeHtml(bgError(error))}</div>`;return}
 const ids=(brawls||[]).map(b=>b.id);let entries=[];
 if(ids.length){const r=await sb.from('mass_brawl_entries').select('*').in('brawl_id',ids);entries=r.data||[]}
 box.innerHTML=(brawls||[]).map(b=>renderMassBrawlCard(b,entries.filter(e=>e.brawl_id===b.id))).join('')||'<div class="msg">Няма предстоящо меле.</div>';
}
function massBrawlTime(ts){return new Date(ts).toLocaleString('bg-BG',{timeZone:'Europe/Sofia',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function renderMassBrawlCard(b,entries){
 const mine=entries.find(e=>e.user_id===currentUser.id),now=Date.now(),start=new Date(b.starts_at).getTime(),end=new Date(b.ends_at).getTime(),live=now>=start&&now<end&&b.status!=='finished';
 if(live&&mine)return `<div class="msg"><b>🔴 МЕЛЕТО Е LIVE · ${massBrawlTime(b.starts_at)}</b><br><span class="tiny">Участници: ${entries.length} · твоето HP: ${mine.battle_hp}/${mine.battle_max_hp}</span><br><button class="primary" style="margin-top:8px" onclick="openMassBrawl(${b.id})">ВЛЕЗ В МЕЛЕТО</button></div>`;
 if(live)return `<div class="msg"><b>🔴 Мелето в ${massBrawlTime(b.starts_at)} вече тече</b><br><span class="tiny">Записването е приключило · участници: ${entries.length}</span></div>`;
 if(now<start)return `<div class="msg"><b>🥊 Меле · ${massBrawlTime(b.starts_at)}</b><br><span class="tiny">Записани: ${entries.length} · продължителност: 3 мин.</span><br>${mine?'<button disabled style="margin-top:8px">✅ ЗАПИСАН СИ</button>':`<button class="primary" style="margin-top:8px" onclick="joinMassBrawl(${b.id})">ЗАПИШИ СЕ ЗА МЕЛЕТО В ${new Date(b.starts_at).toLocaleTimeString('bg-BG',{timeZone:'Europe/Sofia',hour:'2-digit',minute:'2-digit'})}</button>`}</div>`;
 return '';
}
async function joinMassBrawl(id){const {error}=await sb.rpc('join_mass_brawl',{p_brawl_id:id});if(error)return alert('❌ '+bgError(error));await loadMassBrawls()}
async function openMassBrawl(id){
 const box=E('massBrawlBox');const [{data:entries},{data:events}]=await Promise.all([sb.from('mass_brawl_entries').select('*').eq('brawl_id',id),sb.from('mass_brawl_events').select('*').eq('brawl_id',id).order('id',{ascending:false}).limit(40)]);
 const ids=[...new Set((entries||[]).map(e=>e.user_id))],names=new Map();if(ids.length){const {data:p}=await sb.from('profiles').select('id,username').in('id',ids);(p||[]).forEach(x=>names.set(x.id,x.username))}
 const mine=(entries||[]).find(e=>e.user_id===currentUser.id),targets=(entries||[]).filter(e=>e.user_id!==currentUser.id&&!e.knocked_out);
 box.innerHTML=`<div class="msg"><b>🔴 МАСОВО МЕЛЕ</b><br>❤️ ${mine?.battle_hp||0}/${mine?.battle_max_hp||0}</div>${mine&&!mine.knocked_out?`<div class="field"><label>Противник</label><select id="massBrawlTarget">${targets.map(t=>`<option value="${t.user_id}">${escapeHtml(names.get(t.user_id)||'Играч')} · ❤️ ${t.battle_hp}</option>`).join('')}</select></div><button class="primary" onclick="attackMassBrawl(${id})">АТАКУВАЙ</button>`:'<div class="msg err">💀 Нокаутиран си.</div>'}<h3>📡 Live log</h3><div class="log">${(events||[]).map(e=>escapeHtml(e.message)).join('<br>')||'Мелето започва…'}</div><button style="margin-top:10px" onclick="loadMassBrawls()">НАЗАД</button>`;
}
async function attackMassBrawl(id){const target=E('massBrawlTarget')?.value;if(!target)return;const {error}=await sb.rpc('attack_mass_brawl',{p_brawl_id:id,p_target_user_id:target});if(error)return alert('⏳ '+bgError(error));await openMassBrawl(id)}

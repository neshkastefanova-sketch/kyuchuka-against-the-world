let tacticalOpponent=null,tacticalWeapons=[],notificationChannel=null;

async function tacticalWeaponOptions(){
 const {data,error}=await sb.from('inventory').select('item_id,quantity,equipped,items(id,name,item_type,attack_bonus,strength_bonus,combat_effect,combat_effect_value,consumed_on_use)').eq('user_id',currentUser.id);
 if(error)throw error;
 tacticalWeapons=(data||[]).filter(v=>v.items?.item_type==='weapon'&&(v.quantity||1)>0);
 return tacticalWeapons;
}

async function openTacticalFight(id,name){
 tacticalOpponent={id,name};
 try{await tacticalWeaponOptions()}catch(e){return alert('❌ '+bgError(e))}
 let old=E('tacticalFightOverlay');if(old)old.remove();
 const options=['<option value="">👊 Без оръжие</option>',...tacticalWeapons.map(v=>`<option value="${v.item_id}">${escapeHtml(v.items.name)}${v.quantity>1?' ×'+v.quantity:''}${v.items.combat_effect==='burn'?' 🔥':''}</option>`)].join('');
 document.body.insertAdjacentHTML('beforeend',`<div class="modalback" id="tacticalFightOverlay" onclick="if(event.target===this)this.remove()"><div class="battlemodal"><h2>⚔️ АТАКА</h2><div class="msg">Противник: <b>${escapeHtml(name)}</b></div><div class="field"><label>Избери оръжие от инвентара</label><select id="tacticalWeapon">${options}</select></div><div class="tiny">Молотовът е еднократен и дава специален огнен ефект.</div><div class="row" style="margin-top:14px"><button onclick="E('tacticalFightOverlay').remove()">ОТКАЗ</button><button class="primary" onclick="startTacticalFight()">НАПАДНИ ⚡ 20</button></div></div></div>`);
}

async function startTacticalFight(){
 if(fightBusy||!tacticalOpponent)return;
 if(!currentProfile||currentProfile.energy<20)return alert('⚡ Трябват ти поне 20 енергия за бой.');
 const weaponValue=E('tacticalWeapon')?.value,weaponId=weaponValue?Number(weaponValue):null;
 const name=tacticalOpponent.name,id=tacticalOpponent.id;
 fightBusy=true;document.querySelectorAll('.fight-btn').forEach(b=>b.disabled=true);
 E('tacticalFightOverlay')?.remove();E('log').textContent='⚔️ Нападаш '+name+'...';
 const {data,error}=await sb.rpc('fight_player',{opponent:id,p_weapon_item_id:weaponId});
 fightBusy=false;
 if(error){E('log').textContent='Боят не можа да започне: '+bgError(error);await loadPlayers();return}
 await showTacticalBattle(data,name);await refreshAll();await loadNotifications();
}

async function showTacticalBattle(data,name){
 const modal=E('battleModal');modal.className='battlemodal '+(data.won?'win':'lose');
 E('battleTitle').textContent=data.won?'🏆 ПОБЕДА!':'💥 ЗАГУБА!';
 E('battleBody').innerHTML=`<div class="msg">${data.won?`Размаза <b>${escapeHtml(name)}</b>.`:`<b>${escapeHtml(name)}</b> спечели боя.`}</div>${data.weapon?`<div class="battleline"><span>🔫 Оръжие</span><b>${escapeHtml(data.weapon)}</b></div>`:''}${data.special_effect==='burn'?`<div class="battleline special"><span>🔥 Ефект на Молотов</span><b>+${data.special_effect_value} бойна мощ</b></div>`:''}<div class="battleline"><span>⚔️ Твоя сила</span><b>${data.attacker_score}</b></div><div class="battleline"><span>🛡️ Противник</span><b>${data.defender_score}</b></div><div class="battleline"><span>😎 Респект</span><b>${data.won?'+'+data.respect:'0'}</b></div><div class="battleline"><span>💶 Пари</span><b>${data.won?'+'+data.money+' €':'0 €'}</b></div><button class="blue battle-open" onclick="openCompletedBattle(${Number(data.battle_id)})">📜 ОТВОРИ BATTLE LOG</button>`;
 E('battleOverlay').classList.remove('hidden');
 E('log').textContent=`${data.won?'🏆 ПОБЕДА':'💥 ЗАГУБА'} срещу ${name}\n${data.weapon?'Оръжие: '+data.weapon+'\n':''}${data.special_effect==='burn'?'🔥 Молотов: специален огнен ефект\n':''}Сила: ${data.attacker_score} срещу ${data.defender_score}`;
}

// Existing player list, upgraded to open tactical weapon selection before calling fight_player.
loadPlayers=async function(){
 const {data,error}=await sb.from('profiles').select('id,username,side,level,respect,wins,losses,premium_avatar,name_style,vip_badge').neq('id',currentUser.id).order('respect',{ascending:false}).limit(20);
 if(error){E('players').innerHTML=`<div class="msg err">${escapeHtml(bgError(error))}</div>`;return}
 E('players').innerHTML=data.length?data.map(p=>`<div class="player"><div>${styledName(p)} ${p.side==='Кючука'?'<span class="badge">Кючука</span>':'<span class="badge world">The World</span>'}<small>Ниво ${p.level} · Респект ${p.respect} · ${p.wins}/${p.losses}</small></div><button class="primary fight-btn" onclick="openTacticalFight('${p.id}','${escapeHtml(p.username).replace(/'/g,'&#39;')}')">ИЗБЕРИ ОРЪЖИЕ</button></div>`).join(''):'<div class="msg">Още няма други играчи.</div>';
};

async function openCompletedBattle(battleId){
 const [{data:b,error:be},{data:events,error:ee}]=await Promise.all([
   sb.from('battles').select('*').eq('id',battleId).single(),
   sb.from('battle_events').select('*').eq('battle_id',battleId).order('id')
 ]);
 if(be||ee)return alert('❌ '+bgError(be||ee));
 const ids=[b.attacker,b.defender];const {data:people}=await sb.from('profiles').select('id,username').in('id',ids);const names=new Map((people||[]).map(p=>[p.id,p.username]));
 const weaponIds=[b.attacker_weapon_id,b.defender_weapon_id].filter(Boolean);let weaponNames=new Map();if(weaponIds.length){const {data:items}=await sb.from('items').select('id,name').in('id',weaponIds);weaponNames=new Map((items||[]).map(i=>[i.id,i.name]))}
 const won=b.winner===currentUser.id;
 E('battleModal').className='battlemodal '+(won?'win':'lose');E('battleTitle').textContent='📜 BATTLE LOG';
 E('battleBody').innerHTML=`<div class="battleline"><span>Нападател</span><b>${escapeHtml(names.get(b.attacker)||'Играч')}</b></div><div class="battleline"><span>Защитник</span><b>${escapeHtml(names.get(b.defender)||'Играч')}</b></div>${b.attacker_weapon_id?`<div class="battleline"><span>Оръжие</span><b>${escapeHtml(weaponNames.get(b.attacker_weapon_id)||'Оръжие')}</b></div>`:''}<div class="battleline"><span>Резултат</span><b>${b.attacker_score??'?'} : ${b.defender_score??'?'}</b></div><div class="battle-log">${(events||[]).map(e=>`<div class="battle-event ${e.event_type}"><small>${new Date(e.created_at).toLocaleTimeString('bg-BG')}</small><b>${escapeHtml(e.message)}</b></div>`).join('')||'<div class="msg">Няма записани действия.</div>'}</div>`;
 E('battleOverlay').classList.remove('hidden');
 await sb.from('game_notifications').update({read_at:new Date().toISOString()}).eq('battle_id',battleId).eq('user_id',currentUser.id).is('read_at',null);await loadNotifications();
}

function ensureNotificationsUi(){
 if(E('notificationBtn'))return;
 const top=E('game')?.querySelector('.topbar>div:last-child');if(!top)return;
 top.insertAdjacentHTML('afterbegin','<button id="notificationBtn" onclick="toggleNotifications()">🔔 <span id="notificationCount">0</span></button> ');
 document.body.insertAdjacentHTML('beforeend','<div class="notification-drawer hidden" id="notificationDrawer"><div class="notification-head"><b>🔔 Известия</b><button onclick="toggleNotifications(false)">✕</button></div><div id="notificationList"></div></div>');
}
function toggleNotifications(force){const d=E('notificationDrawer');if(!d)return;const show=force===undefined?d.classList.contains('hidden'):force;d.classList.toggle('hidden',!show);if(show)loadNotifications()}
async function loadNotifications(){
 ensureNotificationsUi();if(!currentUser)return;
 const {data,error}=await sb.from('game_notifications').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false}).limit(20);if(error)return;
 const unread=(data||[]).filter(n=>!n.read_at).length;E('notificationCount').textContent=unread;
 E('notificationBtn').classList.toggle('has-unread',unread>0);
 E('notificationList').innerHTML=(data||[]).length?(data||[]).map(n=>`<button class="notification-item ${n.read_at?'':'unread'}" onclick="${n.battle_id?`openCompletedBattle(${n.battle_id});toggleNotifications(false)`:''}"><b>${escapeHtml(n.title)}</b><small>${escapeHtml(n.body)}<br>${new Date(n.created_at).toLocaleString('bg-BG')}</small></button>`).join(''):'<div class="msg">Нямаш нови известия.</div>';
}
function startNotificationRealtime(){
 if(notificationChannel||!currentUser)return;ensureNotificationsUi();loadNotifications();
 notificationChannel=sb.channel('game-notifications-'+currentUser.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'game_notifications',filter:`user_id=eq.${currentUser.id}`},payload=>{loadNotifications();const n=payload.new;if(n.notification_type==='attacked')E('log').textContent='⚠️ '+n.title+' '+n.body}).subscribe();
}
const tacticalEnterGame=enterGame;enterGame=async function(user){await tacticalEnterGame(user);startNotificationRealtime()};
const tacticalLogout=logout;logout=async function(){if(notificationChannel){await sb.removeChannel(notificationChannel);notificationChannel=null}await tacticalLogout()};

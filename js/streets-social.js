const STREET_INFO={
 'Дискотека Венера':{icon:'🪩',text:'Нощният живот на Кючука. Тук се събират всякакви образи.',actions:['танцува','прави се на тежък','прави мохабет']},
 'Междублоковото':{icon:'🏘️',text:'Тук се въртят кварталните лица.',actions:['люпи семки','виси пред блока','прави мохабет','рита топка']},
 'Тъмната уличка':{icon:'🌙',text:'По-опасно е. Тук се търсят истинските проблеми.',actions:['дебне','оглежда се','чака някого']},
 'Кафето':{icon:'☕',text:'Кварталните лица са се събрали на кафе.',actions:['пие кафе','люпи семки','прави мохабет']},
 'Игрището':{icon:'🏟️',text:'Мястото на агитките и кварталния спорт.',actions:['рита топка','тренира','гледа мач','прави мохабет']},
 'Спирката':{icon:'🚏',text:'Тук най-често се засичат хора от The World.',actions:['чака рейса','люпи семки','зяпа кой минава','прави мохабет']}
};
let selectedStreetLocation=null;
function streetSafe(s){return escapeHtml(s)}
function renderStreetShell(location){
 const info=STREET_INFO[location]||STREET_INFO['Междублоковото'];
 selectedStreetLocation=location;
 const title=E('streetSpotTitle'),sub=E('streetSpotText'),status=E('streetCurrentStatus'),actions=E('streetSocialActions');
 if(title)title.textContent=`${info.icon} ${location}`;
 if(sub)sub.textContent=info.text;
 if(status)status.textContent=`📍 ${location}`;
 document.querySelectorAll('.street-hotspot').forEach(x=>x.classList.toggle('selected',x.dataset.location===location));
 if(actions)actions.innerHTML=`<div class="tiny" style="margin-bottom:7px">Какво правиш тук?</div><div class="street-action-buttons">${info.actions.map(a=>`<button type="button" class="${currentProfile?.street_activity===a?'gold':''}" onclick="doStreetActivity('${a.replace(/'/g,"\\'")}')">${streetSafe(a)}</button>`).join('')}</div>`;
}
async function saveStreet(location,activity){
 const payload={street_location:location,street_activity:activity,street_updated_at:new Date().toISOString()};
 const {data,error}=await sb.from('profiles').update(payload).eq('id',currentUser.id).select('street_location,street_activity').single();
 if(error)throw error;
 if(currentProfile){currentProfile.street_location=data.street_location;currentProfile.street_activity=data.street_activity}
 return data;
}
async function selectStreetLocation(el,location){
 if(!currentUser||!STREET_INFO[location])return;
 const first=STREET_INFO[location].actions[0];
 renderStreetShell(location);
 if(E('players'))E('players').innerHTML='<div class="msg">🚶 Отиваш натам...</div>';
 try{
   await saveStreet(location,first);
   await loadStreetLocation(location);
 }catch(error){
   console.error('street location',error);
   if(E('players'))E('players').innerHTML=`<div class="msg err">Не успях да те преместя: ${streetSafe(bgError(error))}</div>`;
 }
 document.querySelector('.street-encounters')?.scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function doStreetActivity(activity){
 if(!currentUser||!selectedStreetLocation)return;
 const allowed=STREET_INFO[selectedStreetLocation]?.actions||[];
 if(!allowed.includes(activity))return;
 if(E('streetSpotText'))E('streetSpotText').textContent=`Ти ${activity}.`;
 try{
   await saveStreet(selectedStreetLocation,activity);
   await loadStreetLocation(selectedStreetLocation);
 }catch(error){
   console.error('street activity',error);
   if(E('streetSpotText'))E('streetSpotText').textContent='Действието не можа да се запази: '+bgError(error);
 }
}
async function loadStreetLocation(location){
 if(!currentUser)return;
 location=location||selectedStreetLocation||currentProfile?.street_location||'Междублоковото';
 renderStreetShell(location);
 const {data,error}=await sb.from('profiles').select('id,username,side,level,respect,wins,losses,premium_avatar,name_style,vip_badge,street_location,street_activity').eq('street_location',location).order('respect',{ascending:false}).limit(30);
 if(error){if(E('players'))E('players').innerHTML=`<div class="msg err">${streetSafe(bgError(error))}</div>`;return}
 if(!E('players'))return;
 E('players').innerHTML=(data||[]).map(p=>{const me=p.id===currentUser.id;return `<div class="player street-player"><div><div>${styledName(p)} ${p.side==='Кючука'?'<span class="badge">Кючука</span>':'<span class="badge world">The World</span>'}${me?' <span class="pill">ТИ</span>':''}</div><small>📍 ${streetSafe(p.street_location)} · <b>${streetSafe(p.street_activity||'виси')}</b></small><small>Ниво ${p.level} · Респект ${p.respect} · ${p.wins}/${p.losses}</small></div>${me?'':`<button class="primary fight-btn" data-name="${streetSafe(p.username)}" onclick="fight('${p.id}',this)">АТАКУВАЙ ⚡ 20</button>`}</div>`}).join('')||'<div class="msg">В момента тук няма никого.</div>';
}
async function initStreetSocial(){if(!currentUser)return;await loadStreetLocation(currentProfile?.street_location||selectedStreetLocation||'Междублоковото')}

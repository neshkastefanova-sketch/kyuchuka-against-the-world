function questInstruction(q){if(q.quest_type==='visit')return '👉 Отиди на <b>'+q.target+'</b> от картата на Уличките.';const where=({banitsa:'Кафето',key13:'Междублоковото',zip_tie:'Междублоковото',plastic_chair:'Междублоковото',sunflower_seeds:'Междублоковото',ticket_222:'Спирката',bus_screw:'Спирката',remote_no_cover:'Междублоковото',coffee_token:'Кафето',empty_two_liter:'Междублоковото',flat_ball:'Игрището',napkin_number:'Кафето',coffee_spoon:'Кафето',crumpled_schedule:'Спирката',whistle:'Игрището'}[q.target]||'съответната зона');return '👉 Отиди на <b>'+where+'</b> и използвай <b>„Претърси района“</b>, докато намериш нужния предмет.'}
async function loadNpcQuests(){const host=document.getElementById('npcQuests');if(!host||!currentUser)return;const {data,error}=await sb.rpc('get_npc_quests');if(error)return;npcQuestCache=data||[];host.innerHTML=(data||[]).map(q=>{const done=q.progress>=q.amount&&q.extra_progress>=q.extra_amount;const extra=q.extra_amount?`<div>${questThing(q.extra_target)}: ${q.extra_progress}/${q.extra_amount}</div>`:'';return `<article class="npc-quest ${done?'quest-ready':''}" onclick="openNpcQuestModal(${q.id})" role="button" tabindex="0"><div class="npc-face">${npcEmoji(q.npc)}</div><div><h3>${q.npc}</h3><b>${q.title}</b><p>„${q.description}“</p><div class="quest-progress">${questThing(q.target)}: ${q.progress}/${q.amount}${extra}</div><small>🎁 ${q.money} € · +${q.respect} респект</small>${q.status==='claimed'?'<button disabled>✅ СВЪРШЕНО ЗА ДНЕС</button>':done?`<button class="gold" onclick="claimNpcQuest(${q.id})">ВЗЕМИ НАГРАДАТА</button>`:''}</div></article>`}).join('')}function npcEmoji(n){return n.includes('Краси')?'🍽️':n.includes('Боби')?'🚌':n.includes('Томи')?'🔧':'🧍'}function questThing(c){return({banitsa:'🥐 Банички','Спирката':'🚏 Провери Спирката',key13:'🔧 Ключ 13',zip_tie:'🪢 Свински опашки'}[c]||c)}async function claimNpcQuest(id){const {data,error}=await sb.rpc('claim_npc_quest',{p_quest_id:id});if(error)return alert(error.message);alert(`😎 ${data.npc}: Ставаш.\n+${data.money} € · +${data.respect} респект`);loadNpcQuests();refreshAll()}async function npcQuestVisit(location){await sb.rpc('npc_quest_visit',{p_code:location});loadNpcQuests()}async function npcQuestLoot(location){const {data}=await sb.rpc('roll_quest_loot',{p_location:location});if(data?.found)alert(`📦 Намери: ${data.item}\nМай някой го търсеше...`);loadNpcQuests();return data}
let npcQuestCache=[];
function openNpcQuestModal(id){
 const q=npcQuestCache.find(x=>Number(x.id)===Number(id)); if(!q)return;
 const done=q.progress>=q.amount&&q.extra_progress>=q.extra_amount;
 const extra=q.extra_amount?'<div>'+questThing(q.extra_target)+': '+q.extra_progress+'/'+q.extra_amount+'</div>':'';
 document.getElementById('battleTitle').textContent='🗣️ '+q.npc+' · '+q.title;
 document.getElementById('battleBody').innerHTML='<div class="quest-popup"><p>„'+q.description+'“</p><div class="quest-popup-how">'+questInstruction(q)+'</div><div class="quest-progress">'+questThing(q.target)+': '+q.progress+'/'+q.amount+extra+'</div><p><b>🎁 Награда:</b> '+q.money+' € · +'+q.respect+' респект</p>'+(q.status==='claimed'?'<button disabled>✅ СВЪРШЕНО ЗА ДНЕС</button>':done?'<button class="gold" onclick="claimNpcQuest('+q.id+');closeBattleResult()">ВЗЕМИ НАГРАДАТА</button>':'<small>Изпълни условието и се върни тук за наградата.</small>')+'</div>';
 document.getElementById('battleOverlay').classList.remove('hidden');
}

function openNpcQuestModal(id){
 const q=npcQuestCache.find(x=>Number(x.id)===Number(id)); if(!q)return;
 const done=q.progress>=q.amount&&q.extra_progress>=q.extra_amount;
 const extra=q.extra_amount?'<div>'+questThing(q.extra_target)+': '+q.extra_progress+'/'+q.extra_amount+'</div>':'';
 const overlay=document.getElementById('npcQuestOverlay');
 const box=document.getElementById('npcQuestModalBody');
 document.getElementById('npcQuestModalTitle').textContent='🗣️ '+q.npc+' · '+q.title;
 box.innerHTML='<p>„'+q.description+'“</p><div class="quest-popup-how">'+questInstruction(q)+'</div><div class="quest-progress">'+questThing(q.target)+': '+q.progress+'/'+q.amount+extra+'</div><p><b>🎁 Награда:</b> '+q.money+' € · +'+q.respect+' респект</p>'+(q.status==='claimed'?'<button disabled>✅ СВЪРШЕНО ЗА ДНЕС</button>':done?'<button class="gold" onclick="claimNpcQuest('+q.id+');closeNpcQuestModal()">ВЗЕМИ НАГРАДАТА</button>':'<small>Изпълни условието и се върни тук за наградата.</small>');
 overlay.classList.remove('hidden');
}
function closeNpcQuestModal(){document.getElementById('npcQuestOverlay')?.classList.add('hidden')}

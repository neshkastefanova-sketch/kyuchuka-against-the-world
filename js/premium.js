async function loadPremiumShop(){
 if(!currentUser)return;
 const [{data:items,error},{data:owned}]=await Promise.all([sb.from('premium_items').select('*').eq('active',true).order('category').order('price'),sb.from('premium_inventory').select('item_id,equipped,premium_items(id,name,category,effect_value,prestige_points)').eq('user_id',currentUser.id)]);
 if(error){E('premiumShop').innerHTML=`<div class="msg err">${escapeHtml(bgError(error))}</div>`;return}
 const own=new Map((owned||[]).map(x=>[x.item_id,x]));
 const labels={avatar:'⭐ Специални аватари',vip:'👑 VIP',name:'🎨 Специални имена',gang:'👊 Банда',prestige:'🏠 Гараж, коли и имоти'};
 const cats=['avatar','vip','name','gang','prestige'];
 E('premiumShop').innerHTML=cats.map(cat=>{const list=(items||[]).filter(i=>i.category===cat);if(!list.length)return '';return `<div style="grid-column:1/-1"><h3 style="color:var(--gold);margin:8px 0">${labels[cat]}</h3></div>`+list.map(i=>{const o=own.get(i.id);const canEquip=o&&(!o.equipped||cat==='gang');const action=!o?`<button class="gold" onclick="buyPremium(${i.id})">${i.price} 🪙</button>`:canEquip?`<button class="blue" onclick="equipPremium(${i.id})">${cat==='prestige'?'ПОКАЖИ':'ИЗПОЛЗВАЙ'}</button>`:`<button disabled>АКТИВНО</button>`;return `<div class="premium-item"><b>${escapeHtml(i.name)}</b><small>${escapeHtml(i.description)}${i.prestige_points?`<br>🏆 +${i.prestige_points} престиж`:''}</small>${action}</div>`}).join('')}).join('');
 E('premiumOwned').innerHTML=(owned||[]).length?`<h3>Моята премиум колекция</h3>`+(owned||[]).map(x=>`<div class="tiny">${x.equipped?'✅':'•'} ${escapeHtml(x.premium_items?.name||'Предмет')}</div>`).join(''):'<div class="tiny">Още нямаш премиум предмети.</div>';
 E('premiumBalance').textContent=currentProfile?.premium_coins||0;
}
async function buyPremium(id){if(!confirm('Купуваш този предмет с Кючукойни?'))return;const {data,error}=await sb.rpc('buy_premium_item',{p_item:id});if(error)return alert('❌ '+bgError(error));alert(`✅ Купи ${data.item} за ${data.price} Кючукойни.`);await refreshAll();await loadPremiumShop()}
async function equipPremium(id){const {data,error}=await sb.rpc('equip_premium_item',{p_item:id});if(error)return alert('❌ '+bgError(error));alert('✅ Активира: '+data.item);await refreshAll();await loadPremiumShop();if(E('gangPanel').classList.contains('active'))await loadGangs()}

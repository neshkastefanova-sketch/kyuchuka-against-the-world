const originalLoadPlayersAttackLabel=loadPlayers;
loadPlayers=async function(...args){
  const result=await originalLoadPlayersAttackLabel(...args);
  document.querySelectorAll('.fight-btn').forEach(button=>{
    if(button.textContent.trim()==='ИЗБЕРИ ОРЪЖИЕ')button.textContent='АТАКУВАЙ';
  });
  return result;
};

create or replace function public.gang_battle_attack_message(p_attacker text,p_target text,p_weapon text,p_outcome text)
returns text
language plpgsql
volatile
set search_path=public
as $$
declare r int:=1+floor(random()*3)::int;
begin
 if p_weapon is null then
  if p_outcome='miss' then return p_attacker||' замахва към '||p_target||', но пропуска.'; end if;
  if p_outcome='block' then return p_target||' блокира атаката на '||p_attacker||'.'; end if;
  return p_attacker||' връхлита върху '||p_target||' с квартална комбинация.';
 end if;
 if p_outcome='miss' then return case r when 1 then p_attacker||' размахва '||p_weapon||' към '||p_target||', но уцелва само въздуха.' when 2 then p_attacker||' тръгва геройски с '||p_weapon||' към '||p_target||', но май оръжието не е разбрало плана.' else p_attacker||' пробва номер с '||p_weapon||', а '||p_target||' просто се дръпва навреме.' end; end if;
 if p_outcome='block' then return case r when 1 then p_target||' вижда '||p_weapon||' и блокира '||p_attacker||' в последния момент.' when 2 then p_attacker||' налита с '||p_weapon||', но '||p_target||' се окопитва и спира удара.' else p_target||' оцелява след срещата с '||p_weapon||' и блокира атаката на '||p_attacker||'.' end; end if;
 if lower(p_weapon)=lower('Чехъл') then return case r when 1 then p_attacker||' вади Чехъла на правосъдието и шляпва '||p_target||'.' when 2 then p_attacker||' праща летящ чехъл по '||p_target||' — балканска балистика.' else p_attacker||' напомня на '||p_target||' кой командва вкъщи с един добре насочен чехъл.' end; end if;
 if lower(p_weapon)=lower('Пиратка') then return case r when 1 then p_attacker||' пуска Пиратка в краката на '||p_target||' и кварталът за миг празнува Нова година.' when 2 then p_attacker||' хвърля Пиратка по '||p_target||' — БУМ и малко загубено достойнство.' else p_attacker||' решава, че тишината е надценена, и гърми Пиратка до '||p_target||'.' end; end if;
 if lower(p_weapon)=lower('Кьорфишек') then return case r when 1 then p_attacker||' вади Кьорфишека и стряска '||p_target||' повече, отколкото го боли.' when 2 then p_attacker||' гърми с Кьорфишек към '||p_target||' — шум много, кварталът доволен.' else p_attacker||' прави театър с Кьорфишек, а '||p_target||' плаща цената.' end; end if;
 if lower(p_weapon)=lower('Крик от Голф двойка') then return case r when 1 then p_attacker||' вади Крика от Голф двойката и обяснява на '||p_target||' немската инженерна мисъл.' when 2 then p_attacker||' замахва с Крика от Голф двойка по '||p_target||' — TÜV не би одобрил това.' else p_attacker||' използва Крика от Голф двойка не по предназначение върху '||p_target||'.' end; end if;
 if lower(p_weapon)=lower('Винкел') then return case r when 1 then p_attacker||' вади Винкела и чертае прав ъгъл върху самочувствието на '||p_target||'.' when 2 then p_attacker||' замахва с Винкел по '||p_target||' — геометрията става приложна.' else p_attacker||' мери '||p_target||' с Винкел и резултатът не му харесва.' end; end if;
 if lower(p_weapon)=lower('Точилката на баба Пена') then return case r when 1 then p_attacker||' грабва Точилката на баба Пена и '||p_target||' изведнъж си спомня всички домашни.' when 2 then p_attacker||' налага ред с Точилката на баба Пена върху '||p_target||'.' else p_attacker||' доказва на '||p_target||', че баба Пена не държи точилката само за баница.' end; end if;
 if lower(p_weapon)=lower('Молотов') then return p_attacker||' хвърля Молотов по '||p_target||' и пламъците избухват.'; end if;
 if lower(p_weapon)=lower('Граната') then return case r when 1 then p_attacker||' хвърля Граната към '||p_target||' и всички наоколо преосмислят житейските си избори.' when 2 then p_attacker||' праща Граната по '||p_target||' — това вече е прекалено сериозен квартален спор.' else p_attacker||' решава спора с Граната и '||p_target||' определено не е впечатлен.' end; end if;
 if lower(p_weapon)=lower('Бокс') then return case r when 1 then p_attacker||' слага Бокса и подава метално мнение на '||p_target||'.' when 2 then p_attacker||' обяснява аргумента си на '||p_target||' с Бокс.' else p_attacker||' доближава '||p_target||' и Боксът влиза в разговора.' end; end if;
 if lower(p_weapon) like '%меч%' then return p_attacker||' размахва '||p_weapon||' срещу '||p_target||' все едно кварталът е средновековно царство.'; end if;
 if lower(p_weapon) like '%бухал%' or lower(p_weapon) like '%палка%' then return p_attacker||' замахва с '||p_weapon||' и разклаща '||p_target||' чак до съседния вход.'; end if;
 return case r when 1 then p_attacker||' вади '||p_weapon||' и '||p_target||' веднага разбира, че разговорът приключи.' when 2 then p_attacker||' прилага '||p_weapon||' върху '||p_target||' по начин, който производителят не е предвидил.' else p_attacker||' влиза в бой с '||p_weapon||' и '||p_target||' съжалява, че е дошъл.' end;
end $$;

do $$
declare v text;
begin
 select pg_get_functiondef(p.oid) into v from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='attack_gang_battle' limit 1;
 v:=replace(v,
$old$ if missed then msg:=ap.username||' замахва към '||tp.username||', но пропуска.';
 elsif blocked then msg:=tp.username||' блокира атаката на '||ap.username||'.';
 elsif w.id is null then msg:=ap.username||' '||format(fists[1+floor(random()*array_length(fists,1))::int],tp.username)||'.';
 elsif lower(w.name)=lower('Молотов') then msg:=ap.username||' хвърля Молотов по '||tp.username||' и пламъците избухват.';
 elsif lower(w.name) like '%нож%' then msg:=ap.username||' налита с '||w.name||' и порязва '||tp.username||'.';
 elsif lower(w.name) like '%бухал%' or lower(w.name) like '%тръб%' then msg:=ap.username||' замахва с '||w.name||' и разклаща '||tp.username||'.';
 else msg:=ap.username||' използва '||w.name||' срещу '||tp.username||'.'; end if;$old$,
$new$ if w.id is null then
  if missed then msg:=ap.username||' замахва към '||tp.username||', но пропуска.';
  elsif blocked then msg:=tp.username||' блокира атаката на '||ap.username||'.';
  else msg:=ap.username||' '||format(fists[1+floor(random()*array_length(fists,1))::int],tp.username)||'.'; end if;
 else
  msg:=public.gang_battle_attack_message(ap.username,tp.username,w.name,case when missed then 'miss' when blocked then 'block' else 'hit' end);
 end if;$new$);
 execute v;
end $$;

alter table public.profiles add column if not exists is_bot boolean not null default false;

create table if not exists public.bot_personas (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  persona_key text not null unique,
  favorite_location text not null,
  personality text not null,
  enabled boolean not null default true,
  last_action_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.bot_personas enable row level security;
drop policy if exists "bot personas readable" on public.bot_personas;
create policy "bot personas readable" on public.bot_personas for select using (true);

insert into auth.users (id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-4000-8000-000000000101','authenticated','authenticated','bot+krasi@kyuchuka.invalid',now(),'{"provider":"bot","providers":["bot"]}'::jsonb,'{"username":"Краси Дебелия","side":"Кючука","avatar_key":"a01","bot":true}'::jsonb,now(),now()),
('00000000-0000-4000-8000-000000000102','authenticated','authenticated','bot+dancho@kyuchuka.invalid',now(),'{"provider":"bot","providers":["bot"]}'::jsonb,'{"username":"Данчо Жълтия","side":"Кючука","avatar_key":"a03","bot":true}'::jsonb,now(),now()),
('00000000-0000-4000-8000-000000000103','authenticated','authenticated','bot+bobi@kyuchuka.invalid',now(),'{"provider":"bot","providers":["bot"]}'::jsonb,'{"username":"Боби Рейса","side":"Кючука","avatar_key":"a01","bot":true}'::jsonb,now(),now()),
('00000000-0000-4000-8000-000000000104','authenticated','authenticated','bot+tomi@kyuchuka.invalid',now(),'{"provider":"bot","providers":["bot"]}'::jsonb,'{"username":"бат Томи","side":"Кючука","avatar_key":"a03","bot":true}'::jsonb,now(),now())
on conflict (id) do nothing;

insert into public.profiles (id,username,side,level,respect,money,hp,energy,strength,defense,luck,wins,losses,avatar_key,street_location,street_activity,street_updated_at,talent_brawler,talent_hustler,talent_local,is_bot)
values
('00000000-0000-4000-8000-000000000101','Краси Дебелия','Кючука',4,82,245,100,100,16,17,8,9,7,'a01','Кафето','мисли какво да яде',now(),2,4,5,true),
('00000000-0000-4000-8000-000000000102','Данчо Жълтия','Кючука',5,118,170,100,100,21,16,7,15,10,'a03','Игрището','обяснява защо Каравелов е номер едно',now(),6,2,5,true),
('00000000-0000-4000-8000-000000000103','Боби Рейса','Кючука',3,61,95,100,100,13,14,11,5,8,'a01','Спирката','кефи се на рейсовете',now(),1,2,7,true),
('00000000-0000-4000-8000-000000000104','бат Томи','Кючука',6,146,310,100,100,22,24,6,18,9,'a03','Междублоковото','ремонтира Голф 2-ката',now(),5,5,6,true)
on conflict (id) do update set is_bot=true;

insert into public.bot_personas(user_id,persona_key,favorite_location,personality)
values
('00000000-0000-4000-8000-000000000101','krasi_debeliya','Кафето','Обича да яде, да си угажда, да пие кафе и да не бърза за никъде.'),
('00000000-0000-4000-8000-000000000102','dancho_zhaltiya','Игрището','Заклет фен на Каравелов. Лесно се пали, когато някой се заяде с квартала.'),
('00000000-0000-4000-8000-000000000103','bobi_reysa','Спирката','Малко смахнат фен на рейсовете. Може да стои с часове на спирката и да им се радва.'),
('00000000-0000-4000-8000-000000000104','bat_tomi','Междублоковото','Непрекъснато ремонтира своя Golf 2 и винаги има мнение коя част пак е заминала.')
on conflict (user_id) do update set favorite_location=excluded.favorite_location,personality=excluded.personality,enabled=true;

create or replace function public.run_neighborhood_bots()
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
 b record; r double precision; new_location text; new_activity text; phrase text;
begin
 for b in select p.*,bp.persona_key,bp.favorite_location from public.profiles p join public.bot_personas bp on bp.user_id=p.id where p.is_bot and bp.enabled loop
  r:=random();
  new_location:=b.street_location;
  if r < 0.28 then
    if random()<0.62 then new_location:=b.favorite_location;
    else new_location:=(array['Дискотека Венера','Междублоковото','Тъмната уличка','Кафето','Игрището','Спирката'])[1+floor(random()*6)::int]; end if;
  end if;
  if b.persona_key='krasi_debeliya' then
    new_activity:=(array['мисли какво да яде','пие кафе след яденето','поръчва още едно','яде нещо набързо вече 40 минути','си угажда'])[1+floor(random()*5)::int];
    phrase:=(array['Някой ще яде ли нещо?','Аз само едно кафе... и нещо към него.','Диета от понеделник. Кой понеделник не съм казал.'])[1+floor(random()*3)::int];
  elsif b.persona_key='dancho_zhaltiya' then
    new_activity:=(array['говори за Каравелов','прави се на тежък','гледа кой какво говори за Каравелов','прави мохабет','тренира'])[1+floor(random()*5)::int];
    phrase:=(array['Каравелов е друго измерение.','Айде по-леко с Каравелов.','Ти бил ли си изобщо в Каравелов?'])[1+floor(random()*3)::int];
  elsif b.persona_key='bobi_reysa' then
    new_location:=case when random()<0.82 then 'Спирката' else new_location end;
    new_activity:=(array['чака рейса','кефи се на рейсовете','зяпа кой рейс идва','брои рейсовете','обяснява кой модел рейс е това'])[1+floor(random()*5)::int];
    phrase:=(array['Тоя рейс го познавам по звука.','Ей сега ще мине хубав рейс.','Този шофьор много плавно го взима завоя.'])[1+floor(random()*3)::int];
  else
    new_activity:=(array['ремонтира Голф 2-ката','търси части за Голфа','обяснява защо Golf 2 е вечен','пак е под Голфа','пали Голфа за проба'])[1+floor(random()*5)::int];
    phrase:=(array['Само една дреболия остана по Голфа.','За Golf 2 части винаги се намират.','Не е повреда, профилактика е.'])[1+floor(random()*3)::int];
  end if;
  update public.profiles set street_location=new_location,street_activity=new_activity,street_updated_at=now(),energy=least(100,energy+5),money=money+(case when random()<0.15 then 3 else 0 end),respect=respect+(case when random()<0.08 then 1 else 0 end) where id=b.id;
  update public.bot_personas set last_action_at=now() where user_id=b.id;
  if random()<0.16 then
    insert into public.street_messages(user_id,location,message,created_at) values(b.id,new_location,phrase,now());
  end if;
 end loop;
end $$;

revoke all on function public.run_neighborhood_bots() from public;
grant execute on function public.run_neighborhood_bots() to service_role;

create extension if not exists pg_cron with schema extensions;
do $$
begin
 if exists(select 1 from cron.job where jobname='neighborhood-bots') then perform cron.unschedule('neighborhood-bots'); end if;
 perform cron.schedule('neighborhood-bots','*/7 * * * *','select public.run_neighborhood_bots();');
end $$;
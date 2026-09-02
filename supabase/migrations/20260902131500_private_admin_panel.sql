create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_current_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(select 1 from public.admin_users a where a.user_id=auth.uid());
$$;

create or replace function public.get_admin_users()
returns table(
  user_id uuid,
  username text,
  email text,
  side text,
  level integer,
  respect integer,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  is_bot boolean
)
language plpgsql
security definer
set search_path=public
as $$
begin
  if not exists(select 1 from public.admin_users a where a.user_id=auth.uid()) then
    raise exception 'admin access required';
  end if;

  return query
  select
    u.id,
    p.username,
    u.email::text,
    p.side,
    p.level,
    p.respect,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    coalesce(p.is_bot,false)
  from auth.users u
  left join public.profiles p on p.id=u.id
  order by u.created_at desc;
end;
$$;

revoke all on function public.is_current_admin() from public;
revoke all on function public.get_admin_users() from public;
grant execute on function public.is_current_admin() to authenticated;
grant execute on function public.get_admin_users() to authenticated;

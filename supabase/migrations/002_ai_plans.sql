-- 002 - AI plans & usage
begin;

-- Plans
create table if not exists public.plans (
  name text primary key,
  seats_limit int not null,
  clients_limit int not null,
  ai_posts_quota int not null
);
insert into public.plans(name, seats_limit, clients_limit, ai_posts_quota) values
  ('Starter', 3, 5, 50),
  ('Pro',     10, 20, 300),
  ('Business',50, 200, 3000)
on conflict (name) do nothing;

-- Agency plan
create table if not exists public.agency_plans (
  agency_id uuid primary key references public.agencies(id) on delete cascade,
  plan_name text not null references public.plans(name),
  trial_end_at timestamptz,
  overage_enabled boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trigger updated_at
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger if not exists trg_agency_plans_updated before update on public.agency_plans for each row execute function public.set_updated_at();

-- AI usage
create table if not exists public.ai_usage (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  yyyymm char(7) not null,
  posts_generated int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (agency_id, yyyymm)
);
create trigger if not exists trg_ai_usage_updated before update on public.ai_usage for each row execute function public.set_updated_at();

-- Helpers
create or replace function public.ai_current_month() returns char(7) language sql immutable as $$
  select to_char(date_trunc('month', now()), 'YYYY-MM')::char(7)
$$;

-- Summary (corrigida com qualificação)
create or replace function public.ai_usage_summary(p_agency_id uuid)
returns table(
  plan_name text,
  yyyymm char(7),
  used int,
  quota int,
  remaining int,
  overage_enabled boolean,
  trial_end_at timestamptz
) language plpgsql security definer set search_path=public as $$
declare v_plan text; v_quota int; v_used int; v_month char(7); v_over boolean; v_trial timestamptz; begin
  if not public.is_agency_member(p_agency_id) then raise exception 'Permissão negada'; end if;
  v_month := public.ai_current_month();
  select ap.plan_name, p.ai_posts_quota, ap.overage_enabled, ap.trial_end_at into v_plan, v_quota, v_over, v_trial
  from public.agency_plans ap join public.plans p on p.name = ap.plan_name
  where ap.agency_id = p_agency_id and ap.active = true limit 1;
  if v_plan is null then v_plan := 'Starter'; select ai_posts_quota into v_quota from public.plans where name='Starter'; v_over:=false; v_trial:=null; end if;
  select au.posts_generated into v_used from public.ai_usage au where au.agency_id=p_agency_id and au.yyyymm=v_month; v_used := coalesce(v_used,0);
  return query select v_plan, v_month::char(7), v_used, v_quota, greatest(v_quota-v_used,0), v_over, v_trial; end; $$;

-- Check quota
create or replace function public.can_use_ai_posts(amount int, p_agency_id uuid)
returns table(allowed boolean, yyyymm char(7), used int, quota int, remaining int) language plpgsql security definer set search_path=public as $$
declare s record; begin
  select * into s from public.ai_usage_summary(p_agency_id);
  if s.plan_name is null then return query select false, s.yyyymm, 0, 0, 0; return; end if;
  if (s.remaining >= coalesce(amount,0)) or s.overage_enabled or (s.trial_end_at is not null and s.trial_end_at>now()) then
    return query select true, s.yyyymm, s.used, s.quota, s.remaining; else
    return query select false, s.yyyymm, s.used, s.quota, s.remaining; end if; end; $$;

-- Increment usage (corrigida)
drop function if exists public.inc_ai_posts(integer, uuid);
create or replace function public.inc_ai_posts(amount int, p_agency_id uuid)
returns table(new_total int, out_month char(7)) language plpgsql security definer set search_path=public as $$
declare v_month char(7);
begin
  if amount is null or amount<=0 then return query select 0, public.ai_current_month(); return; end if;
  if not public.is_agency_member(p_agency_id) then raise exception 'Permissão negada'; end if;
  v_month := public.ai_current_month();
  insert into public.ai_usage(agency_id, yyyymm, posts_generated)
  values (p_agency_id, v_month, amount)
  on conflict (agency_id, yyyymm) do update set posts_generated = public.ai_usage.posts_generated + excluded.posts_generated, updated_at=now();
  return query select ai.posts_generated, ai.yyyymm from public.ai_usage ai where ai.agency_id=p_agency_id and ai.yyyymm=v_month; end; $$;

commit;

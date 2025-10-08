-- 003 - Invitations
begin;

create or replace function public.is_agency_admin(aid uuid)
returns boolean language sql security definer set search_path=public as $$
  select exists(select 1 from public.agency_members am where am.agency_id=aid and am.user_id=auth.uid() and am.role='agency_admin');
$$;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  email text not null,
  role text not null check (role in ('agency_admin','social_media','client_viewer')),
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.invitations enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='invitations' and policyname='invitations_select_admin') then
    create policy "invitations_select_admin" on public.invitations for select using (public.is_agency_admin(agency_id)); end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='invitations' and policyname='invitations_insert_admin') then
    create policy "invitations_insert_admin" on public.invitations for insert with check (public.is_agency_admin(agency_id)); end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='invitations' and policyname='invitations_update_admin') then
    create policy "invitations_update_admin" on public.invitations for update using (public.is_agency_admin(agency_id)) with check (public.is_agency_admin(agency_id)); end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='invitations' and policyname='invitations_delete_admin') then
    create policy "invitations_delete_admin" on public.invitations for delete using (public.is_agency_admin(agency_id)); end if;
end $$;

-- RPCs
-- create_invitation com nomes sem colisão
drop function if exists public.create_invitation(uuid, text, text, int);
create or replace function public.create_invitation(p_agency_id uuid, p_email text, p_role text, p_days int default 14)
returns table (invite_id uuid, invite_token uuid, invite_expires_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_token uuid; v_expires timestamptz; begin
  if not public.is_agency_admin(p_agency_id) then raise exception 'Permissão negada (apenas agency_admin)'; end if;
  if p_role not in ('agency_admin','social_media','client_viewer') then raise exception 'Papel inválido'; end if;
  insert into public.invitations(agency_id, email, role, expires_at)
  values (p_agency_id, trim(p_email), p_role, now() + make_interval(days => greatest(p_days,1)))
  returning id, token, expires_at into v_id, v_token, v_expires;
  return query select v_id, v_token, v_expires; end; $$;

create or replace function public.get_invitation_info(p_token uuid)
returns table (agency_id uuid, agency_name text, email text, role text, expires_at timestamptz, status text)
language plpgsql security definer set search_path=public as $$ begin
  return query
  select i.agency_id, a.name, i.email, i.role, i.expires_at,
         case when i.accepted_at is not null then 'accepted' when now()>i.expires_at then 'expired' else 'pending' end
  from public.invitations i join public.agencies a on a.id=i.agency_id
  where i.token = p_token limit 1; end; $$;

drop function if exists public.accept_invitation(uuid);
create or replace function public.accept_invitation(p_token uuid)
returns table(out_agency_id uuid, out_role text, out_member_user uuid)
language plpgsql security definer set search_path=public as $$
declare v_user uuid; v_agency uuid; v_role text; begin
  v_user := auth.uid(); if v_user is null then raise exception 'Precisa estar autenticado para aceitar convite'; end if;
  select i.agency_id, i.role into v_agency, v_role from public.invitations i
  where i.token=p_token and i.accepted_at is null and i.expires_at>=now() limit 1;
  if v_agency is null then raise exception 'Convite inválido ou expirado'; end if;
  insert into public.agency_members(agency_id, user_id, role) values (v_agency, v_user, v_role)
  on conflict (agency_id, user_id) do update set role=excluded.role;
  update public.invitations set accepted_at=now(), accepted_by=v_user where token=p_token;
  return query select v_agency, v_role, v_user; end; $$;

commit;

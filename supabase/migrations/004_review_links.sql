-- 004 - Public review links
begin;

create table if not exists public.review_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  can_comment boolean not null default true,
  expires_at timestamptz not null default (now() + interval '30 days'),
  disabled boolean not null default false,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.review_links enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='review_links' and policyname='review_links_select_members') then
    create policy "review_links_select_members" on public.review_links for select using (
      exists (select 1 from public.projects p join public.agency_members am on am.agency_id=p.agency_id and am.user_id=auth.uid() where p.id=review_links.project_id)
    ); end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='review_links' and policyname='review_links_insert_admin') then
    create policy "review_links_insert_admin" on public.review_links for insert with check (
      exists (select 1 from public.projects p join public.agency_members am on am.agency_id=p.agency_id and am.user_id=auth.uid() and am.role='agency_admin' where p.id=review_links.project_id)
    ); end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='review_links' and policyname='review_links_update_admin') then
    create policy "review_links_update_admin" on public.review_links for update using (
      exists (select 1 from public.projects p join public.agency_members am on am.agency_id=p.agency_id and am.user_id=auth.uid() and am.role='agency_admin' where p.id=review_links.project_id)
    ) with check (
      exists (select 1 from public.projects p join public.agency_members am on am.agency_id=p.agency_id and am.user_id=auth.uid() and am.role='agency_admin' where p.id=review_links.project_id)
    ); end if;
end $$;

-- RPCs
create or replace function public.create_review_link(p_project_id uuid, p_days int default 30)
returns table (link_token uuid, link_expires_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare v_agency uuid; v_token uuid; v_expires timestamptz; begin
  select p.agency_id into v_agency from public.projects p where p.id=p_project_id;
  if v_agency is null then raise exception 'Projeto não encontrado'; end if;
  if not public.is_agency_admin(v_agency) then raise exception 'Permissão negada (somente admin)'; end if;
  insert into public.review_links(project_id, expires_at) values (p_project_id, now()+make_interval(days=>greatest(p_days,1))) returning token, expires_at into v_token, v_expires;
  return query select v_token, v_expires; end; $$;

create or replace function public.get_review_info(p_token uuid)
returns table (project_id uuid, project_name text, client_name text, month char(7), expires_at timestamptz, expired boolean)
language plpgsql security definer set search_path=public as $$
declare v_project uuid; v_expires timestamptz; begin
  select rl.project_id, rl.expires_at into v_project, v_expires from public.review_links rl where rl.token=p_token and rl.disabled=false limit 1;
  if v_project is null then return; end if;
  return query select p.id, p.name, c.name, p.month, v_expires, (now()>v_expires)
  from public.projects p join public.clients c on c.id=p.client_id where p.id=v_project limit 1; end; $$;

create or replace function public.list_review_posts(p_token uuid)
returns table (id uuid, date date, title text, arte text, legenda text, cta text, status text, revision_comment text)
language sql security definer set search_path=public as $$
  select po.id, po.date, po.title, po.arte, po.legenda, po.cta, po.status::text, po.revision_comment
  from public.review_links rl join public.posts po on po.project_id=rl.project_id
  where rl.token=p_token and rl.disabled=false and rl.expires_at>=now()
  order by po.date nulls last, po.created_at;
$$;

drop function if exists public.apply_review_action(uuid, uuid, text, text, text);
create or replace function public.apply_review_action(p_token uuid, p_post_id uuid, p_action text, p_comment text default null, p_actor text default null)
returns table (out_post_id uuid, new_status text)
language plpgsql security definer set search_path=public as $$
declare v_project uuid; v_agency uuid; v_valid boolean; v_status text; begin
  select rl.project_id into v_project from public.review_links rl where rl.token=p_token and rl.disabled=false and rl.expires_at>=now() limit 1;
  if v_project is null then raise exception 'Link inválido ou expirado'; end if;
  select exists(select 1 from public.posts p where p.id=p_post_id and p.project_id=v_project) into v_valid;
  if not v_valid then raise exception 'Post não pertence a este projeto'; end if;
  select p.agency_id into v_agency from public.projects p where p.id=v_project;
  if p_action='approve' then
    update public.posts set status='Aprovado'::public.post_status, approved_by=null, approved_at=now(), revision_comment=null, updated_at=now() where id=p_post_id;
    v_status:='Aprovado';
  elsif p_action='request_changes' then
    update public.posts set status='Ajustar'::public.post_status, revision_comment=coalesce(p_comment,''), approved_by=null, approved_at=null, updated_at=now() where id=p_post_id;
    v_status:='Ajustar';
  else
    raise exception 'Ação inválida. Use approve|request_changes';
  end if;
  insert into public.logs(agency_id, actor_user_id, entity_type, entity_id, action, meta)
  values (v_agency, null, 'post', p_post_id, concat('review_', p_action, '_public'), jsonb_build_object('actor', p_actor, 'comment', p_comment));
  return query select p_post_id, v_status; end; $$;

commit;

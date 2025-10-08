-- 005 - reset_seed function for DEV
begin;

drop function if exists public.reset_seed(uuid, uuid, uuid);
create or replace function public.reset_seed(p_admin_user uuid, p_sm_user uuid, p_client_user uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_agency uuid := '9d4e658d-c2a9-4ffd-8a6b-25f4163901c4'; v_client uuid := 'abe3477a-0a48-4753-9d81-05073796548e'; v_project uuid := '8a9d3356-14f8-4a04-987a-400c9941613b'; begin
  delete from public.logs; delete from public.kanban_cards; delete from public.kanban_columns; delete from public.posts; delete from public.review_links; delete from public.invitations; delete from public.projects; delete from public.clients; delete from public.ai_usage; delete from public.agency_plans; delete from public.agency_members; delete from public.agencies;
  insert into public.agencies(id, name, created_by) values (v_agency, 'Minha Agência (Seed)', p_admin_user);
  insert into public.agency_members(agency_id, user_id, role) values (v_agency, p_admin_user,'agency_admin'), (v_agency, p_sm_user,'social_media'), (v_agency, p_client_user,'client_viewer') on conflict (agency_id, user_id) do update set role=excluded.role;
  insert into public.clients(id, agency_id, name, website, timezone) values (v_client, v_agency, 'Cliente Alpha', 'https://clientealpha.com', 'America/Sao_Paulo');
  insert into public.projects(id, agency_id, client_id, name, month, starts_on, ends_on) values (v_project, v_agency, v_client, '2025-10 — Cliente Alpha', '2025-10', '2025-10-01', '2025-10-31');
  insert into public.kanban_columns(agency_id, project_id, name, position)
  select v_agency, v_project, x.name, x.pos from (values ('A criar',1),('Em revisão',2),('Aprovado',3),('Ajustar',4)) as x(name,pos)
  on conflict (project_id, name) do nothing;
  insert into public.posts(id, agency_id, client_id, project_id, date, title, arte, legenda, cta, status) values
    (gen_random_uuid(), v_agency, v_client, v_project, '2025-10-12', 'Dia das Crianças / Nossa Senhora Aparecida', 'Carrossel: celebração com elementos infantis', 'Hoje celebramos o Dia das Crianças e Nossa Senhora Aparecida. Que a alegria inspire nossos projetos!', 'Fale com nossa equipe', 'Em revisão'),
    (gen_random_uuid(), v_agency, v_client, v_project, '2025-10-15', 'Lançamento de feature', 'Feed estático com destaque da novidade', 'Apresentamos uma nova feature para otimizar sua obra com drywall!', 'Saiba mais no site', 'A criar');
  insert into public.kanban_cards(agency_id, project_id, post_id, column_id)
  select v_agency, v_project, p.id, c.id from public.posts p join public.kanban_columns c on c.project_id=v_project and c.name=p.status::text where p.project_id=v_project on conflict (post_id) do update set column_id=excluded.column_id;
  insert into public.agency_plans(agency_id, plan_name, trial_end_at, overage_enabled, active) values (v_agency, 'Pro', now()+interval '14 days', false, true)
  on conflict (agency_id) do update set plan_name=excluded.plan_name, trial_end_at=excluded.trial_end_at, overage_enabled=excluded.overage_enabled, active=true;
  insert into public.ai_usage(agency_id, yyyymm, posts_generated) values (v_agency, public.ai_current_month(), 0) on conflict (agency_id, yyyymm) do nothing;
end; $$;

commit;

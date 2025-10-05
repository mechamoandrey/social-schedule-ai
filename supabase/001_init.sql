BEGIN;

-- Extensões
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- TABELAS BASE
CREATE TABLE IF NOT EXISTS public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.agency_members (
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('agency_admin','social_media','client_viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agency_id, user_id)
);
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- Função helper (depois das tabelas)
CREATE OR REPLACE FUNCTION public.is_agency_member(aid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM agency_members m
    WHERE m.agency_id = aid
      AND m.user_id = auth.uid()
  );
$$;

-- POLICIES (SEM IF NOT EXISTS): drop e recria

-- agencies
DROP POLICY IF EXISTS "agencies_select_member" ON public.agencies;
CREATE POLICY "agencies_select_member" ON public.agencies
  FOR SELECT USING (is_agency_member(id));

DROP POLICY IF EXISTS "agencies_insert_any_auth" ON public.agencies;
CREATE POLICY "agencies_insert_any_auth" ON public.agencies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "agencies_update_admin" ON public.agencies;
CREATE POLICY "agencies_update_admin" ON public.agencies
  FOR UPDATE USING (
    EXISTS(SELECT 1 FROM agency_members am
           WHERE am.agency_id = id
             AND am.user_id = auth.uid()
             AND am.role = 'agency_admin')
  )
  WITH CHECK (
    EXISTS(SELECT 1 FROM agency_members am
           WHERE am.agency_id = id
             AND am.user_id = auth.uid()
             AND am.role = 'agency_admin')
  );

DROP POLICY IF EXISTS "agencies_delete_admin" ON public.agencies;
CREATE POLICY "agencies_delete_admin" ON public.agencies
  FOR DELETE USING (
    EXISTS(SELECT 1 FROM agency_members am
           WHERE am.agency_id = id
             AND am.user_id = auth.uid()
             AND am.role = 'agency_admin')
  );

-- Trigger: ao criar agência, adiciona o criador como admin
CREATE OR REPLACE FUNCTION public.handle_agency_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agency_members(agency_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'agency_admin')
  ON CONFLICT (agency_id, user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_agency_after_insert ON public.agencies;
CREATE TRIGGER trg_agency_after_insert
AFTER INSERT ON public.agencies
FOR EACH ROW EXECUTE FUNCTION public.handle_agency_after_insert();

-- clients
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  website text,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, name)
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_members" ON public.clients;
CREATE POLICY "clients_select_members" ON public.clients
  FOR SELECT USING (is_agency_member(agency_id));

DROP POLICY IF EXISTS "clients_insert_member" ON public.clients;
CREATE POLICY "clients_insert_member" ON public.clients
  FOR INSERT WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "clients_update_member" ON public.clients;
CREATE POLICY "clients_update_member" ON public.clients
  FOR UPDATE USING (is_agency_member(agency_id))
  WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "clients_delete_admin" ON public.clients;
CREATE POLICY "clients_delete_admin" ON public.clients
  FOR DELETE USING (
    EXISTS(SELECT 1 FROM agency_members am
           WHERE am.agency_id = agency_id
             AND am.user_id = auth.uid()
             AND am.role = 'agency_admin')
  );

-- projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  month char(7) NOT NULL, -- 'YYYY-MM'
  starts_on date,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, month)
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_members" ON public.projects;
CREATE POLICY "projects_select_members" ON public.projects
  FOR SELECT USING (is_agency_member(agency_id));

DROP POLICY IF EXISTS "projects_insert_member" ON public.projects;
CREATE POLICY "projects_insert_member" ON public.projects
  FOR INSERT WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "projects_update_member" ON public.projects;
CREATE POLICY "projects_update_member" ON public.projects
  FOR UPDATE USING (is_agency_member(agency_id))
  WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "projects_delete_admin" ON public.projects;
CREATE POLICY "projects_delete_admin" ON public.projects
  FOR DELETE USING (
    EXISTS(SELECT 1 FROM agency_members am
           WHERE am.agency_id = agency_id
             AND am.user_id = auth.uid()
             AND am.role = 'agency_admin')
  );

-- Status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
    CREATE TYPE public.post_status AS ENUM ('A criar','Em revisão','Aprovado','Ajustar');
  END IF;
END $$;

-- posts
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  platform text,
  date date NOT NULL,
  title text NOT NULL,
  arte text,
  legenda text,
  cta text,
  status public.post_status NOT NULL DEFAULT 'A criar',
  ai_metadata jsonb,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  revision_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_by_project_date ON public.posts(project_id, date);
CREATE INDEX IF NOT EXISTS posts_by_client_date ON public.posts(client_id, date);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_members" ON public.posts;
CREATE POLICY "posts_select_members" ON public.posts
  FOR SELECT USING (is_agency_member(agency_id));

DROP POLICY IF EXISTS "posts_insert_member" ON public.posts;
CREATE POLICY "posts_insert_member" ON public.posts
  FOR INSERT WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "posts_update_member" ON public.posts;
CREATE POLICY "posts_update_member" ON public.posts
  FOR UPDATE USING (is_agency_member(agency_id))
  WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "posts_delete_admin" ON public.posts;
CREATE POLICY "posts_delete_admin" ON public.posts
  FOR DELETE USING (
    EXISTS(SELECT 1 FROM agency_members am
           WHERE am.agency_id = agency_id
             AND am.user_id = auth.uid()
             AND am.role = 'agency_admin')
  );

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_posts_set_updated_at ON public.posts;
CREATE TRIGGER trg_posts_set_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- preencher agency_id/client_id a partir do projeto
CREATE OR REPLACE FUNCTION public.fill_post_refs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p RECORD;
BEGIN
  SELECT agency_id, client_id INTO p FROM public.projects WHERE id = NEW.project_id;
  NEW.agency_id := p.agency_id;
  NEW.client_id := p.client_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_posts_before_insert_fill_refs ON public.posts;
CREATE TRIGGER trg_posts_before_insert_fill_refs
BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.fill_post_refs();

-- kanban: colunas
CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL,
  UNIQUE (project_id, name)
);
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "columns_select_members" ON public.kanban_columns;
CREATE POLICY "columns_select_members" ON public.kanban_columns
  FOR SELECT USING (is_agency_member(agency_id));

DROP POLICY IF EXISTS "columns_insert_member" ON public.kanban_columns;
CREATE POLICY "columns_insert_member" ON public.kanban_columns
  FOR INSERT WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "columns_update_member" ON public.kanban_columns;
CREATE POLICY "columns_update_member" ON public.kanban_columns
  FOR UPDATE USING (is_agency_member(agency_id))
  WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "columns_delete_member" ON public.kanban_columns;
CREATE POLICY "columns_delete_member" ON public.kanban_columns
  FOR DELETE USING (is_agency_member(agency_id));

-- kanban: cards
CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
  assignee uuid REFERENCES auth.users(id),
  labels text[] DEFAULT '{}',
  due_at timestamptz
);
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cards_select_members" ON public.kanban_cards;
CREATE POLICY "cards_select_members" ON public.kanban_cards
  FOR SELECT USING (is_agency_member(agency_id));

DROP POLICY IF EXISTS "cards_insert_member" ON public.kanban_cards;
CREATE POLICY "cards_insert_member" ON public.kanban_cards
  FOR INSERT WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "cards_update_member" ON public.kanban_cards;
CREATE POLICY "cards_update_member" ON public.kanban_cards
  FOR UPDATE USING (is_agency_member(agency_id))
  WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "cards_delete_member" ON public.kanban_cards;
CREATE POLICY "cards_delete_member" ON public.kanban_cards
  FOR DELETE USING (is_agency_member(agency_id));

-- logs
CREATE TABLE IF NOT EXISTS public.logs (
  id bigserial PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select_members" ON public.logs;
CREATE POLICY "logs_select_members" ON public.logs
  FOR SELECT USING (is_agency_member(agency_id));

DROP POLICY IF EXISTS "logs_insert_member" ON public.logs;
CREATE POLICY "logs_insert_member" ON public.logs
  FOR INSERT WITH CHECK (is_agency_member(agency_id));

-- colunas padrão do kanban ao criar projeto
CREATE OR REPLACE FUNCTION public.create_default_kanban_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.kanban_columns(agency_id, project_id, name, position)
  VALUES
    (NEW.agency_id, NEW.id, 'A criar', 1),
    (NEW.agency_id, NEW.id, 'Em revisão', 2),
    (NEW.agency_id, NEW.id, 'Aprovado', 3),
    (NEW.agency_id, NEW.id, 'Ajustar', 4);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_projects_after_insert_columns ON public.projects;
CREATE TRIGGER trg_projects_after_insert_columns
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.create_default_kanban_columns();

-- sincroniza coluna do card ao mudar status do post
CREATE OR REPLACE FUNCTION public.sync_card_on_post_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE target_column uuid;
BEGIN
  SELECT c.id INTO target_column
  FROM public.kanban_columns c
  WHERE c.project_id = NEW.project_id
    AND c.name = NEW.status::text
  LIMIT 1;

  IF EXISTS (SELECT 1 FROM public.kanban_cards k WHERE k.post_id = NEW.id) THEN
    UPDATE public.kanban_cards SET column_id = COALESCE(target_column, column_id)
    WHERE post_id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_posts_after_update_status ON public.posts;
CREATE TRIGGER trg_posts_after_update_status
AFTER UPDATE OF status ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.sync_card_on_post_status();

-- cria card ao inserir post
CREATE OR REPLACE FUNCTION public.create_card_for_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE initial_col uuid;
BEGIN
  SELECT c.id INTO initial_col
  FROM public.kanban_columns c
  WHERE c.project_id = NEW.project_id
    AND c.name = 'A criar'
  LIMIT 1;

  IF initial_col IS NOT NULL THEN
    INSERT INTO public.kanban_cards(agency_id, project_id, post_id, column_id)
    VALUES (NEW.agency_id, NEW.project_id, NEW.id, initial_col);
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_posts_after_insert_card ON public.posts;
CREATE TRIGGER trg_posts_after_insert_card
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.create_card_for_post();

COMMIT;

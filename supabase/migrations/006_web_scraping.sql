BEGIN;

-- ============================================
-- WEB SCRAPING - Cliente Website Analysis
-- ============================================

-- Tabela para armazenar dados de scraping dos websites dos clientes
CREATE TABLE IF NOT EXISTS public.client_scraped_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  -- Dados brutos do scraping
  scraped_at timestamptz NOT NULL DEFAULT now(),
  website_url text NOT NULL,
  pages_scraped jsonb NOT NULL DEFAULT '[]',

  -- Dados estruturados pela IA
  business_type text,
  about text, 
  products_or_services jsonb, 
  location text, 
  target_audience text, 
  key_differentials text[], 
  themes_for_posts text[], 

  -- Metadata do scraping
  scraping_duration_ms int, 
  total_pages int, 
  error_log text, 

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint: um registro por cliente (atualiza ao re-scrapar)
  UNIQUE(client_id)
);

-- Comentários
COMMENT ON TABLE public.client_scraped_data IS 'Dados extraídos automaticamente dos websites dos clientes via web scraping';
COMMENT ON COLUMN public.client_scraped_data.pages_scraped IS 'Array de páginas scrapadas com conteúdo bruto';
COMMENT ON COLUMN public.client_scraped_data.products_or_services IS 'Produtos/serviços estruturados pela IA';
COMMENT ON COLUMN public.client_scraped_data.business_type IS 'Tipo de negócio identificado pela IA';

-- Enable RLS
ALTER TABLE public.client_scraped_data ENABLE ROW LEVEL SECURITY;

-- Policies: SELECT
DROP POLICY IF EXISTS "scraped_data_select_members" ON public.client_scraped_data;
CREATE POLICY "scraped_data_select_members" ON public.client_scraped_data
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM clients c
      WHERE c.id = client_id
        AND is_agency_member(c.agency_id)
    )
  );

-- Policies: INSERT
DROP POLICY IF EXISTS "scraped_data_insert_member" ON public.client_scraped_data;
CREATE POLICY "scraped_data_insert_member" ON public.client_scraped_data
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM clients c
      WHERE c.id = client_id
        AND is_agency_member(c.agency_id)
    )
  );

-- Policies: UPDATE
DROP POLICY IF EXISTS "scraped_data_update_member" ON public.client_scraped_data;
CREATE POLICY "scraped_data_update_member" ON public.client_scraped_data
  FOR UPDATE USING (
    EXISTS(
      SELECT 1 FROM clients c
      WHERE c.id = client_id
        AND is_agency_member(c.agency_id)
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM clients c
      WHERE c.id = client_id
        AND is_agency_member(c.agency_id)
    )
  );

-- Policies: DELETE (apenas admins)
DROP POLICY IF EXISTS "scraped_data_delete_admin" ON public.client_scraped_data;
CREATE POLICY "scraped_data_delete_admin" ON public.client_scraped_data
  FOR DELETE USING (
    EXISTS(
      SELECT 1 FROM clients c
      JOIN agency_members am ON am.agency_id = c.agency_id
      WHERE c.id = client_id
        AND am.user_id = auth.uid()
        AND am.role = 'agency_admin'
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_scraped_data_client ON public.client_scraped_data(client_id);
CREATE INDEX IF NOT EXISTS idx_scraped_data_scraped_at ON public.client_scraped_data(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_data_business_type ON public.client_scraped_data(business_type);

-- Trigger para updated_at automático
DROP TRIGGER IF EXISTS trg_scraped_data_updated_at ON public.client_scraped_data;
CREATE TRIGGER trg_scraped_data_updated_at
BEFORE UPDATE ON public.client_scraped_data
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;

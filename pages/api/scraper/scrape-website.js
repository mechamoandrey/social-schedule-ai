/**
 * API Route: POST /api/scraper/scrape-website
 */

import { scrapeWebsite } from '@/lib/scraper/index.js';
import { supabaseServer } from '@/lib/supabaseClient.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    externalResolver: true,
  },
  maxDuration: 90,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const startTime = Date.now();

  try {
    const { clientId, websiteUrl } = req.body || {};

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'clientId é obrigatório',
      });
    }

    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        error: 'websiteUrl é obrigatório',
      });
    }

    console.log(`[API] Scraping request for client ${clientId}: ${websiteUrl}`);

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    let supabase;

    if (token) {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
    } else {
      const { supabaseServer } = await import('@/lib/supabaseClient.js');
      supabase = supabaseServer(req, res);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado',
        hint: 'Envie o token via header: Authorization: Bearer <token>',
      });
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, agency_id')
      .eq('id', clientId)
      .maybeSingle();

    if (clientError || !client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado ou sem permissão',
      });
    }

    console.log(`[API] Client found: ${client.name}`);

    let scrapedData;

    try {
      scrapedData = await scrapeWebsite(websiteUrl, {
        aiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      });
    } catch (scrapeError) {
      console.error('[API] Scraping error:', scrapeError);

      return res.status(500).json({
        success: false,
        error: scrapeError.message || 'Erro ao fazer scraping do website',
        details: process.env.NODE_ENV === 'development' ? scrapeError.stack : undefined,
      });
    }

    const dataToSave = {
      client_id: clientId,
      website_url: scrapedData.website_url,
      scraped_at: scrapedData.scraped_at,
      pages_scraped: scrapedData.pages_scraped,
      business_type: scrapedData.business_type,
      about: scrapedData.about,
      products_or_services: scrapedData.products_or_services,
      location: scrapedData.location,
      target_audience: scrapedData.target_audience,
      key_differentials: scrapedData.key_differentials,
      themes_for_posts: scrapedData.themes_for_posts,
      scraping_duration_ms: scrapedData.scraping_duration_ms,
      total_pages: scrapedData.total_pages,
      error_log: scrapedData.error_log,
    };

    const { data: savedData, error: saveError } = await supabase
      .from('client_scraped_data')
      .upsert(dataToSave, {
        onConflict: 'client_id',
        returning: 'representation',
      })
      .select()
      .single();

    if (saveError) {
      console.error('[API] Database save error:', saveError);

      return res.status(500).json({
        success: false,
        error: 'Erro ao salvar dados no banco',
        details: saveError.message,
      });
    }

    const totalDuration = Date.now() - startTime;

    console.log(`[API] ✓ Scraping completed successfully in ${(totalDuration / 1000).toFixed(1)}s`);

    return res.status(200).json({
      success: true,
      data: savedData,
      meta: {
        duration_ms: totalDuration,
        pages_scraped: scrapedData.total_pages,
        client_name: client.name,
      },
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);

    return res.status(500).json({
      success: false,
      error: 'Erro inesperado ao processar scraping',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

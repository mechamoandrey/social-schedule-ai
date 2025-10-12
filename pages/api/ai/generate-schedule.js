/**
 * API Route: POST /api/ai/generate-schedule
 * Gera um cronograma mensal de posts em JSON seguindo rigorosamente o schema e as regras do sistema.
 */

export const config = { 
  api: { 
    bodyParser: { 
      sizeLimit: '1mb' 
    } 
  } 
};

import fs from 'fs';
import path from 'path';
import { validateSchedule } from '@/lib/ai/scheduleSchema';
import { buildUserPrompt } from '@/lib/ai/promptBuilder';
import { supabaseServer } from '@/lib/supabaseClient';

const SYSTEM_PATH = path.join(process.cwd(), 'docs/prompts/system.txt');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      client_id,
      client_name, client_website, month,
      freq_per_week, types, platforms, tone,
      product_list, post_plan_list,
      approved_holidays,
      model
    } = req.body || {};

    if (!client_name || !month) return res.status(400).json({ error: 'client_name e month são obrigatórios' });

    let scraped_data = null;
    if (client_id) {
      try {
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
          supabase = supabaseServer(req, res);
        }

        const { data, error } = await supabase
          .from('client_scraped_data')
          .select('business_type, about, products_or_services, location, target_audience, key_differentials, themes_for_posts')
          .eq('client_id', client_id)
          .maybeSingle();

        if (!error && data) {
          scraped_data = data;
        }
      } catch (err) {
        // Silently fail - scraped data is optional
      }
    }

    const system = fs.readFileSync(SYSTEM_PATH, 'utf-8');
    const user = buildUserPrompt({
      client_name, client_website, month,
      freq_per_week, types, platforms, tone,
      product_list, post_plan_list,
      approved_holidays,
      scraped_data
    });

    const openaiModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY não configurada' });

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: openaiModel,
        temperature: 0.6,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'Erro ao chamar OpenAI' });

    let text = data?.choices?.[0]?.message?.content || '';
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match) text = match[1];

    let parsed;
    try { 
      parsed = JSON.parse(text); 
    } catch (e) {
      return res.status(422).json({ error: 'Resposta não é JSON válido', raw: text });
    }

    let validated;
    try { 
      validated = validateSchedule(parsed); 
    } catch (e) {
      return res.status(422).json({ error: 'JSON inválido pelo schema', details: e.message, raw: parsed });
    }

    return res.status(200).json({ 
      schedule: validated, 
      raw: text, 
      userPrompt: user, 
      system: system 
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}

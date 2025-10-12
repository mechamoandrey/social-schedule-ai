export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};

import { PostSchema } from '@/lib/ai/scheduleSchema';
import { supabaseServer } from '@/lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      client_id,
      client_name,
      client_website,
      month,
      holiday,
      tone,
      platforms,
      model
    } = req.body || {};

    if (!client_name || !month || !holiday?.date || !holiday?.name) {
      return res.status(400).json({
        error: 'client_name, month e holiday{date,name} são obrigatórios'
      });
    }

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

    let scrapedContext = '';
    if (scraped_data) {
      scrapedContext = `\n\n
        Informações extraidas do site do cliente:
          - Tipo de negócio: ${scraped_data.business_type || 'N/A'}
          - Sobre: ${scraped_data.about || 'N/A'}
          - Localização: ${scraped_data.location || 'N/A'}
          - Público-alvo: ${scraped_data.target_audience || 'N/A'}
          - Diferenciais: ${scraped_data.key_differentials?.join(', ') || 'N/A'}
      `;

      if (scraped_data.products_or_services?.length > 0) {
        scrapedContext += `\n- Produtos/Serviços: ${scraped_data.products_or_services.slice(0, 5).map(p => p.name).join(', ')}`;
      }
    }

    const system = `Você é um agente de social media. Gere APENAS um post em JSON válido, seguindo o schema:
{
  "date":"YYYY-MM-DD",
  "title":"5-90 chars",
  "arte":"comece com Carrossel: ou Estático:, ≤200",
  "legenda":"≤500",
  "cta":"opcional, ≤150",
  "status":"A criar"
}

Regras:
- Sem texto fora do JSON
- Data deve ser a do feriado informado
- Em Dica, incluir na ARTE uma variação de "Temos este material"
- Em institucional, usar o site se houver
- PT-BR`;

    const user = `Crie um único post para o cliente ${client_name} (site: ${client_website || ''}) para o mês ${month}.

Feriado: ${holiday.date} — ${holiday.name}.
Plataformas: ${platforms || 'Instagram'}.
Tom: ${tone || 'técnico didático, direto e cordial'}.

${scrapedContext}

Saída: apenas o JSON do post com {date,title,arte,legenda,cta,status}.`;

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
    if (!r.ok) return res.status(r.status).json({ 
      error: data?.error?.message || 'Erro ao chamar OpenAI' 
    });

    let text = data?.choices?.[0]?.message?.content || '';
    const match = text.match(/```json\n([\s\S]*?)\n```/); 
    if (match) text = match[1];

    let post; 
    try { 
      post = JSON.parse(text); 
    } catch (e) { 
      return res.status(422).json({ 
        error: 'Resposta não é JSON válido', 
        raw: text 
      }); 
    }
    
    try { 
      post = PostSchema.parse(post); 
    } catch (e) { 
      return res.status(422).json({ 
        error: 'JSON inválido pelo schema', 
        details: e.message, 
        raw: post 
      }); 
    }

    return res.status(200).json({ 
      post, 
      raw: text, 
      userPrompt: user 
    });
  } catch (e) { 
    console.error(e); 
    return res.status(500).json({ error: e.message }); 
  }
}

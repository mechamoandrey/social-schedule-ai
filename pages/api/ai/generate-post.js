export const config = { 
  api: { 
    bodyParser: { 
      sizeLimit: '1mb' 
    } 
  } 
};

import { PostSchema } from '@/lib/ai/scheduleSchema';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { 
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

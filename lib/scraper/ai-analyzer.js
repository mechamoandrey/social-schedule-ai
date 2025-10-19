export async function analyzeWithAI(pagesData, options = {}) {
  console.log(`[AI Analyzer] Analyzing ${pagesData.length} pages...`);

  const allText = pagesData
    .map((page, i) => {
      return `
      === PÁGINA ${i + 1}: ${page.url} ===
      Título: ${page.metadata?.title || 'N/A'}
      Descrição: ${page.metadata?.description || 'N/A'}

      Conteúdo:
      ${page.text}
      `;
    })
    .join('\n\n---\n\n');

  const maxChars = 35000;
  const contentToAnalyze =
    allText.length > maxChars
      ? allText.slice(0, maxChars) + '\n\n[... conteúdo truncado ...]'
      : allText;

  const prompt = buildAnalysisPrompt(contentToAnalyze, pagesData[0]?.metadata);

  console.log(
    `[AI Analyzer] Sending ${contentToAnalyze.length} characters to OpenAI...`
  );

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  let attempt = 0;
  const maxAttempts = 3;
  let lastError;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: options.model || 'gpt-4o-mini',
            temperature: 0.3,
            messages: [
              {
                role: 'system',
                content:
                  'Você é um assistente especializado em analisar websites de empresas e extrair informações estruturadas.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || `OpenAI API error: ${response.status}`
        );
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI retornou resposta vazia');
      }

      console.log('[AI Analyzer] Received response from OpenAI');

      let parsed;
      try {
        let jsonText = content.trim();
        const match = jsonText.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
          jsonText = match[1];
        }

        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('[AI Analyzer] Failed to parse JSON:', content);
        throw new Error(`Erro ao parsear JSON da IA: ${parseError.message}`);
      }

      const validated = validateAIResponse(parsed);

      console.log('[AI Analyzer] Analysis complete:', {
        business_type: validated.business_type,
        products_count: validated.products_or_services?.length || 0,
        themes_count: validated.themes_for_posts?.length || 0,
      });

      return validated;
    } catch (error) {
      lastError = error;
      console.error(
        `[AI Analyzer] Attempt ${attempt}/${maxAttempts} failed:`,
        error.message
      );

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  throw new Error(
    `Falha ao analisar com IA após ${maxAttempts} tentativas: ${lastError.message}`
  );
}

function buildAnalysisPrompt(content, metadata) {
  return `Analise este conteúdo de um site de empresa e extraia informações estruturadas.

METADATA:
${JSON.stringify(metadata || {}, null, 2)}

CONTEÚDO DO SITE:
${content}

---

Extraia e estruture as seguintes informações em JSON:

{
  "business_type": "string - tipo de negócio. Escolha UM dos seguintes: 'vacation_rental', 'real_estate', 'healthcare', 'law_firm', 'restaurant', 'e_commerce', 'manufacturing', 'professional_services', 'education', 'construction', 'retail', 'hospitality', 'other'",

  "about": "string - descrição concisa da empresa em até 300 caracteres. Foque na proposta de valor única e principais diferenciais.",

  "products_or_services": [
    {
      "name": "string - nome do produto/serviço",
      "description": "string - descrição breve (até 150 chars)",
      "category": "string - categoria/tipo",
      "features": "string - características principais separadas por vírgula (opcional)"
    }
    // Máximo 20 produtos/serviços principais
  ],

  "location": "string - cidade/região onde atua (ex: 'Orlando, Florida' ou 'São Paulo, SP'). Se não mencionar, use null",

  "target_audience": "string - público-alvo principal inferido do conteúdo (ex: 'famílias com crianças', 'executivos', 'jovens adultos', 'empresas B2B')",

  "key_differentials": [
    "string - diferencial competitivo 1 (ex: 'Atendimento 24/7')",
    "string - diferencial competitivo 2",
    "string - diferencial competitivo 3"
    // Até 5 diferenciais
  ],

  "themes_for_posts": [
    "string - tema para post 1 (ex: 'dicas de Orlando', 'prevenção cardiovascular')",
    "string - tema para post 2",
    "string - tema para post 3"
    // Até 10 temas RELEVANTES ao negócio
  ]
}

REGRAS IMPORTANTES:
1. Responda APENAS com o JSON válido, sem explicações antes ou depois
2. Se não encontrar alguma informação, use null (não invente dados)
3. Para products_or_services, extraia apenas os PRINCIPAIS (não mais que 20)
4. Para themes_for_posts, sugira temas que façam SENTIDO para criar posts nas redes sociais dessa empresa
5. Seja CONCISO nas descrições
6. O JSON deve ser parseável por JSON.parse()
7. NÃO use markdown code blocks, apenas o JSON puro

Responda agora com o JSON:`;
}

function validateAIResponse(data) {
  const validated = {
    business_type: data.business_type || 'other',
    about: typeof data.about === 'string' ? data.about.slice(0, 500) : null,
    products_or_services: Array.isArray(data.products_or_services)
      ? data.products_or_services.slice(0, 20).map(p => ({
          name: p.name || '',
          description: p.description || '',
          category: p.category || null,
          features: p.features || null,
        }))
      : [],
    location: data.location || null,
    target_audience: data.target_audience || null,
    key_differentials: Array.isArray(data.key_differentials)
      ? data.key_differentials.slice(0, 5)
      : [],
    themes_for_posts: Array.isArray(data.themes_for_posts)
      ? data.themes_for_posts.slice(0, 10)
      : [],
  };

  return validated;
}

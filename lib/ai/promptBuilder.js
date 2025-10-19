export function buildUserPrompt(payload) {
  const {
    client_name,
    client_website,
    month,
    freq_per_week,
    types,
    platforms,
    tone,
    product_list,
    post_plan_list,
    approved_holidays,
    scraped_data,
  } = payload;

  let scrapedContext = '';
  if (scraped_data) {
    scrapedContext = `
      \n\nInformações extraídas do site do cliente:
      - Tipo de negócio: ${scraped_data.business_type || 'N/A'}
      - Sobre a empresa: ${scraped_data.about || 'N/A'}
      - Localização: ${scraped_data.location || 'N/A'}
      - Público-alvo: ${scraped_data.target_audience || 'N/A'}
      - Diferenciais competitivos: ${scraped_data.key_differentials?.join(', ') || 'N/A'}
      - Temas sugeridos para posts: ${scraped_data.themes_for_posts?.join(', ') || 'N/A'}
    `;

    if (scraped_data.products_or_services?.length > 0) {
      scrapedContext += `\n- Produtos/Serviços principais:`;
      scraped_data.products_or_services.slice(0, 10).forEach(p => {
        scrapedContext += `\n  • ${p.name}${p.description ? ': ' + p.description : ''}`;
      });
    }
  }

  return `Gere um cronograma mensal de posts em JSON seguindo rigorosamente o schema e as regras do sistema.

Contexto do cliente:
- Nome: ${client_name}
- Site (opcional): ${client_website || ''}
- Mês: ${month}
- País/calendário: BR
- Frequência alvo por semana: ${freq_per_week}
- Tipos de post a alternar: ${types}
- Plataformas alvo: ${platforms}
- Tom de voz: ${tone}${scrapedContext}

Restrições importantes:
- Não invente datas festivas dentro dos posts sem aprovação.
- ${client_website ? 'Posts institucionais devem usar o site do cliente.' : 'Se o site for informado, posts institucionais devem usá-lo.'}
- Arte ≤ 200, Legenda ≤ 500, CTA ≤ 150.
- Em posts de dica, inclua na ARTE uma variação de "Temos este material".

Catálogo de produtos:${product_list ? '\n' + product_list : ' (não informado)'}

Plano preferencial de temas:${post_plan_list ? '\n' + post_plan_list : ' (não informado)'}

Feriados:
- **Sempre sugerir** em "suggested_holidays" (fora de posts).
- approved_holidays: ${JSON.stringify(approved_holidays || [])}

Saída:
- Apenas o JSON do cronograma e o campo "suggested_holidays".
`;
}

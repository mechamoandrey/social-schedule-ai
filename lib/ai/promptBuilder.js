export function buildUserPrompt(payload) {
  const {
    client_name, client_website, month,
    freq_per_week, types, platforms, tone,
    product_list, post_plan_list,
    approved_holidays
  } = payload;

  return `Gere um cronograma mensal de posts em JSON seguindo rigorosamente o schema e as regras do sistema.

Contexto do cliente:
- Nome: ${client_name}
- Site (opcional): ${client_website || ''}
- Mês: ${month}
- País/calendário: BR
- Frequência alvo por semana: ${freq_per_week}
- Tipos de post a alternar: ${types}
- Plataformas alvo: ${platforms}
- Tom de voz: ${tone}

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

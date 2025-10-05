Gere um cronograma mensal de posts em JSON seguindo rigorosamente o schema e as regras do sistema.

Contexto do cliente:
- Nome: {CLIENT_NAME}
- Site (opcional): {CLIENT_WEBSITE_OR_EMPTY}
- Mês: {YYYY-MM}
- País/calendário: BR
- Frequência alvo por semana: {FREQ_PER_WEEK}
- Tipos de post a alternar: {TIPOS}  (ex.: Produto, Dica, Institucional, Campanha)
- Plataformas alvo (texto único): {PLATFORMS}
- Tom de voz: {TOM}

Restrições importantes:
- Não invente datas festivas dentro dos **posts** sem aprovação.
- Se o site foi informado, posts institucionais devem usá-lo.
- Arte ≤ 200, Legenda ≤ 500, CTA ≤ 150.
- Em posts de **dica**, inclua na **ARTE** uma variação de "Temos este material".

Variação/antirrepetição:
- Não repita título/gancho/CTA em posts consecutivos.
- Alterne tipos.
- Distribua as datas ao longo do mês.

Catálogo de produtos (quando aplicável):
{PRODUCT_LIST_JSON_OR_BULLETS}

Plano preferencial de temas (opcional):
{POST_PLAN_LIST}

Feriados:
- **Sempre sugerir** no campo `suggested_holidays` (fora de `posts`).
- approved_holidays: {APPROVED_HOLIDAYS_JSON_ARRAY}  
  (datas/festas **aprovadas** para entrar em `posts`)

Saída: apenas o JSON do cronograma (`month`, `client`, `posts`) e `suggested_holidays` (sugestões, fora de `posts`).

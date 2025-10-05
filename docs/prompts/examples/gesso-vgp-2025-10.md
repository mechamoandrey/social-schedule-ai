Use `docs/prompts/system.txt` como SYSTEM.

USER preenchido (exemplo real):

Gere um cronograma mensal de posts em JSON seguindo rigorosamente o schema e as regras do sistema.

Contexto do cliente:
- Nome: GESSO VGP
- Site (opcional): https://www.gessovargemgrande.com.br/
- Mês: 2025-10
- País/calendário: BR
- Frequência alvo por semana: 3
- Tipos de post a alternar: Produto, Dica, Institucional, Campanha
- Plataformas alvo: Instagram
- Tom de voz: técnico didático, direto e cordial

Restrições importantes:
- Não invente datas festivas **dentro dos posts** sem aprovação.
- Posts institucionais devem usar o site do cliente.
- Arte ≤ 200, Legenda ≤ 500, CTA ≤ 150.
- Em posts de dica, inclua na ARTE uma variação de "Temos este material".

Catálogo de produtos:
- Argamassa Técnica BASE COAT p/ Placa Cimentícia (20kg) – Decorlit
- Cortador de Placas – Walsywa
- Tesoura Aviador Reto 10" – Lótus
- Pincéis Castor – Atlas

Plano preferencial de temas:
1) Bem-vindo Outubro Rosa (Campanha)
2) Dica: Drywall (ST/RU/RF, Perfis, Acessórios, Fixação)
3) Produto: BASE COAT – Decorlit
4) Dica: Isolamento (lã de rocha/vidro/PET)
5) Sobre a empresa (Institucional)
6) Produto: Cortador – Walsywa
7) Dica: Steel frame (6/8mm, perfis, acessórios, fixação)
8) Sobre a empresa
9) Produto: Tesoura Aviador – Lótus
10) Dica: Forro removível (fibra mineral, lã mineral, gesso, PVC, EPS)
11) Sobre a empresa
12) Produto: Pincéis Castor – Atlas
13) Dica: Placas 60×60 / PVC
14) Sobre a empresa

Feriados:
- **Sempre sugerir** em `suggested_holidays` (fora de posts).
- approved_holidays: [{"date":"2025-10-12","name":"Dia das Crianças / Nossa Senhora Aparecida"}]

Saída: apenas o JSON do cronograma e `suggested_holidays`.

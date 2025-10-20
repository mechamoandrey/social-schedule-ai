# Guia rápido para gerar cronogramas com IA

Este guia ensina o social media a gerar cronogramas no **formato JSON** padronizado da plataforma, sem precisar decorar regras.

## O que a IA deve entregar

- **Apenas JSON válido** seguindo este schema:

```json
{
  "month": "YYYY-MM",
  "client": "Nome do cliente",
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "title": "Título do post (5-90 caracteres)",
      "arte": "Descrição da arte (máx 200 caracteres)",
      "legenda": "Texto da legenda (máx 500 caracteres)",
      "cta": "Call to action (opcional, máx 150 caracteres)",
      "status": "A criar"
    }
  ]
}
```

## Regras principais (resumo)

1. **Sem texto fora do JSON.**
2. **Arte**: comece com **"Carrossel:"** ou **"Estático:"** e descreva a peça em até 200 caracteres. Em **posts de dica**, inclua uma variação de **"Temos este material"** na **arte**.
3. **Legenda**: até 500 caracteres. Varie aberturas e ângulos; evite repetir frases em posts consecutivos.
4. **CTA**: até 150 caracteres. Não repita o mesmo CTA em dois posts seguidos.
5. **Institucional**: usar o **site do cliente** se for informado.
6. **Datas**: não inventar feriados nos posts. A IA **sempre** sugerirá feriados em `suggested_holidays` (fora dos posts). Só usar os **aprovados** (se fornecidos) nos posts. Datas sempre dentro de `month`.
7. **Status**: sempre `"A criar"`.

## Template (SYSTEM)

Copie o conteúdo de `docs/prompts/system.txt` como instrução do sistema.

## Template (USER)

Copie `docs/prompts/user-template.md` e preencha os campos entre chaves `{}`.

## Exemplo pronto

Veja `docs/prompts/examples/gesso-vgp-2025-10.md` com o caso real de **GESSO VGP — 2025-10**.

## Boas práticas para evitar repetição

- Alterne: **Produto / Dica / Institucional / Campanha**.
- Varie títulos ("Como", "Guia", "Checklist", "3 pontos"…), abertura de legenda e CTA.
- Distribua posts ao longo do mês (sem amontoar).

## Futuro

- **Termos proibidos por cliente** e **briefs por cliente** terão seção própria (placeholder já criado).

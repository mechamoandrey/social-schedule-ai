# Tests

Diretório de testes do projeto.

## Scripts Disponíveis

### API de Scraping (completo)

Testa a API route completa com autenticação e salvamento no banco:

```bash
npm run test:api-scraper
```

**Pré-requisitos:**
- ✅ Servidor rodando (`npm run dev`)
- ✅ Banco populado com seed (`npm run dev:seed`)

**O que faz:**
1. Autentica como `admin@agencyx.com`
2. Busca um cliente de teste no banco
3. Chama `POST /api/scraper/scrape-website`
4. Valida autenticação e RLS
5. Salva dados no Supabase
6. Mostra resultado

**Resultado esperado:**
- ✅ Autenticação bem-sucedida
- ✅ Cliente encontrado via RLS
- ✅ Scraping executado
- ✅ Dados salvos na tabela `client_scraped_data`

---

### Curl Manual (alternativa)

Se preferir testar com curl:

**Passo 1: Pegar access token**
1. Acesse `http://localhost:3000` no navegador
2. Faça login
3. Abra DevTools (F12) → Application → Local Storage
4. Copie o valor de `sb-localhost-auth-token.access_token`

**Passo 2: Executar curl**
```bash
curl -X POST http://localhost:3000/api/scraper/scrape-website \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "clientId": "UUID_DO_CLIENTE",
    "websiteUrl": "https://www.dreamsnfunvacationhomes.com"
  }'
```

---

## Estrutura

```
tests/
├── README.md                   # Este arquivo
├── api-scraper.test.mjs        # Teste da API completa
└── api-scraper.result.json     # Resultado (gitignored)
```

## Notas

- Arquivos `*.result.json` são ignorados pelo git
- Use `NODE_ENV=development` para rodar testes locais
- Teste de API precisa do servidor rodando em paralelo

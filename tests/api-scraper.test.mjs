/**
 * Teste da API de Web Scraping
 * Uso: npm run test:api-scraper
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3000/api/scraper/scrape-website';
const TEST_WEBSITE = 'https://www.dreamsnfunvacationhomes.com';
const TEST_EMAIL = 'admin@agencyx.com';
const TEST_PASSWORD = 'password123';

console.log('🧪 Testando API de Web Scraping\n');

try {
  console.log('1️⃣  Autenticando usuário...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError) {
    throw new Error(`Falha na autenticação: ${authError.message}`);
  }

  const accessToken = authData.session.access_token;

  console.log(`✅ Autenticado como: ${authData.user.email}\n`);

  console.log('2️⃣  Buscando cliente de teste...');

  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, website_url')
    .limit(1);

  if (clientsError || !clients || clients.length === 0) {
    throw new Error('Nenhum cliente encontrado no banco. Execute o seed primeiro.');
  }

  const testClient = clients[0];
  console.log(`✅ Cliente encontrado: ${testClient.name}`);
  console.log(`   ID: ${testClient.id}`);
  console.log(`   Website: ${testClient.website_url || 'N/A'}\n`);

  console.log('3️⃣  Chamando API de scraping...');
  console.log(`   URL: ${API_URL}`);
  console.log(`   Website: ${TEST_WEBSITE}\n`);

  const startTime = Date.now();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      clientId: testClient.id,
      websiteUrl: TEST_WEBSITE,
    }),
  });

  const duration = Date.now() - startTime;
  const result = await response.json();

  console.log('='.repeat(50));
  console.log('📊 RESULTADO DA API');
  console.log('='.repeat(50));
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log(`Duração: ${(duration / 1000).toFixed(1)}s\n`);

  if (result.success) {
    console.log('✅ Scraping concluído com sucesso!\n');
    console.log(`📄 Páginas scrapadas: ${result.meta?.pages_scraped || result.data?.total_pages}`);
    console.log(`🏠 Produtos: ${result.data?.products_or_services?.length || 0}`);
    console.log(`📍 Location: ${result.data?.location || 'N/A'}`);
    console.log(`🏢 Business Type: ${result.data?.business_type || 'N/A'}`);
    console.log(`👥 Target Audience: ${result.data?.target_audience || 'N/A'}`);
  } else {
    console.log('❌ Scraping falhou:\n');
    console.log(`Erro: ${result.error}`);
    if (result.details) {
      console.log(`Detalhes: ${result.details}`);
    }
  }

  console.log('\n' + '='.repeat(50));

  const fs = await import('fs');
  fs.writeFileSync(
    './tests/api-scraper.result.json',
    JSON.stringify(result, null, 2)
  );
  console.log('💾 Resultado salvo em: tests/api-scraper.result.json\n');

} catch (error) {
  console.error('\n❌ Erro no teste:', error.message);
  console.error(error.stack);
  process.exit(1);
}

import { createClient } from '@supabase/supabase-js';

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Não rode o seed em produção.');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('❌ Faltam envs: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function ensureUser(email, password) {
  // tenta criar, ignora erro de já existir
  const { error: e } = await admin.auth.admin.createUser({ 
    email, 
    password, 
    email_confirm: true 
  });
  if (e && !String(e.message || '').includes('already registered')) throw e;
  
  const { data: listed } = await admin.auth.admin.listUsers({ 
    page: 1, 
    perPage: 1000 
  });
  const found = listed?.users?.find(u => u.email === email);
  if (!found) throw new Error('Usuário não encontrado: ' + email);
  return found.id;
}

async function main() {
  console.log('🔄 Criando/garantindo usuários de demo...');
  const adminId = await ensureUser('admin@demo.local', 'demo1234');
  const smId = await ensureUser('sm@demo.local', 'demo1234');
  const clientId = await ensureUser('cliente@demo.local', 'demo1234');

  console.log('🔧 Chamando RPC reset_seed...');
  const { error: eSeed } = await admin.rpc('reset_seed', {
    p_admin_user: adminId,
    p_sm_user: smId,
    p_client_user: clientId
  });
  if (eSeed) {
    console.error('❌ reset_seed falhou:', eSeed.message);
    console.error('Dica: aplique as migrações 002/003/004 ou rode o SQL da função reset_seed primeiro.');
    process.exit(1);
  }

  console.log('✅ Seed ok. Logins de teste:');
  console.log('   admin@demo.local / demo1234 (agency_admin)');
  console.log('   sm@demo.local / demo1234 (social_media)');
  console.log('   cliente@demo.local / demo1234 (client_viewer)');
}

main().catch((e) => { 
  console.error(e); 
  process.exit(1); 
});

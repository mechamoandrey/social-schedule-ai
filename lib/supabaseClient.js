import { createClient } from '@supabase/supabase-js';

let _client = null;

export function supabaseBrowser() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Supabase] Variáveis NEXT_PUBLIC_SUPABASE_URL/ANON_KEY ausentes. Retornando null client.');
      return null;
    }
    throw new Error('Supabase não configurado.');
  }
  _client = createClient(url, key);
  return _client;
}

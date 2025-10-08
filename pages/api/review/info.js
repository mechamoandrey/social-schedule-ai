import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'token obrigatório' });
    
    const [info, posts] = await Promise.all([
      sb.rpc('get_review_info', { p_token: token }),
      sb.rpc('list_review_posts', { p_token: token })
    ]);
    
    if (info.error) throw info.error;
    if (posts.error) throw posts.error;
    
    const hdr = Array.isArray(info.data) ? info.data[0] : info.data;
    if (!hdr) return res.status(404).json({ error: 'Link inválido ou desativado' });
    
    return res.status(200).json({ 
      header: hdr, 
      posts: posts.data || [] 
    });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: e.message || 'Falha ao carregar link' });
  }
}

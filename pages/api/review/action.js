import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { token, postId, action, comment, actor } = req.body || {};
    if (!token || !postId || !action) {
      return res.status(400).json({ error: 'token, postId e action são obrigatórios' });
    }
    
    const { data, error } = await sb.rpc('apply_review_action', { 
      p_token: token, 
      p_post_id: postId, 
      p_action: action, 
      p_comment: comment || null, 
      p_actor: actor || null 
    });
    
    if (error) throw error;
    
    const row = Array.isArray(data) ? data[0] : data;
    return res.status(200).json({ 
      ok: true, 
      post_id: row?.out_post_id, 
      status: row?.new_status 
    });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: e.message || 'Falha ao aplicar ação' });
  }
}

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // Log em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.log('[REVIEW_ACTION]', { 
      method: req.method, 
      query: req.query, 
      bodyKeys: Object.keys(req.body || {}) 
    });
  }
  
  try {
    // Token pode vir da query string ou do body (fallback)
    const token = req.query.token || req.body?.token;
    const { postId, action, comment, actor } = req.body || {};
    
    if (!token || !postId || !action) {
      return res.status(400).json({ error: 'token, postId e action são obrigatórios' });
    }
    
    // Validar ação
    if (!['approve', 'request_changes'].includes(action)) {
      return res.status(400).json({ error: 'Ação inválida. Use approve ou request_changes' });
    }
    
    // Para request_changes, comentário é obrigatório
    if (action === 'request_changes' && !comment?.trim()) {
      return res.status(400).json({ error: 'Comentário é obrigatório para pedir ajustes' });
    }
    
    const { data, error } = await sb.rpc('apply_review_action', { 
      p_token: token, 
      p_post_id: postId, 
      p_action: action, 
      p_comment: comment || null, 
      p_actor: actor || null 
    });
    
    if (error) {
      // Log do erro em desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        console.error('[REVIEW_ACTION] RPC Error:', error);
      }
      
      // Mapear erros específicos para códigos HTTP apropriados
      if (error.message?.includes('Link inválido ou expirado')) {
        return res.status(403).json({ error: 'Link de revisão inválido ou expirado' });
      }
      if (error.message?.includes('Post não pertence a este projeto')) {
        return res.status(409).json({ error: 'Post não pertence a este projeto' });
      }
      if (error.message?.includes('Ação inválida')) {
        return res.status(400).json({ error: error.message });
      }
      
      throw error;
    }
    
    const row = Array.isArray(data) ? data[0] : data;
    
    // Log de sucesso em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.log('[REVIEW_ACTION] Success:', { postId, action, newStatus: row?.new_status });
    }
    
    return res.status(200).json({ 
      ok: true, 
      post: {
        id: row?.out_post_id,
        status: row?.new_status
      }
    });
  } catch (e) {
    const errorId = require('crypto').randomUUID();
    
    // Log detalhado do erro
    console.error(`[REVIEW_ACTION] Error ${errorId}:`, e);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      errorId: process.env.NODE_ENV !== 'production' ? errorId : undefined
    });
  }
}

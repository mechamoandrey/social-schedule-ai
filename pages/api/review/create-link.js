import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { projectId, days } = req.body || {};
    if (!projectId)
      return res.status(400).json({ error: 'projectId obrigatório' });

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    const { data, error } = await sb.rpc('create_review_link', {
      p_project_id: projectId,
      p_days: Number(days || 30),
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    return res.status(200).json({
      token: row.link_token,
      expires_at: row.link_expires_at,
    });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: e.message || 'Falha ao criar link' });
  }
}

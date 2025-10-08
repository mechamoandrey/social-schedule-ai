import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PublicReview() {
  const router = useRouter();
  const { token } = router.query;
  const [hdr, setHdr] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [comment, setComment] = useState('');
  const [actor, setActor] = useState('');

  useEffect(() => {
    if (!token) return;
    
    (async () => {
      try {
        const r = await fetch(`/api/review/info?token=${token}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Falha ao carregar');
        setHdr(j.header);
        setPosts(j.posts || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function act(postId, action) {
    try {
      const r = await fetch('/api/review/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          postId, 
          action, 
          comment: action === 'request_changes' ? comment : null, 
          actor: actor || null 
        })
      });
      
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Falha');
      
      // atualiza localmente
      setPosts(ps => ps.map(p => 
        p.id === postId 
          ? { ...p, status: j.status, revision_comment: action === 'request_changes' ? comment : null }
          : p
      ));
      
      setComment('');
      alert(action === 'approve' ? 'Aprovado!' : 'Solicitado ajuste!');
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <div className="p-6">Carregando…</div>;
  if (err) return <div className="p-6 text-red-600 text-sm">{err}</div>;
  if (!hdr) return <div className="p-6 text-sm">Link inválido ou expirado.</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold">{hdr.client_name} — {hdr.project_name}</h1>
      <div className="text-sm text-neutral-600 mb-3">
        Mês: {hdr.month} · Expira em: {new Date(hdr.expires_at).toLocaleString()} 
        {hdr.expired ? ' · (Expirado)' : ''}
      </div>

      <div className="border rounded p-3 mb-4 bg-white">
        <div className="text-sm font-medium mb-2">Identifique-se (opcional)</div>
        <input 
          value={actor} 
          onChange={e => setActor(e.target.value)} 
          className="border rounded px-3 py-2 text-sm w-full" 
          placeholder="Seu nome (para registro no log)" 
        />
      </div>

      {!posts?.length && <div className="text-sm text-neutral-500">Nenhum post neste projeto.</div>}
      
      <ul className="space-y-3">
        {posts.map(p => (
          <li key={p.id} className="border rounded p-3 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-sm">{p.title}</div>
              <div className="text-xs px-2 py-1 rounded border">{p.status}</div>
            </div>
            <div className="text-xs text-neutral-600 mt-1">Data: {p.date || '—'}</div>
            
            {p.arte && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Arte:</span> {p.arte}
              </div>
            )}
            
            {p.legenda && (
              <div className="mt-1 text-sm">
                <span className="font-medium">Legenda:</span> {p.legenda}
              </div>
            )}
            
            {p.cta && (
              <div className="mt-1 text-sm">
                <span className="font-medium">CTA:</span> {p.cta}
              </div>
            )}
            
            {p.revision_comment && (
              <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded p-2">
                Último pedido de ajuste: {p.revision_comment}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => act(p.id, 'approve')} 
                  className="border rounded px-3 py-2 text-sm hover:bg-green-50"
                >
                  Aprovar
                </button>
                <button 
                  onClick={() => act(p.id, 'request_changes')} 
                  className="border rounded px-3 py-2 text-sm hover:bg-amber-50"
                >
                  Pedir ajustes
                </button>
              </div>
              
              <textarea 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                className="border rounded px-3 py-2 text-sm w-full" 
                rows="2" 
                placeholder="Comentário (obrigatório ao pedir ajustes)"
              />
              
              <div className="text-xs text-neutral-500">
                Ao pedir ajustes, o comentário é salvo no post.
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

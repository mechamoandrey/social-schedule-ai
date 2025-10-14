import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { getMyRoleForAgency } from '@/lib/roles';

export default function PostModal({ project, openPost, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [role, setRole] = useState(null);
  const [comment, setComment] = useState('');
  
  // Histórico do post
  const [history, setHistory] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [tab, setTab] = useState('dados');
  
  const isOpen = !!openPost;

  useEffect(() => { 
    (async () => { 
      if (project?.agency_id) { 
        setRole(await getMyRoleForAgency(project.agency_id)); 
      } 
    })(); 
  }, [project?.agency_id]);

  useEffect(() => { 
    if (openPost) { 
      setForm({ ...openPost }); 
      setComment(''); 
    } 
  }, [openPost]);

  useEffect(() => {
    // Carrega o post completo (inclui revision_comment) sempre que abrir o modal
    (async () => {
      try {
        if (!openPost?.id) return;
        const sb = supabaseBrowser();
        const { data, error } = await sb
          .from('posts')
          .select('id, date, title, arte, legenda, cta, status, revision_comment')
          .eq('id', openPost.id)
          .maybeSingle();
        if (!error && data) {
          setForm(f => ({ ...f, ...data, revision_comment: data.revision_comment || '' }));
        }
      } catch (e) { /* silencioso */ }
    })();
  }, [openPost?.id]);

  // Carregar histórico do post
  useEffect(() => {
    if (!openPost?.id || !project?.agency_id) return;
    (async () => {
      try {
        setLoadingHist(true);
        const sb = supabaseBrowser();
        const { data, error } = await sb
          .from('logs')
          .select('id, action, created_at, actor_user_id, meta')
          .eq('agency_id', project.agency_id)
          .eq('entity_type', 'post')
          .eq('entity_id', openPost.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setHistory(data || []);
      } catch (e) { /* silencioso */ }
      finally { setLoadingHist(false); }
    })();
  }, [openPost?.id, project?.agency_id]);

  const canEditFields = useMemo(() => role !== 'client_viewer', [role]);

  if (!isOpen || !form) return null;

  const overLegend = (form.legenda?.length || 0) > 500;
  const overCTA = (form.cta?.length || 0) > 150;

  async function saveFields() {
    const sb = supabaseBrowser();
    const payload = { 
      title: form.title, 
      arte: form.arte, 
      legenda: form.legenda, 
      cta: form.cta, 
      date: form.date,
      revision_comment: form.revision_comment || null
    };
    const { data: saveData, error: saveError } = await sb
      .from('posts')
      .update(payload)
      .eq('id', form.id)
      .select('id, legenda, arte, title, cta, revision_comment');
    if (saveError) throw saveError;
  }

  async function setStatus(status) {
    const sb = supabaseBrowser();
    const payload = { status };
    
    if (status === 'Aprovado') {
      const { data: me } = await sb.auth.getUser();
      payload.approved_by = me?.user?.id || null;
      payload.approved_at = new Date().toISOString();
    }
    
    if (status === 'Ajustar' && comment) {
      payload.revision_comment = comment;
    }
    
    const { data: adjData, error: adjError } = await sb
      .from('posts')
      .update(payload)
      .eq('id', form.id)
      .select('id, status, revision_comment');
    if (adjError) throw adjError;
    
    onSaved(); 
    setComment('');
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">
            Post • {form.title || 'Sem título'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-sm px-2 py-1 rounded border hover:bg-neutral-50"
          >
            Fechar
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {/* Abas */}
          <div className="flex gap-2 text-sm mb-2">
            <button className={`border rounded px-2 py-1 ${tab==='dados'?'bg-neutral-100':''}`} onClick={()=>setTab('dados')}>Dados</button>
            <button className={`border rounded px-2 py-1 ${tab==='hist'?'bg-neutral-100':''}`} onClick={()=>setTab('hist')}>Histórico</button>
          </div>
          
          {tab === 'hist' ? (
            <div className="max-h-72 overflow-auto text-sm">
              {loadingHist && <div className="text-neutral-500">Carregando…</div>}
              {!loadingHist && !history?.length && <div className="text-neutral-500">Sem eventos.</div>}
              <ul className="space-y-2">
                {history?.map(h => (
                  <li key={h.id} className="border rounded p-2">
                    <div className="text-xs text-neutral-500">{new Date(h.created_at).toLocaleString()}</div>
                    <div><b>Ação:</b> {h.action}</div>
                    {h.meta && <pre className="text-xs bg-neutral-50 p-2 rounded mt-1 overflow-auto">{JSON.stringify(h.meta, null, 2)}</pre>}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-sm font-medium mb-1">Data do post</span>
              <input 
                disabled={!canEditFields} 
                type="date" 
                className="w-full border rounded px-3 py-2 disabled:bg-neutral-100" 
                value={form.date || ''} 
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} 
              />
            </label>
            <label className="text-sm">
              <span className="block text-sm font-medium mb-1">Título (5–90 caracteres)</span>
              <input 
                disabled={!canEditFields} 
                className="w-full border rounded px-3 py-2 disabled:bg-neutral-100" 
                value={form.title || ''} 
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
              />
            </label>
          </div>
          
          <label className="text-sm">
            <span className="block text-sm font-medium mb-1">Arte (comece com "Carrossel:" ou "Estático:", ≤ 200)</span>
            <textarea 
              disabled={!canEditFields} 
              className="w-full border rounded px-3 py-2 disabled:bg-neutral-100" 
              rows={2} 
              value={form.arte || ''} 
              onChange={e => setForm(f => ({ ...f, arte: e.target.value }))} 
            />
          </label>
          
          <label className="text-sm">
            <span className="block text-sm font-medium mb-1">Legenda (≤ 500 caracteres)</span>
            <textarea 
              disabled={!canEditFields} 
              className={`w-full border rounded px-3 py-2 disabled:bg-neutral-100 ${overLegend ? 'border-red-500' : ''}`} 
              rows={4} 
              value={form.legenda || ''} 
              onChange={e => setForm(f => ({ ...f, legenda: e.target.value }))} 
            />
            <div className={`text-xs mt-1 ${overLegend ? 'text-red-600' : 'text-neutral-500'}`}>
              {(form.legenda?.length || 0)}/500
            </div>
          </label>
          
          <label className="text-sm">
            <span className="block text-sm font-medium mb-1">CTA (opcional, ≤ 150 caracteres)</span>
            <input 
              disabled={!canEditFields} 
              className={`w-full border rounded px-3 py-2 disabled:bg-neutral-100 ${overCTA ? 'border-red-500' : ''}`} 
              value={form.cta || ''} 
              onChange={e => setForm(f => ({ ...f, cta: e.target.value }))} 
            />
            <div className={`text-xs mt-1 ${overCTA ? 'text-red-600' : 'text-neutral-500'}`}>
              {(form.cta?.length || 0)}/150
            </div>
          </label>

          {/* Comentários de revisão */}
          <div className="space-y-3 mt-2">
            {form?.revision_comment ? (
              <div className="border rounded p-3 bg-neutral-50">
                <div className="text-xs text-neutral-600 mb-1">Último pedido de ajustes</div>
                <div className="text-sm whitespace-pre-wrap">{form.revision_comment}</div>
              </div>
            ) : null}
            <label className="text-sm block">
              <span className="block text-sm font-medium mb-1">Comentário para ajustes (visível para o social media)</span>
              <textarea 
                className="border rounded px-3 py-2 w-full" 
                rows="3" 
                value={(typeof form.revision_comment === 'string' ? form.revision_comment : '')} 
                onChange={e => setForm(f => ({ ...f, revision_comment: e.target.value }))} 
              />
            </label>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-2">
            {canEditFields && (
              <button 
                onClick={saveFields} 
                className="border rounded px-3 py-2 hover:bg-neutral-50"
              >
                Salvar texto
              </button>
            )}
            <button 
              onClick={() => setStatus('Em revisão')} 
              className="border rounded px-3 py-2 hover:bg-neutral-50"
            >
              Marcar como Em revisão
            </button>
            <button 
              onClick={() => setStatus('Aprovado')} 
              className="border rounded px-3 py-2 hover:bg-neutral-50"
            >
              Aprovar
            </button>
          </div>

          {/* Revisão pelo cliente */}
          <div className="border rounded p-3">
            <div className="text-sm font-medium mb-2">Solicitar ajustes</div>
            <textarea 
              className="w-full border rounded px-3 py-2" 
              rows={2} 
              placeholder="Explique o que ajustar…" 
              value={comment} 
              onChange={e => setComment(e.target.value)} 
            />
            <div className="mt-2">
              <button 
                onClick={() => setStatus('Ajustar')} 
                className="border rounded px-3 py-2 hover:bg-neutral-50"
              >
                Pedir ajustes
              </button>
            </div>
          </div>
              <div className="flex justify-end pt-2">
                <DeletePostButton postId={form.id} onDeleted={() => { onSaved(); onClose(); }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeletePostButton({ postId, onDeleted }) {
  async function del() {
    if (!confirm('Excluir este post? Essa ação não pode ser desfeita.')) return;
    try {
      const { supabaseBrowser } = await import('@/lib/supabaseClient');
      const sb = supabaseBrowser();
      const { data, error } = await sb.rpc('delete_post', { p_post_id: postId });
      if (error) throw error;
      alert('Post excluído.');
      onDeleted && onDeleted();
    } catch (e) { 
      alert(e.message); 
    }
  }
  return (
    <button 
      onClick={del} 
      className="text-red-600 border border-red-300 rounded px-3 py-2 text-sm hover:bg-red-50"
    >
      Excluir post
    </button>
  );
}

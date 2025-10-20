import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { getMyRoleForAgency } from '@/lib/roles';
import { X, FileText, History } from 'lucide-react';

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
          .select(
            'id, date, title, arte, legenda, cta, status, revision_comment'
          )
          .eq('id', openPost.id)
          .maybeSingle();
        if (!error && data) {
          setForm(f => ({
            ...f,
            ...data,
            revision_comment: data.revision_comment || '',
          }));
        }
      } catch (e) {
        /* silencioso */
      }
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
      } catch (e) {
        /* silencioso */
      } finally {
        setLoadingHist(false);
      }
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
      revision_comment: form.revision_comment || null,
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
    <div className='fixed inset-0 bg-black/40 z-50 p-4 grid place-items-center'>
      <div
        role='dialog'
        aria-modal='true'
        className='bg-card w-full max-w-2xl rounded-xl border shadow-lg overflow-hidden flex flex-col max-h-[90vh]'
      >
        {/* Header fixo */}
        <div className='sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between'>
          <div className='min-w-0'>
            <h3 className='font-semibold text-sm md:text-base truncate'>
              Post • {form.title || 'Sem título'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className='inline-flex items-center h-9 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
            title='Fechar'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {/* Abas */}
          <div
            className='flex items-center gap-2 text-sm'
            role='tablist'
            aria-label='Abas do Post'
          >
            <button
              role='tab'
              aria-selected={tab === 'dados'}
              className={`inline-flex items-center gap-1 h-9 rounded-md border px-3 font-medium transition-colors ${
                tab === 'dados'
                  ? 'border-input bg-accent/50 text-accent-foreground'
                  : 'border-input bg-background hover:bg-accent/50 hover:text-accent-foreground'
              }`}
              onClick={() => setTab('dados')}
            >
              <FileText className='h-4 w-4' />
              Dados
            </button>
            <button
              role='tab'
              aria-selected={tab === 'hist'}
              className={`inline-flex items-center gap-1 h-9 rounded-md border px-3 font-medium transition-colors ${
                tab === 'hist'
                  ? 'border-input bg-accent/50 text-accent-foreground'
                  : 'border-input bg-background hover:bg-accent/50 hover:text-accent-foreground'
              }`}
              onClick={() => setTab('hist')}
            >
              <History className='h-4 w-4' />
              Histórico
            </button>
          </div>

          {tab === 'hist' ? (
            <div className='text-sm'>
              {loadingHist && (
                <div className='text-muted-foreground'>Carregando…</div>
              )}
              {!loadingHist && !history?.length && (
                <div className='text-muted-foreground'>Sem eventos.</div>
              )}
              <ul className='space-y-2 max-h-72 overflow-auto'>
                {history?.map(h => (
                  <li
                    key={h.id}
                    className='rounded-md border bg-background p-2 shadow-sm'
                  >
                    <div className='text-xs text-muted-foreground'>
                      {new Date(h.created_at).toLocaleString()}
                    </div>
                    <div className='mt-0.5'>
                      <b>Ação:</b> {h.action}
                    </div>
                    {h.meta && (
                      <pre className='text-xs bg-muted p-2 rounded mt-2 overflow-auto'>
                        {JSON.stringify(h.meta, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Data do post
                  </span>
                  <input
                    disabled={!canEditFields}
                    type='date'
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm disabled:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                    value={form.date || ''}
                    onChange={e =>
                      setForm(f => ({ ...f, date: e.target.value }))
                    }
                  />
                </label>
                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Título (5–90 caracteres)
                  </span>
                  <input
                    disabled={!canEditFields}
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm disabled:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                    value={form.title || ''}
                    onChange={e =>
                      setForm(f => ({ ...f, title: e.target.value }))
                    }
                  />
                </label>
              </div>

              <label className='text-sm block'>
                <span className='block text-sm font-medium mb-1'>
                  Arte (comece com "Carrossel:" ou "Estático:", ≤ 200)
                </span>
                <textarea
                  disabled={!canEditFields}
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm disabled:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                  rows={2}
                  value={form.arte || ''}
                  onChange={e => setForm(f => ({ ...f, arte: e.target.value }))}
                />
              </label>

              <label className='text-sm block'>
                <span className='block text-sm font-medium mb-1'>
                  Legenda (≤ 500 caracteres)
                </span>
                <textarea
                  disabled={!canEditFields}
                  className={`w-full rounded-md bg-background px-3 py-2 text-sm shadow-sm disabled:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background ${
                    overLegend ? 'border border-error' : 'border border-input'
                  }`}
                  rows={4}
                  value={form.legenda || ''}
                  onChange={e =>
                    setForm(f => ({ ...f, legenda: e.target.value }))
                  }
                />
                <div
                  className={`text-xs mt-1 ${overLegend ? 'text-error' : 'text-muted-foreground'}`}
                >
                  {form.legenda?.length || 0}/500
                </div>
              </label>

              <label className='text-sm block'>
                <span className='block text-sm font-medium mb-1'>
                  CTA (opcional, ≤ 150 caracteres)
                </span>
                <input
                  disabled={!canEditFields}
                  className={`w-full h-10 rounded-md bg-background px-3 text-sm shadow-sm disabled:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background ${
                    overCTA ? 'border border-error' : 'border border-input'
                  }`}
                  value={form.cta || ''}
                  onChange={e => setForm(f => ({ ...f, cta: e.target.value }))}
                />
                <div
                  className={`text-xs mt-1 ${overCTA ? 'text-error' : 'text-muted-foreground'}`}
                >
                  {form.cta?.length || 0}/150
                </div>
              </label>

              {/* Comentários de revisão */}
              <div className='space-y-3 mt-2'>
                {form?.revision_comment ? (
                  <div className='rounded-md border bg-muted p-3'>
                    <div className='text-xs text-muted-foreground mb-1'>
                      Último pedido de ajustes
                    </div>
                    <div className='text-sm whitespace-pre-wrap'>
                      {form.revision_comment}
                    </div>
                  </div>
                ) : null}

                <label className='text-sm block'>
                  <span className='block text-sm font-medium mb-1'>
                    Comentário para ajustes (visível para o social media)
                  </span>
                  <textarea
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                    rows='3'
                    value={
                      typeof form.revision_comment === 'string'
                        ? form.revision_comment
                        : ''
                    }
                    onChange={e =>
                      setForm(f => ({ ...f, revision_comment: e.target.value }))
                    }
                  />
                </label>
              </div>

              {/* Ações */}
              <div className='flex flex-wrap gap-2 pt-2'>
                {canEditFields && (
                  <button
                    onClick={saveFields}
                    className='inline-flex items-center h-9 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                  >
                    Salvar texto
                  </button>
                )}
                <button
                  onClick={() => setStatus('Em revisão')}
                  className='inline-flex items-center h-9 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                >
                  Marcar como Em revisão
                </button>
                <button
                  onClick={() => setStatus('Aprovado')}
                  className='inline-flex items-center h-9 rounded-md border border-success/40 bg-success-light/20 px-3 text-sm font-medium text-success shadow-sm transition-colors hover:bg-success-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                >
                  Aprovar
                </button>
              </div>

              {/* Revisão pelo cliente */}
              <div className='rounded-md border bg-background p-3 shadow-sm'>
                <div className='text-sm font-medium mb-2'>
                  Solicitar ajustes
                </div>
                <textarea
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                  rows={2}
                  placeholder='Explique o que ajustar…'
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <div className='mt-2'>
                  <button
                    onClick={() => setStatus('Ajustar')}
                    className='inline-flex items-center h-9 rounded-md border border-warning/40 bg-warning-light/20 px-3 text-sm font-medium text-warning shadow-sm transition-colors hover:bg-warning-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                  >
                    Pedir ajustes
                  </button>
                </div>
              </div>

              <div className='flex justify-end pt-2'>
                <DeletePostButton
                  postId={form.id}
                  onDeleted={() => {
                    onSaved();
                    onClose();
                  }}
                />
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
      const { data, error } = await sb.rpc('delete_post', {
        p_post_id: postId,
      });
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
      className='inline-flex items-center h-9 rounded-md border border-error/40 bg-error-light/20 px-3 text-sm font-medium text-error shadow-sm transition-colors hover:bg-error-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
    >
      Excluir post
    </button>
  );
}

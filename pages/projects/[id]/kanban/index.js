import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useAiUsage } from '@/hooks/useAiUsage';
import AiUsageBanner from '@/components/AiUsageBanner';
import KanbanColumn from '@/components/KanbanColumn';
import PostModal from '@/components/PostModal';
import SchedulePreview from '@/components/SchedulePreview';
import SuggestedHolidays from '@/components/SuggestedHolidays';
import Link from 'next/link';
import DevInfo from '@/components/DevInfo';
import UsageBanner from '@/components/UsageBanner';
import { loadUsageSummary, canUseAI, incAI } from '@/lib/plan/usage';
import QualitySummary from '@/components/QualitySummary';
import StagedDrafts from '@/components/StagedDrafts';
import EditOnePostModal from '@/components/EditOnePostModal';
import useKanban from './hooks';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  Plus,
  X,
  Filter,
  ChevronDown,
  RotateCcw,
  ListFilter,
  Calendar,
} from 'lucide-react';

export default function ProjectKanban() {
  const {
    usage,
    columns,
    postsById,
    openPost,
    filterStatus,
    filterFrom,
    filterTo,
    selectedPostIds,
    form,
    err,
    sb,
    filteredPosts,
    cardsByColumn,
    createPost,
    onDropCard,
    loadAll,
    project,
    setForm,
    setFilterStatus,
    setFilterFrom,
    setFilterTo,
    setSelectedPostIds,
    setPostsById,
    setOpenPost,
  } = useKanban();

  // Drawer do formulário manual
  const [manualOpen, setManualOpen] = useState(false);

  // Filtros: estado de abertura e contagem de ativos
  const [filtersOpen, setFiltersOpen] = useState(true);
  const activeFiltersCount =
    (filterStatus ? 1 : 0) + (filterFrom ? 1 : 0) + (filterTo ? 1 : 0);

  return (
    <Layout>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h1 className='text-3xl font-bold mb-1'>Projeto: {project?.name}</h1>
          <p className='text-muted-foreground'>
            Exibindo {filteredPosts.length} de {Object.keys(postsById).length}{' '}
            posts
            {(filterStatus || filterFrom || filterTo) && (
              <span className='ml-2 text-blue-600'>(filtrado)</span>
            )}
          </p>
        </div>

        {/* Ações principais */}
        <div className='flex items-center gap-2'>
          {/* --- IA: Gerar cronograma --- */}
          <AIGenerator project={project} onInserted={loadAll} />

          {/* --- Gerar post manualmente (abre drawer) --- */}
          <Button
            className='gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={() => setManualOpen(true)}
            variant='secondary'
            title='Adicionar um post manualmente'
          >
            <Plus className='h-4 w-4' />
            Gerar post manualmente
          </Button>
        </div>
      </div>

      {/* Aviso de cota de IA */}
      {!usage?.loading && (
        <div className='mb-3'>
          <AiUsageBanner usage={usage} />
        </div>
      )}

      {/* Toolbar de filtros (com título, contagem, limpar e animação) */}
      <div className='mb-4 rounded-lg border bg-card shadow-sm'>
        {/* Header dos filtros */}
        <div className='flex items-center justify-between px-3 py-2'>
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium'>Filtros de posts</span>
            {activeFiltersCount > 0 && (
              <span className='ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'>
                {activeFiltersCount} ativo(s)
              </span>
            )}
          </div>

          <div className='flex items-center gap-2'>
            {activeFiltersCount > 0 && (
              <button
                type='button'
                className='inline-flex items-center gap-1 h-8 rounded-md border border-input bg-background px-2 text-xs font-medium shadow-sm hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                onClick={() => {
                  setFilterStatus('');
                  setFilterFrom('');
                  setFilterTo('');
                }}
                title='Limpar filtros'
              >
                <RotateCcw className='h-3.5 w-3.5' />
                Limpar
              </button>
            )}

            <button
              type='button'
              className='inline-flex items-center h-8 rounded-md border border-input bg-background px-2 text-xs font-medium shadow-sm hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen(o => !o)}
              title={filtersOpen ? 'Recolher filtros' : 'Expandir filtros'}
            >
              <span className='mr-1'>Opções</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  filtersOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Conteúdo dos filtros com animação */}
        <div
          className={`overflow-hidden px-3 transition-all duration-300 ${
            !filtersOpen
              ? 'max-h-[500px] opacity-100 pb-3'
              : 'max-h-0 opacity-0 pb-0'
          }`}
        >
          <div className='grid gap-3 md:grid-cols-5'>
            {/* STATUS */}
            <div className='md:col-span-2'>
              <label className='block mb-1.5 text-[11px] font-medium text-muted-foreground'>
                Status
              </label>
              <div className='relative focus-within:z-50'>
                <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                  <ListFilter className='h-4 w-4' />
                </span>
                <select
                  className='w-full h-10 rounded-md border border-input bg-background pl-9 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white appearance-none relative z-50'
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value=''>Todos</option>
                  <option>A criar</option>
                  <option>Em revisão</option>
                  <option>Aprovado</option>
                  <option>Ajustar</option>
                </select>
                {/* caret */}
                <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                  <svg
                    className='h-4 w-4'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z' />
                  </svg>
                </span>
              </div>
            </div>

            {/* DE */}
            <div>
              <label className='block mb-1.5 text-[11px] font-medium text-muted-foreground'>
                De
              </label>
              <div className='relative focus-within:z-50'>
                <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                  <Calendar className='h-4 w-4' />
                </span>
                <input
                  type='date'
                  className='w-full h-10 rounded-md border border-input bg-background pl-9 px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                  value={filterFrom}
                  onChange={e => setFilterFrom(e.target.value)}
                />
              </div>
            </div>

            {/* ATÉ */}
            <div>
              <label className='block mb-1.5 text-[11px] font-medium text-muted-foreground'>
                Até
              </label>
              <div className='relative focus-within:z-50'>
                <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                  <Calendar className='h-4 w-4' />
                </span>
                <input
                  type='date'
                  className='w-full h-10 rounded-md border border-input bg-background pl-9 px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                  value={filterTo}
                  onChange={e => setFilterTo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedPostIds.size > 0 && (
        <div className='mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-2.5 shadow-sm'>
          <span className='text-sm text-muted-foreground'>
            Selecionados: {selectedPostIds.size}
          </span>

          {/* SELECT (bulk status) */}
          <div className='relative focus-within:z-50'>
            <label htmlFor='bulk-status' className='sr-only'>
              Mover selecionados para
            </label>
            <select
              id='bulk-status'
              className='h-10 rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background appearance-none relative z-50'
              onChange={async e => {
                const newStatus = e.target.value;
                if (!newStatus) return;
                if (
                  !confirm(
                    `Mover ${selectedPostIds.size} post(s) para '${newStatus}'?`
                  )
                ) {
                  e.target.value = '';
                  return;
                }
                const sb = supabaseBrowser();
                const ids = Array.from(selectedPostIds);
                const { error } = await sb
                  .from('posts')
                  .update({ status: newStatus })
                  .in('id', ids);
                if (error) {
                  alert(error.message);
                  e.target.value = '';
                  return;
                }
                setPostsById(prev => {
                  const next = { ...prev };
                  ids.forEach(id => {
                    if (next[id]) next[id] = { ...next[id], status: newStatus };
                  });
                  return next;
                });
                setSelectedPostIds(new Set());
                e.target.value = '';
              }}
            >
              <option value=''>Mover para…</option>
              <option value='A criar'>A criar</option>
              <option value='Em revisão'>Em revisão</option>
              <option value='Aprovado'>Aprovado</option>
              <option value='Ajustar'>Ajustar</option>
            </select>

            {/* caret */}
            <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
              <svg
                className='h-4 w-4'
                viewBox='0 0 20 20'
                fill='currentColor'
                aria-hidden='true'
              >
                <path d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z' />
              </svg>
            </span>
          </div>

          {/* DELETE BUTTON */}
          <button
            className='inline-flex items-center h-10 rounded-md border border-error/40 bg-error-light/20 px-3 text-sm font-medium text-error shadow-sm transition-colors hover:bg-error-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
            onClick={async () => {
              if (!confirm(`Excluir ${selectedPostIds.size} post(s)?`)) return;
              const sb = supabaseBrowser();
              const ids = Array.from(selectedPostIds);
              const { error } = await sb.from('posts').delete().in('id', ids);
              if (error) {
                alert(error.message);
                return;
              }
              setPostsById(prev => {
                const next = { ...prev };
                ids.forEach(id => delete next[id]);
                return next;
              });
              setSelectedPostIds(new Set());
              await loadAll(); // Recarregar para atualizar cards
            }}
          >
            Excluir selecionados
          </button>
        </div>
      )}

      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          {project?.id && (
            <>
              <Link
                href={`/projects/${project.id}/calendar`}
                className='inline-flex items-center h-9 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
              >
                Calendário
              </Link>

              <Link
                href={`/agency/members`}
                className='inline-flex items-center h-9 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
              >
                Membros
              </Link>

              <button
                className='inline-flex items-center h-9 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                onClick={async () => {
                  try {
                    const sb = supabaseBrowser();
                    const { data, error } = await sb.rpc('create_review_link', {
                      p_project_id: project.id,
                      p_days: 14,
                    });
                    if (error) throw error;
                    const row = Array.isArray(data) ? data[0] : data;
                    const url = `${window.location.origin}/review/${row.link_token}`;
                    await navigator.clipboard.writeText(url);
                    alert(
                      'Link de revisão criado e copiado. Envie ao cliente.'
                    );
                  } catch (e) {
                    alert(e.message);
                  }
                }}
              >
                Gerar link de revisão
              </button>
            </>
          )}

          <button
            onClick={async () => {
              if (!confirm('Excluir TODOS os posts deste projeto?')) return;
              const { data, error } = await sb.rpc('delete_posts_by_project', {
                p_project_id: project.id,
              });
              if (error) {
                alert(error.message);
              } else {
                const count = Array.isArray(data) ? data.length : 0;
                alert(`Excluídos ${count} posts.`);
                await loadAll();
              }
            }}
            className='ml-2 inline-flex items-center h-9 whitespace-nowrap rounded-md border border-error/40 bg-error-light/20 px-3 text-xs font-medium text-error shadow-sm transition-colors hover:bg-error-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
          >
            Excluir todos os posts
          </button>
        </div>
      </div>

      <div className='flex gap-6 overflow-x-auto pb-6'>
        {columns.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            cards={cardsByColumn[col.id] || []}
            postsById={postsById}
            onOpen={post => setOpenPost(post)}
            onDropCard={onDropCard}
            selectedPostIds={selectedPostIds}
            onToggleSelection={postId => {
              setSelectedPostIds(prev => {
                const next = new Set(prev);
                if (next.has(postId)) {
                  next.delete(postId);
                } else {
                  next.add(postId);
                }
                return next;
              });
            }}
          />
        ))}
      </div>

      {/* Drawer lateral: Adicionar post manualmente */}
      {manualOpen && (
        <div className='fixed inset-0 z-50'>
          {/* overlay */}
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => setManualOpen(false)}
          />
          {/* painel lateral */}
          <div className='absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l flex flex-col'>
            {/* header */}
            <div className='px-4 py-3 border-b flex items-center justify-between'>
              <h3 className='font-semibold'>Adicionar post manualmente</h3>
              <button
                className='inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                onClick={() => setManualOpen(false)}
                aria-label='Fechar'
                title='Fechar'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            {/* conteúdo scrollável */}
            <div className='flex-1 overflow-y-auto p-4'>
              <form onSubmit={createPost} className='grid grid-cols-1 gap-3'>
                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>Data</span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    type='date'
                    placeholder='Data'
                    value={form.date}
                    onChange={e =>
                      setForm(f => ({ ...f, date: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>Título</span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    placeholder='Título'
                    value={form.title}
                    onChange={e =>
                      setForm(f => ({ ...f, title: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Arte (curto)
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    placeholder='Arte (curto)'
                    value={form.arte}
                    onChange={e =>
                      setForm(f => ({ ...f, arte: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Legenda (≤500)
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    placeholder='Legenda (≤500)'
                    value={form.legenda}
                    onChange={e =>
                      setForm(f => ({ ...f, legenda: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    CTA (≤150)
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    placeholder='CTA (≤150)'
                    value={form.cta}
                    onChange={e =>
                      setForm(f => ({ ...f, cta: e.target.value }))
                    }
                  />
                </label>

                <div className='pt-2'>
                  <button className='w-full cursor-pointer bg-accent-foreground border rounded-md px-3 py-2 text-white hover:opacity-80'>
                    Adicionar post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {err && <p className='text-red-600 text-sm mb-4'>{err}</p>}

      <PostModal
        project={project}
        openPost={openPost}
        onClose={() => setOpenPost(null)}
        onSaved={() => {
          setOpenPost(null);
          loadAll();
        }}
      />
    </Layout>
  );
}

function AIGenerator({ project, onInserted }) {
  const sb = supabaseBrowser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    client_website: '',
    month: '',
    freq_per_week: 3,
    types: 'Produto, Dica, Institucional, Campanha',
    platforms: 'Instagram',
    tone: 'técnico didático, direto e cordial',
    product_list: '',
    post_plan_list: '',
    approved_holidays: [],
    model: '',
  });
  const [preview, setPreview] = useState(null);
  const [staged, setStaged] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [dev, setDev] = useState({
    raw: '',
    userPrompt: '',
    systemExcerpt: '',
  });
  const [usage, setUsage] = useState(null);
  const [warned80, setWarned80] = useState(false);
  const [reviewPost, setReviewPost] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [client, setClient] = useState(null);

  useEffect(() => {
    (async () => {
      if (!project || !sb) return;
      // carrega cliente
      const { data } = await sb
        .from('clients')
        .select('*')
        .eq('id', project.client_id)
        .maybeSingle();
      setClient(data || null);
      setForm(f => ({
        ...f,
        client_name: data?.name || '',
        client_website: data?.website || '',
        month: project?.month || '',
      }));
    })();
  }, [project, sb]);

  // Aviso de 80% uma vez por sessão
  useEffect(() => {
    if (!usage) return;
    try {
      const used = Number(usage.used || 0),
        quota = Number(usage.quota || 0);
      const pct = quota > 0 ? (used / quota) * 100 : 0;
      const key = `warn80_${usage.yyyymm}`;
      const already = sessionStorage.getItem(key) === '1';
      if (pct >= 80 && pct < 100 && !already && !warned80) {
        alert(
          `Atenção: você atingiu ${Math.round(pct)}% da sua cota mensal de IA.`
        );
        sessionStorage.setItem(key, '1');
        setWarned80(true);
      }
    } catch (e) {}
  }, [usage, warned80]);

  async function callAI(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const r = await fetch('/api/ai/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) {
        throw new Error(j.error || 'Falha na IA');
      }

      // Depois de gerar, checa cota pelo número de posts que veio
      const count = Array.isArray(j?.schedule?.posts)
        ? j.schedule.posts.length
        : 0;
      try {
        const ck = await canUseAI(sb, project.agency_id, count);
        if (!ck?.allowed) {
          alert(
            `Geração excede a cota de IA (posts=${count}, restam ${ck?.remaining || 0}). Motivo: ${ck?.reason}`
          );
          return;
        }
      } catch (e) {
        alert(e.message);
        return;
      }

      setPreview(j.schedule);
      try {
        await incAI(sb, project.agency_id, (j.schedule?.posts || []).length);
        const u = await loadUsageSummary(sb, project.agency_id);
        setUsage(u);
      } catch (e) {}
      const sug = j.schedule?.suggested_holidays || [];
      setSuggested(sug);
      setSelectedSuggestions([]);
      setDev({
        raw: j.raw
          ? typeof j.raw === 'string'
            ? j.raw
            : JSON.stringify(j.raw, null, 2)
          : '',
        userPrompt: j.userPrompt || '',
        systemExcerpt: j.system ? j.system.slice(0, 600) + '...' : '',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function insertPosts() {
    if (!preview) return;
    // mapeia para a tabela posts (status já vem 'A criar')
    const rows = (preview.posts || []).map(p => ({
      project_id: project.id,
      date: p.date,
      title: p.title,
      arte: p.arte,
      legenda: p.legenda,
      cta: p.cta || null,
      status: 'A criar',
    }));
    const { error } = await sb.from('posts').insert(rows);
    if (error) {
      setError(error.message);
      return;
    }
    setOpen(false);
    setPreview(null);
    onInserted && onInserted();
  }

  return (
    <div>
      <Button
        className='gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
        onClick={() => setOpen(true)}
        disabled={usage?.level === 'block'}
        title={
          usage?.level === 'block'
            ? 'Sem cota de IA: ajuste plano ou aguarde próximo mês'
            : undefined
        }
      >
        <Sparkles className='h-4 w-4' />
        Gerar conteúdo com IA{' '}
        {usage?.quota ? `(${usage.used}/${usage.quota})` : ''}
      </Button>

      {open && (
        <div className='fixed inset-0 bg-black/40 z-50 p-4 grid place-items-center'>
          <div className='bg-card w-full max-w-3xl rounded-xl border shadow-lg overflow-hidden flex flex-col max-h-[90vh]'>
            {/* Header fixo */}
            <div className='sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between'>
              <div className='min-w-0'>
                <h3 className='font-semibold text-sm md:text-base truncate'>
                  Gerar cronograma (IA)
                </h3>
              </div>
              <div className='flex items-center gap-2'>
                <Link
                  href='/help/cronogramas'
                  className='text-xs underline text-muted-foreground hover:text-foreground'
                >
                  Ajuda
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className='inline-flex items-center h-9 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Corpo rolável */}
            <div className='flex-1 overflow-y-auto p-4 space-y-4'>
              {/* Banner de uso IA (fora do header para não “crescer” o topo) */}
              {!usage?.loading && (
                <div className='mb-1'>
                  <AiUsageBanner usage={usage} />
                </div>
              )}

              {/* Formulário */}
              <form onSubmit={callAI} className='grid md:grid-cols-2 gap-3'>
                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Nome do cliente
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    value={form.client_name}
                    onChange={e =>
                      setForm(f => ({ ...f, client_name: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Site do cliente (opcional)
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    value={form.client_website}
                    onChange={e =>
                      setForm(f => ({ ...f, client_website: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Mês (YYYY-MM)
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    value={form.month}
                    onChange={e =>
                      setForm(f => ({ ...f, month: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Frequência por semana
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    type='number'
                    value={form.freq_per_week}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        freq_per_week: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Tipos (Produto, Dica, Institucional, Campanha)
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    value={form.types}
                    onChange={e =>
                      setForm(f => ({ ...f, types: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Plataformas (ex.: Instagram)
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    value={form.platforms}
                    onChange={e =>
                      setForm(f => ({ ...f, platforms: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Tom de voz
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    value={form.tone}
                    onChange={e =>
                      setForm(f => ({ ...f, tone: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm'>
                  <span className='block text-sm font-medium mb-1'>
                    Modelo (opcional, ex.: gpt-4o-mini)
                  </span>
                  <input
                    className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-white'
                    value={form.model}
                    onChange={e =>
                      setForm(f => ({ ...f, model: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm md:col-span-2'>
                  <span className='block text-sm font-medium mb-1'>
                    Catálogo de produtos (bullets ou JSON)
                  </span>
                  <textarea
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                    rows='3'
                    placeholder={
                      'Ex.: \n- Produto A (Marca X)\n- Produto B (Marca Y)'
                    }
                    value={form.product_list}
                    onChange={e =>
                      setForm(f => ({ ...f, product_list: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm md:col-span-2'>
                  <span className='block text-sm font-medium mb-1'>
                    Plano preferencial de temas (um por linha)
                  </span>
                  <textarea
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                    rows='3'
                    placeholder={
                      'Ex.: \n1) Campanha Outubro Rosa\n2) Dica: Drywall (ST/RU/RF)'
                    }
                    value={form.post_plan_list}
                    onChange={e =>
                      setForm(f => ({ ...f, post_plan_list: e.target.value }))
                    }
                  />
                </label>

                <label className='text-sm md:col-span-2'>
                  <span className='block text-sm font-medium mb-1'>
                    approved_holidays (JSON array de {'{date,name}'})
                  </span>
                  <textarea
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                    rows='3'
                    placeholder={`Ex.:\n[{"date":"2025-10-12","name":"Dia das Crianças / Nossa Senhora Aparecida"}]`}
                    value={JSON.stringify(form.approved_holidays)}
                    onChange={e => {
                      try {
                        const arr = JSON.parse(e.target.value || '[]');
                        setForm(f => ({ ...f, approved_holidays: arr }));
                      } catch {}
                    }}
                  />
                </label>

                <p className='text-xs text-muted-foreground md:col-span-2'>
                  A IA sempre sugerirá feriados no campo{' '}
                  <code>suggested_holidays</code> da pré-visualização. Eles não
                  são agendados automaticamente.
                </p>

                <div className='md:col-span-2 flex gap-2'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='inline-flex items-center h-10 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                  >
                    {loading ? 'Gerando…' : 'Gerar cronograma'}
                  </button>
                </div>
              </form>

              {error && <p className='text-error text-sm'>{error}</p>}

              {preview && (
                <div className='space-y-4'>
                  {suggested ? (
                    <SuggestedHolidays
                      items={suggested}
                      selected={selectedSuggestions}
                      setSelected={setSelectedSuggestions}
                      onAddApproved={() => {
                        const merged = [...form.approved_holidays];
                        selectedSuggestions.forEach(s => {
                          if (
                            !merged.find(
                              m => m.date === s.date && m.name === s.name
                            )
                          ) {
                            merged.push(s);
                          }
                        });
                        setForm(f => ({ ...f, approved_holidays: merged }));
                      }}
                      onRegenerate={e => {
                        callAI(e);
                      }}
                      onAddSinglePost={async h => {
                        try {
                          if (
                            !(await (async () => {
                              try {
                                const ck = await canUseAI(
                                  sb,
                                  project.agency_id,
                                  1
                                );
                                if (!ck?.allowed) {
                                  alert(
                                    `Limite de IA atingido (restam ${ck?.remaining || 0}). Motivo: ${ck?.reason}`
                                  );
                                  return false;
                                }
                                return true;
                              } catch (e) {
                                alert(e.message);
                                return false;
                              }
                            })())
                          )
                            return;

                          const canNow = () => {
                            const rem = Number(usage?.remaining || 0);
                            const over = !!usage?.overage_enabled;
                            const trial =
                              usage?.trial_end_at &&
                              new Date(usage.trial_end_at) > new Date();
                            return rem > 0 || over || trial;
                          };
                          if (!canNow()) {
                            alert(
                              'Sem saldo de IA para gerar este post. Faça upgrade, ative overage ou aguarde a renovação.'
                            );
                            return;
                          }

                          const r = await fetch('/api/ai/generate-post', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              client_name: form.client_name,
                              client_website: form.client_website,
                              month: form.month,
                              holiday: h,
                              tone: form.tone,
                              platforms: form.platforms,
                              model: form.model,
                            }),
                          });
                          const j = await r.json();
                          if (!r.ok)
                            throw new Error(j.error || 'Falha ao gerar post');
                          setReviewPost({ ...j.post, __origin: 'staged' });
                          setReviewOpen(true);
                          try {
                            await incAI(sb, project.agency_id, 1);
                            const u = await loadUsageSummary(
                              sb,
                              project.agency_id
                            );
                            setUsage(u);
                          } catch (e) {}
                          return;
                        } catch (e) {
                          alert(e.message);
                        }
                      }}
                    />
                  ) : null}

                  <SchedulePreview
                    schedule={preview}
                    onInsertOne={async (p, idx) => {
                      try {
                        setReviewPost({
                          ...p,
                          __origin: 'preview',
                          __index: idx,
                        });
                        setReviewOpen(true);
                        return;
                      } catch (e) {
                        alert(e.message);
                      }
                    }}
                    onEditOne={(p, idx) => {
                      setReviewPost({
                        ...p,
                        __origin: 'preview',
                        __index: idx,
                      });
                      setReviewOpen(true);
                    }}
                  />

                  <QualitySummary
                    schedule={preview}
                    clientWebsite={form.client_website}
                    approvedHolidays={form.approved_holidays}
                    freqPerWeek={form.freq_per_week}
                  />

                  <button
                    onClick={insertPosts}
                    className='inline-flex items-center h-10 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background'
                  >
                    Inserir posts no projeto
                  </button>

                  <DevInfo
                    requestPayload={form}
                    responseRaw={dev.raw}
                    userPrompt={dev.userPrompt}
                    systemExcerpt={dev.systemExcerpt}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { supabaseBrowser } from '@/lib/supabaseClient';
import KanbanColumn from '@/components/KanbanColumn';
import PostModal from '@/components/PostModal';
import SchedulePreview from '@/components/SchedulePreview';
import SuggestedHolidays from '@/components/SuggestedHolidays';
import Link from 'next/link';
import DevInfo from '@/components/DevInfo';
import QualitySummary from '@/components/QualitySummary';
import StagedDrafts from '@/components/StagedDrafts';
import EditOnePostModal from '@/components/EditOnePostModal';

export default function ProjectKanban() {
  const r = useRouter();
  const { id } = r.query; // project id
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [postsById, setPostsById] = useState({});
  const [openPost, setOpenPost] = useState(null);
  const [form, setForm] = useState({ 
    date: '', 
    title: '', 
    arte: '', 
    legenda: '', 
    cta: '' 
  });
  const [err, setErr] = useState('');
  const sb = supabaseBrowser();

  useEffect(() => {
    if (!id || !sb) return;
    (async () => {
      await loadAll();
    })();
  }, [id, sb]);

  async function loadAll() {
    setErr('');
    
    const pj = await sb
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (pj.error) { 
      setErr(pj.error.message); 
      return; 
    }
    setProject(pj.data);

    const cs = await sb
      .from('kanban_columns')
      .select('id,name,position')
      .eq('project_id', id)
      .order('position');
    if (cs.error) { 
      setErr(cs.error.message); 
      return; 
    }
    setColumns(cs.data || []);

    const ks = await sb
      .from('kanban_cards')
      .select('id,column_id,post_id,posts(id,title,status,date,arte,legenda,cta)')
      .eq('project_id', id);
    if (ks.error) { 
      setErr(ks.error.message); 
      return; 
    }
    setCards(ks.data || []);

    const postsMap = {};
    (ks.data || []).forEach(k => {
      if (k.posts) {
        postsMap[k.posts.id] = k.posts;
      }
    });
    setPostsById(postsMap);
  }

  const cardsByColumn = useMemo(() => {
    const map = Object.fromEntries(columns.map(c => [c.id, []]));
    cards.forEach(c => {
      if (map[c.column_id]) map[c.column_id].push(c);
    });
    return map;
  }, [columns, cards]);

  async function onDropCard(payload, targetColumn) {
    try {
      const { postId } = payload;
      // mudar o status do post para o nome da coluna
      const { error } = await sb
        .from('posts')
        .update({ status: targetColumn.name })
        .eq('id', postId);
      if (error) throw error;
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  }

  async function createPost(e) {
    e.preventDefault();
    setErr('');
    try {
      if (!project) throw new Error('Projeto não carregado');
      if (!form.date || !form.title) throw new Error('Preencha data e título');
      
      const payload = { 
        project_id: project.id, 
        date: form.date, 
        title: form.title, 
        arte: form.arte || null, 
        legenda: form.legenda || null, 
        cta: form.cta || null, 
        status: 'A criar' 
      };
      
      const { error } = await sb.from('posts').insert(payload);
      if (error) throw error;
      
      setForm({ 
        date: '', 
        title: '', 
        arte: '', 
        legenda: '', 
        cta: '' 
      });
      await loadAll(); // trigger cria card; reload para refletir
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Kanban do Projeto</h1>
        <div className="flex items-center gap-2">
          <div className="text-sm text-neutral-500">{project?.name}</div>
          <button 
            onClick={async () => {
              if (!confirm('Excluir TODOS os posts deste projeto?')) return;
              const { data, error } = await sb.rpc('delete_posts_by_project', { p_project_id: project.id });
              if (error) { alert(error.message); }
              else {
                const count = Array.isArray(data) ? data.length : 0;
                alert(`Excluídos ${count} posts.`);
                await loadAll();
              }
            }} 
            className="ml-2 border rounded px-2 py-1 text-xs text-red-600 border-red-300 hover:bg-red-50"
          >
            Excluir todos os posts
          </button>
        </div>
      </div>

      <form onSubmit={createPost} className="grid md:grid-cols-6 gap-2 mb-6">
        <input 
          className="border rounded px-3 py-2" 
          type="date" 
          placeholder="Data" 
          value={form.date} 
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))} 
        />
        <input 
          className="border rounded px-3 py-2 md:col-span-2" 
          placeholder="Título" 
          value={form.title} 
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
        />
        <input 
          className="border rounded px-3 py-2" 
          placeholder="Arte (curto)" 
          value={form.arte} 
          onChange={e => setForm(f => ({ ...f, arte: e.target.value }))} 
        />
        <input 
          className="border rounded px-3 py-2" 
          placeholder="Legenda (≤500)" 
          value={form.legenda} 
          onChange={e => setForm(f => ({ ...f, legenda: e.target.value }))} 
        />
        <input 
          className="border rounded px-3 py-2" 
          placeholder="CTA (≤150)" 
          value={form.cta} 
          onChange={e => setForm(f => ({ ...f, cta: e.target.value }))} 
        />
        <button className="border rounded px-3 py-2 md:col-span-6 hover:bg-neutral-50">
          Adicionar post
        </button>
      </form>
      
      {err && <p className="text-red-600 text-sm mb-4">{err}</p>}

      <div className="grid md:grid-cols-4 gap-3">
        {columns.map(col => (
          <KanbanColumn 
            key={col.id} 
            column={col} 
            cards={cardsByColumn[col.id] || []} 
            postsById={postsById} 
            onOpen={(post) => setOpenPost(post)} 
            onDropCard={onDropCard} 
          />
        ))}
      </div>

      {/* --- IA: Gerar cronograma --- */}
      <AIGenerator project={project} onInserted={loadAll} />

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
    client_name: '', client_website: '', month: '',
    freq_per_week: 3, types: 'Produto, Dica, Institucional, Campanha',
    platforms: 'Instagram', tone: 'técnico didático, direto e cordial',
    product_list: '', post_plan_list: '',
    approved_holidays: [], model: ''
  });
  const [preview, setPreview] = useState(null);
  const [staged, setStaged] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [dev, setDev] = useState({ raw: '', userPrompt: '', systemExcerpt: '' });
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
        month: project?.month || '' 
      }));
    })();
  }, [project, sb]);

  async function callAI(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const r = await fetch('/api/ai/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const j = await r.json();
      if (!r.ok) {
        throw new Error(j.error || 'Falha na IA');
      }
      setPreview(j.schedule);
      const sug = j.schedule?.suggested_holidays || [];
      setSuggested(sug);
      setSelectedSuggestions([]);
      setDev({ 
        raw: j.raw ? (typeof j.raw === 'string' ? j.raw : JSON.stringify(j.raw, null, 2)) : '', 
        userPrompt: j.userPrompt || '', 
        systemExcerpt: j.system ? (j.system.slice(0, 600) + '...') : '' 
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
      status: 'A criar'
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
    <div className="mt-8">
      <button 
        className="border rounded px-3 py-2 hover:bg-neutral-50" 
        onClick={() => setOpen(true)}
      >
        Gerar cronograma com IA
      </button>
      
      {open && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">Gerar cronograma (IA)</h3>
              <div className="flex items-center gap-2">
                <Link href="/help/cronogramas" className="text-sm underline">Ajuda</Link>
                <button 
                  onClick={() => setOpen(false)} 
                  className="text-sm px-2 py-1 rounded border hover:bg-neutral-50"
                >
                  Fechar
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              <form onSubmit={callAI} className="grid md:grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="block text-sm font-medium mb-1">Nome do cliente</span>
                  <input 
                    className="border rounded px-3 py-2 w-full" 
                    value={form.client_name} 
                    onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} 
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-sm font-medium mb-1">Site do cliente (opcional)</span>
                  <input 
                    className="border rounded px-3 py-2 w-full" 
                    value={form.client_website} 
                    onChange={e => setForm(f => ({ ...f, client_website: e.target.value }))} 
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-sm font-medium mb-1">Mês (YYYY-MM)</span>
                  <input 
                    className="border rounded px-3 py-2 w-full" 
                    value={form.month} 
                    onChange={e => setForm(f => ({ ...f, month: e.target.value }))} 
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-sm font-medium mb-1">Frequência por semana</span>
                  <input 
                    className="border rounded px-3 py-2 w-full" 
                    type="number" 
                    value={form.freq_per_week} 
                    onChange={e => setForm(f => ({ ...f, freq_per_week: Number(e.target.value) || 0 }))} 
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-sm font-medium mb-1">Tipos (Produto, Dica, Institucional, Campanha)</span>
                  <input 
                    className="border rounded px-3 py-2 w-full" 
                    value={form.types} 
                    onChange={e => setForm(f => ({ ...f, types: e.target.value }))} 
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-sm font-medium mb-1">Plataformas (ex.: Instagram)</span>
                  <input 
                    className="border rounded px-3 py-2 w-full" 
                    value={form.platforms} 
                    onChange={e => setForm(f => ({ ...f, platforms: e.target.value }))} 
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-sm font-medium mb-1">Tom de voz</span>
                  <input 
                    className="border rounded px-3 py-2 w-full" 
                    value={form.tone} 
                    onChange={e => setForm(f => ({ ...f, tone: e.target.value }))} 
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-sm font-medium mb-1">Modelo (opcional, ex.: gpt-4o-mini)</span>
                  <input 
                    className="border rounded px-3 py-2 w-full" 
                    value={form.model} 
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))} 
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  <span className="block text-sm font-medium mb-1">Catálogo de produtos (bullets ou JSON)</span>
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    rows="3" 
                    placeholder="Ex.:\n- Produto A (Marca X)\n- Produto B (Marca Y)"
                    value={form.product_list}
                    onChange={e => setForm(f => ({ ...f, product_list: e.target.value }))} 
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  <span className="block text-sm font-medium mb-1">Plano preferencial de temas (um por linha)</span>
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    rows="3" 
                    placeholder="Ex.:\n1) Campanha Outubro Rosa\n2) Dica: Drywall (ST/RU/RF)"
                    value={form.post_plan_list}
                    onChange={e => setForm(f => ({ ...f, post_plan_list: e.target.value }))} 
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  <span className="block text-sm font-medium mb-1">approved_holidays (JSON array de {'{date,name}'})</span>
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    rows="3" 
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
                <p className="text-xs text-neutral-600 md:col-span-2">
                  A IA sempre sugerirá feriados no campo <code>suggested_holidays</code> da pré-visualização. 
                  Eles não são agendados automaticamente.
                </p>
                <div className="md:col-span-2 flex gap-2">
                  <button 
                    disabled={loading} 
                    className="border rounded px-3 py-2 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {loading ? 'Gerando…' : 'Gerar cronograma'}
                  </button>
                </div>
              </form>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              {preview && (
                <div className="space-y-4">
                  {suggested ? (
                    <SuggestedHolidays
                      items={suggested}
                      selected={selectedSuggestions}
                      setSelected={setSelectedSuggestions}
                      onAddApproved={() => {
                        const merged = [...form.approved_holidays];
                        selectedSuggestions.forEach(s => {
                          if (!merged.find(m => m.date === s.date && m.name === s.name)) {
                            merged.push(s);
                          }
                        });
                        setForm(f => ({ ...f, approved_holidays: merged }));
                      }}
                      onRegenerate={(e) => { callAI(e); }}
                      onAddSinglePost={async (h) => {
                        try {
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
                              model: form.model 
                            }) 
                          });
                          const j = await r.json();
                          if (!r.ok) throw new Error(j.error || 'Falha ao gerar post');
                          setReviewPost({ ...j.post, __origin: 'staged' }); 
                          setReviewOpen(true); 
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
                        setReviewPost({ ...p, __origin: 'preview', __index: idx }); 
                        setReviewOpen(true); 
                        return;
                      } catch (e) { 
                        alert(e.message); 
                      }
                    }} 
                    onEditOne={(p, idx) => { 
                      setReviewPost({ ...p, __origin: 'preview', __index: idx }); 
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
                    className="border rounded px-3 py-2 hover:bg-neutral-50"
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
      
      {/* Rascunhos locais */}
      {preview && (
        <div className="mt-4">
          <StagedDrafts
            items={staged}
            onEdit={(i) => { 
              const p = staged[i]; 
              setReviewPost({ ...p, __origin: 'staged', __stagedIndex: i }); 
              setReviewOpen(true); 
            }}
            onInsert={async (i) => {
              try {
                const p = staged[i];
                const row = { 
                  project_id: project.id, 
                  date: p.date, 
                  title: p.title, 
                  arte: p.arte, 
                  legenda: p.legenda, 
                  cta: p.cta || null, 
                  status: 'A criar' 
                };
                const { error } = await sb.from('posts').insert(row);
                if (error) throw error;
                setStaged(list => list.filter((_, idx) => idx !== i));
                onInserted && onInserted();
                alert('Rascunho inserido com sucesso.');
              } catch (e) { 
                alert(e.message); 
              }
            }}
            onRemove={(i) => setStaged(list => list.filter((_, idx) => idx !== i))}
          />
        </div>
      )}

      {/* Modal de revisão/edição antes de inserir */}
      <EditOnePostModal
        open={reviewOpen}
        initialPost={reviewPost}
        onCancel={() => { 
          setReviewOpen(false); 
          setReviewPost(null); 
        }}
        onInsert={async (edited) => {
          try {
            const row = { 
              project_id: project.id, 
              date: edited.date, 
              title: edited.title, 
              arte: edited.arte, 
              legenda: edited.legenda, 
              cta: edited.cta || null, 
              status: 'A criar' 
            };
            const { error } = await sb.from('posts').insert(row);
            if (error) throw error;
            setReviewOpen(false); 
            setReviewPost(null);
            onInserted && onInserted();
            alert('Post inserido com sucesso.');
          } catch (e) { 
            alert(e.message); 
          }
        }}
        onSavePreview={(edited) => {
          // limpar metadados
          const origin = edited.__origin; 
          const idx = edited.__index;
          const clean = { 
            date: edited.date, 
            title: edited.title, 
            arte: edited.arte, 
            legenda: edited.legenda, 
            cta: edited.cta || null, 
            status: edited.status || 'A criar' 
          };
          
          if (origin === 'preview' && typeof idx === 'number') {
            // atualizar o próprio preview
            const next = { ...(preview || {}), posts: [...(preview?.posts || [])] };
            next.posts[idx] = clean;
            setPreview(next);
          } else if (origin === 'staged') {
            // adicionar/atualizar rascunho
            if (typeof edited.__stagedIndex === 'number') {
              const list = [...staged]; 
              list[edited.__stagedIndex] = clean; 
              setStaged(list);
            } else {
              setStaged(list => [...list, clean]);
            }
          }
          setReviewOpen(false); 
          setReviewPost(null);
        }}
      />
    </div>
  );
}

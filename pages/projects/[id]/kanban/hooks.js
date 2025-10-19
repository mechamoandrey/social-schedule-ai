import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useAiUsage } from '@/hooks/useAiUsage';
import { loadUsageSummary } from '@/lib/plan/usage';

const useKanban = () => {
  const r = useRouter();
  const { id } = r.query; // project id
  const [project, setProject] = useState(null);
  // IA usage (depende do agency_id do projeto)
  const usage = useAiUsage(project?.agency_id);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [postsById, setPostsById] = useState({});
  const [openPost, setOpenPost] = useState(null);

  // --- Filtros & seleção (novo) ---
  const [filterStatus, setFilterStatus] = useState(''); // '', 'A criar', 'Em revisão', 'Aprovado', 'Ajustar'
  const [filterFrom, setFilterFrom] = useState(''); // YYYY-MM-DD
  const [filterTo, setFilterTo] = useState(''); // YYYY-MM-DD
  const [selectedPostIds, setSelectedPostIds] = useState(new Set());
  const [form, setForm] = useState({
    date: '',
    title: '',
    arte: '',
    legenda: '',
    cta: '',
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

    const pj = await sb.from('projects').select('*').eq('id', id).maybeSingle();
    if (pj.error) {
      setErr(pj.error.message);
      return;
    }
    setProject(pj.data);

    // Load usage summary
    try {
      const u = await loadUsageSummary(sb, pj.data.agency_id);
      setUsage(u);
    } catch (e) {}

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
      .select(
        'id,column_id,post_id,posts(id,title,status,date,arte,legenda,cta)'
      )
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

  // Filtrar posts baseado nos filtros
  const filteredPosts = useMemo(() => {
    return Object.values(postsById).filter(p => {
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterFrom && p.date < filterFrom) return false;
      if (filterTo && p.date > filterTo) return false;
      return true;
    });
  }, [postsById, filterStatus, filterFrom, filterTo]);

  const cardsByColumn = useMemo(() => {
    const map = Object.fromEntries(columns.map(c => [c.id, []]));
    cards.forEach(c => {
      // Só incluir cards cujos posts estão nos posts filtrados
      if (map[c.column_id] && filteredPosts.some(p => p.id === c.post_id)) {
        map[c.column_id].push(c);
      }
    });
    return map;
  }, [columns, cards, filteredPosts]);

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
        status: 'A criar',
      };

      const { error } = await sb.from('posts').insert(payload);
      if (error) throw error;

      setForm({
        date: '',
        title: '',
        arte: '',
        legenda: '',
        cta: '',
      });
      await loadAll(); // trigger cria card; reload para refletir
    } catch (e) {
      setErr(e.message);
    }
  }
  return {
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
  };
};

export default useKanban;
